"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Users, Search, Filter, Phone, Mail, MoreHorizontal, CheckCircle2, XCircle, Shield, Briefcase, Plus, TrendingUp, DollarSign
} from "lucide-react"

// Types
type Role = "Admin" | "Manager" | "Sales Executive" | "Accounts"
interface TeamMember {
    id: number
    name: string
    role: Role
    email: string
    phone: string
    status: "Active" | "Inactive" | "On Leave"
    performance: {
        sales: number
        calls: number
        conversion: string
    }
    avatar?: string
}

// Mock Data
const TEAM_MEMBERS: TeamMember[] = [
    {
        id: 1, name: "Suresh Kumar", role: "Sales Executive", email: "suresh.k@astronix.com", phone: "+91 98765 00001",
        status: "Active", performance: { sales: 12, calls: 450, conversion: "15%" }, avatar: "SK"
    },
    {
        id: 2, name: "Ramesh Singh", role: "Sales Executive", email: "ramesh.s@astronix.com", phone: "+91 98765 00002",
        status: "Active", performance: { sales: 8, calls: 320, conversion: "12%" }, avatar: "RS"
    },
    {
        id: 3, name: "Mahesh Verma", role: "Manager", email: "mahesh.v@astronix.com", phone: "+91 98765 00003",
        status: "Active", performance: { sales: 25, calls: 120, conversion: "22%" }, avatar: "MV"
    },
    {
        id: 4, name: "Anita Desai", role: "Accounts", email: "anita.d@astronix.com", phone: "+91 98765 00004",
        status: "On Leave", performance: { sales: 0, calls: 0, conversion: "N/A" }, avatar: "AD"
    },
    {
        id: 5, name: "Vikram Malhotra", role: "Sales Executive", email: "vikram.m@astronix.com", phone: "+91 88776 65544",
        status: "Inactive", performance: { sales: 2, calls: 50, conversion: "5%" }, avatar: "VM"
    }
]

export function TeamView() {
    const [searchTerm, setSearchTerm] = useState("")
    const [roleFilter, setRoleFilter] = useState("All")

    const filteredTeam = TEAM_MEMBERS.filter(member =>
        (roleFilter === "All" || member.role === roleFilter) &&
        (member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            member.email.toLowerCase().includes(searchTerm.toLowerCase()))
    )

    const getRoleBadge = (role: Role) => {
        switch (role) {
            case "Admin": return "bg-red-100 text-red-700 dark:bg-red-900/30"
            case "Manager": return "bg-purple-100 text-purple-700 dark:bg-purple-900/30"
            case "Sales Executive": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30"
            case "Accounts": return "bg-green-100 text-green-700 dark:bg-green-900/30"
            default: return "bg-slate-100 text-slate-700"
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Team Management</h2>
                    <p className="text-muted-foreground">Manage access and track performance of your staff.</p>
                </div>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                    <Plus className="h-4 w-4" /> Add Member
                </Button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4 flex items-center gap-4 border-slate-200 dark:border-slate-800">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                        <Users className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Total Staff</p>
                        <h3 className="text-2xl font-bold">{TEAM_MEMBERS.length}</h3>
                    </div>
                </Card>
                <Card className="p-4 flex items-center gap-4 border-slate-200 dark:border-slate-800">
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                        <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Active Members</p>
                        <h3 className="text-2xl font-bold">{TEAM_MEMBERS.filter(m => m.status === 'Active').length}</h3>
                    </div>
                </Card>
                <Card className="p-4 flex items-center gap-4 border-slate-200 dark:border-slate-800">
                    <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                        <TrendingUp className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Team Sales (Feb)</p>
                        <h3 className="text-2xl font-bold">₹ 4.5 Cr</h3>
                    </div>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name or email..."
                        className="pl-9 bg-white dark:bg-slate-900"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    {['All', 'Manager', 'Sales Executive', 'Accounts'].map(role => (
                        <Button
                            key={role}
                            variant={roleFilter === role ? "secondary" : "outline"}
                            size="sm"
                            onClick={() => setRoleFilter(role)}
                        >
                            {role}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Staff Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTeam.map(member => (
                    <Card key={member.id} className="overflow-hidden hover:shadow-md transition-shadow border-slate-200 dark:border-slate-800">
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-12 w-12 border-2 border-white dark:border-slate-900 shadow-sm">
                                        <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white font-bold">
                                            {member.avatar}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h3 className="font-bold text-slate-900 dark:text-white">{member.name}</h3>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 ${getRoleBadge(member.role)}`}>
                                                {member.role}
                                            </Badge>
                                            {member.status === 'Inactive' && <span className="text-[10px] text-red-500 font-medium">● Inactive</span>}
                                            {member.status === 'On Leave' && <span className="text-[10px] text-amber-500 font-medium">● On Leave</span>}
                                        </div>
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div className="flex flex-col gap-1 p-2 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                                        <span className="text-muted-foreground text-xs flex items-center gap-1"><Phone className="h-3 w-3" /> Contact</span>
                                        <span className="font-medium truncate" title={member.phone}>{member.phone}</span>
                                    </div>
                                    <div className="flex flex-col gap-1 p-2 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                                        <span className="text-muted-foreground text-xs flex items-center gap-1"><Mail className="h-3 w-3" /> Email</span>
                                        <span className="font-medium truncate" title={member.email}>{member.email.split('@')[0]}</span>
                                    </div>
                                </div>

                                {/* Performance Mini-Dashboard */}
                                {member.role === 'Sales Executive' || member.role === 'Manager' ? (
                                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                                        <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Performance (This Month)</p>
                                        <div className="grid grid-cols-3 gap-2 text-center">
                                            <div>
                                                <p className="text-lg font-bold text-slate-900 dark:text-white">{member.performance.sales}</p>
                                                <p className="text-[10px] text-muted-foreground">Sales</p>
                                            </div>
                                            <div>
                                                <p className="text-lg font-bold text-slate-900 dark:text-white">{member.performance.calls}</p>
                                                <p className="text-[10px] text-muted-foreground">Calls</p>
                                            </div>
                                            <div>
                                                <p className="text-lg font-bold text-green-600 dark:text-green-400">{member.performance.conversion}</p>
                                                <p className="text-[10px] text-muted-foreground">Conv. Rate</p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center h-[88px] text-muted-foreground text-sm italic">
                                        Administrative Role
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-3 flex gap-2 border-t border-slate-100 dark:border-slate-800">
                            <Button variant="outline" size="sm" className="flex-1 text-xs h-8">View Reports</Button>
                            <Button variant="outline" size="sm" className="flex-1 text-xs h-8">Edit Access</Button>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    )
}
