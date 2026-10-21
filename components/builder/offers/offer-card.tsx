"use client";

import React from "react";
import {
  Copy, Pause, Play, Edit2, Trash2, Tag, Calendar,
  Building2, Info, ArrowRight, Sparkles
} from "lucide-react";

interface OfferCardProps {
  offer: any;
  onEdit: (offer: any) => void;
  onDuplicate: (offer: any) => void;
  onToggleStatus: (id: string, currentStatus: string) => void;
  onDelete: (id: string) => void;
}

/**
 * Top Decorative Garland Swag Component
 * Renders the festive golden chain/garland arcs with ambient glow.
 */
function FestiveGarlandHeader() {
  return (
    <div className="relative w-full h-8 overflow-hidden pointer-events-none select-none -mt-0.5">
      {/* Golden Ambient Glow */}
      <div className="absolute -top-6 inset-x-0 h-14 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-400/40 via-yellow-500/15 to-transparent blur-[5px]" />

      <svg
        viewBox="0 0 200 42"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="goldChainGradBuilder" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#B45309" />
            <stop offset="20%" stopColor="#FDE68A" />
            <stop offset="40%" stopColor="#F59E0B" />
            <stop offset="60%" stopColor="#FEF08A" />
            <stop offset="80%" stopColor="#D97706" />
            <stop offset="100%" stopColor="#B45309" />
          </linearGradient>
          <linearGradient id="goldChainDarkBuilder" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#78350F" />
            <stop offset="30%" stopColor="#D97706" />
            <stop offset="70%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#78350F" />
          </linearGradient>
        </defs>

        <path
          d="M -5 0 Q 25 20 48 4"
          stroke="url(#goldChainGradBuilder)"
          strokeWidth="2.2"
          strokeDasharray="2.5 1.5"
          strokeLinecap="round"
        />
        <path
          d="M 152 4 Q 175 20 205 0"
          stroke="url(#goldChainGradBuilder)"
          strokeWidth="2.2"
          strokeDasharray="2.5 1.5"
          strokeLinecap="round"
        />

        {/* Primary Upper Garland Arc */}
        <path
          d="M 0 5 Q 50 28 100 13 Q 150 28 200 5"
          stroke="url(#goldChainGradBuilder)"
          strokeWidth="2.6"
          strokeDasharray="3 2"
          strokeLinecap="round"
        />

        {/* Secondary Lower Garland Arc */}
        <path
          d="M 6 11 Q 50 36 100 19 Q 150 36 194 11"
          stroke="url(#goldChainDarkBuilder)"
          strokeWidth="1.8"
          strokeDasharray="2.5 1.8"
          strokeLinecap="round"
          opacity="0.9"
        />

        <circle cx="100" cy="13" r="3" fill="#FEF08A" stroke="#B45309" strokeWidth="0.8" />
        <circle cx="0" cy="5" r="2.5" fill="#FDE68A" />
        <circle cx="200" cy="5" r="2.5" fill="#FDE68A" />
        <circle cx="50" cy="25" r="2" fill="#FEF08A" />
        <circle cx="150" cy="25" r="2" fill="#FEF08A" />
      </svg>
    </div>
  );
}

/**
 * Parses raw title and priority badge into two distinct lines
 * (e.g. "NAVRATRI" on top line and "FESTIVE OFFER" in radiant gold gradient).
 */
