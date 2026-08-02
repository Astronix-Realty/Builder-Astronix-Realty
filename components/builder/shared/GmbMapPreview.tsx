"use client";

import React, { useState } from "react";
import { MapPin, ExternalLink, Navigation, Copy, Check, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface GmbMapPreviewProps {
  googleMapLink?: string;
  placeId?: string;
  coordinates?: { lat: number | string; lng: number | string };
  locationName?: string;
  city?: string;
  district?: string;
  nearbyLandmark?: string;
}

export function GmbMapPreview({
  googleMapLink = "",
  placeId = "",
  coordinates,
  locationName = "",
  city = "",
  district = "",
  nearbyLandmark = "",
}: GmbMapPreviewProps) {
  const [copied, setCopied] = useState(false);

  const apiKey =
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
    "AIzaSyBAFwnvk0txVGFAk8GCOAiQ3RMuJBxe4vo";

  // Extract lat/lng numbers if present
  const lat = coordinates?.lat ? Number(coordinates.lat) : null;
  const lng = coordinates?.lng ? Number(coordinates.lng) : null;

  // Build the map embed URL that GUARANTEES a Red Location Pin Marker on the exact point
  let embedUrl = "";
  let pinLabel = locationName || nearbyLandmark || city || "Property Location";

  if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
    // Exact lat,lng query on Google Maps embed forces a RED MARKER PIN at that exact point
    embedUrl = `https://maps.google.com/maps?q=${lat},${lng}&z=16&output=embed`;
  } else if (placeId) {
    embedUrl = `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=place_id:${placeId}&zoom=16`;
  } else {
    // Build query from location string tokens
    const queryParts = [locationName, nearbyLandmark, city, district, "India"].filter(Boolean);
    const query = queryParts.length > 0 ? queryParts.join(", ") : "Dombivli, Maharashtra, India";
    embedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=16&output=embed`;
  }

  const directMapUrl =
    googleMapLink ||
    (lat && lng
      ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          [locationName, nearbyLandmark, city].filter(Boolean).join(", ")
        )}`);

  const handleCopyLink = () => {
    if (!directMapUrl) return;
    navigator.clipboard.writeText(directMapUrl);
    setCopied(true);
    toast.success("Google Maps Link Copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-900 text-white p-4 sm:p-5 rounded-2xl border border-slate-800 shadow-xl space-y-3.5">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-md animate-pulse">
            <MapPin className="w-4 h-4 fill-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-100">
                GMB Exact Pin Location Map
              </h4>
              <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-[10px] font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                Red Pin Dropped
              </Badge>
            </div>
            <p className="text-[11px] text-slate-400">
              Live map view with exact red marker pin for visitor navigation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleCopyLink}
            className="h-8 text-xs font-semibold rounded-xl bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-200"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied" : "Copy Link"}
          </Button>

          {directMapUrl && (
            <a
              href={directMapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="h-8 px-3 text-xs font-semibold rounded-xl bg-red-600 hover:bg-red-500 text-white flex items-center gap-1.5 transition-colors shadow-md"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open Maps
            </a>
          )}
        </div>
      </div>

      {/* Embedded Interactive Map Container */}
      <div className="relative w-full h-[290px] sm:h-[340px] rounded-xl overflow-hidden border border-slate-800 shadow-inner bg-slate-950">
        <iframe
          title="GMB Pin Location Map"
          src={embedUrl}
          className="w-full h-full border-0"
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
        />

        {/* Center Pin Marker Card Overlay */}
        <div className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/60 shadow-lg flex items-center gap-2 text-xs">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
          <span className="font-bold text-red-400 text-[11px] uppercase tracking-wider">
            📍 Exact Pin Point
          </span>
        </div>

        {/* Location Info Banner at Bottom */}
        <div className="absolute bottom-3 left-3 right-3 bg-slate-900/90 backdrop-blur-md p-2.5 rounded-xl border border-slate-700/60 shadow-lg flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <Navigation className="w-4 h-4 text-red-400 shrink-0" />
            <span className="font-semibold text-slate-200 truncate">
              {pinLabel}
            </span>
          </div>

          {lat && lng && (
            <span className="text-[10px] font-mono text-slate-300 shrink-0 bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700">
              {lat.toFixed(4)}, {lng.toFixed(4)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
