"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Send, Bug, Lightbulb, MessageSquare, AlertCircle } from "lucide-react";

export function FeedbackView() {
  const [type, setType] = useState<"Glitch" | "Problem" | "Suggestion" | "Other">("Suggestion");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return toast.error("Please enter a message");

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedbackType: type, message }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit feedback");
      
      toast.success("Feedback submitted successfully. Admin has been notified.");
      setMessage("");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 mt-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-indigo-500" />
          Feedback & Support
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2">
          Report a glitch, submit a problem, or share your suggestions directly with the Admin team.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
            What kind of feedback is this?
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { id: "Glitch", icon: Bug, color: "text-red-500" },
              { id: "Problem", icon: AlertCircle, color: "text-orange-500" },
              { id: "Suggestion", icon: Lightbulb, color: "text-amber-500" },
              { id: "Other", icon: MessageSquare, color: "text-blue-500" },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setType(t.id as any)}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                  type === t.id
                    ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10"
                    : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                }`}
              >
                <t.icon className={`w-6 h-6 mb-3 ${t.color}`} />
                <span className={`text-sm font-bold ${type === t.id ? "text-indigo-700 dark:text-indigo-400" : "text-slate-600 dark:text-slate-400"}`}>
                  {t.id}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Details
          </label>
          <textarea
            id="message"
            rows={6}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Please describe the issue or suggestion in detail..."
            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full sm:w-auto px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
        >
          {isSubmitting ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Send className="w-5 h-5" />
              Submit to Admin
            </>
          )}
        </button>
      </form>
    </div>
  );
}