function parseOfferTitle(rawTitle?: string, rawBadge?: string) {
  const title = (rawTitle || 'Special Offer').trim();
  const badge = (rawBadge && rawBadge !== 'None' ? rawBadge : '').trim();

  const upperTitle = title.toUpperCase();
  const upperBadge = badge.toUpperCase();

  if (upperBadge.includes('FESTIVE') || upperTitle.includes('FESTIVE')) {
    let cleanTitle = upperTitle
      .replace(/\b(FESTIVE|OFFER|FESTIVE OFFER)\b/gi, '')
      .trim();
    if (!cleanTitle) cleanTitle = 'FESTIVE';
    return {
      topLine: cleanTitle,
      bottomLine: 'FESTIVE OFFER',
    };
  }

  const words = upperTitle.split(/\s+/);
  if (words.length >= 2) {
    if (words[words.length - 1] === 'OFFER') {
      const main = words.slice(0, -1).join(' ');
      return {
        topLine: main,
        bottomLine: upperBadge || 'EXCLUSIVE OFFER',
      };
    }
    const mid = Math.ceil(words.length / 2);
    return {
      topLine: words.slice(0, mid).join(' '),
      bottomLine: words.slice(mid).join(' ') + (upperBadge ? ` • ${upperBadge}` : ''),
    };
  }

  return {
    topLine: upperTitle,
    bottomLine: upperBadge || 'EXCLUSIVE OFFER',
  };
}

