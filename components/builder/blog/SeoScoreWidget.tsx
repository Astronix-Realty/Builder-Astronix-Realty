"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2, AlertTriangle, XCircle, ChevronRight,
  Globe, BookOpen, Image as ImageIcon, MousePointerClick, Zap, X
} from 'lucide-react';
import { HealthScore } from '@/lib/utils/health-score';

// ─── Color config by score band ───────────────
const getScoreConfig = (score: number) => {
  if (score >= 80) return { label: 'Good', ring: '#22c55e', bg: 'bg-green-500', text: 'text-green-600', badge: 'bg-green-50 text-green-700 border-green-200' };
  if (score >= 50) return { label: 'Average', ring: '#f59e0b', bg: 'bg-amber-500', text: 'text-amber-600', badge: 'bg-amber-50 text-amber-700 border-amber-200' };
  return { label: 'Poor', ring: '#ef4444', bg: 'bg-red-500', text: 'text-red-600', badge: 'bg-red-50 text-red-700 border-red-200' };
};

// ─── Circular SVG Progress Ring ────────────────
const CircularRing = ({ score, size = 64 }: { score: number; size?: number }) => {
  const cfg = getScoreConfig(score);
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={5} className="text-slate-200 dark:text-slate-700" />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={cfg.ring} strokeWidth={5}
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-sm font-black ${cfg.text}`}>{score}</span>
      </div>
    </div>
  );
};

// ─── Sub-score row ─────────────────────────────
const SubScoreRow = ({ icon: Icon, label, score, color }: { icon: any; label: string; score: number; color: string }) => (
  <div className="flex items-center gap-3">
    <div className={`p-1.5 rounded-lg ${color}`}>
      <Icon className="w-3.5 h-3.5 text-white" />
    </div>
    <div className="flex-1">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{label}</span>
        <span className="text-xs font-bold text-slate-500">{score}%</span>
      </div>
      <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${score >= 80 ? 'bg-green-500' : score >= 50 ? 'bg-amber-400' : 'bg-red-500'}`}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
    </div>
  </div>
);

// ─── Issue item ────────────────────────────────
const IssueItem = ({ text, type }: { text: string; type: 'error' | 'warning' | 'pass' }) => {
  const cfg = {
    error: { Icon: XCircle, cls: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' },
    warning: { Icon: AlertTriangle, cls: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
    pass: { Icon: CheckCircle2, cls: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20' },
  }[type];

  return (
    <div className={`flex items-start gap-2.5 px-3 py-2 rounded-lg ${cfg.bg}`}>
      <cfg.Icon className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${cfg.cls}`} />
      <span className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{text}</span>
    </div>
  );
};

// ─── Main Widget ───────────────────────────────
interface SeoScoreWidgetProps {
  health: HealthScore;
}

export const SeoScoreWidget: React.FC<SeoScoreWidgetProps> = ({ health }) => {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const cfg = getScoreConfig(health.score);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const passedCount = 5 - health.issues.length; // rough pass count
  const totalIssues = health.issues.length;
  const totalWarnings = health.recommendations.length;

  return (
    <div ref={panelRef} className="relative">

      {/* ── Compact Badge ── */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-bold transition-all shadow-sm ${cfg.badge}`}
        title="SEO & Health Score — click for details"
      >
        <CircularRing score={health.score} size={28} />
        <span>Score: {health.score}/100</span>
        <ChevronRight className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-90' : ''}`} />
      </motion.button>

      {/* ── Floating Detail Panel ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="seo-panel"
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            className="absolute top-full right-0 mt-2 w-96 z-[200] rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden"
            style={{ backdropFilter: 'blur(20px)', background: 'rgba(255,255,255,0.96)' }}
          >
            {/* Header */}
            <div className={`px-5 py-4 flex items-center justify-between ${cfg.bg}`}>
              <div className="flex items-center gap-4">
                <CircularRing score={health.score} size={56} />
                <div>
                  <p className="text-white font-black text-2xl leading-none">{health.score}<span className="text-white/60 text-sm font-semibold">/100</span></p>
                  <p className="text-white/80 text-xs font-semibold mt-0.5">{cfg.label} · Real-time SEO Analysis</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="p-1.5 hover:bg-white/20 rounded-full transition-colors">
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Quick Summary Strip */}
            <div className="grid grid-cols-3 divide-x divide-slate-100 dark:divide-slate-800 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
              <div className="px-4 py-3 text-center">
                <p className="text-lg font-black text-green-600">{Math.max(0, passedCount)}</p>
                <p className="text-xs text-slate-500 font-medium">Passed</p>
              </div>
              <div className="px-4 py-3 text-center">
                <p className="text-lg font-black text-amber-500">{totalWarnings}</p>
                <p className="text-xs text-slate-500 font-medium">Warnings</p>
              </div>
              <div className="px-4 py-3 text-center">
                <p className="text-lg font-black text-red-500">{totalIssues}</p>
                <p className="text-xs text-slate-500 font-medium">Critical</p>
              </div>
            </div>

            {/* Body */}
            <div className="p-5 space-y-5 max-h-[420px] overflow-y-auto">

              {/* Sub-scores */}
              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Category Scores</p>
                <SubScoreRow icon={Globe}              label="SEO"         score={health.seoScore}         color="bg-blue-500" />
                <SubScoreRow icon={BookOpen}           label="Readability" score={health.readabilityScore} color="bg-purple-500" />
                <SubScoreRow icon={ImageIcon}          label="Media"       score={health.mediaScore}       color="bg-pink-500" />
              </div>

              {/* Critical Issues */}
              {health.issues.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-widest text-red-400 flex items-center gap-1.5">
                    <XCircle className="w-3.5 h-3.5" /> Critical Issues
                  </p>
                  {health.issues.map((issue, i) => (
                    <IssueItem key={i} text={issue} type="error" />
                  ))}
                </div>
              )}

              {/* Warnings */}
              {health.recommendations.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-widest text-amber-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" /> Suggestions
                  </p>
                  {health.recommendations.map((rec, i) => (
                    <IssueItem key={i} text={rec} type="warning" />
                  ))}
                </div>
              )}

              {/* All passed */}
              {health.issues.length === 0 && health.recommendations.length === 0 && (
                <IssueItem text="All checks passed! Your blog is ready to publish." type="pass" />
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between">
              <span className="text-xs text-slate-400">Updates live as you edit</span>
              <div className="flex items-center gap-1.5 text-xs text-green-600 font-semibold">
                <Zap className="w-3.5 h-3.5" />
                Live Analysis
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
