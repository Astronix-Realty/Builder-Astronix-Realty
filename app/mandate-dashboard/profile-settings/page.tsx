"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ShieldAlert, Clock, Building2, User, Mail, Phone, RefreshCw, LogOut } from "lucide-react";

function MandateProfileSettingsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const approvalParam = searchParams.get("approval") || "pending";
  const messageParam = searchParams.get("message") || "";

  const [user, setUser] = useState<any>(null);
  const [checking, setChecking] = useState(false);

  const fetchProfile = async () => {
    setChecking(true);
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        if (data.user?.approvalStatus === "approved") {
          router.push("/mandate-dashboard");
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-2">
            {approvalParam === "rejected" ? (
              <ShieldAlert className="w-8 h-8 text-rose-400" />
            ) : (
              <Clock className="w-8 h-8 text-amber-400 animate-pulse" />
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            {approvalParam === "rejected" ? "Mandate Application Declined" : "Mandate Approval: Pending Review"}
          </h1>

          <p className="text-slate-400 text-sm max-w-lg">
            {approvalParam === "rejected"
              ? messageParam || "Your mandate account application was reviewed and declined by Astronix Realty Admin."
              : "Your registration as a Mandate partner has been submitted to Astronix Realty Admin for verification."}
          </p>
        </div>

        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-5 space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-2">
            Submitted Mandate Details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-3">
              <Building2 className="w-4 h-4 text-indigo-400 shrink-0" />
              <div>
                <p className="text-xs text-slate-500">Company / Mandate Name</p>
                <p className="font-medium text-slate-200">{user?.profile?.companyName || user?.name || "N/A"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <User className="w-4 h-4 text-indigo-400 shrink-0" />
              <div>
                <p className="text-xs text-slate-500">Role</p>
                <p className="font-medium text-slate-200">Exclusive Mandate Partner</p>
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
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <button
            onClick={fetchProfile}
            disabled={checking}
            className="w-full sm:flex-1 h-11 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50"
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

export default function MandateProfileSettingsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">Loading approval status...</div>}>
      <MandateProfileSettingsContent />
    </Suspense>
  );
}
