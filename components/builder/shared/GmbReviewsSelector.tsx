"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Star, CheckCircle2, MessageSquareQuote, Plus, Trash2, Edit3, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

export interface GmbReviewItem {
  id?: string;
  name: string;
  designation?: string;
  rating: number;
  quote: string;
  avatar?: string;
}

interface GmbReviewsSelectorProps {
  allReviews?: GmbReviewItem[];
  selectedReviews?: GmbReviewItem[];
  onChange: (selected: GmbReviewItem[], all?: GmbReviewItem[]) => void;
}

function ReviewAvatar({ avatar, name }: { avatar?: string; name: string }) {
  const [hasError, setHasError] = useState(false);
  const isRandomUser = avatar && avatar.includes("randomuser.me");
  const isValidAvatar = Boolean(avatar && avatar.trim().length > 0 && !isRandomUser && !hasError);

  if (isValidAvatar) {
    return (
      <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 shrink-0 border border-slate-200 dark:border-slate-700">
        <img
          src={avatar}
          alt={name}
          className="w-full h-full object-cover"
          onError={() => setHasError(true)}
        />
      </div>
    );
  }

  return (
    <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-900 shrink-0 border border-slate-200 dark:border-slate-700 flex items-center justify-center p-1.5 shadow-xs">
      <svg viewBox="0 0 24 24" className="w-full h-full shrink-0" fill="none">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
      </svg>
    </div>
  );
}

