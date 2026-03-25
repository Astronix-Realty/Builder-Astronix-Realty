"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Building2, Users, Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react"
import { UserType } from "@/types/auth"

interface LoginFormProps {
  onForgotPassword: () => void;
}

export default function LoginForm({ onForgotPassword }: LoginFormProps) {
  const router = useRouter()
  const [userType, setUserType] = useState<UserType>("builder")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

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
      
      if (userType === "builder") router.push("/builder-dashboard")
      else router.push("/mandate-dashboard")
    } catch {
      setError("Something went wrong. Please try again.")
      setIsLoading(false)
    }
  }

  return (
    <>
      <h2 className="text-xl font-bold text-white text-center mb-6">Welcome Back!</h2>

      {/* ── USER TYPE TOGGLE ── */}
      <div className="flex bg-white/10 rounded-xl p-1 mb-6">
        <button
          type="button"
          onClick={() => setUserType("builder")}
          className={`flex-1 py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-all
          ${userType === "builder" ? "bg-gradient-to-r from-[#1A3C8C] to-blue-600 text-white shadow-lg" : "text-slate-400 hover:text-white"}`}
        >
          <Building2 className="h-4 w-4" /> Builder
        </button>
        <button
          type="button"
          onClick={() => setUserType("mandate")}
          className={`flex-1 py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-all
          ${userType === "mandate" ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg" : "text-slate-400 hover:text-white"}`}
        >
          <Users className="h-4 w-4" /> Mandate
        </button>
      </div>

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
          <button type="button" onClick={onForgotPassword} className="text-sm text-blue-400 hover:text-blue-300 transition-colors font-medium">
            Forgot password?
          </button>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-4 bg-gradient-to-r from-[#1A3C8C] to-blue-600 hover:from-[#152f6e] hover:to-blue-700 text-white rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Logging in...</>
          ) : (
            <>{userType === "builder" ? "Login as Builder" : "Login as Mandate"} <ArrowRight className="h-5 w-5" /></>
          )}
        </button>
      </form>

      {/* ── DIVIDER ── */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/10" />
        </div>
        <div className="relative flex justify-center">
          <span className="px-4 bg-transparent text-sm text-slate-500 backdrop-blur-sm">New to Astronix?</span>
        </div>
      </div>

      {/* ── REGISTER LINKS ── */}
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
  )
}
