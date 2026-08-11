"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Search, CheckCircle2, Sparkles, Loader2, Globe2 } from "lucide-react";
import { toast } from "sonner";

interface GooglePlacesSearchProps {
  onLocationSelected: (locationData: {
    city?: string;
    district?: string;
    subCity?: string;
    village?: string;
    state?: string;
    country?: string;
    pincode?: string;
    nearbyLandmark?: string;
    googleMapLink?: string;
    googlePlusCode?: string;
    placeId?: string;
    coordinates?: { lat: number; lng: number };
    gmbReviews?: any[];
  }) => void;
  initialSearchText?: string;
}

declare global {
  interface Window {
    google: any;
    initGoogleMapsPlaces?: () => void;
  }
}

export default function GooglePlacesSearch({
  onLocationSelected,
  initialSearchText = "",
}: GooglePlacesSearchProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const autocompleteRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [selectedPlaceName, setSelectedPlaceName] = useState<string>("");

  const apiKey =
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
    "AIzaSyBAFwnvk0txVGFAk8GCOAiQ3RMuJBxe4vo";

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (window.google?.maps?.places) {
      setIsLoaded(true);
      return;
    }

    const existingScript = document.getElementById("google-maps-places-script");
    if (!existingScript) {
      const script = document.createElement("script");
      script.id = "google-maps-places-script";
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGoogleMapsPlaces`;
      script.async = true;
      script.defer = true;

      window.initGoogleMapsPlaces = () => {
        setIsLoaded(true);
      };

      script.onerror = () => {
        setLoadingError("Failed to load Google Places Autocomplete API");
      };

      document.head.appendChild(script);
    } else {
      const checkInterval = setInterval(() => {
        if (window.google?.maps?.places) {
          setIsLoaded(true);
          clearInterval(checkInterval);
        }
      }, 300);
      return () => clearInterval(checkInterval);
    }
  }, [apiKey]);

  useEffect(() => {
    if (!isLoaded || !inputRef.current || autocompleteRef.current) return;

    try {
      const options = {
        fields: [
          "address_components",
          "formatted_address",
          "geometry",
          "name",
          "place_id",
          "plus_code",
          "url",
          "reviews",
          "rating",
          "user_ratings_total",
        ],
        types: ["geocode", "establishment"],
      };

      const autocomplete = new window.google.maps.places.Autocomplete(
        inputRef.current,
        options
      );
      autocompleteRef.current = autocomplete;

      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (!place || !place.address_components) return;

        let city = "";
        let level2District = "";
        let level3District = "";
        let subCity = "";
        let sublocality1 = "";
        let sublocality2 = "";
        let sublocality3 = "";
        let neighborhood = "";
        let routePremise = "";
        let state = "";
        let country = "";
        let pincode = "";

        // Extract exact components dynamically from Google Places API
        for (const component of place.address_components) {
          const types: string[] = component.types || [];

          if (types.includes("postal_code")) {
            pincode = component.long_name;
          } else if (types.includes("country")) {
            country = component.long_name;
          } else if (types.includes("administrative_area_level_1")) {
            state = component.long_name;
          } else if (types.includes("administrative_area_level_2")) {
            level2District = component.long_name;
          } else if (types.includes("administrative_area_level_3")) {
            level3District = component.long_name;
          } else if (types.includes("locality")) {
            city = component.long_name;
          } else if (types.includes("sublocality_level_1")) {
            sublocality1 = component.long_name;
          } else if (types.includes("sublocality_level_2")) {
            sublocality2 = component.long_name;
          } else if (types.includes("sublocality_level_3")) {
            sublocality3 = component.long_name;
          } else if (types.includes("neighborhood")) {
            neighborhood = component.long_name;
          } else if (types.includes("sublocality")) {
            if (!sublocality1) sublocality1 = component.long_name;
          } else if (
            types.includes("route") ||
            types.includes("street_number") ||
            types.includes("premise")
          ) {
            if (!routePremise) routePremise = component.long_name;
          }
        }

        // Sub City resolution: prefer sublocality1 (e.g. "Dombivli East")
        subCity = sublocality1 || sublocality2 || city || "";

        // 1. Smart City Resolution:
        // If subCity is "Dombivli East" / "Dombivli West", the true city is "Dombivli" rather than "Kalyan" (KDMC municipal name)
        let cleanSubCity = subCity.replace(/\s*(east|west|north|south|central)\s*/i, "").trim();
        if (cleanSubCity && city.toLowerCase() !== cleanSubCity.toLowerCase()) {
          if (city.toLowerCase().includes("kalyan") && cleanSubCity.toLowerCase().includes("dombivli")) {
            city = cleanSubCity;
          }
        }
        if (!city) city = cleanSubCity || level3District || level2District || "";

        // 2. Smart District resolution (Filter out revenue division names like "Konkan Division")
        let district = "";
        if (level2District && level2District.toLowerCase().includes("division")) {
          district = level3District || city || level2District.replace(/division/i, "").trim();
        } else {
          district = level2District || level3District || city || "";
        }

        // 3. Smart Village/Area Resolution for GMB Profiles & Places:
        // Extract exact neighborhood/road/area (e.g. "Shankara Nagar Road", "Sonar Pada", "MIDC")
        let village = neighborhood || sublocality3 || "";

        if (!village && routePremise && routePremise.toLowerCase() !== city.toLowerCase()) {
          village = routePremise;
        }

        if (!village && sublocality2 && sublocality2.toLowerCase() !== city.toLowerCase() && sublocality2.toLowerCase() !== subCity.toLowerCase()) {
          village = sublocality2;
        }

        // If village is still empty or duplicates city name (e.g. "Dombivli"), extract from formatted_address/place.name
        if (!village || village.toLowerCase() === city.toLowerCase() || village.toLowerCase() === subCity.toLowerCase()) {
          const rawAddress = place.formatted_address || place.name || "";
          if (rawAddress) {
            const addressParts = rawAddress.split(",").map((p: string) => p.trim());
            // Filter out state, country, pincode, city, subCity, district, and business title
            const filtered = addressParts.filter((part: string) => {
              const lower = part.toLowerCase();
              if (pincode && lower.includes(pincode)) return false;
              if (country && lower.includes(country.toLowerCase())) return false;
              if (state && lower.includes(state.toLowerCase())) return false;
              if (district && lower.includes(district.toLowerCase())) return false;
              if (city && lower === city.toLowerCase()) return false;
              if (subCity && lower === subCity.toLowerCase()) return false;
              if (lower.includes("kalyan") && lower.includes("dombivli")) return false;
              if (place.name && lower.includes(place.name.toLowerCase())) return false;
              return true;
            });

            if (filtered.length > 0) {
              // Pick the best area token (e.g. "Shankara Nagar Road", "Sonar Pada", "MIDC")
              village = filtered.find((f: string) =>
                f.toLowerCase().includes("road") ||
                f.toLowerCase().includes("nagar") ||
                f.toLowerCase().includes("pada") ||
                f.toLowerCase().includes("midc") ||
                f.toLowerCase().includes("sector") ||
                f.toLowerCase().includes("colony")
              ) || filtered[0];
            }
          }
        }

        if (!village) {
          village = routePremise || sublocality2 || subCity || city || "";
        }

        // Universal hierarchy fallbacks
        if (!city) city = subCity || district || state || "";
        if (!district) district = city || state || "";
        if (!subCity) subCity = village || city || "";

        const lat = place.geometry?.location?.lat
          ? place.geometry.location.lat()
          : undefined;
        const lng = place.geometry?.location?.lng
          ? place.geometry.location.lng()
          : undefined;

        const googleMapLink =
          place.url ||
          (lat && lng
            ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
            : "");
        const googlePlusCode =
          place.plus_code?.global_code ||
          place.plus_code?.compound_code ||
          "";

        // Clean & precise Landmark string for any place
        let landmark = "";
        if (place.name && place.formatted_address) {
          if (
            !place.formatted_address
              .toLowerCase()
              .includes(place.name.toLowerCase())
          ) {
            landmark = `${place.name}, ${place.formatted_address}`;
          } else {
            landmark = place.formatted_address;
          }
        } else {
          landmark = place.formatted_address || place.name || "";
        }

        const gmbReviews = Array.isArray(place.reviews)
          ? place.reviews.map((r: any) => ({
              name: r.author_name || "Google User",
              designation: r.relative_time_description || "GMB Verified Reviewer",
              rating: r.rating || 5,
              quote: r.text || "Great experience and location.",
              avatar: r.profile_photo_url || "",
            }))
          : [];

        setSelectedPlaceName(place.name || place.formatted_address || "");

        // Auto-fill wizard fields dynamically for ANY place searched
        onLocationSelected({
          city,
          district,
          subCity,
          village,
          state,
          country,
          pincode,
          nearbyLandmark: landmark,
          googleMapLink,
          googlePlusCode,
          placeId: place.place_id,
          coordinates: lat && lng ? { lat, lng } : undefined,
          gmbReviews,
        });

        toast.success(
          `📍 Google Maps details linked for: ${place.name || "Selected Location"}`,
          {
            description: `City, District, Sub City, Area, State, Country, Pincode & Map details auto-filled!`,
          }
        );
      });
    } catch (err) {
      console.error("Error initializing Google Places Autocomplete:", err);
    }
  }, [isLoaded, onLocationSelected]);

  return (
    <div className="bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 p-5 rounded-2xl border border-blue-200/50 dark:border-blue-800/40 shadow-sm space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <Label className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Universal Google Places & GMB Search
            </Label>
            <p className="text-[11px] text-muted-foreground">
              Search ANY Project, GMB Profile, or Address to auto-extract exact City, Pincode & Map details
            </p>
          </div>
        </div>
        <Badge className="bg-blue-600/10 text-blue-700 dark:text-blue-300 border-blue-300/40 text-[10px] font-black uppercase flex items-center gap-1">
          <Globe2 className="w-3 h-3 text-blue-600" />
          Worldwide Auto-Extract
        </Badge>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="🔍 Search ANY Project Name, GMB Business Profile, or Location..."
          className="pl-10 pr-10 h-11 bg-white dark:bg-slate-900 border-blue-200 dark:border-slate-700 shadow-sm focus-visible:ring-blue-500 text-xs font-semibold rounded-xl"
        />
        {!isLoaded && !loadingError && (
          <Loader2 className="w-4 h-4 absolute right-3.5 top-3.5 text-blue-500 animate-spin" />
        )}
        {selectedPlaceName && (
          <CheckCircle2 className="w-4 h-4 absolute right-3.5 top-3.5 text-emerald-500" />
        )}
      </div>

      {selectedPlaceName && (
        <div className="flex items-center gap-2 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Selected Place: {selectedPlaceName}</span>
        </div>
      )}
    </div>
  );
}
