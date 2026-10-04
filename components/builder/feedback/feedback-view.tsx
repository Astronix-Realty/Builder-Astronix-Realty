"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Send, MessageSquare, CheckCircle2, User, Mail } from "lucide-react";

interface FeedbackViewProps {
  initialName?: string;
  initialEmail?: string;
  source?: "builder" | "mandate";
}

export function FeedbackView({ initialName = "", initialEmail = "", source = "builder" }: FeedbackViewProps) {
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [query, setQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    if (initialName && !name) setName(initialName);
    if (initialEmail && !email) setEmail(initialEmail);
  }, [initialName, initialEmail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Strict client-side validation
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedQuery = query.trim();

    if (!trimmedName || trimmedName.length < 2) {
      return toast.error("Please enter a valid name (at least 2 characters)");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      return toast.error("Please enter a valid email address");
    }

    if (!trimmedQuery || trimmedQuery.length < 5) {
      return toast.error("Please enter your query/feedback (at least 5 characters)");
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          email: trimmedEmail,
          query: trimmedQuery,
          source
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit feedback");

      toast.success("Feedback submitted successfully to the Admin team!");
      setIsSubmitted(true);
      setQuery("");
    } catch (err: any) {
      toast.error(err.message || "Failed to submit feedback");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 sm:p-8 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 mt-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <MessageSquare className="w-5 h-5" />
          </div>
          Feedback & Support
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm leading-relaxed">
          Share your queries, feedback, or report technical difficulties.
        </p>
      </div>

      {isSubmitted && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold">Thank you! Your feedback has been recorded.</p>
            <p className="text-xs text-emerald-700/80 dark:text-emerald-300/80 mt-0.5">
              You can submit another query below at any time.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="name" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
            <User className="w-4 h-4 text-slate-400" />
            Your Full Name <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Rahul Sharma"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
            <Mail className="w-4 h-4 text-slate-400" />
            Email Address <span className="text-red-500">*</span>
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g. rahul@example.com"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm"
          />
        </div>

        <div>
          <label htmlFor="query" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Query / Feedback Message <span className="text-red-500">*</span>
          </label>
          <textarea
            id="query"
            required
            rows={5}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Please detail your query, experience, suggestion, or issue..."
            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none text-sm leading-relaxed"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full sm:w-auto px-7 py-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-60 shadow-sm"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Submitting...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Submit Feedback</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
