"use client"

import { useState } from "react"
import LoginForm from "@/components/auth/LoginForm"
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm"

export default function LoginView() {
  const [isForgotPassword, setIsForgotPassword] = useState(false)
  const [resetSuccessMessage, setResetSuccessMessage] = useState("")
  const [activeUserType, setActiveUserType] = useState<"builder" | "mandate" | "teamLeader">("builder")

  const handleBackToLogin = (successMessage?: string) => {
    setIsForgotPassword(false)
    if (successMessage) setResetSuccessMessage(successMessage)
  }

  const getPanelContent = () => {
    switch (activeUserType) {
      case "mandate":
        return {
          subtitle: "Mandate Portal",
          title: "Exclusive Mandate Dashboard",
          desc: "Manage your exclusive mandates, drive sales efficiently, and coordinate with builders directly.",
          features: [
            { title: "Exclusive Inventory Access", desc: "Full control over your exclusive properties & inventory.", icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10", color: "blue" },
            { title: "Lead & Sales Pipeline", desc: "Monitor and manage your property leads instantly.", icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z", color: "cyan" },
            { title: "Builder Coordination", desc: "Seamlessly connect with your partner builders.", icon: "M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z", color: "indigo" }
          ]
        };
      case "teamLeader":
        return {
          subtitle: "Team Leader Portal",
          title: "Team Management Dashboard",
          desc: "Oversee your agents, track team performance, and collaborate on shared leads.",
          features: [
            { title: "Agent Performance Tracking", desc: "Monitor your team's conversions and activity.", icon: "M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z", color: "emerald" },
            { title: "Lead Assignment & Routing", desc: "Efficiently distribute leads among your team.", icon: "M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4", color: "teal" },
            { title: "Team Analytics", desc: "Access detailed insights on team-wide performance.", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z", color: "blue" }
          ]
        };
      case "builder":
      default:
        return {
          subtitle: "Builder Portal",
          title: "Access Your Partner Dashboard",
          desc: "Manage your projects, track leads in real-time, and get premium builder insights directly.",
          features: [
            { title: "Real-Time Lead Tracking", desc: "Monitor and manage your property leads instantly.", icon: "M13 10V3L4 14h7v7l9-11h-7z", color: "blue" },
            { title: "Project Management Control", desc: "Full control over your exclusive properties & inventory.", icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z", color: "cyan" },
            { title: "Actionable Insights", desc: "Access detailed analytics and performance metrics.", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z", color: "indigo" }
          ]
        };
    }
  };

  const content = getPanelContent();

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center md:p-4 relative overflow-hidden">
      {/* ── ANIMATED BLOBS ── */}
      <div className="absolute top-0 -left-40 w-80 h-80 bg-[#1A3C8C] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
      <div className="absolute bottom-0 -right-40 w-80 h-80 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />

      <div className="w-full h-full md:min-h-[600px] md:h-auto max-w-5xl bg-slate-900 md:bg-white/5 backdrop-blur-xl md:rounded-3xl md:shadow-[0_20px_50px_rgba(0,0,0,0.5)] md:overflow-hidden flex flex-col md:flex-row md:border border-white/10 relative z-10 pt-[10vh] md:pt-0">
        
        {/* Left Side: Info Panel (Desktop Only) */}
        <div className="w-full md:w-5/12 lg:w-1/2 relative flex-col justify-between hidden md:flex overflow-hidden bg-gradient-to-br from-[#0f1f4d] to-[#050b18] border-r border-white/10 transition-colors duration-500">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=1000')] bg-cover bg-center opacity-10 mix-blend-luminosity"></div>
          
          <div className="relative z-10 p-8 lg:p-10 flex flex-col h-full">
            <div>
              <div className="inline-flex items-center gap-3 mb-10">
                <div className="w-10 h-10 rounded-xl bg-white border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.3)] flex items-center justify-center overflow-hidden p-1">
                  <img src="/astronix-logo.png" alt="Astronix Realty Logo" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h2 className="text-white text-xl font-bold leading-tight">Astronix Realty</h2>
                  <p className="text-blue-400 text-[10px] uppercase tracking-[0.15em] font-bold mt-0.5">{content.subtitle}</p>
                </div>
              </div>
              
              <h1 className="text-3xl lg:text-4xl font-black text-white leading-[1.15] tracking-tight mb-4 transition-all duration-300">
                {content.title.split(' ').slice(0, -1).join(' ')} <br />
                <span className={`text-transparent bg-clip-text bg-gradient-to-r ${activeUserType === 'teamLeader' ? 'from-emerald-400 to-teal-400' : 'from-blue-400 to-cyan-400'}`}>
                  {content.title.split(' ').slice(-1)}
                </span>
              </h1>
              <p className="text-slate-300 font-medium text-sm leading-relaxed max-w-sm transition-all duration-300">
                {content.desc}
              </p>
            </div>

            <div className="flex-grow flex flex-col justify-center my-8">
              <div className="space-y-6">
                {content.features.map((feature, idx) => {
                  const colorClasses = {
                    blue: "bg-blue-500/20 border-blue-500/30 text-blue-400",
                    cyan: "bg-cyan-500/20 border-cyan-500/30 text-cyan-400",
                    indigo: "bg-indigo-500/20 border-indigo-500/30 text-indigo-400",
                    emerald: "bg-emerald-500/20 border-emerald-500/30 text-emerald-400",
                    teal: "bg-teal-500/20 border-teal-500/30 text-teal-400",
                  }[feature.color] || "bg-blue-500/20 border-blue-500/30 text-blue-400";
                  
                  return (
                    <div key={idx} className="flex gap-4 items-start animate-fade-in" style={{ animationDelay: `${idx * 100}ms` }}>
                      <div className={`w-10 h-10 rounded-full border flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors duration-300 ${colorClasses}`}>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={feature.icon} />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-white font-bold text-[15px]">{feature.title}</h4>
                        <p className="text-slate-400 text-xs mt-1 leading-relaxed">{feature.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="mt-auto pt-6 border-t border-white/10">
              <p className="text-slate-500 text-xs font-medium">Secured by Astronix Realty Platform</p>
            </div>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="w-full flex-1 md:w-7/12 lg:w-1/2 px-6 py-10 sm:px-10 lg:px-12 flex flex-col relative z-20 bg-slate-900/50 md:bg-transparent">
          
          <div className="md:hidden flex flex-col items-center mb-8">
            <div className="w-16 h-16 flex items-center justify-center rounded-2xl bg-white border-2 border-blue-600/30 shadow-[0_0_30px_rgba(37,99,235,0.2)] mb-4 p-2">
              <img src="/astronix-logo.png" alt="Astronix Realty Logo" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-2xl font-bold text-white">Astronix Realty</h1>
            <p className="text-blue-400 text-xs mt-1 uppercase tracking-wider font-bold">{content.subtitle}</p>
          </div>

          <div className="max-w-[400px] w-full mx-auto flex-1 flex flex-col justify-center">
            {resetSuccessMessage && !isForgotPassword && (
              <div className="mb-6 p-3 bg-green-500/20 border border-green-500/30 rounded-xl text-green-300 text-sm text-center">
                ✅ {resetSuccessMessage}
              </div>
            )}

            {isForgotPassword ? (
              <ForgotPasswordForm onBackToLogin={handleBackToLogin} />
            ) : (
              <LoginForm 
                onForgotPassword={() => {
                  setIsForgotPassword(true);
                  setResetSuccessMessage("");
                }} 
                activeUserType={activeUserType}
                onUserTypeChange={setActiveUserType}
              />
            )}
          </div>
          
          <p className="text-center mt-8 text-slate-500 text-xs md:hidden">
            🔒 Secured by Astronix Realty
          </p>
        </div>
      </div>
    </div>
  )
}
