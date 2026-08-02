import { EventEmitter } from "events";
import { CRMEventPayload } from "@/types/crm-events";

// Use global to prevent re-instantiation in Next.js dev mode
declare global {
  var sseEmitter: EventEmitter | undefined;
}

const emitter = global.sseEmitter || new EventEmitter();
emitter.setMaxListeners(200);

if (process.env.NODE_ENV !== "production") {
  global.sseEmitter = emitter;
}

export function broadcastEvent(payload: CRMEventPayload) {
  emitter.emit("crm-event", payload);
}

export function subscribeToEvents(callback: (payload: CRMEventPayload) => void) {
  emitter.on("crm-event", callback);
  return () => {
    emitter.off("crm-event", callback);
  };
}
