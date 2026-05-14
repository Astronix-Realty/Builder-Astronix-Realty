export type CRMEventType =
  | "LEAD_CREATED"
  | "LEAD_UPDATED"
  | "LEAD_DELETED"
  | "MESSAGE_SENT"
  | "CONVERSATION_CREATED"
  | "NOTIFICATION_PUSHED"
  | "HEARTBEAT"
  | "CONNECTED";

export interface LeadEventData {
  _id: string;
  name: string;
  phone: string;
  status: string;
  assignee?: string;
  source?: string;
  [key: string]: any;
}

export interface MessageEventData {
  _id: string;
  conversationId: string;
  text: string;
  sender: "agent" | "lead";
  senderName?: string;
  createdAt: string;
}

export interface CRMEventPayload {
  type: CRMEventType;
  leadId?: string;
  conversationId?: string;
  data?: LeadEventData | MessageEventData | any;
  timestamp: number;
}
