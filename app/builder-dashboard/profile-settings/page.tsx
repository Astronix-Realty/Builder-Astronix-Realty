"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ShieldAlert, Clock, CheckCircle2, Building2, User, Mail, Phone, RefreshCw, LogOut, Edit3, Save, X, FileText, MapPin, Award, Check } from "lucide-react";
import { toast } from "sonner";
import { ImageUpload } from "@/components/ui/image-upload";

function ProfileSettingsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const approvalParam = searchParams.get("approval") || "pending";
  const messageParam = searchParams.get("message") || "";

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [editForm, setEditForm] = useState({
    companyName: "",
    developerName: "",
    fullName: "",
    phone: "",
    address: "",
    description: "",
    reraNumber: "",
    website: "",
    establishedYear: "",
    tagline: "",
    operatingCities: "",
    experience: "",
    aboutCompany: "",
    specialization: "",
    logo: ""
  });

  const fetchProfile = async () => {
    setChecking(true);
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        const u = data.user;
        setUser(u);
        const p = u?.profile || {};
        setEditForm({
          companyName: p.companyName || u?.name || "",
          developerName: p.developerName || p.fullName || u?.name || "",
          fullName: p.fullName || u?.name || "",
          phone: p.phone || u?.phone || "",
          address: p.address || "",
          description: p.description || p.developerDescription || "",
          reraNumber: p.reraNumber || "",
          website: p.website || "",
          establishedYear: p.establishedYear || "",
          tagline: p.tagline || "",
          operatingCities: p.operatingCities || "",
          experience: p.experience || "",
          aboutCompany: p.aboutCompany || "",
          specialization: p.specialization || "",
          logo: p.logo || ""
        });

        if (u?.approvalStatus === "approved") {
          router.push("/builder-dashboard");
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setChecking(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...editForm, resubmit: true })
      });
      if (res.ok) {
        toast.success("Profile updated! Re-submitted to Admin for approval.");
        setIsEditing(false);
        fetchProfile();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to update profile");
      }
    } catch {
      toast.error("Network error while updating profile");
    } finally {
      setIsSaving(false);
    }
  };

  const currentStatus = user?.approvalStatus || approvalParam;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-x-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-indigo-600/15 blur-[140px] rounded-full pointer-events-none" />

      <div className="w-full max-w-3xl bg-slate-900/90 border border-slate-800 backdrop-blur-xl rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 relative z-10 my-8">
        {/* Status Header Banner */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-2 ${currentStatus === "rejected" ? "bg-rose-500/10 border border-rose-500/30 text-rose-400" : "bg-amber-500/10 border border-amber-500/20 text-amber-400"}`}>
            {currentStatus === "rejected" ? (
              <ShieldAlert className="w-8 h-8 text-rose-400" />
            ) : (
              <Clock className="w-8 h-8 text-amber-400 animate-pulse" />
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            {currentStatus === "rejected" ? "Account Application Declined" : "Approval Status: Pending Review"}
          </h1>

          <p className="text-slate-400 text-sm max-w-lg">
            {currentStatus === "rejected"
              ? "Your builder account application was reviewed and declined. Update your details below to re-submit for review."
              : "Your registration has been submitted for review. Once our team verifies your company credentials, full builder dashboard features will be unlocked automatically."}
          </p>

          {currentStatus === "rejected" && (
            <div className="w-full bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 space-y-1.5 text-left mt-2">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wider">
                <ShieldAlert className="w-4 h-4" /> Reason for Rejection:
              </div>
              <p className="text-white text-sm font-semibold leading-relaxed bg-slate-950/80 p-3 rounded-lg border border-rose-500/20">
                "{((messageParam && messageParam !== "Your account has been rejected by admin.") ? messageParam : (user?.approvalMessage && user?.approvalMessage !== "Your account has been rejected by admin.") ? user.approvalMessage : user?.rejectionMessage) || "Details provided did not meet verification criteria."}"
              </p>
            </div>
          )}
        </div>

        {/* Submitted Profile Summary OR Editable Form */}
        {!isEditing ? (
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Submitted Profile Details
              </h3>
              <button
                onClick={() => setIsEditing(true)}
                className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-lg transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" /> Edit & Fix Profile Details
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-3">
                <Building2 className="w-4 h-4 text-indigo-400 shrink-0" />
                <div>
                  <p className="text-xs text-slate-500">Company Name</p>
                  <p className="font-medium text-slate-200">{user?.profile?.companyName || user?.name || "N/A"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-indigo-400 shrink-0" />
                <div>
                  <p className="text-xs text-slate-500">Developer Name</p>
                  <p className="font-medium text-slate-200">{user?.profile?.developerName || user?.name || "N/A"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-indigo-400 shrink-0" />
                <div>
                  <p className="text-xs text-slate-500">Email Address</p>
                  <p className="font-medium text-slate-200">{user?.email || "N/A"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-indigo-400 shrink-0" />
                <div>
                  <p className="text-xs text-slate-500">Phone</p>
                  <p className="font-medium text-slate-200">{user?.profile?.phone || "N/A"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
                <div>
                  <p className="text-xs text-slate-500">RERA Registration No.</p>
                  <p className="font-medium text-slate-200 font-mono">{user?.profile?.reraNumber || "Not Provided"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-indigo-400 shrink-0" />
                <div>
                  <p className="text-xs text-slate-500">Operating Cities</p>
                  <p className="font-medium text-slate-200">{user?.profile?.operatingCities || "Not Specified"}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Interactive Edit Profile Form */
          <form onSubmit={handleSaveProfile} className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
                <Edit3 className="w-4 h-4" /> Edit Profile & Correct Credentials
              </h3>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="text-slate-400 hover:text-slate-200 text-xs flex items-center gap-1 bg-slate-800 px-2.5 py-1 rounded-md"
              >
                <X className="w-3.5 h-3.5" /> Cancel
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase text-slate-400 block mb-1">Company Name</label>
                <input
                  type="text"
                  value={editForm.companyName}
                  onChange={e => setEditForm({ ...editForm, companyName: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-400 block mb-1">Established Year</label>
                <input
                  type="text"
                  value={editForm.establishedYear}
                  onChange={e => setEditForm({ ...editForm, establishedYear: e.target.value })}
                  placeholder="e.g. 2010"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-400 block mb-1">Developer / Contact Name</label>
                <input
                  type="text"
                  value={editForm.developerName}
                  onChange={e => setEditForm({ ...editForm, developerName: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-400 block mb-1">Experience (Years)</label>
                <input
                  type="text"
                  value={editForm.experience}
                  onChange={e => setEditForm({ ...editForm, experience: e.target.value })}
                  placeholder="e.g. 10 Years"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-400 block mb-1">RERA Registration No.</label>
                <input
                  type="text"
                  value={editForm.reraNumber}
                  onChange={e => setEditForm({ ...editForm, reraNumber: e.target.value })}
                  placeholder="e.g. P51700012345"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-400 block mb-1">Phone Number</label>
                <input
                  type="text"
                  value={editForm.phone}
                  onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-bold uppercase text-slate-400 block mb-1">Operating Cities / Locations</label>
                <input
                  type="text"
                  value={editForm.operatingCities}
                  onChange={e => setEditForm({ ...editForm, operatingCities: e.target.value })}
                  placeholder="e.g. Mumbai, Pune, Thane"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-bold uppercase text-slate-400 block mb-1">About Company</label>
                <textarea
                  value={editForm.aboutCompany}
                  onChange={e => setEditForm({ ...editForm, aboutCompany: e.target.value })}
                  rows={2}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-bold uppercase text-slate-400 block mb-1">Developer Bio / Description</label>
                <textarea
                  value={editForm.description}
                  onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                  rows={2}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="sm:col-span-2">
                <ImageUpload
                  value={editForm.logo}
                  onChange={val => setEditForm({ ...editForm, logo: val })}
                  label="Company Logo"
                  className="w-full"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                disabled={isSaving}
                className="flex-1 h-10 border border-slate-700 hover:bg-slate-800 text-slate-300 text-sm font-semibold rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 h-10 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 disabled:opacity-50"
              >
                {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {isSaving ? "Saving..." : "Save & Re-submit Profile"}
              </button>
            </div>
          </form>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="w-full sm:flex-1 h-11 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/20"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit Profile & Re-Submit</span>
            </button>
          )}

          <button
            onClick={fetchProfile}
            disabled={checking}
            className="w-full sm:w-auto px-5 h-11 border border-slate-700 hover:bg-slate-800 text-slate-300 font-semibold rounded-xl text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${checking ? "animate-spin" : ""}`} />
            <span>Check Approval Status</span>
          </button>

          <button
            onClick={handleLogout}
            className="w-full sm:w-auto px-5 h-11 border border-slate-700 hover:bg-slate-800 text-slate-300 font-semibold rounded-xl text-sm flex items-center justify-center gap-2 transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BuilderProfileSettingsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">Loading approval status...</div>}>
      <ProfileSettingsContent />
    </Suspense>
  );
}
