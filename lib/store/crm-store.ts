import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { LeadSchema, ValidatedLead } from '../schemas/crm';

// --- Types ---
type LeadStatus = "Fresh" | "Token VIP" | "Connected" | "Site Visit" | "Negotiation" | "Final Negotiation" | "Booked" | "Junk";

interface PendingTransaction {
  id: string;
  type: 'UPDATE_STATUS' | 'ADD_NOTE' | 'CREATE_LEAD';
  leadId: string;
  payload: any;
  status: 'sending' | 'failed';
  timestamp: number;
}

interface CRMState {
  // Normalized Entity Storage partitioned by role
  leadsById: Record<string, Record<string, ValidatedLead>>;
  allLeadIds: Record<string, string[]>;
  
  // Hydration & Connection
  _hasHydrated: boolean;
  sseStatus: 'connecting' | 'connected' | 'disconnected';
  lastHeartbeat: number | null;
  
  // Transaction Manager
  pendingTransactions: Record<string, PendingTransaction>;
  
  // Actions
  setHydrated: () => void;
  setSSEStatus: (status: 'connecting' | 'connected' | 'disconnected') => void;
  updateHeartbeat: () => void;
  
  // Lead Actions (strictly tenant-isolated)
  setInitialLeads: (role: string, leads: ValidatedLead[]) => void;
  upsertLead: (role: string, lead: ValidatedLead) => void;
  removeLead: (role: string, leadId: string) => void;
  
  // Optimistic Mutations
  optimisticUpdateStatus: (role: string, leadId: string, newStatus: LeadStatus, mutationId: string) => void;
  resolveTransaction: (mutationId: string) => void;
  failTransaction: (mutationId: string) => void;
  
  // Background Reconciler
  reconcileState: (role: string, truthSnapshot: { id: string, updatedAt: string }[]) => string[]; // returns out-of-sync IDs
}

export const useCRMStore = create<CRMState>()(
  devtools(
    (set, get) => ({
      leadsById: {},
      allLeadIds: {},
      
      _hasHydrated: false,
      sseStatus: 'disconnected',
      lastHeartbeat: null,
      
      pendingTransactions: {},
      
      setHydrated: () => set({ _hasHydrated: true }, false, 'setHydrated'),
      setSSEStatus: (status) => set({ sseStatus: status }, false, 'setSSEStatus'),
      updateHeartbeat: () => set({ lastHeartbeat: Date.now() }, false, 'updateHeartbeat'),
      
      setInitialLeads: (role, leads) => {
        set((state) => {
            const byId: Record<string, ValidatedLead> = {};
            const allIds: string[] = [];
            
            leads.forEach(l => {
              byId[l.id] = l;
              allIds.push(l.id);
            });
            
            return { 
              leadsById: {
                ...state.leadsById,
                [role]: byId
              }, 
              allLeadIds: {
                ...state.allLeadIds,
                [role]: allIds
              } 
            };
        }, false, 'setInitialLeads');
      },
      
      upsertLead: (role, rawLead) => {
        const parsed = LeadSchema.safeParse(rawLead);
        if (!parsed.success) {
          console.error("[Zod] Rejected corrupted realtime lead injection:", parsed.error);
          return;
        }
        
        const lead = parsed.data;
        const state = get();
        
        // If this SSE event belongs to a resolved client mutation, drop the transaction
        if (lead.clientMutationId && state.pendingTransactions[lead.clientMutationId]) {
            const { [lead.clientMutationId]: _, ...restTx } = state.pendingTransactions;
            set({ pendingTransactions: restTx });
        }

        const currentRoleById = state.leadsById[role] || {};
        const currentAllIds = state.allLeadIds[role] || [];
        const isNew = !currentRoleById[lead.id];
        
        set((prev) => ({
          leadsById: {
            ...prev.leadsById,
            [role]: { ...(prev.leadsById[role] || {}), [lead.id]: lead }
          },
          allLeadIds: {
            ...prev.allLeadIds,
            [role]: isNew ? [lead.id, ...(prev.allLeadIds[role] || [])] : (prev.allLeadIds[role] || [])
          }
        }), false, 'upsertLead');
      },
      
      removeLead: (role, leadId) => {
        set((state) => {
            const currentRoleById = state.leadsById[role] || {};
            const { [leadId]: _, ...rest } = currentRoleById;
            return {
                leadsById: {
                  ...state.leadsById,
                  [role]: rest
                },
                allLeadIds: {
                  ...state.allLeadIds,
                  [role]: (state.allLeadIds[role] || []).filter(id => id !== leadId)
                }
            };
        }, false, 'removeLead');
      },
      
      optimisticUpdateStatus: (role, leadId, newStatus, mutationId) => {
        const currentRoleById = get().leadsById[role] || {};
        const lead = currentRoleById[leadId];
        if (!lead) return;
        
        set((state) => ({
          // Optimistically mutate the normalized dictionary directly for correct role
          leadsById: {
            ...state.leadsById,
            [role]: {
              ...(state.leadsById[role] || {}),
              [leadId]: { ...lead, status: newStatus }
            }
          },
          // Track the transaction to prevent overlapping race conditions
          pendingTransactions: {
            ...state.pendingTransactions,
            [mutationId]: {
              id: mutationId,
              type: 'UPDATE_STATUS',
              leadId,
              payload: { status: newStatus },
              status: 'sending',
              timestamp: Date.now()
            }
          }
        }), false, 'optimisticUpdateStatus');
      },
      
      resolveTransaction: (mutationId) => {
        set((state) => {
          const { [mutationId]: _, ...rest } = state.pendingTransactions;
          return { pendingTransactions: rest };
        }, false, 'resolveTransaction');
      },
      
      failTransaction: (mutationId) => {
        set((state) => {
          const tx = state.pendingTransactions[mutationId];
          if (!tx) return state;
          return {
            pendingTransactions: {
              ...state.pendingTransactions,
              [mutationId]: { ...tx, status: 'failed' }
            }
          };
        }, false, 'failTransaction');
      },
      
      reconcileState: (role, truthSnapshot) => {
        const state = get();
        const desyncedIds: string[] = [];
        const currentRoleById = state.leadsById[role] || {};
        
        // Basic checksum validation for silent network drops
        truthSnapshot.forEach(truth => {
           const local = currentRoleById[truth.id];
           if (!local) {
               desyncedIds.push(truth.id);
           }
        });
        
        return desyncedIds;
      }
    }),
    { name: 'Astronix-CRM-Store' }
  )
);