export function GmbReviewsSelector({
  allReviews = [],
  selectedReviews = [],
  onChange,
}: GmbReviewsSelectorProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Form state for adding/editing review
  const [formName, setFormName] = useState("");
  const [formDesignation, setFormDesignation] = useState("Google Verified Reviewer");
  const [formRating, setFormRating] = useState(5);
  const [formQuote, setFormQuote] = useState("");
  const [formAvatar, setFormAvatar] = useState("");

  // Helper to check if a review is selected
  const isSelected = (review: GmbReviewItem) => {
    return selectedReviews.some(
      (r) =>
        r.name === review.name &&
        r.quote === review.quote
    );
  };

  // Toggle selection (Max 3)
  const toggleSelect = (review: GmbReviewItem) => {
    if (isSelected(review)) {
      const updated = selectedReviews.filter(
        (r) => !(r.name === review.name && r.quote === review.quote)
      );
      onChange(updated, allReviews);
    } else {
      if (selectedReviews.length >= 3) {
        toast.warning("Maximum 3 Reviews Allowed", {
          description: "You can select up to 3 reviews to feature on the Visitor Panel. Unselect one to choose this.",
        });
        return;
      }
      const updated = [...selectedReviews, review];
      onChange(updated, allReviews);
      toast.success(`Selected review by ${review.name}`);
    }
  };

  // Open modal for adding custom review
  const handleOpenAddModal = () => {
    setFormName("");
    setFormDesignation("Google Verified Reviewer");
    setFormRating(5);
    setFormQuote("");
    setFormAvatar("");
    setEditingIndex(null);
    setIsAddModalOpen(true);
  };

  // Save custom review
  const handleSaveReview = () => {
    if (!formName.trim() || !formQuote.trim()) {
      toast.error("Please fill in reviewer name and review text");
      return;
    }

    const newReview: GmbReviewItem = {
      id: `custom-${Date.now()}`,
      name: formName.trim(),
      designation: formDesignation.trim() || "Google Verified Reviewer",
      rating: formRating,
      quote: formQuote.trim(),
      avatar: formAvatar.trim(),
    };

    let newAll = [...allReviews];
    let newSelected = [...selectedReviews];

    if (editingIndex !== null) {
      newAll[editingIndex] = newReview;
    } else {
      newAll.push(newReview);
      // Auto-select if less than 3
      if (newSelected.length < 3) {
        newSelected.push(newReview);
      }
    }

    onChange(newSelected, newAll);
    setIsAddModalOpen(false);
    toast.success(editingIndex !== null ? "Review updated!" : "Custom review added!");
  };

  // Combine available reviews list (default sample fallback if none fetched)
  const defaultFallbackReviews: GmbReviewItem[] = [
    {
      name: "Ramesh Gupta",
      designation: "Google Verified Reviewer",
      rating: 5,
      quote: "Exceptional construction quality and superb location connectivity. Highly satisfied with Astronix Realty!",
      avatar: "",
    },
    {
      name: "Anita Roy",
      designation: "Google Verified Reviewer",
      rating: 5,
      quote: "The project amenities, green spaces, and layout design exceeded our expectations. Great experience overall.",
      avatar: "",
    },
    {
      name: "Vikram Sharma",
      designation: "Google Verified Reviewer",
      rating: 5,
      quote: "Professional sales team, transparent documentation, and on-time progress. Highly recommended builder!",
      avatar: "",
    },
  ];

  const displayList = allReviews.length > 0 ? allReviews : defaultFallbackReviews;

  return (
    <div className="bg-slate-50 dark:bg-slate-900/60 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <MessageSquareQuote className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Google Business Reviews Selection
              </h4>
              <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-300/40 text-[10px] font-bold">
                Visitor Featured (3 Max)
              </Badge>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Select 3 reviews from connected GMB profile to display on property page
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={`text-xs font-bold px-3 py-1 ${
              selectedReviews.length === 3
                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                : "bg-blue-500/10 text-blue-600 border-blue-500/30"
            }`}
          >
            Selected: {selectedReviews.length} / 3
          </Badge>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleOpenAddModal}
            className="h-8 text-xs font-semibold rounded-xl flex items-center gap-1 border-blue-200 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-slate-800"
          >
            <Plus className="w-3.5 h-3.5" /> Add Review
          </Button>
        </div>
      </div>

      {/* Reviews Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {displayList.map((review, index) => {
          const selected = isSelected(review);
          const selectedIndex = selectedReviews.findIndex(
            (r) => r.name === review.name && r.quote === review.quote
          );

          return (
            <Card
              key={index}
              onClick={() => toggleSelect(review)}
              className={`cursor-pointer transition-all duration-200 relative overflow-hidden ${
                selected
                  ? "border-2 border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20 shadow-md ring-2 ring-emerald-500/20"
                  : "border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700"
              }`}
            >
              {/* Selected Badge Ribbon */}
              {selected && (
                <div className="absolute top-2 right-2 flex items-center gap-1 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                  <CheckCircle2 className="w-3 h-3" />
                  Featured #{selectedIndex + 1}
                </div>
              )}

              <CardContent className="p-3.5 space-y-2.5">
                {/* User info */}
                <div className="flex items-center gap-2.5 pr-20">
                  <ReviewAvatar avatar={review.avatar} name={review.name} />
                  <div className="min-w-0">
                    <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                      {review.name}
                    </h5>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                      {review.designation || "Google Review"}
                    </p>
                  </div>
                </div>

                {/* Star rating */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${
                        i < review.rating
                          ? "fill-amber-400 text-amber-400"
                          : "text-slate-300 dark:text-slate-700"
                      }`}
                    />
                  ))}
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 ml-1">
                    {review.rating}.0
                  </span>
                </div>

                {/* Quote */}
                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-100 dark:border-slate-800/80 italic">
                  "{review.quote}"
                </p>

                {/* Action instruction */}
                <div className="pt-1 flex items-center justify-between text-[11px] font-semibold">
                  <span
                    className={
                      selected ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"
                    }
                  >
                    {selected ? "✓ Click to Unselect" : "+ Click to Select for Visitor"}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add Custom Review Dialog */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-sm font-extrabold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" /> Add Custom GMB Review
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Reviewer Name *
              </label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Suresh Patil"
                className="h-9 text-xs mt-1"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Designation / Source
              </label>
              <Input
                value={formDesignation}
                onChange={(e) => setFormDesignation(e.target.value)}
                placeholder="e.g. 2 months ago · Google Review"
                className="h-9 text-xs mt-1"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Rating (Stars)
              </label>
              <div className="flex items-center gap-2 mt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setFormRating(star)}
                    className="p-1 hover:scale-110 transition-transform"
                  >
                    <Star
                      className={`w-5 h-5 ${
                        star <= formRating
                          ? "fill-amber-400 text-amber-400"
                          : "text-slate-300 dark:text-slate-700"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Review Quote / Feedback *
              </label>
              <Textarea
                value={formQuote}
                onChange={(e) => setFormQuote(e.target.value)}
                placeholder="Write or paste the review text here..."
                rows={3}
                className="text-xs mt-1"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsAddModalOpen(false)}
              className="h-9 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSaveReview}
              className="h-9 text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold"
            >
              Save Review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
