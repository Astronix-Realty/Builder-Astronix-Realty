import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { LeadSchema, ValidatedLead } from '../schemas/crm';

// --- Types ---
type LeadStatus = "Fresh" | "Token VIP" | "Connected" | "Site Visit" | "Negotiation" | "Booked" | "Junk";

interface PendingTransaction {
  id: string;
  type: 'UPDATE_STATUS' | 'ADD_NOTE' | 'CREATE_LEAD';
  leadId: string;
  payload: any;
  status: 'sending' | 'failed';
  timestamp: number;
}

interface CRMState {
  // Normalized Entity Storage
  leadsById: Record<string, ValidatedLead>;
  allLeadIds: string[];
  
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
  
  // Lead Actions
  setInitialLeads: (leads: ValidatedLead[]) => void;
  upsertLead: (lead: ValidatedLead) => void;
  removeLead: (leadId: string) => void;
  
  // Optimistic Mutations
  optimisticUpdateStatus: (leadId: string, newStatus: LeadStatus, mutationId: string) => void;
  resolveTransaction: (mutationId: string) => void;
  failTransaction: (mutationId: string) => void;
  
  // Background Reconciler
  reconcileState: (truthSnapshot: { id: string, updatedAt: string }[]) => string[]; // returns out-of-sync IDs
}

export const useCRMStore = create<CRMState>()(
  devtools(
    (set, get) => ({
      leadsById: {},
      allLeadIds: [],
      
      _hasHydrated: false,
      sseStatus: 'disconnected',
      lastHeartbeat: null,
      
      pendingTransactions: {},
      
      setHydrated: () => set({ _hasHydrated: true }, false, 'setHydrated'),
      setSSEStatus: (status) => set({ sseStatus: status }, false, 'setSSEStatus'),
      updateHeartbeat: () => set({ lastHeartbeat: Date.now() }, false, 'updateHeartbeat'),
      
      setInitialLeads: (leads) => {
        set((state) => {
            const byId = { ...state.leadsById };
            const fetchedIds = new Set(leads.map(l => l.id));
            
            leads.forEach(l => {
              byId[l.id] = l;
            });
            
            // Keep realtime leads not present in fetch
            const realTimeIds = state.allLeadIds.filter(id => !fetchedIds.has(id));
            
            return { leadsById: byId, allLeadIds: [...realTimeIds, ...Array.from(fetchedIds)] };
        }, false, 'setInitialLeads');
      },
      
      upsertLead: (rawLead) => {
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

        const isNew = !state.leadsById[lead.id];
        
        set((prev) => ({
          leadsById: { ...prev.leadsById, [lead.id]: lead },
          allLeadIds: isNew ? [lead.id, ...prev.allLeadIds] : prev.allLeadIds
        }), false, 'upsertLead');
      },
      
      removeLead: (leadId) => {
        set((state) => {
            const { [leadId]: _, ...rest } = state.leadsById;
            return {
                leadsById: rest,
                allLeadIds: state.allLeadIds.filter(id => id !== leadId)
            };
        }, false, 'removeLead');
      },
      
      optimisticUpdateStatus: (leadId, newStatus, mutationId) => {
        const lead = get().leadsById[leadId];
        if (!lead) return;
        
        set((state) => ({
          // Optimistically mutate the normalized dictionary directly
          leadsById: {
            ...state.leadsById,
            [leadId]: { ...lead, status: newStatus }
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
      
      reconcileState: (truthSnapshot) => {
        const state = get();
        const desyncedIds: string[] = [];
        
        // Basic checksum validation for silent network drops
        truthSnapshot.forEach(truth => {
           const local = state.leadsById[truth.id];
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
