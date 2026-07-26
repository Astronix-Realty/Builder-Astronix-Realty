"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { 
  User, Eye, EyeOff, Mail, Lock, ArrowRight, Phone, Building2,
  Briefcase, CheckCircle2, BadgeCheck, UploadCloud, FileText, X, RefreshCw
} from "lucide-react"
import { IRegisterMandatePayload } from "@/types/auth"

export default function MandateRegisterForm() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  
  // Validation state
  const [emailError, setEmailError] = useState("")
  const [phoneError, setPhoneError] = useState("")
  
  // Logo upload state
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [mandateForm, setMandateForm] = useState({
    fullName: "", companyName: "", email: "", phone: "",
    password: "", confirmPassword: "", reraNumber: "",
    address: "", city: "", state: "", experience: "", specialization: "", preferredAreas: "", logo: ""
  })

  const validateEmail = (email: string) => {
    if (!email) {
      setEmailError("")
      return false
    }
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    setEmailError(isValid ? "" : "Invalid email format")
    return isValid
  }

  const validatePhone = (phone: string) => {
    if (!phone) {
      setPhoneError("")
      return false
    }
    const cleanPhone = phone.replace(/[\s-]/g, '')
    const isValid = /^\+?[0-9]{10,15}$/.test(cleanPhone)
    setPhoneError(isValid ? "" : "Invalid phone number (10-15 digits)")
    return isValid
  }

  const uploadFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      return setError("Please upload a valid image file.")
    }
    setIsUploadingLogo(true)
    setError("")
    const formData = new FormData()
    formData.append("file", file)
    try {
      const res = await fetch("/api/upload?public=true", { method: "POST", body: formData })
      const data = await res.json()
      if (data.url) {
        setMandateForm(prev => ({ ...prev, logo: data.url }))
      } else {
        setError(data.error || "Profile upload failed")
      }
    } catch {
      setError("Failed to upload profile image")
    } finally {
      setIsUploadingLogo(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) await uploadFile(file)
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) await uploadFile(file)
  }

  const handleRemoveLogo = (e: React.MouseEvent) => {
    e.stopPropagation()
    setMandateForm(prev => ({ ...prev, logo: "" }))
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleNext = () => {
    setError("")
    if (step === 1) {
      if (!mandateForm.fullName || !mandateForm.email || !mandateForm.phone) {
        return setError("Please fill all required fields in Step 1")
      }
      const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mandateForm.email)
      const isPhoneValid = /^\+?[0-9]{10,15}$/.test(mandateForm.phone)
      
      if (!isEmailValid) setEmailError("Invalid email format")
      if (!isPhoneValid) setPhoneError("Invalid phone number (10-15 digits)")
      
      if (!isEmailValid || !isPhoneValid) {
        return setError("Please fix the validation errors before proceeding.")
      }
    }
    if (step === 2) {
      if (!mandateForm.reraNumber || !mandateForm.password || !mandateForm.confirmPassword) {
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
    if (step < 3) {
      handleNext()
      return
    }
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

  const inputClass = "w-full bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#1A3C8C] py-3 px-4 transition-all"
  const inputWithIconClass = `${inputClass} pl-11`
  const labelClass = "block text-sm font-medium text-slate-300 mb-2"

  return (
    <>
      <div className="flex items-center justify-center gap-2 mb-8">
        {[1, 2, 3].map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all shadow-lg
              ${step >= s ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-none" : "bg-white/5 border border-white/10 text-slate-500"}`}
            >
              {step > s ? <CheckCircle2 className="h-4 w-4" /> : s}
            </div>
            {i < 2 && (
              <div className={`w-16 h-1 mx-1 rounded-full transition-all ${step > s ? "bg-gradient-to-r from-blue-500 to-cyan-500" : "bg-white/10"}`} />
            )}
          </div>
        ))}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl py-3 px-4 text-red-400 text-sm text-center mb-6 flex items-center justify-center gap-2">
          <CheckCircle2 className="h-4 w-4 opacity-50" /> {error}
        </div>
      )}

      {success && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl py-3 px-4 text-green-400 text-sm text-center mb-6 flex items-center justify-center gap-2">
          <BadgeCheck className="h-4 w-4" /> {success}
        </div>
      )}

      <form onSubmit={handleMandateSubmit} className="space-y-6">
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-xl font-semibold text-white border-b border-white/10 pb-3">Personal Information</h3>
            
            {/* Profile Photo Uploader */}
            <div className="flex flex-col gap-2">
              <label className={labelClass}>Profile Photo / Agency Logo (Optional)</label>
              <div className="flex items-center gap-6">
                <div 
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => !mandateForm.logo && fileInputRef.current?.click()}
                  className={`relative w-32 h-32 shrink-0 rounded-2xl border-2 flex flex-col items-center justify-center overflow-hidden transition-all duration-300 group
                    ${mandateForm.logo 
                      ? 'border-white/10 bg-black/40 shadow-2xl ring-1 ring-white/10' 
                      : isDragging 
                        ? 'border-blue-400 bg-blue-500/10 border-dashed' 
                        : 'border-white/20 border-dashed bg-white/5 hover:bg-white/10 hover:border-blue-400/50 cursor-pointer'}`}
                >
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleFileChange} 
                    className="hidden" 
                    ref={fileInputRef} 
                  />
                  
                  {isUploadingLogo ? (
                    <div className="flex flex-col items-center gap-2 text-slate-300">
                      <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : mandateForm.logo ? (
                    <>
                      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-20" />
                      <img src={mandateForm.logo} alt="Profile Photo" className="absolute inset-0 w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center gap-3 backdrop-blur-sm">
                        <button 
                          type="button" 
                          onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click() }}
                          className="bg-white/20 hover:bg-white/30 p-2 rounded-full text-white transition-colors hover:scale-110 shadow-lg"
                          title="Replace Image"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </button>
                        <button 
                          type="button" 
                          onClick={handleRemoveLogo}
                          className="bg-red-500/50 hover:bg-red-500/80 p-2 rounded-full text-white transition-colors hover:scale-110 shadow-lg"
                          title="Remove Image"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-slate-400 pointer-events-none p-4 text-center">
                      <UploadCloud className={`h-8 w-8 transition-all duration-300 ${isDragging ? 'text-blue-400 scale-110' : 'group-hover:text-blue-400 group-hover:-translate-y-1'}`} />
                      <span className="text-[10px] font-medium uppercase tracking-wider opacity-70">Upload Photo</span>
                    </div>
                  )}
                </div>
                {!mandateForm.logo && (
                  <div className="flex flex-col gap-1 text-sm text-slate-400">
                    <p className="font-medium text-slate-300">Identity</p>
                    <p className="text-xs">Upload your profile photo or agency logo.</p>
                    <p className="text-xs opacity-60">SVG, PNG, JPG (max. 5MB)</p>
                  </div>
                )}
                {mandateForm.logo && !isUploadingLogo && (
                  <div className="flex flex-col gap-1 text-sm">
                    <p className="font-medium text-green-400 flex items-center gap-1">
                      <BadgeCheck className="h-4 w-4" /> Photo uploaded
                    </p>
                    <p className="text-xs text-slate-400">Hover over the image to replace or remove it.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClass}>Full Name *</label>
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

              <div>
                <label className={labelClass}>Agency / Company Name</label>
                <div className="relative">
                  <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    type="text"
                    value={mandateForm.companyName}
                    onChange={e => setMandateForm({ ...mandateForm, companyName: e.target.value })}
                    placeholder="Optional"
                    className={inputWithIconClass}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClass}>Email *</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="email" required
                    value={mandateForm.email}
                    onChange={e => {
                      setMandateForm({ ...mandateForm, email: e.target.value })
                      validateEmail(e.target.value)
                    }}
                    onBlur={(e) => validateEmail(e.target.value)}
                    placeholder="email@company.com"
                    className={`${inputWithIconClass} ${emailError ? 'border-red-500/50 focus:ring-red-500' : ''}`}
                  />
                </div>
                {emailError && <p className="text-red-400 text-xs mt-1.5 ml-1">{emailError}</p>}
              </div>
              <div>
                <label className={labelClass}>Phone *</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="tel" required
                    value={mandateForm.phone}
                    onChange={e => {
                      setMandateForm({ ...mandateForm, phone: e.target.value })
                      validatePhone(e.target.value)
                    }}
                    onBlur={(e) => validatePhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className={`${inputWithIconClass} ${phoneError ? 'border-red-500/50 focus:ring-red-500' : ''}`}
                  />
                </div>
                {phoneError && <p className="text-red-400 text-xs mt-1.5 ml-1">{phoneError}</p>}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <h3 className="text-xl font-semibold text-white border-b border-white/10 pb-3">Security & Verification</h3>
            
            <div>
              <label className={labelClass}>RERA Registration Number *</label>
              <div className="relative">
                <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="text" required
                  value={mandateForm.reraNumber}
                  onChange={e => setMandateForm({ ...mandateForm, reraNumber: e.target.value.toUpperCase() })}
                  placeholder="e.g., P52000001234"
                  className={inputWithIconClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClass}>Password *</label>
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
                <label className={labelClass}>Confirm Password *</label>
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
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <h3 className="text-xl font-semibold text-white border-b border-white/10 pb-3">Work Details</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClass}>Experience (years) *</label>
                <div className="relative">
                  <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    type="number" required min="0"
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
                  className={`${inputClass} bg-slate-800 text-white [&>option]:bg-slate-800 [&>option]:text-white appearance-none cursor-pointer hover:bg-white-[0.15]`}
                  style={{ backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23cbd5e1%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 1rem top 50%", backgroundSize: "0.65rem auto" }}
                >
                  <option value="">Select...</option>
                  <option value="residential">Residential</option>
                  <option value="commercial">Commercial</option>
                  <option value="plots">Plots / Land</option>
                  <option value="all">All Types</option>
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

        <div className="flex gap-4 pt-4">
          {step > 1 && (
            <button type="button" onClick={() => setStep(step - 1)}
              className="flex-1 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl font-medium transition-all">
              Previous
            </button>
          )}
          {step < 3 && (
            <button type="button" onClick={handleNext} disabled={!!emailError || !!phoneError}
              className="flex-[2] py-3.5 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
              Continue <ArrowRight className="h-4 w-4" />
            </button>
          )}
          {step === 3 && (
            <button type="submit" disabled={isLoading}
              className="flex-[2] py-3.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-green-900/20 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-wait">
              {isLoading ? (
                <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Finalizing...</>
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
