import { NextRequest } from "next/server";
import { subscribeToEvents } from "@/lib/sse";
import { checkRBAC } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { context, errorResponse } = await checkRBAC(req, ['builder', 'mandate', 'teamLeader']);
  if (errorResponse) return errorResponse;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: "CONNECTED", timestamp: Date.now() })}\n\n`)
      );

      const unsubscribe = subscribeToEvents((payload) => {
        try {
          // Allow connection health events
          if (payload.type === "CONNECTED" || payload.type === "HEARTBEAT") {
            const data = `data: ${JSON.stringify(payload)}\n\n`;
            controller.enqueue(encoder.encode(data));
            return;
          }

          // Resolve tenant keys from event payload
          const eventRole = payload.role || payload.data?.role || 'builder';
          const eventAccountId = payload.accountId || payload.data?.accountId;
          const eventBuilderId = payload.builderId || payload.data?.builderId;
          const eventMandateId = payload.mandateId || payload.data?.mandateId;

          // Enforce strict multi-tenant validation
          let isAuthorized = false;

          if (context!.role === 'builder') {
            if (eventRole !== 'mandate') {
              const uId = context!.userId;
              if (String(eventBuilderId) === uId || String(eventAccountId) === uId) {
                isAuthorized = true;
              }
            }
          } else if (context!.role === 'teamLeader') {
            const allowedTenantIds = context!.builderAccountIds && context!.builderAccountIds.length > 0
              ? context!.builderAccountIds
              : [context!.builderId, context!.userId].filter(Boolean) as string[];
            if (allowedTenantIds.some(id => String(eventBuilderId) === String(id) || String(eventAccountId) === String(id))) {
              isAuthorized = true;
            }
          } else if (context!.role === 'mandate') {
            if (eventRole === 'mandate') {
              const uId = context!.userId;
              const mId = context!.mandateId;
              if (String(eventAccountId) === uId || (mId && String(eventMandateId) === String(mId))) {
                isAuthorized = true;
              }
            }
          }

          if (isAuthorized) {
            const data = `data: ${JSON.stringify(payload)}\n\n`;
            controller.enqueue(encoder.encode(data));
          }
        } catch {
          // Client disconnected
        }
      });

      // Heartbeat every 15 seconds to keep connection alive through proxies
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "HEARTBEAT", timestamp: Date.now() })}\n\n`)
          );
        } catch {
          clearInterval(heartbeat);
        }
      }, 15000);

      // Handle client disconnect
      req.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
        unsubscribe();
        try { controller.close(); } catch {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no", // Disable Nginx buffering
    },
  });
}
