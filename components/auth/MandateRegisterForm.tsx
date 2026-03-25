"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { 
  User, Eye, EyeOff, Mail, Lock, ArrowRight, Phone,
  Briefcase, CheckCircle2, BadgeCheck, UploadCloud
} from "lucide-react"
import { IRegisterMandatePayload } from "@/types/auth"

export default function MandateRegisterForm() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)

  const [mandateForm, setMandateForm] = useState({
    fullName: "", email: "", phone: "",
    password: "", confirmPassword: "", panNumber: "", aadharNumber: "",
    address: "", city: "", state: "", experience: "", specialization: "", preferredAreas: "", logo: ""
  })

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploadingLogo(true)
    const formData = new FormData()
    formData.append("file", file)
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData })
      const data = await res.json()
      if (data.url) {
        setMandateForm(prev => ({ ...prev, logo: data.url }))
      } else {
        setError(data.error || "Logo upload failed")
      }
    } catch {
      setError("Failed to upload logo")
    } finally {
      setIsUploadingLogo(false)
    }
  }

  const handleNext = () => {
    setError("")
    if (step === 1 && (!mandateForm.fullName || !mandateForm.email || !mandateForm.phone)) {
      return setError("Please fill all required fields in Step 1")
    }
    if (step === 2) {
      if (!mandateForm.panNumber || !mandateForm.aadharNumber || !mandateForm.password || !mandateForm.confirmPassword) {
        return setError("Please fill all required fields in Step 2")
      }
      if (mandateForm.password !== mandateForm.confirmPassword) {
        return setError("Passwords do not match")
      }
    }
    setStep(step + 1)
  }

  const handleMandateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!mandateForm.city || !mandateForm.state || !mandateForm.experience) {
      return setError("City, State, and Experience are required fields.")
    }
    setIsLoading(true)
    setError("")
    setSuccess("")
    
    try {
      const payload: IRegisterMandatePayload = { 
        userType: "mandate",
        ...mandateForm
      }
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Registration failed")
        setIsLoading(false)
        return
      }
      setSuccess(data.message)
      setTimeout(() => router.push("/login"), 2000)
    } catch {
      setError("Something went wrong. Please try again.")
      setIsLoading(false)
    }
  }

  const inputClass = "w-full bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#1A3C8C] py-3 px-4"
  const inputWithIconClass = `${inputClass} pl-11`
  const labelClass = "block text-sm font-medium text-slate-300 mb-2"

  return (
    <>
      <div className="flex items-center justify-center gap-2 mb-6">
        {[1, 2, 3].map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all
              ${step >= s ? "bg-gradient-to-r from-[#1A3C8C] to-blue-600 text-white" : "bg-white/10 text-slate-500"}`}
            >
              {step > s ? <CheckCircle2 className="h-4 w-4" /> : s}
            </div>
            {i < 2 && (
              <div className={`w-16 h-1 mx-1 rounded transition-all ${step > s ? "bg-[#1A3C8C]" : "bg-white/10"}`} />
            )}
          </div>
        ))}
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500/30 rounded-xl py-3 px-4 text-red-300 text-sm text-center mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-500/20 border border-green-500/30 rounded-xl py-3 px-4 text-green-300 text-sm text-center mb-4">
          ✅ {success}
        </div>
      )}

      <form onSubmit={handleMandateSubmit}>
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white mb-4">Personal Information</h3>

            <div>
              <label className={labelClass}>Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="text" required
                  value={mandateForm.fullName}
                  onChange={e => setMandateForm({ ...mandateForm, fullName: e.target.value })}
                  placeholder="Your Full Name"
                  className={inputWithIconClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="email" required
                    value={mandateForm.email}
                    onChange={e => setMandateForm({ ...mandateForm, email: e.target.value })}
                    placeholder="email@company.com"
                    className={`${inputClass} pl-10 text-sm`}
                  />
                </div>
              </div>
              <div>
                <label className={labelClass}>Phone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="tel" required
                    value={mandateForm.phone}
                    onChange={e => setMandateForm({ ...mandateForm, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className={`${inputClass} pl-10 text-sm`}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className={labelClass}>Profile Photo / Logo (Optional)</label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                  {mandateForm.logo ? (
                    <img src={mandateForm.logo} alt="Profile Logo" className="w-full h-full object-cover" />
                  ) : (
                    <User className="h-6 w-6 text-slate-500" />
                  )}
                </div>
                <div className="flex-1 relative">
                  <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" id="mandate-logo-upload" />
                  <label htmlFor="mandate-logo-upload" className="w-full flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 border border-white/20 border-dashed rounded-xl cursor-pointer text-sm font-medium text-slate-300 transition-all hover:border-[#1A3C8C] group">
                    {isUploadingLogo ? (
                      <><div className="w-4 h-4 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" /> Uploading...</>
                    ) : (
                      <><UploadCloud className="w-4 h-4 group-hover:text-[#1A3C8C] transition-colors" /> <span className="group-hover:text-white transition-colors">Upload Profile Image</span></>
                    )}
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white mb-4">Security & Verification</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>PAN Number</label>
                <input
                  type="text" maxLength={10} required
                  value={mandateForm.panNumber}
                  onChange={e => setMandateForm({ ...mandateForm, panNumber: e.target.value.toUpperCase() })}
                  placeholder="ABCDE1234F"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Aadhar Number</label>
                <input
                  type="text" maxLength={14} required
                  value={mandateForm.aadharNumber}
                  onChange={e => setMandateForm({ ...mandateForm, aadharNumber: e.target.value })}
                  placeholder="1234 5678 9012"
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"} required minLength={8}
                  value={mandateForm.password}
                  onChange={e => setMandateForm({ ...mandateForm, password: e.target.value })}
                  placeholder="Min 8 characters"
                  className={inputWithIconClass}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors">
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className={labelClass}>Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="password" required
                  value={mandateForm.confirmPassword}
                  onChange={e => setMandateForm({ ...mandateForm, confirmPassword: e.target.value })}
                  placeholder="Re-enter password"
                  className={inputWithIconClass}
                />
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white mb-4">Work Details</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>City *</label>
                <input
                  type="text" required
                  value={mandateForm.city}
                  onChange={e => setMandateForm({ ...mandateForm, city: e.target.value })}
                  placeholder="e.g., Pune"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>State *</label>
                <input
                  type="text" required
                  value={mandateForm.state}
                  onChange={e => setMandateForm({ ...mandateForm, state: e.target.value })}
                  placeholder="e.g., Maharashtra"
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Experience (years) *</label>
                <div className="relative">
                  <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    type="number" required
                    value={mandateForm.experience}
                    onChange={e => setMandateForm({ ...mandateForm, experience: e.target.value })}
                    placeholder="e.g., 5"
                    className={inputWithIconClass}
                  />
                </div>
              </div>
              <div>
                <label className={labelClass}>Specialization *</label>
                <select required
                  value={mandateForm.specialization}
                  onChange={e => setMandateForm({ ...mandateForm, specialization: e.target.value })}
                  className={`${inputClass} bg-slate-800`}
                >
                  <option value="" className="bg-slate-800">Select...</option>
                  <option value="residential" className="bg-slate-800">Residential</option>
                  <option value="commercial" className="bg-slate-800">Commercial</option>
                  <option value="plots" className="bg-slate-800">Plots / Land</option>
                  <option value="all" className="bg-slate-800">All Types</option>
                </select>
              </div>
            </div>

            <div>
              <label className={labelClass}>Preferred Areas / Localities</label>
              <textarea
                value={mandateForm.preferredAreas}
                onChange={e => setMandateForm({ ...mandateForm, preferredAreas: e.target.value })}
                placeholder="e.g., Baner, Wakad, Hinjewadi"
                rows={2}
                className={`${inputClass} resize-none`}
              />
            </div>
          </div>
        )}

        <div className="flex gap-3 mt-6">
          {step > 1 && (
            <button type="button" onClick={() => setStep(step - 1)}
              className="flex-1 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl font-medium transition-all">
              Previous
            </button>
          )}
          {step < 3 && (
            <button type="button" onClick={handleNext}
              className="flex-1 py-3 bg-gradient-to-r from-[#1A3C8C] to-blue-600 hover:from-[#152f6e] hover:to-blue-700 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2">
              Next <ArrowRight className="h-4 w-4" />
            </button>
          )}
          {step === 3 && (
            <button type="submit" disabled={isLoading}
              className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50">
              {isLoading ? (
                <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Creating Account...</>
              ) : (
                <><BadgeCheck className="h-5 w-5" /> Complete Registration</>
              )}
            </button>
          )}
        </div>
      </form>
    </>
  )
}
