"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  X, Save, Gift, CheckCircle2, Loader2, Sparkles,
  Building2, Calendar, Tag, ShieldCheck, Eye, Upload,
  Percent, AlertCircle, ArrowRight, Clock, Trash2, Check,
  Layers, ExternalLink
} from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { compressImage } from "@/lib/utils/compressor";

interface OfferEditorProps {
  offer: any;
  onSave: (offer: any) => void;
  onClose: () => void;
  properties: any[];
}

export function OfferEditor({ offer, onSave, onClose, properties }: OfferEditorProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Track the URL that was uploaded in this session (not yet persisted to DB).
  const pendingBannerUrlRef = useRef<string>("");

  const [hierarchyTree, setHierarchyTree] = useState<any[]>([]);
  const [isLoadingTree, setIsLoadingTree] = useState(false);

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
    propertyLevel: "tower",
    targetScope: "cascade",
    townshipId: "",
    projectId: "",
    towerId: "",
    unitId: "",
  });

  useEffect(() => {
    setIsLoadingTree(true);
    fetch("/api/properties/hierarchy-tree")
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.tree)) {
          setHierarchyTree(data.tree);
        }
      })
      .catch(err => console.error("Failed to load hierarchy tree:", err))
      .finally(() => setIsLoadingTree(false));
  }, []);

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
        priorityBadge: (
          offer.priorityBadge === "Hot Deal" ? "Hot Deal Offer" :
          offer.priorityBadge === "Limited Time" ? "Limited Period Offer" :
          offer.priorityBadge === "Builder Exclusive" ? "Builder Exclusive Offer" :
          (offer.priorityBadge || "None")
        ),
        status: offer.status || "draft",
        startDate: offer.startDate ? new Date(offer.startDate).toISOString().slice(0, 10) : "",
        endDate: offer.endDate ? new Date(offer.endDate).toISOString().slice(0, 10) : "",
        autoExpire: offer.autoExpire || false,
        bannerImage: offer.bannerImage || "",
        propertyId: offer.propertyId?.toString() || "",
        propertyLevel: offer.propertyLevel || "tower",
        targetScope: offer.targetScope || "cascade",
        townshipId: offer.townshipId?.toString() || "",
        projectId: offer.projectId?.toString() || "",
        towerId: offer.towerId?.toString() || "",
        unitId: offer.unitId?.toString() || "",
      });
    }
  }, [offer]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSaving) {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSaving]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  // Deletes a Cloudinary URL silently
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

  // Called when user removes banner image
  const handleBannerRemove = useCallback((url: string) => {
    setFormData(prev => ({ ...prev, bannerImage: "" }));
    if (pendingBannerUrlRef.current === url) {
      pendingBannerUrlRef.current = "";
    }
    deleteFromCloudinary(url);
    toast.info("Banner removed");
  }, [deleteFromCloudinary]);

  // File upload handler with compression
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (PNG, JPG, WEBP)");
      return;
    }

    try {
      setIsUploadingBanner(true);
      const compressedFile = await compressImage(file);
      const data = new FormData();
      data.append("file", compressedFile);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: data,
      });

      if (!res.ok) {
        throw new Error("Upload failed");
      }

      const json = await res.json();
      if (json.url) {
        // If there was a previous unsaved banner in this session, delete it
        if (pendingBannerUrlRef.current && pendingBannerUrlRef.current !== offer?.bannerImage) {
          deleteFromCloudinary(pendingBannerUrlRef.current);
        }
        pendingBannerUrlRef.current = json.url;
        setFormData(prev => ({ ...prev, bannerImage: json.url }));
        toast.success("Banner image uploaded successfully!");
      }
    } catch (err) {
      console.error("Banner upload error:", err);
      toast.error("Failed to upload banner image");
    } finally {
      setIsUploadingBanner(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Close modal and cleanup unsaved uploads
  const handleClose = useCallback(async () => {
    const pending = pendingBannerUrlRef.current;
    const originalBanner = offer?.bannerImage || "";
    if (pending && pending !== originalBanner) {
      await deleteFromCloudinary(pending);
      pendingBannerUrlRef.current = "";
    }
    onClose();
  }, [offer, deleteFromCloudinary, onClose]);

  // Save / Publish
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
      const payload: any = {
        ...formData,
        status: targetStatus,
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || undefined,
        townshipId: formData.townshipId || undefined,
        projectId: formData.projectId || undefined,
        towerId: formData.towerId || undefined,
        unitId: formData.unitId || undefined,
      };
      await onSave(payload);
    } finally {
      setIsSaving(false);
    }
  };

  // Selected hierarchy node or flat property
  const selectedHierarchyItem = useMemo(() => {
    return hierarchyTree.find(item => item.id === formData.propertyId);
  }, [hierarchyTree, formData.propertyId]);

  const selectedProperty = useMemo(() => {
    if (selectedHierarchyItem) return selectedHierarchyItem;
    return properties.find(p => (p._id || p.id)?.toString() === formData.propertyId);
  }, [properties, selectedHierarchyItem, formData.propertyId]);

  const selectedPropertyName = selectedHierarchyItem
    ? selectedHierarchyItem.name
    : (selectedProperty ? (selectedProperty.townshipName || selectedProperty.name || "Selected Property") : "");

  const handleHierarchySelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    if (!selectedId) {
      setFormData(prev => ({
        ...prev,
        propertyId: "",
        propertyLevel: "tower",
        townshipId: "",
        projectId: "",
        towerId: "",
        unitId: "",
      }));
      return;
    }

    const item = hierarchyTree.find(it => it.id === selectedId);
    if (item) {
      setFormData(prev => ({
        ...prev,
        propertyId: item.id,
        propertyLevel: item.level || item.type || "tower",
        townshipId: item.townshipId || (item.level === "township" ? item.id : ""),
        projectId: item.projectId || (item.level === "project" ? item.id : ""),
        towerId: item.towerId || (item.level === "tower" ? item.id : ""),
        unitId: item.level === "unit" ? item.id : "",
      }));
    } else {
      const p = properties.find(it => (it._id || it.id)?.toString() === selectedId);
      const lvl = p?.type || "tower";
      setFormData(prev => ({
        ...prev,
        propertyId: selectedId,
        propertyLevel: lvl,
        townshipId: lvl === "township" ? selectedId : "",
        projectId: lvl === "project" ? selectedId : "",
        towerId: lvl === "tower" ? selectedId : "",
        unitId: lvl === "unit" ? selectedId : "",
      }));
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
  const priorityBadges = [
    "None",
    "Festive Offer",
    "Limited Period Offer",
    "Hot Deal Offer",
    "Builder Exclusive Offer",
    "Early Bird Offer",
    "Launch Offer",
    "Spot Booking Offer",
    "Zero Stamp Duty Offer",
    "Pre-Launch Offer",
    "Flash Deal Offer",
    "Mega Discount Offer"
  ];

  const badgeGradients: Record<string, string> = {
    "Festive Offer": "bg-gradient-to-r from-pink-500 to-rose-500 text-white",
    "Limited Period Offer": "bg-gradient-to-r from-blue-500 to-indigo-500 text-white",
    "Hot Deal Offer": "bg-gradient-to-r from-orange-500 to-red-500 text-white",
    "Builder Exclusive Offer": "bg-gradient-to-r from-amber-400 to-amber-600 text-white",
    "Early Bird Offer": "bg-gradient-to-r from-emerald-500 to-teal-600 text-white",
    "Launch Offer": "bg-gradient-to-r from-violet-500 to-purple-600 text-white",
    "Spot Booking Offer": "bg-gradient-to-r from-cyan-500 to-blue-600 text-white",
    "Zero Stamp Duty Offer": "bg-gradient-to-r from-emerald-600 to-green-700 text-white",
    "Pre-Launch Offer": "bg-gradient-to-r from-fuchsia-500 to-pink-600 text-white",
    "Flash Deal Offer": "bg-gradient-to-r from-red-500 to-rose-600 text-white",
    "Mega Discount Offer": "bg-gradient-to-r from-purple-500 to-indigo-600 text-white",
    // Compatibility fallbacks
    "Hot Deal": "bg-gradient-to-r from-orange-500 to-red-500 text-white",
    "Limited Time": "bg-gradient-to-r from-blue-500 to-indigo-500 text-white",
    "Builder Exclusive": "bg-gradient-to-r from-amber-400 to-amber-600 text-white",
    "None": "hidden",
  };

  // Readiness Checklist status
  const checklist = [
    { label: "Target Property Selected", done: !!formData.propertyId },
    { label: "Offer Name Defined", done: !!formData.offerName.trim() },
    { label: "Primary Benefit Highlighted", done: !!formData.benefitText.trim() },
    { label: "Promotional Banner Uploaded", done: !!formData.bannerImage },
    { label: "Validity Schedule Set", done: !!formData.startDate && !!formData.endDate },
  ];
  const completedCount = checklist.filter(c => c.done).length;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex flex-col justify-between overflow-hidden animate-in fade-in duration-200">
      <div className="w-full h-full bg-slate-50 dark:bg-slate-950 flex flex-col overflow-hidden">

        {/* ─── Top Sticky Header ─── */}
        <header className="h-16 px-6 sm:px-8 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md flex items-center justify-between z-20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/10 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800 flex items-center justify-center font-bold">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  {formData._id ? "Edit Special Offer Campaign" : "Create New Special Offer"}
                </h1>
                <span className="hidden sm:inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border border-purple-200 dark:border-purple-700">
                  Builder / Mandate Campaign
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                Configure promotional terms, badges & live card shown to prospective property buyers.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Completion indicator */}
            <div className="hidden md:flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300">
              <span className="text-purple-600 dark:text-purple-400 font-black">{completedCount}/5</span>
              <span>Ready</span>
              <div className="w-16 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-purple-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${(completedCount / 5) * 100}%` }}
                />
              </div>
            </div>

            <button
              onClick={handleClose}
              disabled={isSaving}
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all disabled:opacity-50"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* ─── Main 2-Column Split Content ─── */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">

              {/* LEFT COLUMN: Organized Form Fields (7 cols on lg, 7 cols on xl) */}
              <div className="lg:col-span-7 space-y-6">

                {/* 1. Target Property & Basic Info */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-5">
                  <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <span className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black text-xs">
                      1
                    </span>
                    <div>
                      <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                        Campaign Target &amp; Core Details
                      </h2>
                      <p className="text-xs text-slate-400">Select the township/property and define the offer title</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Target Property Hierarchy Selector */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-blue-500" />
                          Target Property Hierarchy <span className="text-red-500">*</span>
                        </label>
                        {isLoadingTree && (
                          <span className="text-[11px] text-purple-600 flex items-center gap-1">
                            <Loader2 className="w-3 h-3 animate-spin" /> Loading hierarchy...
                          </span>
                        )}
                      </div>

                      <select
                        name="propertyId"
                        value={formData.propertyId}
                        onChange={handleHierarchySelect}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-semibold text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      >
                        <option value="">Select Target (Township, Project, Tower or Unit)...</option>
                        {hierarchyTree.length > 0 ? (
                          hierarchyTree.map((item) => {
                            const levelIcon =
                              item.level === "township"
                                ? "🏘️ Township: "
                                : item.level === "project"
                                ? "📁 Project: "
                                : item.level === "tower"
                                ? "🏢 Tower: "
                                : "🚪 Unit: ";
                            const indent = "\u00A0\u00A0\u00A0".repeat(item.depth);
                            return (
                              <option key={`tree-${item.id}`} value={item.id}>
                                {indent}{levelIcon}{item.name} {item.childCount > 0 ? `(${item.childCount} children)` : ""}
                              </option>
                            );
                          })
                        ) : (
                          properties.map((p) => {
                            const id = (p._id || p.id)?.toString();
                            const typeLabel = p.type ? ` (${p.type.charAt(0).toUpperCase() + p.type.slice(1)})` : "";
                            const label = (p.townshipName || p.name || "Unnamed Property") + typeLabel;
                            return (
                              <option key={`prop-${id}`} value={id}>{label}</option>
                            );
                          })
                        )}
                      </select>

                      {/* Breadcrumb Trail & Level Indicator */}
                      {selectedHierarchyItem && (
                        <div className="mt-2 p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 flex flex-col gap-1 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                              {selectedHierarchyItem.level === 'township' && '🏘️ Township Level'}
                              {selectedHierarchyItem.level === 'project' && '📁 Project Level'}
                              {selectedHierarchyItem.level === 'tower' && '🏢 Tower Level'}
                              {selectedHierarchyItem.level === 'unit' && '🚪 Unit Level'}
                            </span>
                            <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-md bg-blue-200/60 dark:bg-blue-800 text-blue-900 dark:text-blue-200">
                              Level: {formData.propertyLevel}
                            </span>
                          </div>
                          <p className="text-slate-600 dark:text-slate-300 font-medium text-[11px]">
                            <span className="text-slate-400">Path: </span>
                            {selectedHierarchyItem.breadcrumbLabel || selectedHierarchyItem.name}
                          </p>
                        </div>
                      )}

                      {properties.length === 0 && hierarchyTree.length === 0 && !isLoadingTree && (
                        <p className="text-xs text-amber-600 mt-1.5 font-medium">
                          ⚠️ No properties registered under your account yet. Please add a property first.
                        </p>
                      )}
                    </div>

                    {/* Hierarchy Target Scope (Cascading vs Exact Level) */}
                    {formData.propertyLevel !== "unit" && (
                      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                        <div>
                          <label className="block text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                            Offer Display Scope / Cascading Control
                          </label>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Choose whether this offer cascades down to child properties or stays only on this level.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <label
                            className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                              formData.targetScope === "cascade"
                                ? "border-purple-600 bg-purple-50/50 dark:bg-purple-950/20 text-purple-900 dark:text-purple-200"
                                : "border-slate-200 dark:border-slate-700 hover:border-slate-300 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                            }`}
                          >
                            <input
                              type="radio"
                              name="targetScope"
                              value="cascade"
                              checked={formData.targetScope === "cascade"}
                              onChange={() => setFormData(prev => ({ ...prev, targetScope: "cascade" }))}
                              className="mt-1 text-purple-600 focus:ring-purple-500"
                            />
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold">🌊 Cascading (All Children)</span>
                                <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300 rounded">Recommended</span>
                              </div>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                                Shows on this {formData.propertyLevel} AND cascades down to all inner child projects, towers &amp; units.
                              </p>
                            </div>
                          </label>

                          <label
                            className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                              formData.targetScope === "exact"
                                ? "border-purple-600 bg-purple-50/50 dark:bg-purple-950/20 text-purple-900 dark:text-purple-200"
                                : "border-slate-200 dark:border-slate-700 hover:border-slate-300 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                            }`}
                          >
                            <input
                              type="radio"
                              name="targetScope"
                              value="exact"
                              checked={formData.targetScope === "exact"}
                              onChange={() => setFormData(prev => ({ ...prev, targetScope: "exact" }))}
                              className="mt-1 text-purple-600 focus:ring-purple-500"
                            />
                            <div>
                              <span className="text-xs font-bold">🎯 This Level Only</span>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                                Displays ONLY on this {formData.propertyLevel} page. Will not cascade to child towers or units.
                              </p>
                            </div>
                          </label>
                        </div>
                      </div>
                    )}

                    {/* Offer Name */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                        Offer Campaign Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="offerName"
                        value={formData.offerName}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        placeholder="e.g. Diwali Mega Dhamaka / Festive Launch Offer"
                      />
                    </div>

                    {/* Benefit Text & Highlight Pill */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                          Primary Benefit Text <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="benefitText"
                          value={formData.benefitText}
                          onChange={handleChange}
                          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-semibold text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                          placeholder="e.g. ₹2.5 Lakhs Direct Discount + Modular Kitchen"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                          Short Badge Text <span className="text-slate-400 font-normal lowercase">(max 15 chars)</span>
                        </label>
                        <input
                          type="text"
                          name="benefitHighlight"
                          value={formData.benefitHighlight}
                          onChange={handleChange}
                          maxLength={15}
                          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                          placeholder="e.g. 2.5L OFF / ZERO STAMP"
                        />
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                        Offer Description / Highlights
                      </label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows={3}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        placeholder="Explain what the buyer gets, special conditions, and excitement around this limited promotion..."
                      />
                    </div>

                    {/* Terms & Conditions */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                        Terms &amp; Conditions
                      </label>
                      <textarea
                        name="termsAndConditions"
                        value={formData.termsAndConditions}
                        onChange={handleChange}
                        rows={2}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        placeholder="e.g. Valid only on first 20 bookings made before 31st Oct. Cannot be clubbed with other schemes."
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Offer Type & Targeting */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-5">
                  <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <span className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center font-black text-xs">
                      2
                    </span>
                    <div>
                      <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                        Strategy, Type &amp; Badges
                      </h2>
                      <p className="text-xs text-slate-400">Classify promotion type and eye-catching priority ribbons</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                        Offer Type
                      </label>
                      <select
                        name="offerType"
                        value={formData.offerType}
                        onChange={handleChange}
                        className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium text-xs focus:ring-2 focus:ring-purple-500 outline-none"
                      >
                        {offerTypes.map(t => (
                          <option key={`type-${t}`} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                        Priority Ribbon
                      </label>
                      <select
                        name="priorityBadge"
                        value={formData.priorityBadge}
                        onChange={handleChange}
                        className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium text-xs focus:ring-2 focus:ring-purple-500 outline-none"
                      >
                        {priorityBadges.map(b => (
                          <option key={`badge-${b}`} value={b}>{b}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                        Visibility
                      </label>
                      <select
                        name="visibility"
                        value={formData.visibility}
                        onChange={handleChange}
                        className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium text-xs focus:ring-2 focus:ring-purple-500 outline-none"
                      >
                        {visibilities.map(v => (
                          <option key={`vis-${v}`} value={v}>{v}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* 3. Scheduling & Expiry */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-5">
                  <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <span className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black text-xs">
                      3
                    </span>
                    <div>
                      <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                        Campaign Schedule &amp; Expiry
                      </h2>
                      <p className="text-xs text-slate-400">Set start date, expiry date, and automatic archiving</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-amber-500" /> Start Date
                      </label>
                      <input
                        type="date"
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-500" /> End Date
                      </label>
                      <input
                        type="date"
                        name="endDate"
                        value={formData.endDate}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                      <input
                        type="checkbox"
                        id="autoExpire"
                        name="autoExpire"
                        checked={formData.autoExpire}
                        onChange={handleCheckboxChange}
                        className="w-4 h-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                      />
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                        Auto-expire offer on End Date (Offer will be hidden automatically after expiry)
                      </span>
                    </label>
                  </div>
                </div>

                {/* 4. Banner Media Uploader */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-5">
                  <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <span className="w-7 h-7 rounded-lg bg-pink-50 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 flex items-center justify-center font-black text-xs">
                      4
                    </span>
                    <div>
                      <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                        Offer Banner Media
                      </h2>
                      <p className="text-xs text-slate-400">High-resolution promotional banner for the visitor card</p>
                    </div>
                  </div>

                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />

                    {formData.bannerImage ? (
                      <div className="relative group/banner rounded-2xl overflow-hidden border-2 border-purple-200 dark:border-purple-800 bg-slate-900 shadow-md">
                        <div className="relative w-full h-52 sm:h-64">
                          <Image
                            src={formData.bannerImage}
                            alt="Offer Banner"
                            fill
                            className="object-cover group-hover/banner:scale-[1.02] transition-transform duration-500"
                            unoptimized
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/banner:opacity-100 flex items-center justify-center gap-3 transition-opacity">
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-1.5 transition-transform active:scale-95"
                            >
                              <Upload className="w-3.5 h-3.5" /> Change Banner
                            </button>
                            <button
                              type="button"
                              onClick={() => handleBannerRemove(formData.bannerImage)}
                              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-1.5 transition-transform active:scale-95"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Remove
                            </button>
                          </div>
                        </div>
                        <div className="p-3 bg-white dark:bg-slate-900 flex items-center justify-between border-t border-slate-200 dark:border-slate-800">
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4" /> Banner Attached
                          </span>
                          <span className="text-[11px] text-slate-400">
                            Recommended: 1200 × 600 px (16:9 / 2:1 ratio)
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => !isUploadingBanner && fileInputRef.current?.click()}
                        className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-purple-500 dark:hover:border-purple-500 bg-slate-50/50 hover:bg-purple-50/20 dark:bg-slate-800/40 rounded-2xl p-8 transition-all text-center cursor-pointer group"
                      >
                        {isUploadingBanner ? (
                          <div className="flex flex-col items-center justify-center py-6 gap-2">
                            <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
                            <p className="text-xs font-bold text-purple-600">Uploading &amp; compressing banner...</p>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-4 space-y-2">
                            <div className="w-14 h-14 rounded-2xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                              <Upload className="w-7 h-7" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                                Click or drag to upload Promotional Banner
                              </p>
                              <p className="text-xs text-slate-400 mt-1 font-medium">
                                PNG, JPG, WEBP • Recommended 1200 × 600 px (Auto-compressed to WebP)
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* RIGHT COLUMN: Real-Time Live Preview (5 cols on lg, 5 cols on xl) */}
              <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-6">

                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xl relative overflow-hidden">
                  <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <h3 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">
                        Live Visitor Card Preview
                      </h3>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Real-time UI
                    </span>
                  </div>

                  {/* ─── The Rendered Card ─── */}
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg overflow-hidden flex flex-col transition-all">
                    {/* Image Area */}
                    <div className="relative h-48 w-full bg-slate-800 overflow-hidden">
                      {formData.bannerImage ? (
                        <Image
                          src={formData.bannerImage}
                          alt="Banner Preview"
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-950 flex flex-col items-center justify-center text-white/50 p-4 text-center">
                          <Tag className="w-10 h-10 mb-2 opacity-50" />
                          <span className="text-xs font-bold uppercase tracking-widest text-purple-200">
                            Banner Image Preview
                          </span>
                        </div>
                      )}

                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />

                      {/* Badges Over Image */}
                      <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                        {formData.priorityBadge && formData.priorityBadge !== "None" && (
                          <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-md border border-white/20 ${badgeGradients[formData.priorityBadge]}`}>
                            {formData.priorityBadge}
                          </span>
                        )}
                        <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-white/20 backdrop-blur-md text-white border border-white/30">
                          {formData.offerType}
                        </span>
                      </div>

                      {/* Property Badge on Image */}
                      {selectedPropertyName && (
                        <div className="absolute bottom-3 left-3 bg-black/75 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 text-white text-[11px] font-bold flex flex-col gap-0.5 max-w-[85%]">
                          <div className="flex items-center gap-1.5 truncate">
                            <Building2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span className="truncate">{selectedPropertyName}</span>
                          </div>
                          <div className="flex items-center gap-1 text-[9px] font-extrabold uppercase">
                            <span className="text-purple-300">
                              {formData.propertyLevel}
                            </span>
                            {formData.propertyLevel !== "unit" && (
                              <span className={formData.targetScope === "cascade" ? "text-emerald-400" : "text-amber-400"}>
                                • {formData.targetScope === "cascade" ? "Cascading (All Children)" : "Exact Level Only"}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Highlight Tag */}
                      {formData.benefitHighlight && (
                        <div className="absolute -bottom-3 right-4 bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black px-3 py-1 rounded-xl shadow-lg text-xs transform rotate-2 border border-white/40">
                          {formData.benefitHighlight}
                        </div>
                      )}
                    </div>

                    {/* Content Body */}
                    <div className="p-5 pt-6 space-y-3">
                      <div>
                        <h4 className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                          {formData.offerName || "Your Offer Campaign Title"}
                        </h4>
                        <p className="text-sm font-black text-purple-600 dark:text-purple-400 mt-1">
                          {formData.benefitText || "Highlight the key financial discount or bonus"}
                        </p>
                      </div>

                      {formData.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                          {formData.description}
                        </p>
                      )}

                      {/* Validity Bar */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 font-semibold">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-purple-500" />
                          {formData.startDate ? formData.startDate : "Start Date"} - {formData.endDate ? formData.endDate : "End Date"}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-[10px] font-bold">
                          {formData.visibility}
                        </span>
                      </div>

                      {/* Mock CTA Button */}
                      <div className="pt-2">
                        <button
                          type="button"
                          className="w-full py-3 bg-[#F97316] hover:bg-orange-600 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-md transition-all flex items-center justify-center gap-2 pointer-events-none"
                        >
                          Claim This Offer <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* ─── Campaign Readiness Checklist ─── */}
                  <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
                      <span>Campaign Checklist</span>
                      <span className="text-purple-600 dark:text-purple-400">{completedCount} of 5 Completed</span>
                    </div>

                    <div className="space-y-1.5">
                      {checklist.map((item, idx) => (
                        <div
                          key={idx}
                          className={`flex items-center gap-2 text-xs font-semibold p-2 rounded-xl transition-colors ${
                            item.done
                              ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400"
                              : "bg-slate-50 dark:bg-slate-800/50 text-slate-400"
                          }`}
                        >
                          {item.done ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border-2 border-slate-300 dark:border-slate-600 shrink-0" />
                          )}
                          <span>{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </div>
        </div>

        {/* ─── Bottom Sticky Action Bar ─── */}
        <footer className="h-20 px-6 sm:px-8 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md flex items-center justify-between z-20 shrink-0">
          <div className="hidden sm:block">
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {formData.propertyId
                ? `Ready to launch on: ${selectedPropertyName}`
                : "Select a Target Property to proceed with publishing."}
            </p>
            <p className="text-[11px] text-slate-400">
              Published offers appear in the Special Offers section on the homepage and property details.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSaving}
              className="px-5 py-2.5 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={isSaving}
              onClick={() => handleSave("draft")}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs transition-colors flex items-center gap-2 disabled:opacity-50 border border-slate-200 dark:border-slate-700"
            >
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save as Draft
            </button>

            <button
              type="button"
              disabled={isSaving}
              onClick={() => handleSave("active")}
              className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg shadow-purple-600/30 active:scale-95 disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Publish Offer
            </button>
          </div>
        </footer>

      </div>
    </div>
  );
}
