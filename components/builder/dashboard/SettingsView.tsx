"use client"

import React from "react"
import {
  Building2,
  User,
  Mail,
  Star,
  Award,
  Trash2,
  Save,
  Loader2,
  Palette,
  Bell,
  Shield,
  Lock,
  X,
  Info,
  Rocket,
  Globe,
  CheckCircle2,
  Layers,
  HeartHandshake,
  BarChart3,
  MapPin,
  Sparkles,
  Megaphone,
  BadgePercent,
  Laptop,
  Zap,
  ShieldCheck,
  TrendingUp,
  Check,
  ArrowRight,
  Gift,
  Target,
  Coins,
  Home,
  PhoneCall,
  HardHat,
  Hammer,
  Clock,
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ImageUpload } from "@/components/ui/image-upload"
import {
  DashboardProfile,
  ActiveSettingsTab,
} from "./dashboard-types"

interface SettingsViewProps {
  role: "builder" | "mandate"
  currentUser: any
  profile: DashboardProfile
  setProfile: React.Dispatch<React.SetStateAction<DashboardProfile>>
  propertiesCount: number
  activeSettingsTab: ActiveSettingsTab
  setActiveSettingsTab: (tab: ActiveSettingsTab) => void
  onSaveProfile: () => Promise<void>
  isSavingProfile: boolean
  theme: "light" | "dark" | "system"
  onThemeChange: (theme: "light" | "dark" | "system") => void
  notifications: Record<string, boolean>
  onNotificationChange: (key: string, checked: boolean) => void
  isChangingPassword: boolean
  setIsChangingPassword: (val: boolean) => void
  passwordData: {
    otp: string
    newPassword: string
    confirmPassword: string
  }
  setPasswordData: React.Dispatch<
    React.SetStateAction<{
      otp: string
      newPassword: string
      confirmPassword: string
    }>
  >
  handleSendOtp: () => Promise<void>
  sendingOtp: boolean
  otpSent: boolean
  handlePasswordChange: (e: React.FormEvent) => Promise<void>
}

