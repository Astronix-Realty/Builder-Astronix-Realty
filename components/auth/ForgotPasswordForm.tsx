"use client"

import { useState, useEffect, useCallback } from "react"
import { Mail, Shield, Lock, Eye, EyeOff, CheckCircle2, ArrowLeft, Building2, Users, RefreshCw, Clock } from "lucide-react"
import { UserType } from "@/types/auth"

interface ForgotPasswordFormProps {
  onBackToLogin: (resetSuccessMessage?: string) => void;
}

const OTP_EXPIRY_SECONDS = 15 * 60  // 15 minutes
const RESEND_COOLDOWN_SECONDS = 60  // 60 seconds

export default function ForgotPasswordForm({ onBackToLogin }: ForgotPasswordFormProps) {
  const [userType, setUserType] = useState<UserType>("builder")
  const [forgotStep, setForgotStep] = useState(1) // 1: Email, 2: OTP & New Password
  const [resetEmail, setResetEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  // Timers
  const [otpExpiryLeft, setOtpExpiryLeft] = useState(0)
  const [resendCooldown, setResendCooldown] = useState(0)

  // Countdown tick
  useEffect(() => {
    if (otpExpiryLeft <= 0 && resendCooldown <= 0) return
    const interval = setInterval(() => {
      setOtpExpiryLeft(s => Math.max(0, s - 1))
      setResendCooldown(s => Math.max(0, s - 1))
    }, 1000)
    return () => clearInterval(interval)
  }, [otpExpiryLeft, resendCooldown])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, "0")}`
  }

  const handleSendOtp = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setIsLoading(true)
    setError("")
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail }),
      })
      const data = await res.json()

      if (res.status === 429) {
        setError(data.error || "Too many requests. Please wait.")
        if (data.waitSeconds) setResendCooldown(data.waitSeconds)
        return
      }

      if (!res.ok) {
        setError(data.error || "Failed to send OTP. Please try again.")
        return
      }

      // Always move to step 2 (prevents email enumeration)
      setForgotStep(2)
      setOtpExpiryLeft(OTP_EXPIRY_SECONDS)
      setResendCooldown(RESEND_COOLDOWN_SECONDS)
    } catch {
      setError("Network error. Please check your connection.")
    } finally {
      setIsLoading(false)
    }
  }, [resetEmail])

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return
    setError("")
    setIsLoading(true)
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail }),
      })
      const data = await res.json()

      if (res.status === 429) {
        setError(data.error || "Too many requests. Please wait.")
        if (data.waitSeconds) setResendCooldown(data.waitSeconds)
        return
      }

      setResendCooldown(RESEND_COOLDOWN_SECONDS)
      setOtpExpiryLeft(OTP_EXPIRY_SECONDS)
      setOtp("")
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.")
      return
    }
    if (otpExpiryLeft === 0) {
      setError("OTP has expired. Please request a new one.")
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail, otp, newPassword }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Failed to reset password. Please try again.")
        return
      }

      onBackToLogin("Password reset successfully! Log in with your new password.")
    } catch {
      setError("Network error. Please check your connection.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => onBackToLogin()}
        className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors text-sm font-medium"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Login
      </button>

      <h2 className="text-xl font-bold text-white text-center mb-1">
        {forgotStep === 1 ? "Reset Password" : "Enter OTP"}
      </h2>
      <p className="text-slate-400 text-sm text-center mb-5">
        {forgotStep === 1
          ? "Enter your registered email to receive a One-Time Password."
          : `OTP sent to ${resetEmail}`}
      </p>

      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300 text-sm text-center">
          {error}
        </div>
      )}

      {/* ─── STEP 1: Email ─── */}
      {forgotStep === 1 && (
        <form onSubmit={handleSendOtp} className="space-y-4">
          {/* User Type Toggle */}
          <div className="flex bg-white/10 rounded-xl p-1 mb-4">
            <button type="button" onClick={() => setUserType("builder")}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${userType === "builder" ? "bg-gradient-to-r from-[#1A3C8C] to-blue-600 text-white shadow-lg" : "text-slate-400 hover:text-white"}`}
            >
              <Building2 className="h-4 w-4" /> Builder
            </button>
            <button type="button" onClick={() => setUserType("mandate")}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${userType === "mandate" ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg" : "text-slate-400 hover:text-white"}`}
            >
              <Users className="h-4 w-4" /> Mandate
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Registered Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="email"
                required
                value={resetEmail}
                onChange={e => setResetEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#1A3C8C] transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-4 bg-gradient-to-r from-[#1A3C8C] to-blue-600 hover:from-[#152f6e] hover:to-blue-700 text-white rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading
              ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Sending...</>
              : <><Mail className="h-5 w-5" /> Send OTP</>}
          </button>
        </form>
      )}

      {/* ─── STEP 2: OTP + New Password ─── */}
      {forgotStep === 2 && (
        <form onSubmit={handleResetPassword} className="space-y-4">

          {/* OTP Expiry Timer */}
          {otpExpiryLeft > 0 ? (
            <div className="flex items-center justify-center gap-2 text-xs text-slate-400 bg-white/5 rounded-lg py-2 px-3">
              <Clock className="h-3.5 w-3.5 text-amber-400" />
              OTP expires in <span className="text-amber-400 font-mono font-bold">{formatTime(otpExpiryLeft)}</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 text-xs text-red-400 bg-red-500/10 rounded-lg py-2 px-3">
              ⚠️ OTP expired — please request a new one
            </div>
          )}

          {/* OTP Input */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">6-Digit OTP</label>
            <div className="relative">
              <Shield className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                required
                maxLength={6}
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
                className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#1A3C8C] transition-all tracking-[0.5em] font-mono text-lg"
              />
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">New Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Min 8 characters"
                className="w-full pl-12 pr-12 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#1A3C8C] transition-all"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors">
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type={showConfirm ? "text" : "password"}
                required
                minLength={8}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                className="w-full pl-12 pr-12 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#1A3C8C] transition-all"
              />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors">
                {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading || otpExpiryLeft === 0}
            className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading
              ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Resetting...</>
              : <><CheckCircle2 className="h-5 w-5" /> Reset Password</>}
          </button>

          {/* Resend OTP */}
          <div className="text-center">
            {resendCooldown > 0 ? (
              <p className="text-slate-500 text-xs">
                Resend OTP in <span className="text-slate-300 font-mono">{resendCooldown}s</span>
              </p>
            ) : (
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={isLoading}
                className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 text-sm font-medium mx-auto transition-colors"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Resend OTP
              </button>
            )}
          </div>
        </form>
      )}
    </>
  )
}
