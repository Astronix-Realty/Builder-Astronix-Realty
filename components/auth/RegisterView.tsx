"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Building2, Users, ArrowLeft, Shield, Sparkles, Award } from "lucide-react"

import BuilderRegisterForm from "@/components/auth/BuilderRegisterForm"
import MandateRegisterForm from "@/components/auth/MandateRegisterForm"

function RegisterContent() {
  const searchParams = useSearchParams()
  const typeFromUrl = searchParams.get("type")

  const [userType, setUserType] = useState<"builder" | "mandate">(
    typeFromUrl === "mandate" ? "mandate" : "builder"
  )

  useEffect(() => {
    if (typeFromUrl === "mandate") setUserType("mandate")
    else if (typeFromUrl === "builder") setUserType("builder")
  }, [typeFromUrl])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-[#0f1f4d] to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* ── ANIMATED BLOBS ── */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-[#1A3C8C]/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl animate-pulse delay-1000" />

      <div className="w-full max-w-xl relative z-10">
        {/* ── BACK LINK ── */}
        <Link href="/login" className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors text-sm">
          <ArrowLeft className="h-4 w-4" />
          Back to Login
        </Link>

        {/* ── GLASS CARD ── */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-8">
          {/* ── LOGO ── */}
          <div className="text-center mb-6">
            <div className="w-24 h-24 flex items-center justify-center mx-auto mb-6 rounded-3xl bg-white border-4 border-blue-600/20 shadow-[0_0_50px_rgba(37,99,235,0.2)] relative group transition-all duration-500 hover:scale-105 overflow-hidden p-3">
              <img src="/astronix-logo.png" alt="Astronix Realty Logo" className="w-full h-full object-contain relative z-10" />
            </div>
            <h1 className="text-2xl font-bold text-white">
              {userType === "builder" ? "Builder Registration" : "Mandate Registration"}
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              {userType === "builder" ? "Register your real estate development company" : "Register as a sales mandate/agency"}
            </p>
          </div>

          {/* ── USER TYPE TOGGLE ── */}
          <div className="flex bg-white/10 rounded-xl p-1 mb-6">
            <button
              type="button"
              onClick={() => setUserType("builder")}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2
                ${userType === "builder" ? "bg-gradient-to-r from-[#1A3C8C] to-blue-600 text-white shadow-lg" : "text-slate-400 hover:text-white"}`}
            >
              <Building2 className="h-4 w-4" /> Builder
            </button>
            <button
              type="button"
              onClick={() => setUserType("mandate")}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2
                ${userType === "mandate" ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg" : "text-slate-400 hover:text-white"}`}
            >
              <Users className="h-4 w-4" /> Mandate
            </button>
          </div>

          {/* ── MODULAR FORMS ── */}
          {userType === "builder" ? <BuilderRegisterForm /> : <MandateRegisterForm />}

          {/* ── LOGIN LINK ── */}
          <p className="text-center text-sm text-slate-400 mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">
              Sign In
            </Link>
          </p>
        </div>

        {/* ── BENEFITS SECTION ── */}
        <div className="mt-6 grid grid-cols-3 gap-3">
          <div className="bg-white/5 backdrop-blur rounded-xl p-3 text-center">
            <Shield className="h-5 w-5 mx-auto mb-1 text-blue-400" />
            <p className="text-xs text-slate-400">Secure Platform</p>
          </div>
          <div className="bg-white/5 backdrop-blur rounded-xl p-3 text-center">
            <Sparkles className="h-5 w-5 mx-auto mb-1 text-cyan-400" />
            <p className="text-xs text-slate-400">Premium Tools</p>
          </div>
          <div className="bg-white/5 backdrop-blur rounded-xl p-3 text-center">
            <Award className="h-5 w-5 mx-auto mb-1 text-yellow-400" />
            <p className="text-xs text-slate-400">24/7 Support</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function RegisterView() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-[#0f1f4d] to-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#1A3C8C] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <RegisterContent />
    </Suspense>
  )
}
