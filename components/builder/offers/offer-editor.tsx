"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { X, Save, Gift, CheckCircle2, Loader2 } from "lucide-react";
import { ImageUpload } from "@/components/ui/image-upload";
import { toast } from "sonner";

interface OfferEditorProps {
  offer: any;
  onSave: (offer: any) => void;
  onClose: () => void;
  properties: any[];
}

export function OfferEditor({ offer, onSave, onClose, properties }: OfferEditorProps) {
  const [isSaving, setIsSaving] = useState(false);
  // Track the URL that was uploaded in this session (not yet persisted to DB).
  // Used to delete it from Cloudinary if the user cancels.
  const pendingBannerUrlRef = useRef<string>("");

  const [formData, setFormData] = useState({
    _id: "",
    offerName: "",
    benefitText: "",
    benefitHighlight: "",
    description: "",
    termsAndConditions: "",
    offerType: "Flat Discount",
    visibility: "Public",
    priorityBadge: "None",
    status: "draft",
    startDate: "",
    endDate: "",
    autoExpire: false,
    bannerImage: "",
    propertyId: "",
  });

  useEffect(() => {
    if (offer) {
      setFormData({
        _id: offer._id?.toString() || "",
        offerName: offer.offerName || "",
        benefitText: offer.benefitText || "",
        benefitHighlight: offer.benefitHighlight || "",
        description: offer.description || "",
        termsAndConditions: offer.termsAndConditions || "",
        offerType: offer.offerType || "Flat Discount",
        visibility: offer.visibility || "Public",
        priorityBadge: offer.priorityBadge || "None",
        status: offer.status || "draft",
        startDate: offer.startDate ? new Date(offer.startDate).toISOString().slice(0, 10) : "",
        endDate: offer.endDate ? new Date(offer.endDate).toISOString().slice(0, 10) : "",
        autoExpire: offer.autoExpire || false,
        bannerImage: offer.bannerImage || "",
        // Normalize ObjectId to string so <select> value comparison works
        propertyId: offer.propertyId?.toString() || "",
      });
    }
  }, [offer]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  // Deletes a Cloudinary URL silently (fire-and-forget, errors logged not toasted)
  const deleteFromCloudinary = useCallback(async (url: string) => {
    if (!url || !url.includes("cloudinary.com")) return;
    try {
      await fetch("/api/upload", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
    } catch (err) {
      console.error("[Cloudinary delete] failed:", err);
    }
  }, []);

  // Called when user clicks the X on the image upload widget
  const handleBannerRemove = useCallback((url: string) => {
    // Clear local state immediately for instant UI feedback
    setFormData(prev => ({ ...prev, bannerImage: "" }));
    // Also clear pending tracker
    if (pendingBannerUrlRef.current === url) {
      pendingBannerUrlRef.current = "";
    }
    // Delete from Cloudinary in the background
    deleteFromCloudinary(url);
  }, [deleteFromCloudinary]);

  // Called when user picks a new banner image
  const handleBannerChange = useCallback((url: string) => {
    if (!url) {
      // Empty string means removal — delegate to handleBannerRemove with current value
      handleBannerRemove(formData.bannerImage);
      return;
    }
    // Track newly uploaded URL so we can delete it if user cancels without saving
    pendingBannerUrlRef.current = url;
    setFormData(prev => ({ ...prev, bannerImage: url }));
  }, [formData.bannerImage, handleBannerRemove]);

  // Wraps onClose — if user cancels with an unsaved banner, delete it from Cloudinary
  const handleClose = useCallback(async () => {
    const pending = pendingBannerUrlRef.current;
    // Only delete if the pending URL is different from what was originally on the offer
    // (i.e., it was uploaded in this session and was never saved to DB)
    const originalBanner = offer?.bannerImage || "";
    if (pending && pending !== originalBanner) {
      await deleteFromCloudinary(pending);
      pendingBannerUrlRef.current = "";
    }
    onClose();
  }, [offer, deleteFromCloudinary, onClose]);

  // Validate fields and call onSave with an explicitly-set status.
  // We pass status as an argument instead of relying on setState (which is async).
  const handleSave = async (targetStatus: "draft" | "active") => {
    if (!formData.offerName.trim()) {
      toast.error("Offer Name is required.");
      return;
    }
    if (!formData.benefitText.trim()) {
      toast.error("Benefit Text is required.");
      return;
    }
    if (!formData.propertyId) {
      toast.error("Please select a Target Property.");
      return;
    }

    if (formData.startDate && formData.endDate) {
      if (new Date(formData.startDate) > new Date(formData.endDate)) {
        toast.error("End Date cannot be before Start Date.");
        return;
      }
    }

    setIsSaving(true);
    try {
      // Pass status directly — never rely on formData.status being updated first
      await onSave({ ...formData, status: targetStatus });
    } finally {
      setIsSaving(false);
    }
  };

  const offerTypes = [
    "Flat Discount",
    "Percentage Discount",
    "Cashback",
    "Free Amenities",
    "Floor-rise Waiver",
    "Parking Offers",
    "EMI/Subvention Plans",
  ];
  const visibilities = ["Public", "Private", "CRM Only", "Mandate Only"];
  const priorityBadges = ["None", "Hot Deal", "Limited Time", "Festive Offer", "Builder Exclusive"];

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex justify-end">
      <div className="bg-white dark:bg-slate-900 w-full max-w-3xl h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Gift className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              {formData._id ? "Edit Offer" : "Create New Offer"}
            </h2>
            <p className="text-sm text-slate-500">Configure your campaign details</p>
          </div>
          <button
            onClick={handleClose}
            disabled={isSaving}
            className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-8">

            {/* Section 1: Basic Info */}
            <section className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs">1</span>
                Basic Details
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Offer Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="offerName"
                    value={formData.offerName}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g. Monsoon Dhamaka"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Benefit Text <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="benefitText"
                    value={formData.benefitText}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g. ₹2 Lakh Off"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Short Badge Text
                  </label>
                  <input
                    type="text"
                    name="benefitHighlight"
                    value={formData.benefitHighlight}
                    onChange={handleChange}
                    maxLength={15}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g. 2L OFF"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Write a catchy description..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Terms &amp; Conditions</label>
                <textarea
                  name="termsAndConditions"
                  value={formData.termsAndConditions}
                  onChange={handleChange}
                  rows={2}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g. Valid only for bookings made before 31st Oct..."
                />
              </div>
            </section>

            <hr className="border-slate-200 dark:border-slate-800" />

            {/* Section 2: Configuration */}
            <section className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs">2</span>
                Configuration &amp; Targeting
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Offer Type</label>
                  <select
                    name="offerType"
                    value={formData.offerType}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  >
                    {offerTypes.map(t => (
                      <option key={`offerType-${t}`} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Visibility</label>
                  <select
                    name="visibility"
                    value={formData.visibility}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  >
                    {visibilities.map(v => (
                      <option key={`visibility-${v}`} value={v}>{v}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Priority Badge</label>
                  <select
                    name="priorityBadge"
                    value={formData.priorityBadge}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  >
                    {priorityBadges.map(b => (
                      <option key={`badge-${b}`} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Target Property <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="propertyId"
                    value={formData.propertyId}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  >
                    <option value="">Select a property...</option>
                    {properties.map(p => {
                      // MongoDB documents have _id; API-serialized docs may expose id or _id
                      const id = (p._id || p.id)?.toString();
                      const typeLabel = p.type ? ` (${p.type.charAt(0).toUpperCase() + p.type.slice(1)})` : "";
                      const label = (p.townshipName || p.name || "Unnamed Property") + typeLabel;
                      return (
                        <option key={`property-${id}`} value={id}>{label}</option>
                      );
                    })}
                  </select>
                  {properties.length === 0 && (
                    <p className="text-xs text-amber-600 mt-1">⚠️ No properties found. Please add a property first.</p>
                  )}
                </div>
              </div>
            </section>

            <hr className="border-slate-200 dark:border-slate-800" />

            {/* Section 3: Scheduling */}
            <section className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-xs">3</span>
                Scheduling
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Start Date</label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">End Date</label>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="autoExpire"
                  name="autoExpire"
                  checked={formData.autoExpire}
                  onChange={handleCheckboxChange}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="autoExpire" className="text-sm text-slate-700 dark:text-slate-300">
                  Auto-expire offer on End Date
                </label>
              </div>
            </section>

            <hr className="border-slate-200 dark:border-slate-800" />

            {/* Section 4: Banner Media */}
            <section className="space-y-4 pb-10">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center text-xs">4</span>
                Banner Media
              </h3>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Offer Banner Image</label>
                <ImageUpload
                  value={formData.bannerImage}
                  onChange={handleBannerChange}
                  label="Upload Banner"
                />
                {formData.bannerImage && (
                  <p className="text-xs text-slate-500 mt-2">
                    ✅ Banner uploaded. Removing it will also delete it from storage.
                  </p>
                )}
              </div>
            </section>

          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSaving}
            className="px-6 py-2.5 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={isSaving}
            onClick={() => handleSave("draft")}
            className="px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white dark:bg-slate-700 dark:hover:bg-slate-600 rounded-xl font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save as Draft
          </button>

          <button
            type="button"
            disabled={isSaving}
            onClick={() => handleSave("active")}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors flex items-center gap-2 shadow-lg shadow-blue-500/30 disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            Publish Offer
          </button>
        </div>

      </div>
    </div>
  );
}
