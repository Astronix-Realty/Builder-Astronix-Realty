"use client";

import React from "react";
import { Eye, Users, Copy, Pause, Play, Edit2, Trash2, Tag, Calendar, TrendingUp, Percent, Building2 } from "lucide-react";
import Image from "next/image";

interface OfferCardProps {
  offer: any;
  onEdit: (offer: any) => void;
  onDuplicate: (offer: any) => void;
  onToggleStatus: (id: string, currentStatus: string) => void;
  onDelete: (id: string) => void;
}

export function OfferCard({ offer, onEdit, onDuplicate, onToggleStatus, onDelete }: OfferCardProps) {
  const isExpired = offer.endDate && new Date(offer.endDate) < new Date();
  const displayStatus = isExpired ? "expired" : offer.status;

  const statusColors: Record<string, string> = {
    active: "bg-white/95 dark:bg-slate-900/95 text-emerald-600 border-emerald-200/50 shadow-sm",
    draft: "bg-white/95 dark:bg-slate-900/95 text-slate-600 border-slate-200/50 shadow-sm",
    paused: "bg-white/95 dark:bg-slate-900/95 text-amber-600 border-amber-200/50 shadow-sm",
    expired: "bg-white/95 dark:bg-slate-900/95 text-red-600 border-red-200/50 shadow-sm",
  };

  const badgeColors: Record<string, string> = {
    "Hot Deal": "bg-gradient-to-r from-orange-500 to-red-500 text-white",
    "Limited Time": "bg-gradient-to-r from-blue-500 to-indigo-500 text-white",
    "Festive Offer": "bg-gradient-to-r from-pink-500 to-rose-500 text-white",
    "Builder Exclusive": "bg-gradient-to-r from-amber-400 to-amber-600 text-white",
    "None": "hidden",
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col group">
      {/* Header / Banner */}
      <div className="h-40 w-full relative bg-slate-100 dark:bg-slate-800 overflow-hidden border-b border-slate-100 dark:border-slate-800">
        {offer.bannerImage ? (
          <>
            <Image
              src={offer.bannerImage}
              alt={offer.offerName}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-700"
              unoptimized
            />
            {/* Gradient Overlay for better badge legibility on bright images */}
            <div className="absolute inset-0 bg-gradient-to-b from-slate-900/40 via-transparent to-transparent pointer-events-none" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-purple-100 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/20 flex items-center justify-center">
            <Tag className="w-12 h-12 text-purple-300 dark:text-purple-700/50" />
          </div>
        )}

        {/* Priority Badge */}
        {offer.priorityBadge && offer.priorityBadge !== "None" && (
          <div className={`absolute top-4 left-4 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-md border border-white/20 ${badgeColors[offer.priorityBadge] || ""}`}>
            {offer.priorityBadge}
          </div>
        )}

        {/* Status Badge */}
        <div className={`absolute top-4 right-4 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border backdrop-blur-md ${statusColors[displayStatus] || ""}`}>
          <span className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${displayStatus === 'active' ? 'bg-emerald-500 animate-pulse' : displayStatus === 'draft' ? 'bg-slate-400' : displayStatus === 'paused' ? 'bg-amber-500' : 'bg-red-500'}`} />
            {displayStatus}
          </span>
        </div>

        {/* Highlight overlapping badge */}
        {offer.benefitHighlight && (
          <div className="absolute -bottom-4 right-6 bg-gradient-to-br from-amber-300 to-yellow-500 text-yellow-950 font-black px-4 py-2 rounded-xl shadow-[0_8px_16px_-6px_rgba(234,179,8,0.5)] border border-yellow-200/50 dark:border-yellow-600/50 transform rotate-3 z-10 text-sm hover:rotate-0 transition-transform">
            {offer.benefitHighlight}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-6 flex-1 flex flex-col">
        <div className="mb-4">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1 line-clamp-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
            {offer.offerName}
          </h3>
          <p className="text-sm font-semibold text-purple-600 dark:text-purple-400">
            {offer.benefitText}
          </p>
        </div>

        <div className="space-y-3 mb-6">
          {offer.propertyLevel && (
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg">
              <span className="flex items-center gap-1.5 font-bold capitalize text-slate-800 dark:text-slate-200">
                <Building2 className="w-3.5 h-3.5 text-blue-500" />
                {offer.propertyLevel} Level
              </span>
              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                offer.targetScope === 'exact'
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
              }`}>
                {offer.targetScope === 'exact' ? 'Exact Level' : 'Cascading'}
              </span>
            </div>
          )}

          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg">
            <Tag className="w-4 h-4 text-slate-400" />
            <span className="font-medium">{offer.offerType || "—"}</span>
            <span className="mx-1 text-slate-300">•</span>
            <span>{offer.visibility || "Public"}</span>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="font-medium">
              {offer.endDate ? `Valid till ${new Date(offer.endDate).toLocaleDateString("en-IN")}` : "No Expiry"}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex justify-between items-center gap-2">
        <button
          onClick={() => !isExpired && onToggleStatus(offer._id, offer.status)}
          disabled={isExpired}
          className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {offer.status === "active" ? (
            <><Pause className="w-4 h-4" /> Pause</>
          ) : (
            <><Play className="w-4 h-4 text-emerald-500" /> Publish</>
          )}
        </button>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onDuplicate(offer)}
            className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
            title="Duplicate"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={() => onEdit(offer)}
            className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
            title="Edit"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(offer._id)}
            className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
