"use client"

import { useState } from "react"
import LoginForm from "@/components/auth/LoginForm"
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm"

export default function LoginPage() {
  const [isForgotPassword, setIsForgotPassword] = useState(false)
  const [resetSuccessMessage, setResetSuccessMessage] = useState("")

  const handleBackToLogin = (successMessage?: string) => {
    setIsForgotPassword(false)
    if (successMessage) setResetSuccessMessage(successMessage)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-[#0f1f4d] to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* ── ANIMATED BLOBS ── */}
      <div className="absolute top-0 -left-40 w-80 h-80 bg-[#1A3C8C] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
      <div className="absolute bottom-0 -right-40 w-80 h-80 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />

      <div className="w-full max-w-md relative z-10">
        {/* ── LOGO ── */}
        <div className="text-center mb-8">
          <div className="w-28 h-28 flex items-center justify-center mx-auto mb-6 rounded-full bg-[#050b18] border-4 border-blue-600/20 shadow-[0_0_50px_rgba(37,99,235,0.2)] relative group transition-all duration-500 hover:scale-105 overflow-hidden">
            <div className="absolute inset-0 rounded-full bg-blue-500/5 animate-pulse group-hover:bg-blue-500/10 transition-colors" />
            <img src="/astronix-logo.png" alt="Astronix Realty Logo" className="w-full h-full object-cover rounded-full relative z-10" />
          </div>
          <h1 className="text-2xl font-bold text-white">Astronix Realty</h1>
          <p className="text-slate-400 text-sm mt-1 ">Builder & Mandate Portal</p>
        </div>

        <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-8">
          {resetSuccessMessage && !isForgotPassword && (
            <div className="mb-4 p-3 bg-green-500/20 border border-green-500/30 rounded-xl text-green-300 text-sm text-center">
              ✅ {resetSuccessMessage}
            </div>
          )}

          {isForgotPassword ? (
            <ForgotPasswordForm onBackToLogin={handleBackToLogin} />
          ) : (
            <LoginForm onForgotPassword={() => { 
              setIsForgotPassword(true); 
              setResetSuccessMessage(""); 
            }} />
          )}
        </div>

        {/* ── FOOTER ── */}
        <p className="text-center mt-6 text-slate-500 text-sm">
          🔒 Secured by Astronix • Your data is protected
        </p>
      </div>
    </div>
  )
}
