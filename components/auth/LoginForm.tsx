"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Building2, Users, Mail, Lock, Eye, EyeOff, ArrowRight, UserCog } from "lucide-react"
import { UserType } from "@/types/auth"

interface LoginFormProps {
  onForgotPassword: () => void;
  activeUserType?: UserType | "teamLeader";
  onUserTypeChange?: (type: UserType | "teamLeader") => void;
}

function LoginFormInner({ onForgotPassword, activeUserType, onUserTypeChange }: LoginFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [internalUserType, setInternalUserType] = useState<UserType | "teamLeader">("builder")
  
  const userType = activeUserType || internalUserType;

  const handleUserTypeChange = (type: UserType | "teamLeader") => {
    setInternalUserType(type);
    if (onUserTypeChange) onUserTypeChange(type);
  }

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  // Auto-select tab and check error from searchParams
  useEffect(() => {
    const type = searchParams.get("type")
    if (type === "teamLeader" || type === "builder" || type === "mandate") {
      handleUserTypeChange(type as UserType | "teamLeader")
    }

    const err = searchParams.get("error")
    if (err === "session_expired") {
      setError("Your session has expired or requires authentication. Please sign in again.")
    }
  }, [searchParams])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, userType }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Login failed")
        setIsLoading(false)
        return
      }

      const userApproval = data.user?.approvalStatus || "pending"
      const targetUrl =
        userType === "builder"
          ? (userApproval !== "approved" ? `/builder-dashboard/profile-settings?approval=${userApproval}` : "/builder-dashboard")
          : userType === "teamLeader"
            ? "/team-panel"
            : (userApproval !== "approved" ? `/mandate-dashboard/profile-settings?approval=${userApproval}` : "/mandate-dashboard");

      // Full page navigation guarantees browser cookie commit and avoids Next.js router cache race conditions
      window.location.href = targetUrl;
    } catch {
      setError("Something went wrong. Please try again.")
      setIsLoading(false)
    }
  }

  return (
    <>
      <h2 className="text-xl font-bold text-white text-center mb-6">Welcome Back!</h2>

      {/* ── USER TYPE TOGGLE ── */}
      <div className="flex bg-white/10 rounded-xl p-1 mb-6 gap-1">
        <button
          type="button"
          onClick={() => handleUserTypeChange("builder")}
          className={`flex-1 py-2.5 px-2 rounded-lg font-medium flex items-center justify-center gap-1.5 transition-all text-sm
          ${userType === "builder" ? "bg-gradient-to-r from-[#1A3C8C] to-blue-600 text-white shadow-lg" : "text-slate-400 hover:text-white"}`}
        >
          <Building2 className="h-4 w-4" /> Builder
        </button>
        <button
          type="button"
          onClick={() => handleUserTypeChange("mandate")}
          className={`flex-1 py-2.5 px-2 rounded-lg font-medium flex items-center justify-center gap-1.5 transition-all text-sm
          ${userType === "mandate" ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg" : "text-slate-400 hover:text-white"}`}
        >
          <Users className="h-4 w-4" /> Mandate
        </button>
        <button
          type="button"
          onClick={() => handleUserTypeChange("teamLeader")}
          className={`flex-1 py-2.5 px-2 rounded-lg font-medium flex items-center justify-center gap-1.5 transition-all text-sm
          ${userType === "teamLeader" ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg" : "text-slate-400 hover:text-white"}`}
        >
          <UserCog className="h-4 w-4" /> Team
        </button>
      </div>

      {userType === "teamLeader" && (
        <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-300 text-xs text-center">
          🔑 Team Leader Portal — Login with credentials provided by your Builder
        </div>
      )}

      {/* ── ERROR ── */}
      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300 text-sm text-center">
          {error}
        </div>
      )}

      {/* ── FORM ── */}
      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#1A3C8C] focus:border-transparent transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full pl-12 pr-12 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#1A3C8C] focus:border-transparent transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer">
            <input type="checkbox" className="w-4 h-4 rounded border-white/20 bg-white/10 accent-[#1A3C8C]" />
            Remember me
          </label>
          {userType !== "teamLeader" && (
            <button type="button" onClick={onForgotPassword} className="text-sm text-blue-400 hover:text-blue-300 transition-colors font-medium">
              Forgot password?
            </button>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-4 text-white rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
            userType === "teamLeader"
              ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
              : "bg-gradient-to-r from-[#1A3C8C] to-blue-600 hover:from-[#152f6e] hover:to-blue-700"
          }`}
        >
          {isLoading ? (
            <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Logging in...</>
          ) : (
            <>
              {userType === "builder" ? "Login as Builder" : userType === "teamLeader" ? "Login to Team Panel" : "Login as Mandate"}
              <ArrowRight className="h-5 w-5" />
            </>
          )}
        </button>
      </form>

      {/* ── DIVIDER & REGISTER LINKS ── */}
      {userType !== "teamLeader" && (
        <>
          <div className="relative my-6">
            <div className="border-t m-2"></div>
            <div className="relative flex justify-center">
              <span className="px-4 bg-transparent text-sm text-slate-500 backdrop-blur-sm">New to AstronixRealty?</span>
            </div>
          </div>
          <div className="space-y-3">
            <Link href="/register?type=builder"
              className="w-full py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2">
              <Building2 className="h-4 w-4" /> Register as Builder
            </Link>
            <Link href="/register?type=mandate"
              className="w-full py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2">
              <Users className="h-4 w-4" /> Register as Mandate
            </Link>
          </div>
        </>
      )}
    </>
  )
}

export default function LoginForm({ onForgotPassword, activeUserType, onUserTypeChange }: LoginFormProps) {
  return (
    <Suspense fallback={<div className="text-white text-center">Loading...</div>}>
      <LoginFormInner onForgotPassword={onForgotPassword} activeUserType={activeUserType} onUserTypeChange={onUserTypeChange} />
    </Suspense>
  )
}