export function OfferCard({ offer, onEdit, onDuplicate, onToggleStatus, onDelete }: OfferCardProps) {
  const isExpired = offer.endDate && new Date(offer.endDate) < new Date();
  const displayStatus = isExpired ? "expired" : offer.status;

  const statusColors: Record<string, string> = {
    active: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    draft: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30",
    paused: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
    expired: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30",
  };

  const { topLine, bottomLine } = parseOfferTitle(offer.offerName, offer.priorityBadge);

  // Clean benefit text (prefer punchy highlight like "₹5 Lac Cashback*")
  let benefit =
    offer.benefitHighlight ||
    offer.benefitText ||
    offer.description ||
    '₹5 Lac Cashback*';

  if (/5\s*lac\s*₹/i.test(benefit) || /5lac\s*cashback/i.test(benefit)) {
    benefit = '₹5 Lac Cashback*';
  }

  const bookmarkClip = 'polygon(0% 0%, 100% 0%, 100% 100%, 50% calc(100% - 14px), 0% 100%)';
  const innerBookmarkClip = 'polygon(0% 0%, 100% 0%, 100% calc(100% - 1px), 50% calc(100% - 13.5px), 0% calc(100% - 1px))';

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col group">
      
      {/* ─── Top Stage: Authentic Festive Hanging Ribbon Display ─── */}
      <div className="relative w-full bg-gradient-to-b from-[#090b11] via-[#0d101a] to-[#07090f] py-5 px-3 flex flex-col items-center justify-center overflow-hidden border-b border-slate-100 dark:border-slate-800">
        
        {/* Subtle Ambient Background Glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,_rgba(245,158,11,0.12)_0%,_transparent_65%)] pointer-events-none" />

        {/* Top Floating Badges: Level & Status */}
        <div className="absolute top-3 inset-x-3 flex items-center justify-between z-30 pointer-events-none">
          {offer.propertyLevel && (
            <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-black/60 backdrop-blur-md text-amber-300 border border-amber-500/30 flex items-center gap-1 shadow-sm">
              <Building2 className="w-3 h-3 text-amber-400" />
              {offer.propertyLevel} {offer.targetScope === 'exact' ? '(Exact)' : '(Cascade)'}
            </span>
          )}

          <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border backdrop-blur-md ${statusColors[displayStatus] || ""}`}>
            <span className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${displayStatus === 'active' ? 'bg-emerald-500 animate-pulse' : displayStatus === 'draft' ? 'bg-slate-400' : displayStatus === 'paused' ? 'bg-amber-500' : 'bg-red-500'}`} />
              {displayStatus}
            </span>
          </span>
        </div>

        {/* The Festive Ribbon Card (Scaled to fit card header perfectly) */}
        <div className="relative pt-6 pb-1 transition-transform duration-300 group-hover:scale-[1.02]">
          
          {/* Top Hanging Cables */}
          <div className="relative mx-auto w-[82%] flex items-center justify-between px-3 z-10 -mb-1">
            <div className="w-[2.5px] h-3 bg-gradient-to-b from-amber-700 via-yellow-400 to-amber-600 rounded-t" />
            <div className="w-[2.5px] h-3 bg-gradient-to-b from-amber-700 via-yellow-400 to-amber-600 rounded-t" />
          </div>

          {/* Golden Framed Bookmark */}
          <div
            style={{ clipPath: bookmarkClip }}
            className="w-44 sm:w-48 p-[1.5px] bg-gradient-to-b from-amber-300 via-yellow-500 to-amber-700 shadow-[0_12px_28px_rgba(0,0,0,0.6)]"
          >
            <div
              style={{ clipPath: innerBookmarkClip }}
              className="relative w-full bg-gradient-to-b from-[#11131c] via-[#0d0f17] to-[#07080d] pt-1 pb-6 px-3 flex flex-col items-center text-center overflow-hidden"
            >
              {/* Inner hairline gold border */}
              <div
                style={{ clipPath: innerBookmarkClip }}
                className="absolute inset-[2.5px] border border-amber-500/25 pointer-events-none z-10"
              />

              {/* Garland Swags */}
              <FestiveGarlandHeader />

              {/* Title */}
              <div className="w-full flex flex-col items-center mt-0.5 mb-2 z-20">
                {topLine && (
                  <span className="text-[10.5px] font-black tracking-[0.16em] text-white/90 uppercase drop-shadow-sm">
                    {topLine}
                  </span>
                )}
                <h4 className="text-[13px] sm:text-[14px] font-black tracking-wider uppercase leading-tight bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-400 bg-clip-text text-transparent drop-shadow-[0_2px_6px_rgba(234,179,8,0.3)] mt-0.5">
                  {bottomLine}
                </h4>
              </div>

              {/* Benefit Box */}
              <div className="w-full px-2 py-1 rounded border border-amber-500/35 bg-[#090b12]/90 text-amber-300 font-extrabold text-[10.5px] tracking-wide leading-tight mb-2 flex items-center justify-center shadow-inner z-20">
                <span className="truncate">{benefit}</span>
              </div>

              {/* Verified Tag */}
              <div className="relative z-20 flex items-center gap-1 text-[8px] font-bold uppercase tracking-[0.12em] text-slate-300/80 mb-2.5">
                <Info className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                <span>Verified Property Offer</span>
              </div>

              {/* Mock Claim Button */}
              <div className="relative z-20 w-full py-1.5 px-3 bg-white text-slate-950 font-black text-[10px] uppercase tracking-wider rounded-md shadow-md flex items-center justify-center gap-1.5 pointer-events-none">
                <span>Claim Offer</span>
                <ArrowRight className="w-2.5 h-2.5" />
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ─── Body Details ─── */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg">
            <span className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
              <Tag className="w-3.5 h-3.5 text-purple-500" />
              {offer.offerType || "Flat Discount"}
            </span>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
              {offer.visibility || "Public"}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="font-medium">
              {offer.endDate ? `Valid till ${new Date(offer.endDate).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })}` : "Ongoing Campaign (No Expiry)"}
            </span>
          </div>

          {offer.description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 px-1">
              {offer.description}
            </p>
          )}
        </div>

        {/* ─── Builder Action Toolbar ─── */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
          <button
            onClick={() => !isExpired && onToggleStatus(offer._id, offer.status)}
            disabled={isExpired}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
          >
            {offer.status === "active" ? (
              <><Pause className="w-3.5 h-3.5 text-amber-500" /> Pause</>
            ) : (
              <><Play className="w-3.5 h-3.5 text-emerald-500" /> Publish</>
            )}
          </button>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onDuplicate(offer)}
              className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-colors"
              title="Duplicate Offer"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              onClick={() => onEdit(offer)}
              className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-colors"
              title="Edit Offer"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(offer._id)}
              className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
              title="Delete Offer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