export function SettingsView({
  role,
  currentUser,
  profile,
  setProfile,
  propertiesCount,
  activeSettingsTab,
  setActiveSettingsTab,
  onSaveProfile,
  isSavingProfile,
  theme,
  onThemeChange,
  notifications,
  onNotificationChange,
  isChangingPassword,
  setIsChangingPassword,
  passwordData,
  setPasswordData,
  handleSendOtp,
  sendingOtp,
  otpSent,
  handlePasswordChange,
}: SettingsViewProps) {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Tabs
        value={activeSettingsTab}
        onValueChange={(val: any) => setActiveSettingsTab(val)}
        className="space-y-6"
      >
        <TabsList className="bg-slate-100/80 dark:bg-slate-800/80 p-1 rounded-xl w-full md:w-auto inline-flex border border-slate-200/60 dark:border-slate-700/60 shadow-sm">
          <TabsTrigger
            value="profile"
            className="flex-1 md:w-48 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:shadow-sm px-4 py-2"
          >
            {role === "mandate" ? "👤 Mandate Profile" : "🏢 Builder Profile"}
          </TabsTrigger>
          <TabsTrigger
            value="preferences"
            className="flex-1 md:w-48 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:shadow-sm px-4 py-2"
          >
            ⚙️ System Preferences
          </TabsTrigger>
          <TabsTrigger
            value="about"
            className="flex-1 md:w-48 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:shadow-sm px-4 py-2"
          >
            ℹ️ About Platform
          </TabsTrigger>
        </TabsList>

        {/* Profile Content */}
        <TabsContent
          value="profile"
          className="focus-visible:outline-none animate-in fade-in duration-300"
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Col - Avatar & Basic Media */}
            <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-8 h-fit">
              <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm p-6 text-center space-y-8">
                <ImageUpload
                  value={profile.logo}
                  onChange={(val) => setProfile({ ...profile, logo: val })}
                  label="Company Logo"
                  className="w-full"
                />

                {role === "builder" && (
                  <>
                    <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
                      <ImageUpload
                        value={profile.coverImage}
                        onChange={(val) =>
                          setProfile({ ...profile, coverImage: val })
                        }
                        label="Cover Hero Image"
                        className="w-full"
                      />
                    </div>
                    <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
                      <ImageUpload
                        value={profile.overviewImage}
                        onChange={(val) =>
                          setProfile({ ...profile, overviewImage: val })
                        }
                        label="Overview Side Image"
                        className="w-full"
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-4">
                  Quick Stats
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">
                      Properties
                    </span>
                    <span className="font-medium text-slate-900 dark:text-white">
                      {propertiesCount}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">
                      Member Since
                    </span>
                    <span className="font-medium text-slate-900 dark:text-white">
                      {currentUser?.createdAt
                        ? new Date(currentUser.createdAt).toLocaleDateString(
                            "en-US",
                            { month: "short", year: "numeric" }
                          )
                        : "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Col - Form */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm p-8">
                <div className="space-y-6">
                  {/* Company Details */}
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                      Company Details
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                          {role === "mandate"
                            ? "Agency/Company Name"
                            : "Company Name"}
                        </label>
                        <input
                          type="text"
                          value={profile.companyName}
                          onChange={(e) =>
                            setProfile({ ...profile, companyName: e.target.value })
                          }
                          className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g. Acme Realty"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                          RERA Number
                        </label>
                        <input
                          type="text"
                          value={profile.reraNumber}
                          onChange={(e) =>
                            setProfile({ ...profile, reraNumber: e.target.value })
                          }
                          className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="RERA Registration No."
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Established / Registration Year
                        </label>
                        <input
                          type="text"
                          value={profile.establishedYear || ""}
                          onChange={(e) =>
                            setProfile({
                              ...profile,
                              establishedYear: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g. 2015"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                          State
                        </label>
                        <input
                          type="text"
                          value={profile.state || ""}
                          onChange={(e) =>
                            setProfile({ ...profile, state: e.target.value })
                          }
                          className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g. Maharashtra"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Operating Cities / Locations of Work
                        </label>
                        <input
                          type="text"
                          value={profile.operatingCities || ""}
                          onChange={(e) =>
                            setProfile({
                              ...profile,
                              operatingCities: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g. Mumbai, Pune, Thane"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Tagline
                        </label>
                        <input
                          type="text"
                          value={profile.tagline || ""}
                          onChange={(e) =>
                            setProfile({ ...profile, tagline: e.target.value })
                          }
                          className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Company tagline or short bio"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                          About Company / Agency
                        </label>
                        <textarea
                          value={profile.aboutCompany || ""}
                          onChange={(e) =>
                            setProfile({
                              ...profile,
                              aboutCompany: e.target.value,
                            })
                          }
                          rows={4}
                          className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Detailed description of the company..."
                        />
                      </div>
                    </div>
                  </div>

                  {/* Partner / Developer Info */}
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                      <User className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                      {role === "mandate"
                        ? "Mandate Partner Info"
                        : "Developer Information"}
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                          {role === "mandate" ? "Full Name" : "Developer Name"}
                        </label>
                        <input
                          type="text"
                          value={
                            role === "mandate"
                              ? profile.fullName || ""
                              : profile.developerName || ""
                          }
                          onChange={(e) => {
                            if (role === "mandate") {
                              setProfile({
                                ...profile,
                                fullName: e.target.value,
                              })
                            } else {
                              setProfile({
                                ...profile,
                                developerName: e.target.value,
                              })
                            }
                          }}
                          className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Full Name"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Experience
                        </label>
                        <input
                          type="text"
                          value={profile.experience || ""}
                          onChange={(e) =>
                            setProfile({
                              ...profile,
                              experience: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g. 10+ Years"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Specializations
                        </label>
                        <input
                          type="text"
                          value={profile.specialization || ""}
                          onChange={(e) =>
                            setProfile({
                              ...profile,
                              specialization: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g. Residential, Retail, Land"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                          {role === "mandate"
                            ? "Mandate Description"
                            : "Developer Description"}
                        </label>
                        <textarea
                          value={profile.description || ""}
                          onChange={(e) =>
                            setProfile({
                              ...profile,
                              description: e.target.value,
                            })
                          }
                          rows={3}
                          className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder={
                            role === "mandate"
                              ? "Brief description or overview of the mandate partner..."
                              : "Brief overview or bio of the developer..."
                          }
                        />
                      </div>

                      {role === "mandate" && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                              PAN Number
                            </label>
                            <input
                              type="text"
                              value={profile.panNumber || ""}
                              onChange={(e) =>
                                setProfile({
                                  ...profile,
                                  panNumber: e.target.value,
                                })
                              }
                              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="ABCDE1234F"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                              Aadhar Number
                            </label>
                            <input
                              type="text"
                              value={profile.aadharNumber || ""}
                              onChange={(e) =>
                                setProfile({
                                  ...profile,
                                  aadharNumber: e.target.value,
                                })
                              }
                              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="1234 5678 9012"
                            />
                          </div>

                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                              Preferred Operating Areas / Townships
                            </label>
                            <input
                              type="text"
                              value={profile.preferredAreas || ""}
                              onChange={(e) =>
                                setProfile({
                                  ...profile,
                                  preferredAreas: e.target.value,
                                })
                              }
                              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="e.g. Bandra, Andheri, Navi Mumbai"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                      <Mail className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                      Contact & Address
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Email Address
                        </label>
                        <input
                          type="email"
                          value={profile.email}
                          onChange={(e) =>
                            setProfile({ ...profile, email: e.target.value })
                          }
                          className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          value={profile.phone}
                          onChange={(e) =>
                            setProfile({ ...profile, phone: e.target.value })
                          }
                          className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Website
                        </label>
                        <input
                          type="url"
                          value={profile.website}
                          onChange={(e) =>
                            setProfile({ ...profile, website: e.target.value })
                          }
                          className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="https://"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Office Address
                        </label>
                        <textarea
                          value={profile.address}
                          onChange={(e) =>
                            setProfile({ ...profile, address: e.target.value })
                          }
                          rows={3}
                          className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Vision Highlights (Builder only) */}
                  {role === "builder" && (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                          <Star className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                          Vision Highlights
                        </h3>
                        <button
                          type="button"
                          onClick={() =>
                            setProfile({
                              ...profile,
                              visionHighlights: [
                                ...(profile.visionHighlights || []),
                                { title: "", subtitle: "", icon: "Star" },
                              ],
                            })
                          }
                          className="text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-lg font-medium transition-colors"
                        >
                          + Add Highlight
                        </button>
                      </div>
                      <div className="space-y-4">
                        {profile.visionHighlights?.map((highlight, index) => (
                          <div
                            key={index}
                            className="flex gap-4 items-start bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700"
                          >
                            <div className="flex-1 space-y-3">
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Title
                                  </label>
                                  <input
                                    type="text"
                                    value={highlight.title}
                                    onChange={(e) => {
                                      const newHighlights = [
                                        ...(profile.visionHighlights || []),
                                      ]
                                      newHighlights[index].title = e.target.value
                                      setProfile({
                                        ...profile,
                                        visionHighlights: newHighlights,
                                      })
                                    }}
                                    className="w-full px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="e.g. Legacy"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Icon
                                  </label>
                                  <select
                                    value={highlight.icon}
                                    onChange={(e) => {
                                      const newHighlights = [
                                        ...(profile.visionHighlights || []),
                                      ]
                                      newHighlights[index].icon = e.target.value
                                      setProfile({
                                        ...profile,
                                        visionHighlights: newHighlights,
                                      })
                                    }}
                                    className="w-full px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  >
                                    <option value="Star">Star</option>
                                    <option value="Award">Award</option>
                                    <option value="TrendingUp">Trending Up</option>
                                  </select>
                                </div>
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                                  Subtitle
                                </label>
                                <input
                                  type="text"
                                  value={highlight.subtitle}
                                  onChange={(e) => {
                                    const newHighlights = [
                                      ...(profile.visionHighlights || []),
                                    ]
                                    newHighlights[index].subtitle = e.target.value
                                    setProfile({
                                      ...profile,
                                      visionHighlights: newHighlights,
                                    })
                                  }}
                                  className="w-full px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  placeholder="e.g. Decades of trust"
                                />
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const newHighlights = [
                                  ...(profile.visionHighlights || []),
                                ]
                                newHighlights.splice(index, 1)
                                setProfile({
                                  ...profile,
                                  visionHighlights: newHighlights,
                                })
                              }}
                              className="mt-6 text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                        {(!profile.visionHighlights ||
                          profile.visionHighlights.length === 0) && (
                          <p className="text-sm text-slate-500 italic">
                            No highlights added yet.
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Awards & Recognition (Builder only) */}
                  {role === "builder" && (
                    <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                          <Award className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                          Awards & Recognition
                        </h3>
                        <button
                          type="button"
                          onClick={() =>
                            setProfile({
                              ...profile,
                              awards: [
                                ...(profile.awards || []),
                                { year: "", title: "", org: "" },
                              ],
                            })
                          }
                          className="text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-lg font-medium transition-colors"
                        >
                          + Add Award
                        </button>
                      </div>
                      <div className="space-y-4">
                        {profile.awards?.map((award, index) => (
                          <div
                            key={index}
                            className="flex gap-4 items-start bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700"
                          >
                            <div className="flex-1 space-y-3">
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Year
                                  </label>
                                  <input
                                    type="text"
                                    value={award.year}
                                    onChange={(e) => {
                                      const newAwards = [
                                        ...(profile.awards || []),
                                      ]
                                      newAwards[index].year = e.target.value
                                      setProfile({
                                        ...profile,
                                        awards: newAwards,
                                      })
                                    }}
                                    className="w-full px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="e.g. 2023"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Organization
                                  </label>
                                  <input
                                    type="text"
                                    value={award.org}
                                    onChange={(e) => {
                                      const newAwards = [
                                        ...(profile.awards || []),
                                      ]
                                      newAwards[index].org = e.target.value
                                      setProfile({
                                        ...profile,
                                        awards: newAwards,
                                      })
                                    }}
                                    className="w-full px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="e.g. Real Estate Awards"
                                  />
                                </div>
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                                  Title
                                </label>
                                <input
                                  type="text"
                                  value={award.title}
                                  onChange={(e) => {
                                    const newAwards = [
                                      ...(profile.awards || []),
                                    ]
                                    newAwards[index].title = e.target.value
                                    setProfile({
                                      ...profile,
                                      awards: newAwards,
                                    })
                                  }}
                                  className="w-full px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  placeholder="e.g. Best Developer of the Year"
                                />
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const newAwards = [...(profile.awards || [])]
                                newAwards.splice(index, 1)
                                setProfile({ ...profile, awards: newAwards })
                              }}
                              className="mt-6 text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                        {(!profile.awards || profile.awards.length === 0) && (
                          <p className="text-sm text-slate-500 italic">
                            No awards added yet.
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Save Profile Button */}
                  <div className="pt-6 border-t border-slate-200 dark:border-slate-800 mt-8 flex justify-end">
                    <button
                      onClick={onSaveProfile}
                      disabled={isSavingProfile}
                      className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSavingProfile ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" /> Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-5 w-5" /> Save Profile
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* System Preferences Content */}
        <TabsContent
          value="preferences"
          className="focus-visible:outline-none animate-in fade-in duration-300"
        >
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            {/* Appearance */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                  <Palette className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                Appearance
              </h3>
              <div className="pl-10">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                  Choose how Dashboard looks on your device.
                </p>
                <div className="grid grid-cols-3 gap-4">
                  <label className="cursor-pointer">
                    <input
                      type="radio"
                      name="theme"
                      value="light"
                      checked={theme === "light"}
                      onChange={() => onThemeChange("light")}
                      className="peer sr-only"
                    />
                    <div className="p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 peer-checked:border-blue-600 dark:peer-checked:border-blue-500 peer-checked:bg-blue-50 dark:peer-checked:bg-blue-900/20 transition-all text-center">
                      <div className="w-full h-20 bg-slate-100 rounded-lg mb-3 border border-slate-200 flex flex-col gap-2 p-2 overflow-hidden">
                        <div className="h-2 w-full bg-white rounded-full" />
                        <div className="h-2 w-2/3 bg-white rounded-full" />
                      </div>
                      <span className="font-medium text-slate-900 dark:text-white peer-checked:text-blue-700 dark:peer-checked:text-blue-400">
                        Light
                      </span>
                    </div>
                  </label>
                  <label className="cursor-pointer">
                    <input
                      type="radio"
                      name="theme"
                      value="dark"
                      checked={theme === "dark"}
                      onChange={() => onThemeChange("dark")}
                      className="peer sr-only"
                    />
                    <div className="p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 peer-checked:border-blue-600 dark:peer-checked:border-blue-500 peer-checked:bg-blue-50 dark:peer-checked:bg-blue-900/20 transition-all text-center">
                      <div className="w-full h-20 bg-slate-800 rounded-lg mb-3 border border-slate-700 flex flex-col gap-2 p-2 overflow-hidden">
                        <div className="h-2 w-full bg-slate-700 rounded-full" />
                        <div className="h-2 w-2/3 bg-slate-700 rounded-full" />
                      </div>
                      <span className="font-medium text-slate-900 dark:text-white peer-checked:text-blue-700 dark:peer-checked:text-blue-400">
                        Dark
                      </span>
                    </div>
                  </label>
                  <label className="cursor-pointer">
                    <input
                      type="radio"
                      name="theme"
                      value="system"
                      checked={theme === "system"}
                      onChange={() => onThemeChange("system")}
                      className="peer sr-only"
                    />
                    <div className="p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 peer-checked:border-blue-600 dark:peer-checked:border-blue-500 peer-checked:bg-blue-50 dark:peer-checked:bg-blue-900/20 transition-all text-center">
                      <div className="w-full h-20 bg-gradient-to-br from-slate-100 to-slate-800 rounded-lg mb-3 border border-slate-200 overflow-hidden relative">
                        <div className="absolute inset-y-0 left-0 w-1/2 bg-slate-100" />
                      </div>
                      <span className="font-medium text-slate-900 dark:text-white peer-checked:text-blue-700 dark:peer-checked:text-blue-400">
                        System
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Notifications */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <Bell className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                Notification Preferences
              </h3>
              <div className="pl-10 grid gap-4">
                {["Offer Expiry Reminders"].map((item) => {
                  const isOn = notifications[item] !== false
                  return (
                    <div
                      key={item}
                      className="flex items-center justify-between"
                    >
                      <span className="text-slate-700 dark:text-slate-300">
                        {item}
                      </span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={isOn}
                        onClick={() => onNotificationChange(item, !isOn)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                          isOn
                            ? "bg-blue-600"
                            : "bg-slate-200 dark:bg-slate-700"
                        }`}
                      >
                        <span
                          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                            isOn ? "translate-x-[22px]" : "translate-x-[2px]"
                          }`}
                        />
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Security */}
            <div className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                Security & Account
              </h3>
              <div className="pl-10 space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Lock className="h-5 w-5 text-slate-500" />
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">
                        Password
                      </p>
                      <p className="text-xs text-slate-500">
                        Protect your account with a secure password
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsChangingPassword(true)}
                    className="text-sm px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    Change
                  </button>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* About Platform Content */}
        <TabsContent
          value="about"
          className="focus-visible:outline-none animate-in fade-in duration-300"
        >
          <div className="space-y-6">

            {/* Partner Commitment & Zero-Risk Manifesto Banner */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 p-7 sm:p-9 text-white border border-blue-500/20 shadow-2xl">
              {/* Decorative radial gradients */}
              <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

              <div className="relative z-10 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs uppercase tracking-widest font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                      Zero-Risk · Pure Performance Partnership
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-blue-200/80 bg-white/10 px-3 py-1 rounded-full">
                    Astronix OS v2.4
                  </span>
                </div>

                <div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2">
                    {role === "mandate" ? "Dear Mandate Partner," : "Dear Builder Partner,"}
                  </h2>
                  <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-4xl">
                    Astronix Realty ke zariye hum aapko <strong className="text-white">Advanced Leads CRM</strong>, <strong className="text-white">Real-Time Inventory Management</strong> aur aapke brand ka ek <strong className="text-white">Dedicated Public Landing Page</strong> 100% FREE provide kar rahe hain. Digital marketing aur ad campaigns ka poora kharcha hum khud uthate hain — aapse upfront ₹1 bhi charge nahi kiya jata!
                  </p>
                </div>

                {/* Highlight Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                    <p className="text-xs text-slate-400 font-medium">Software License</p>
                    <p className="text-lg font-bold text-emerald-400 mt-0.5">₹0 / Lifetime Free</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                    <p className="text-xs text-slate-400 font-medium">Marketing & Ads</p>
                    <p className="text-lg font-bold text-emerald-400 mt-0.5">₹0 (100% We Fund)</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                    <p className="text-xs text-slate-400 font-medium">Company Landing Page</p>
                    <p className="text-lg font-bold text-blue-400 mt-0.5">Auto-Created Free</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                    <p className="text-xs text-slate-400 font-medium">Buyer Gift Perks</p>
                    <p className="text-lg font-bold text-purple-400 mt-0.5">₹50K Voucher + 500 Pts</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                    <p className="text-xs text-slate-400 font-medium">Service Charge</p>
                    <p className="text-lg font-bold text-amber-400 mt-0.5">Standard CP % Only</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 4 Core Value Pillars */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Pillar 1: CRM & Inventory */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover:border-blue-300 dark:hover:border-blue-700 transition-all">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 flex-shrink-0">
                    <Laptop className="h-6 w-6" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded">
                        100% Free Tools
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Leads CRM & Real-Time Inventory Management
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      Hum aapko enterprise-grade CRM dete hain jahan aapke saare leads ka status, pipeline, call logs, WhatsApp reminders, aur BHK inventory status (available, reserved, sold) ek single centralized dashboard se manage hota hai. Koi annual maintenance ya user fee nahi.
                    </p>
                    <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-1.5 pt-1">
                      <li className="flex items-center gap-2">
                        <Check className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                        <span>Real-time unit availability & pricing matrix</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                        <span>Lead status tracking with smart follow-up reminders</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Pillar 2: Dedicated Landing Page */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-700 transition-all">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 flex-shrink-0">
                    <Globe className="h-6 w-6" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded">
                        Automatic Micro-Site
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Aapki Company Ka Dedicated Landing Page
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      Jab aap yahan register aur login karte hain, to aapki company ka ek complete public landing page ban jata hai. Jahan aapke company profile, RERA certificate, aur aapke sabhi project details showcase hote hain jahan se verified visitors direct aapko contact karte hain.
                    </p>
                    <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-1.5 pt-1">
                      <li className="flex items-center gap-2">
                        <Check className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                        <span>High-converting project brochures & floor plan showcase</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                        <span>Direct organic lead generation straight to your CRM</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Pillar 3: Zero-Cost Marketing */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover:border-emerald-300 dark:hover:border-emerald-700 transition-all">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                    <Megaphone className="h-6 w-6" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded">
                        100% We Fund It
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Zero Marketing Cost · Saara Kharcha Hamara
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      Marketing ke liye hum aapse ek bhi rupya nahi lete! Meta Ads (Facebook/Instagram), Google Search Ads aur portal campaigns ka saara kharcha Astronix Realty khud uthata hai. Aapko marketing budget ka koi tension nahi lena.
                    </p>
                    <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-1.5 pt-1">
                      <li className="flex items-center gap-2">
                        <Check className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                        <span>Targeted digital campaigns funded by Astronix Realty</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                        <span>Only high-intent, phone & email verified leads delivered</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Pillar 4: Pure Performance / CP % */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover:border-amber-300 dark:hover:border-amber-700 transition-all">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-amber-600 dark:text-amber-400 flex-shrink-0">
                    <BadgePercent className="h-6 w-6" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded">
                        Pay Only On Result
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Pay Standard CP % Only When Booking Happens
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      Aapko sirf leads ka follow-up lena hota hai aur customer ko site visit karani hoti hai. Hum apna standard service charge (same as Channel Partner / CP %) sirf tabhi lete hain jab customer booking confirm karta hai. Koi booking nahi = Koi charge nahi!
                    </p>
                    <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-1.5 pt-1">
                      <li className="flex items-center gap-2">
                        <Check className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                        <span>100% win-win: Hum tabhi kamate hain jab aapki unit bikti hai</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                        <span>Transparent commission agreement, same as standard CP terms</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

            </div>

            {/* Exclusive Buyer Incentives Funded by Astronix (SBSCAI Tie-up & Reward Points) */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500/10 via-purple-500/5 to-blue-500/10 border-2 border-amber-500/30 dark:border-amber-400/20 p-6 sm:p-8 shadow-md">
              {/* Decorative background glow */}
              <div className="absolute top-0 right-0 -mr-12 -mt-12 w-64 h-64 rounded-full bg-amber-400/10 blur-2xl pointer-events-none" />

              <div className="relative z-10 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-200/60 dark:border-amber-800/40 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="flex h-2 w-2 rounded-full bg-amber-500" />
                      <span className="text-[11px] font-extrabold uppercase tracking-widest text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/40 px-2.5 py-0.5 rounded-full">
                        100% Funded By Astronix · Zero Cost To You
                      </span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                      Aapke Offers Ke Alawa — Har Buyer Ko Astronix Ki Taraf Se Exclusive Perks! 🎁
                    </h3>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-200 bg-amber-100 dark:bg-amber-900/60 border border-amber-300 dark:border-amber-700 px-3 py-1.5 rounded-xl flex-shrink-0">
                    <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    Deal Closing Accelerator
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-4xl">
                  Aapke project ke discounts aur payment plans to rahenge hi, sath hi har customer ko jo <strong className="text-slate-900 dark:text-white">Astronix Realty ke through aap se property buy karta hai</strong>, hum apni taraf se yeh high-value rewards dete hain — jisse buyer ka decision fast hota hai aur aapki deal spot par close hoti hai:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Perk 1: SBSCAI Interior Voucher */}
                  <div className="bg-white dark:bg-slate-900 rounded-xl border border-amber-200 dark:border-amber-800/80 p-5 shadow-sm relative overflow-hidden flex flex-col justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white font-bold flex-shrink-0 shadow-md">
                        <Gift className="h-6 w-6" />
                      </div>
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                            Official SBSCAI Tie-Up
                          </span>
                          <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                            ₹50,000 Free
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-slate-900 dark:text-white">
                          ₹50,000 Guaranteed Interior Design Voucher
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                          Humne leading home interior company <strong className="text-slate-800 dark:text-slate-200">SBSCAI</strong> ke sath official tie-up kiya hua hai. Har buyer ko Astronix ke through property buy karne par <strong>₹50,000 ka Interior Voucher</strong> milta hai, jise wo new flat/villa ke modular woodwork, false ceiling, lighting aur design execution me use kar sakte hain.
                        </p>
                      </div>
                    </div>
                    <div className="bg-amber-50/70 dark:bg-amber-950/30 rounded-lg p-2.5 border border-amber-100 dark:border-amber-900/50 mt-3">
                      <p className="text-[11px] font-medium text-amber-800 dark:text-amber-300">
                        ✨ <strong>{role === "mandate" ? "Exclusive Agency Advantage:" : "Developer & Builder Advantage:"}</strong> Iska ₹1 bhi aapse nahi liya jata. Buyer ko extra ₹50k benefit dikhta hai jisse objection handling aasan hoti hai!
                      </p>
                    </div>
                  </div>

                  {/* Perk 2: 500 Reward Points */}
                  <div className="bg-white dark:bg-slate-900 rounded-xl border border-purple-200 dark:border-purple-800/80 p-5 shadow-sm relative overflow-hidden flex flex-col justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold flex-shrink-0 shadow-md">
                        <Coins className="h-6 w-6" />
                      </div>
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-bold text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 px-2 py-0.5 rounded border border-purple-200 dark:border-purple-800">
                            Astronix Club Rewards
                          </span>
                          <span className="text-base font-black text-purple-600 dark:text-purple-400">
                            500 Points
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-slate-900 dark:text-white">
                          500 Reward Points for Home Furniture & Services
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                          Har confirmed purchase ke sath customer ke wallet me <strong className="text-slate-800 dark:text-slate-200">500 Reward Points</strong> credit hote hain, jinhe wo apne ghar ke basic setup ke liye items aur moving services me redeem kar sakte hain:
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-700 dark:text-slate-300 pt-1">
                          <div className="flex items-start gap-1.5 bg-purple-50/50 dark:bg-purple-950/20 p-2 rounded-lg border border-purple-100 dark:border-purple-900/40">
                            <Check className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
                            <span><strong>Basic Furniture:</strong> Sofa sets, center tables, study desk & home decor</span>
                          </div>
                          <div className="flex items-start gap-1.5 bg-purple-50/50 dark:bg-purple-950/20 p-2 rounded-lg border border-purple-100 dark:border-purple-900/40">
                            <Check className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
                            <span><strong>Home Services:</strong> Home Deep Cleaning, Pest Control & Move-In Setup</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-purple-50/70 dark:bg-purple-950/30 rounded-lg p-2.5 border border-purple-100 dark:border-purple-900/50 mt-3">
                      <p className="text-[11px] font-medium text-purple-800 dark:text-purple-300">
                        🛋️ <strong>Move-in Ready Experience:</strong> Buyer ko sofa aur deep cleaning milne se word-of-mouth aur referral bookings 3x badhti hain!
                      </p>
                    </div>
                  </div>
                </div>

                {/* Sales Closer Tip Box */}
                <div className="bg-slate-900 text-white rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-slate-700 shadow-sm">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Zap className="h-3.5 w-3.5" /> Sales Conversion Pitch for Your Calling & Site-Visit Team
                    </p>
                    <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                      Jab buyer price negotiation ya token booking me hichkicha raha ho, to aapki team direct bol sakti hai: <em>"Sir/Ma'am, {role === "mandate" ? "agency ke exclusive direct project offer" : "builder ke direct price offer"} ke sath aapko Astronix Realty se ₹50,000 ka SBSCAI Interior Voucher + 500 Reward Points (Sofa / Deep Cleaning) bhi complimentary mil rahe hain!"</em> — isse deal spot par close hoti hai.
                    </p>
                  </div>
                  <div className="flex-shrink-0 self-start sm:self-center">
                    <span className="text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1.5 rounded-lg inline-block">
                      +35% Faster Site Visit Closings
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Exclusive Builder Feature: Digital Mandate Partnership */}
            {role === "builder" && (
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-950 via-slate-900 to-indigo-950 text-white p-6 sm:p-8 border border-blue-500/30 shadow-xl space-y-6">
                {/* Decorative glows */}
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-72 h-72 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-72 h-72 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />

                <div className="relative z-10 space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
                    <div className="flex items-center gap-2">
                      <span className="flex h-2 w-2 rounded-full bg-blue-400 animate-ping" />
                      <span className="text-[11px] font-extrabold uppercase tracking-widest text-blue-300 bg-blue-500/20 border border-blue-400/30 px-3 py-1 rounded-full">
                        Exclusive Sales Service for Builders
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                      Zero Fixed Cost · No Retainers
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-2">
                      Sir, Aap Chahein Toh Apne Project Ki Sales Humein As A "Digital Mandate Partner" De Sakte Hain! 🤝
                    </h3>
                    <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-4xl">
                      Traditional offline agencies ki tarah hume aapse koi office, physical lounge ya heavy mandate percentage nahi chahiye. Hum aapke project ke <strong className="text-white">Dedicated Digital Mandate Partner</strong> ban kar end-to-end sales drive karte hain — jahan aapko bas project ke targeted ad campaigns ke liye thoda marketing budget allot karna hota hai, aur booking hone par <strong className="text-emerald-400">sirf standard CP %</strong> hi dena hota hai!
                    </p>
                  </div>

                  {/* 4 Pillars of Digital Mandate */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
                    {/* Pillar 1: No Office Overhead */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 sm:p-5 hover:bg-white/10 transition-colors">
                      <div className="w-10 h-10 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold mb-3 border border-blue-500/30">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <h4 className="font-bold text-sm text-white mb-1.5">
                        Zero Office & Setup Cost
                      </h4>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Aapko hume koi site office, sales gallery ya reception staff provide karne ki bilkul zaroorat nahi hai. Hum poori pipeline digitally execute karte hain.
                      </p>
                    </div>

                    {/* Pillar 2: Actual Sales Price Transparency */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 sm:p-5 hover:bg-white/10 transition-colors">
                      <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold mb-3 border border-emerald-500/30">
                        <Target className="h-5 w-5" />
                      </div>
                      <h4 className="font-bold text-sm text-white mb-1.5">
                        Bas Actual Sales Price Share Karein
                      </h4>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Aapko bas apna actual bottom sales price hamare sath share karna hota hai, jisse hum serious buyers ko transparent deals dekar negotiations fast close kar sakein.
                      </p>
                    </div>

                    {/* Pillar 3: Dedicated Marketing Budget for Campaigns */}
                    <div className="bg-white/5 border border-purple-500/30 bg-purple-950/20 rounded-xl p-4 sm:p-5 hover:bg-purple-950/40 transition-colors">
                      <div className="w-10 h-10 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold mb-3 border border-purple-500/30">
                        <Megaphone className="h-5 w-5" />
                      </div>
                      <h4 className="font-bold text-sm text-white mb-1.5">
                        Campaign Budget Allot Karein
                      </h4>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        As a mandate dene par, bas aapko thoda marketing budget allot karna hota hai jisse hum aapke specific project ke liye targeted Meta & Google ad campaigns aggressively run kar sakein.
                      </p>
                    </div>

                    {/* Pillar 4: No Heavy Mandate % - Only Standard CP % */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 sm:p-5 hover:bg-white/10 transition-colors">
                      <div className="w-10 h-10 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold mb-3 border border-amber-500/30">
                        <BadgePercent className="h-5 w-5" />
                      </div>
                      <h4 className="font-bold text-sm text-white mb-1.5">
                        No Heavy Mandate Fee (Only CP %)
                      </h4>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Offline agencies 4%–6%+ heavy commission aur fixed monthly charges leti hain. Hamare sath mandate ke itna heavy % nahi, <strong>sirf standard CP %</strong> hi dena hota hai!
                      </p>
                    </div>
                  </div>

                  {/* Partnership CTA Banner */}
                  <div className="bg-white/5 border border-blue-500/30 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-blue-400" /> Want Us To Handle Your Project Sales?
                      </p>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Agar aap apne existing ya upcoming project ka complete digital sales mandate hamare sath activate karna chahte hain, to hamari partnership desk se connect karein.
                      </p>
                    </div>
                    <div className="flex-shrink-0 flex items-center gap-3">
                      <a
                        href="tel:+918657225993"
                        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition-all active:scale-95"
                      >
                        <PhoneCall className="h-3.5 w-3.5" /> Call Sales Desk
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Exclusive Builder Feature: Interior & Civil Work Contracting */}
            {role === "builder" && (
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-stone-900 to-amber-950 text-white p-6 sm:p-8 border border-amber-500/30 shadow-xl space-y-6">
                {/* Decorative glows */}
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-72 h-72 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-72 h-72 rounded-full bg-orange-500/10 blur-3xl pointer-events-none" />

                <div className="relative z-10 space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
                    <div className="flex items-center gap-2">
                      <HardHat className="h-4 w-4 text-amber-400" />
                      <span className="text-[11px] font-extrabold uppercase tracking-widest text-amber-300 bg-amber-500/20 border border-amber-400/30 px-3 py-1 rounded-full">
                        Builder Contracting Services
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-amber-300 bg-white/10 px-3 py-1 rounded-full">
                      Turnkey Civil & Interior Execution
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-2">
                      Project Interior & Civil Work Contracting Services 🏗️
                    </h3>
                    <p className="text-stone-300 text-xs sm:text-sm leading-relaxed max-w-4xl">
                      Sir, sales aur marketing ke alawa hum aapke projects ke liye <strong className="text-white">Interior & Civil Work Contracting</strong> bhi provide karte hain. Aap kam se kam apne project ke liye humse ek baar <strong className="text-amber-400">Quotation le kar dekhiye</strong> — bahar ke open market rates aur hamari finishing quality mein aapko seedha fark dikhega!
                    </p>
                  </div>

                  {/* Works We Cover */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-3 flex items-center gap-1.5">
                      <Hammer className="h-3.5 w-3.5" /> Scope of Work / Hum Yeh Kaam Handle Karte Hain:
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <div className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors">
                        <p className="text-sm font-bold text-white mb-1">🧱 Tiles & Flooring</p>
                        <p className="text-xs text-stone-300 leading-relaxed">Vitrified, ceramic, anti-skid tiling, laser alignment & precision skirting.</p>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors">
                        <p className="text-sm font-bold text-white mb-1">🍳 Kitchen Platform</p>
                        <p className="text-xs text-stone-300 leading-relaxed">Granite & quartz platforms, sink fixing, dado tile fittings & modular base.</p>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors">
                        <p className="text-sm font-bold text-white mb-1">🚿 Plumbing & Sanitary</p>
                        <p className="text-xs text-stone-300 leading-relaxed">Concealed CPVC/UPVC piping, drainage, premium CP fittings & pressure testing.</p>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors">
                        <p className="text-sm font-bold text-white mb-1">🪨 Stone & Marble Work</p>
                        <p className="text-xs text-stone-300 leading-relaxed">Granite door/window jambs, stone cladding, staircase treads & threshold borders.</p>
                      </div>
                    </div>
                  </div>

                  {/* 6 Months Notice & Timeline Requirement Box */}
                  <div className="bg-amber-950/40 border border-amber-500/40 rounded-xl p-5 space-y-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-amber-400" />
                      <h4 className="text-xs sm:text-sm font-bold text-amber-300 uppercase tracking-wide">
                        Important Planning Requirement: 6 Months Advance Notice
                      </h4>
                    </div>
                    <p className="text-xs text-stone-300 leading-relaxed">
                      Kaam start hone se kam se kam <strong className="text-white">6 Months pehle</strong> hume inform karna hoga ki aapko quotation chahiye. Agar hamara quotation pass hota hai, toh raw material procurement, skilled manpower allocation aur high-standard quality arrangements ke liye enough preparation time mil sake.
                    </p>
                    <p className="text-xs text-stone-300 leading-relaxed">
                      Sath hi, aapko apna target project completion timeline bhi specify karna hoga ki <strong className="text-white">aapko kab tak kaam complete chahiye</strong>, taaki hum committed delivery schedule ke sath work execute kar sakein.
                    </p>
                  </div>

                  {/* Request Quote CTA */}
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-amber-400" /> Compare Rates for Your Project
                      </p>
                      <p className="text-xs text-stone-300 leading-relaxed">
                        Apne upcoming tower ya floor ke tiles, kitchen platform, plumbing ya stone work ke liye quotation mangwayein.
                      </p>
                    </div>
                    <div className="flex-shrink-0 flex items-center gap-3">
                      <a
                        href="tel:+918657225993"
                        className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition-all active:scale-95"
                      >
                        <PhoneCall className="h-3.5 w-3.5" /> Request Work Quotation
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* How It Works: 3-Step Simple Process */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <Target className="h-4 w-4" />
                </div>
                How The Partnership Works — 3 Simple Steps
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 relative">
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/40 px-2 py-0.5 rounded">Step 01</span>
                  <h4 className="font-semibold text-sm text-slate-900 dark:text-white mt-2">Publish Projects & Inventory</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Aapke company & project details publish hote hi aapka public landing page live ho jata hai.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 relative">
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/40 px-2 py-0.5 rounded">Step 02</span>
                  <h4 className="font-semibold text-sm text-slate-900 dark:text-white mt-2">We Run Free Ads & Send Leads</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Astronix marketing fund se campaigns run karta hai aur verified buyers direct aapke CRM me deliver hote hain.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 relative">
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 rounded">Step 03</span>
                  <h4 className="font-semibold text-sm text-slate-900 dark:text-white mt-2">Follow Up & Close Booking</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Aapki team site visit aur closing karti hai. Booking confirm hone par standard CP service charge share hota hai.
                  </p>
                </div>
              </div>
            </div>

            {/* Future Vision & ERP Roadmap */}
            <div className="rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-gradient-to-r from-indigo-50 via-blue-50 to-purple-50 dark:from-indigo-950/30 dark:via-blue-950/20 dark:to-purple-950/30 p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
                      Future Roadmap · Coming Soon
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Transitioning to a Full-Fledged Real Estate Management Operating System (ERP)
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
                    Aane wale samay mein Astronix OS ko hum poori tarah se ek complete <strong>Real Estate Management App & ERP</strong> me convert kar rahe hain. Jisme digital agreements, automated CP commission escrow, buyer credit pre-approval, 3D interactive floor plans aur AI buyer matching shamil hoga — sabhi ek single touchpoint par.
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-indigo-600 text-white px-3.5 py-2 rounded-lg shadow-sm">
                    In Active Development <Rocket className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
            </div>

            {/* Platform Modules */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-5 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                  <Layers className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                </div>
                Platform Modules & Capabilities
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-0 sm:pl-10">
                {(role === "mandate" ? [
                  { title: "Mandate Agency OS", desc: "CRM, leads, agency client portfolios & inventory tracking" },
                  { title: "Exclusive Project Showcase", desc: "Dedicated landing pages with RERA verified credentials" },
                  { title: "Visitor Portal", desc: "Property discovery, maps, EMI calculator & enquiries" },
                  { title: "Astronix Leads (CRM)", desc: "Lead pipeline, follow-ups, status tracking & reminders" },
                  { title: "Meta Ads & Boost Studio", desc: "AI-powered ad campaigns & property promotions" },
                  { title: "Document Vault", desc: "Legal docs, RERA certificates, agreements & brochures" },
                  { title: "Blog Studio", desc: "Content creation & SEO publishing for real estate" },
                  { title: "Team Console", desc: "Multi-user roles, permissions & workspace management" },
                ] : [
                  { title: "Builder Studio & Dashboard", desc: "List, manage & publish properties with full media control" },
                  { title: "Real-Time Inventory Matrix", desc: "Track unit availability, floor plans & tower pricing" },
                  { title: "Visitor Portal", desc: "Property discovery, maps, EMI calculator & enquiries" },
                  { title: "Astronix Leads (CRM)", desc: "Lead pipeline, follow-ups, status tracking & reminders" },
                  { title: "Meta Ads & Boost Studio", desc: "AI-powered ad campaigns & property promotions" },
                  { title: "Document Vault", desc: "Legal docs, RERA certificates, agreements & brochures" },
                  { title: "Blog Studio", desc: "Content creation & SEO publishing for real estate" },
                  { title: "Team Console", desc: "Multi-user roles, permissions & workspace management" },
                ]).map(({ title, desc }) => (
                  <div key={title} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Version & Support */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                  <Info className="h-4 w-4 text-slate-400" />
                  Version Info
                </h3>
                <div className="space-y-2.5">
                  {[
                    { label: "Platform", value: "Astronix OS" },
                    { label: "Version", value: "v2.4.0" },
                    { label: "Engine", value: "Live Engine · Next.js 16" },
                    { label: "Region", value: "India (IN)" },
                    { label: "Last Updated", value: "October 2026" },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between text-sm">
                      <span className="text-slate-500 dark:text-slate-400">{label}</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                  <HeartHandshake className="h-4 w-4 text-slate-400" />
                  Support & Partnership Helpline
                </h3>
                <div className="space-y-3">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {role === "mandate"
                      ? "For agency onboarding, mandate partnerships, or technical support:"
                      : "For builder onboarding, developer partnerships, or technical support:"}
                  </p>
                  <div className="space-y-2">
                    {[
                      { label: "Email", value: "support@astronixrealty.com" },
                      { label: "Website", value: "www.astronixrealty.com" },
                      { label: "Helpline", value: "+91 86572 25993" },
                      { label: "Hours", value: "Mon–Sat, 9am–7pm IST" },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex justify-between text-sm">
                        <span className="text-slate-500 dark:text-slate-400">{label}</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </TabsContent>
      </Tabs>

      {/* Password Change Modal */}
      {isChangingPassword && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Change Password
              </h3>
              <button
                onClick={() => {
                  setIsChangingPassword(false)
                  setPasswordData({
                    otp: "",
                    newPassword: "",
                    confirmPassword: "",
                  })
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {!otpSent ? (
              <div className="p-6 text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
                  <Mail className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h4 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Verify Your Identity
                </h4>
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  We'll send a 6-digit OTP to your registered email address to
                  verify it's you before changing your password.
                </p>
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={sendingOtp}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-xl transition-all shadow-sm shadow-blue-500/20 disabled:opacity-70 flex justify-center items-center gap-2 mt-4"
                >
                  {sendingOtp ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Sending OTP...
                    </>
                  ) : (
                    "Send OTP to Email"
                  )}
                </button>
              </div>
            ) : (
              <form onSubmit={handlePasswordChange} className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Enter 6-digit OTP
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={passwordData.otp}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, otp: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all tracking-widest"
                    placeholder="123456"
                  />
                </div>
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        newPassword: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder="Min 8 characters"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        confirmPassword: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder="••••••••"
                  />
                </div>
                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsChangingPassword(false)
                    }}
                    className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-xl transition-all shadow-sm shadow-blue-500/20 font-medium disabled:opacity-70 flex justify-center items-center gap-2"
                  >
                    {isSavingProfile ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      "Update Password"
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
