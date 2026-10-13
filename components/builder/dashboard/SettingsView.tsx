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
    <div className="max-w-6xl mx-auto">
      <Tabs
        value={activeSettingsTab}
        onValueChange={(val: any) => setActiveSettingsTab(val)}
        className="space-y-6"
      >
        <TabsList className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-full md:w-auto inline-flex">
          <TabsTrigger
            value="profile"
            className="flex-1 md:w-48 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:shadow-sm px-4 py-2"
          >
            {role === "mandate" ? "Mandate Profile" : "Builder Profile"}
          </TabsTrigger>
          <TabsTrigger
            value="preferences"
            className="flex-1 md:w-48 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:shadow-sm px-4 py-2"
          >
            System Preferences
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
