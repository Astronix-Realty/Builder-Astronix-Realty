import dbConnect from '@/lib/db';
import SyncQueue from '@/models/SyncQueue';
import { v4 as uuidv4 } from 'uuid';

export async function emitSyncEvent(params: {
  eventType: string;
  targetPanel: 'admin' | 'builder' | 'visitor';
  endpoint: string;
  payload: Record<string, any>;
}) {
  try {
    await dbConnect();
    const eventId = uuidv4();
    const payloadWithEvent = { eventId, ...params.payload };

    const queueItem = await SyncQueue.create({
      eventId,
      eventType: params.eventType,
      targetPanel: params.targetPanel,
      endpoint: params.endpoint,
      payload: payloadWithEvent,
      status: 'pending',
      attempts: 0,
      maxAttempts: 5,
    });

    return queueItem;
  } catch (error: any) {
    console.error('[SyncBus Error] Failed to queue sync event:', error.message);
  }
}
