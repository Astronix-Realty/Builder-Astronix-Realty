import { NextResponse } from "next/server";
import { globalEventEmitter } from "@/lib/sse";

// In-memory telemetry
const telemetry = {
    bootTime: new Date().toISOString(),
    totalSseConnections: 0,
    optimisticReplayFailures: 0,
    averageMutationLatencyMs: 0,
};

// Expose internal listener to track connections if we ever need it, 
// though `globalEventEmitter.listenerCount()` works for now.

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const activeConnections = globalEventEmitter.listenerCount('leadUpdate') || 0;
        
        return NextResponse.json({
            status: "healthy",
            version: "v2.Enterprise.AGI",
            uptime: process.uptime(),
            telemetry: {
                ...telemetry,
                activeSseConnections: activeConnections,
                // Mock distributed stats for architecture preview
                redisPubSubStatus: "disconnected (running in memory fallback)",
                mongoChangeStreamsActive: false,
                aiOrchestratorDormant: true
            }
        });
    } catch (error) {
        return NextResponse.json({ status: "degraded", error: String(error) }, { status: 500 });
    }
}
