"use client"

import { useState } from "react"
import { Mail, Shield, Lock, Eye, EyeOff, CheckCircle2, ArrowLeft, Building2, Users } from "lucide-react"
import { UserType } from "@/types/auth"

interface ForgotPasswordFormProps {
  onBackToLogin: (resetSuccessMessage?: string) => void;
}

export default function ForgotPasswordForm({ onBackToLogin }: ForgotPasswordFormProps) {
  const [userType, setUserType] = useState<UserType>("builder")
  const [forgotStep, setForgotStep] = useState(1) // 1: Email, 2: OTP & New Password
  const [resetEmail, setResetEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    // Mock OTP sending
    setTimeout(() => {
      setIsLoading(false)
      setForgotStep(2)
    }, 1500)
  }

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    if (otp !== "123456") {
      setTimeout(() => {
        setIsLoading(false)
        setError("Invalid OTP. For demo purposes use 123456.")
      }, 1000)
      return
    }
    // Mock Password Reset Success
    setTimeout(() => {
      setIsLoading(false)
      onBackToLogin("Password reset successfully! Log in with your new password.")
    }, 1500)
  }

  return (
    <>
      <button
        onClick={() => onBackToLogin()}
        className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors text-sm font-medium"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Login
      </button>

      <h2 className="text-xl font-bold text-white text-center mb-2">
        {forgotStep === 1 ? "Reset Password" : "Enter OTP"}
      </h2>
      <p className="text-slate-400 text-sm text-center mb-6">
        {forgotStep === 1 ? "Enter your email to receive a One-Time Password." : `We've sent a 6-digit OTP to ${resetEmail}`}
      </p>

      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300 text-sm text-center">
          {error}
        </div>
      )}

      {forgotStep === 1 && (
        <form onSubmit={handleSendOtp} className="space-y-4">
          {/* User Type Toggle */}
          <div className="flex bg-white/10 rounded-xl p-1 mb-4">
            <button type="button" onClick={() => setUserType("builder")} className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${userType === "builder" ? "bg-gradient-to-r from-[#1A3C8C] to-blue-600 text-white shadow-lg" : "text-slate-400 hover:text-white"}`}>
              <Building2 className="h-4 w-4" /> Builder
            </button>
            <button type="button" onClick={() => setUserType("mandate")} className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${userType === "mandate" ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg" : "text-slate-400 hover:text-white"}`}>
              <Users className="h-4 w-4" /> Mandate
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Registered Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input type="email" required value={resetEmail} onChange={e => setResetEmail(e.target.value)} placeholder="your@email.com" className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#1A3C8C] transition-all" />
            </div>
          </div>

          <button type="submit" disabled={isLoading} className="w-full mt-2 py-4 bg-gradient-to-r from-[#1A3C8C] to-blue-600 hover:from-[#152f6e] hover:to-blue-700 text-white rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2 disabled:opacity-50">
            {isLoading ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Sending...</> : <><Mail className="h-5 w-5" /> Send OTP</>}
          </button>
        </form>
      )}

      {forgotStep === 2 && (
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">6-Digit OTP</label>
            <div className="relative">
              <Shield className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input type="text" required maxLength={6} value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))} placeholder="123456" className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#1A3C8C] transition-all tracking-[0.5em] font-mono text-lg" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">New Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input type={showPassword ? "text" : "password"} required minLength={8} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Min 8 characters" className="w-full pl-12 pr-12 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#1A3C8C] transition-all" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors">
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={isLoading} className="w-full mt-2 py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2 disabled:opacity-50">
            {isLoading ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Resetting...</> : <><CheckCircle2 className="h-5 w-5" /> Reset Password</>}
          </button>
        </form>
      )}
    </>
  )
}
