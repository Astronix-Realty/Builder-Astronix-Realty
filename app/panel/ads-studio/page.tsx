import React from "react";
import { AdsStudioView } from "@/components/builder/ads-studio/AdsStudioView";

export const metadata = {
  title: "Meta Ads & Boost Studio | Astronix Realty",
  description: "Promote your published properties, towers and flat configurations on Facebook and Instagram.",
};

export default function AdsStudioPage() {
  return (
    <div className="min-h-screen bg-slate-950">
      <AdsStudioView />
    </div>
  );
}
