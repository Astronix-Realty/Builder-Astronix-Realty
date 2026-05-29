"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { 
  Building2, User, Eye, EyeOff, Mail, Lock, ArrowRight, Phone,
  MapPin, Globe, FileText, CheckCircle2, BadgeCheck, UploadCloud, Image as ImageIcon, X, RefreshCw
} from "lucide-react"
import { IRegisterBuilderPayload } from "@/types/auth"

export default function BuilderRegisterForm() {
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

  const [builderForm, setBuilderForm] = useState({
    companyName: "", developerName: "", email: "", phone: "",
    password: "", confirmPassword: "", reraNumber: "",
    address: "", city: "", state: "", website: "", experience: "", logo: ""
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
    const isValid = /^\+?[0-9]{10,15}$/.test(phone)
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
        setBuilderForm(prev => ({ ...prev, logo: data.url }))
      } else {
        setError(data.error || "Logo upload failed")
      }
    } catch {
      setError("Failed to upload logo")
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
    setBuilderForm(prev => ({ ...prev, logo: "" }))
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleNext = () => {
    setError("")
    if (step === 1) {
      if (!builderForm.companyName || !builderForm.developerName || !builderForm.email || !builderForm.phone) {
        return setError("Please fill all required fields in Step 1")
      }
      const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(builderForm.email)
      const isPhoneValid = /^\+?[0-9]{10,15}$/.test(builderForm.phone)
      
      if (!isEmailValid) setEmailError("Invalid email format")
      if (!isPhoneValid) setPhoneError("Invalid phone number (10-15 digits)")
      
      if (!isEmailValid || !isPhoneValid) {
        return setError("Please fix the validation errors before proceeding.")
      }
    }
    if (step === 2) {
      if (!builderForm.reraNumber || !builderForm.password || !builderForm.confirmPassword) {
        return setError("Please fill all required fields in Step 2")
      }
      if (builderForm.password !== builderForm.confirmPassword) {
        return setError("Passwords do not match")
      }
    }
    setStep(step + 1)
  }

  const handleBuilderSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!builderForm.city || !builderForm.state || !builderForm.experience) {
      return setError("City, State, and Experience are required fields.")
    }
    setIsLoading(true)
    setError("")
    setSuccess("")
    
    try {
      const payload: IRegisterBuilderPayload = { 
        userType: "builder",
        ...builderForm
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
              ${step >= s ? "bg-gradient-to-r from-[#1A3C8C] to-blue-600 text-white border-none" : "bg-white/5 border border-white/10 text-slate-500"}`}
            >
              {step > s ? <CheckCircle2 className="h-4 w-4" /> : s}
            </div>
            {i < 2 && (
              <div className={`w-16 h-1 mx-1 rounded-full transition-all ${step > s ? "bg-gradient-to-r from-[#1A3C8C] to-blue-600" : "bg-white/10"}`} />
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

      <form onSubmit={handleBuilderSubmit} className="space-y-6">
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-xl font-semibold text-white border-b border-white/10 pb-3">Company Information</h3>
            
            {/* Logo Uploader */}
            <div className="flex flex-col gap-2">
              <label className={labelClass}>Company Logo (Optional)</label>
              <div className="flex items-center gap-6">
                <div 
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => !builderForm.logo && fileInputRef.current?.click()}
                  className={`relative w-32 h-32 shrink-0 rounded-2xl border-2 flex flex-col items-center justify-center overflow-hidden transition-all duration-300 group
                    ${builderForm.logo 
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
                  ) : builderForm.logo ? (
                    <>
                      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-20" />
                      <img src={builderForm.logo} alt="Company Logo" className="absolute inset-0 w-full h-full object-cover" />
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
                      <span className="text-[10px] font-medium uppercase tracking-wider opacity-70">Upload Logo</span>
                    </div>
                  )}
                </div>
                {!builderForm.logo && (
                  <div className="flex flex-col gap-1 text-sm text-slate-400">
                    <p className="font-medium text-slate-300">Brand Identity</p>
                    <p className="text-xs">Upload your company logo to stand out.</p>
                    <p className="text-xs opacity-60">SVG, PNG, JPG (max. 5MB)</p>
                  </div>
                )}
                {builderForm.logo && !isUploadingLogo && (
                  <div className="flex flex-col gap-1 text-sm">
                    <p className="font-medium text-green-400 flex items-center gap-1">
                      <BadgeCheck className="h-4 w-4" /> Logo uploaded
                    </p>
                    <p className="text-xs text-slate-400">Looking good! Hover over the image to replace or remove it.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClass}>Company Name *</label>
                <div className="relative">
                  <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    type="text" required
                    value={builderForm.companyName}
                    onChange={e => setBuilderForm({ ...builderForm, companyName: e.target.value })}
                    placeholder="e.g., Godrej Properties"
                    className={inputWithIconClass}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Developer / Owner Name *</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    type="text" required
                    value={builderForm.developerName}
                    onChange={e => setBuilderForm({ ...builderForm, developerName: e.target.value })}
                    placeholder="Full Name"
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
                    value={builderForm.email}
                    onChange={e => {
                      setBuilderForm({ ...builderForm, email: e.target.value })
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
                    value={builderForm.phone}
                    onChange={e => {
                      setBuilderForm({ ...builderForm, phone: e.target.value })
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
                  value={builderForm.reraNumber}
                  onChange={e => setBuilderForm({ ...builderForm, reraNumber: e.target.value.toUpperCase() })}
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
                    value={builderForm.password}
                    onChange={e => setBuilderForm({ ...builderForm, password: e.target.value })}
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
                    value={builderForm.confirmPassword}
                    onChange={e => setBuilderForm({ ...builderForm, confirmPassword: e.target.value })}
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
            <h3 className="text-xl font-semibold text-white border-b border-white/10 pb-3">Company Details</h3>
            <div>
              <label className={labelClass}>Office Address</label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-400" />
                <textarea
                  value={builderForm.address}
                  onChange={e => setBuilderForm({ ...builderForm, address: e.target.value })}
                  placeholder="Full office address"
                  rows={2}
                  className={`${inputWithIconClass} resize-none`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClass}>City *</label>
                <input
                  type="text" required
                  value={builderForm.city}
                  onChange={e => setBuilderForm({ ...builderForm, city: e.target.value })}
                  placeholder="e.g., Pune"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>State *</label>
                <input
                  type="text" required
                  value={builderForm.state}
                  onChange={e => setBuilderForm({ ...builderForm, state: e.target.value })}
                  placeholder="e.g., Maharashtra"
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClass}>Website</label>
                <div className="relative">
                  <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    type="url"
                    value={builderForm.website}
                    onChange={e => setBuilderForm({ ...builderForm, website: e.target.value })}
                    placeholder="https://..."
                    className={inputWithIconClass}
                  />
                </div>
              </div>
              <div>
                <label className={labelClass}>Experience (years) *</label>
                <input
                  type="number" required min="0"
                  value={builderForm.experience}
                  onChange={e => setBuilderForm({ ...builderForm, experience: e.target.value })}
                  placeholder="e.g., 10"
                  className={inputClass}
                />
              </div>
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
              className="flex-[2] py-3.5 bg-gradient-to-r from-[#1A3C8C] to-blue-600 hover:from-[#152f6e] hover:to-blue-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
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
