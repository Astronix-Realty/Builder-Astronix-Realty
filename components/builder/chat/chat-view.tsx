"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import {
    Search, Send, MoreVertical, Phone, Video, Paperclip,
    CheckCheck, MessageSquare, RefreshCw, Pin, Circle, Users, Building, Building2,
    Mail, ExternalLink, ShieldCheck, UserCheck, MessageCircle, ArrowRight, User, Info, Check
} from "lucide-react"

interface Message {
    _id?: string
    text: string
    sender: "agent" | "lead" | "user" | "buyer"
    senderId?: string
    senderRole?: string
    senderName?: string
    senderAvatar?: string
    senderPhoto?: string
    createdAt?: string
}

interface Participant {
    userId: string
    role: string
    name: string
    phone?: string
    email?: string
    avatar?: string
    photo?: string
    username?: string
}

interface Conversation {
    _id: string
    leadId?: string
    leadName?: string
    leadPhone?: string
    conversationType?: "GROUP" | "DIRECT" | "SUPPORT"
    groupPoolKey?: string
    poolRootPropertyId?: string
    poolRootPropertyName?: string
    poolRootPropertyThumbnail?: string
    propertyImage?: string
    memberUserId?: string
    memberAvatar?: string
    senderAvatar?: string
    photo?: string
    memberUsername?: string
    assignee?: string
    lastMessage?: string
    lastMessageAt?: string
    unreadCount: number
    isPinned: boolean
    messages?: Message[]
    leadType?: string
    parentGroupName?: string
    participants?: Participant[]
}

interface MemberProfileData {
    userId?: string
    name: string
    avatar?: string
    photo?: string
    username?: string
    phone?: string
    email?: string
    poolName?: string
    leadId?: string
    groupPoolKey?: string
    role?: string
}

// --- Skeleton Loader ---
const ConversationSkeleton = () => (
    <div className="p-4 flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-3 w-44" />
        </div>
    </div>
)

const MessageSkeleton = () => (
    <div className="flex gap-3 p-2">
        <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
        <Skeleton className="h-14 w-56 rounded-2xl" />
    </div>
)

export function ChatView() {
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [selectedConv, setSelectedConv] = useState<Conversation | null>(null)
    const [messages, setMessages] = useState<Message[]>([])
    const [newMessage, setNewMessage] = useState("")
    const [isLoadingConvs, setIsLoadingConvs] = useState(true)
    const [isLoadingMsgs, setIsLoadingMsgs] = useState(false)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [isSending, setIsSending] = useState(false)
    const [categoryFilter, setCategoryFilter] = useState<'all' | 'group' | 'direct' | 'leads'>('all')
    const [searchQuery, setSearchQuery] = useState("")
    
    // WhatsApp Profile & Group Info Modals State
    const [selectedMemberProfile, setSelectedMemberProfile] = useState<MemberProfileData | null>(null)
    const [showMemberProfileModal, setShowMemberProfileModal] = useState(false)
    const [showGroupInfoModal, setShowGroupInfoModal] = useState(false)
    const [groupParticipants, setGroupParticipants] = useState<Participant[]>([])

    const messagesContainerRef = useRef<HTMLDivElement>(null)
    const prevMessagesCountRef = useRef<number>(0)
    const inputRef = useRef<HTMLInputElement>(null)
    const activeConvIdRef = useRef<string | null>(null)

    const searchParams = useSearchParams()
    const chatWith = searchParams.get("chatWith")
    const memberId = searchParams.get("memberId")
    const chatType = searchParams.get("type") // "group" | "direct"

    // Keep ref in sync
    useEffect(() => {
        activeConvIdRef.current = selectedConv?._id || null
    }, [selectedConv])

    // Auto-scroll inside chat container
    const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
        if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTo({
                top: messagesContainerRef.current.scrollHeight,
                behavior
            })
        }
    }, [])

    useEffect(() => {
        if (messages.length > 0) {
            const isFirst = prevMessagesCountRef.current === 0
            const hasNew = messages.length > prevMessagesCountRef.current
            prevMessagesCountRef.current = messages.length
            if (isFirst) {
                scrollToBottom("auto")
            } else if (hasNew) {
                scrollToBottom("smooth")
            }
        } else {
            prevMessagesCountRef.current = 0
        }
    }, [messages, scrollToBottom])

    // Fetch messages for a specific conversation (non-destructive)
    const openConversation = useCallback(async (conv: Conversation, isBackground = false) => {
        const isSameConv = activeConvIdRef.current === conv._id
        setSelectedConv(conv)

        if (!isSameConv && !isBackground) {
            prevMessagesCountRef.current = 0
            setIsLoadingMsgs(true)
        }
        
        // Clear unread locally
        setConversations(prev => prev.map(c =>
            c._id === conv._id ? { ...c, unreadCount: 0 } : c
        ))
        
        try {
            const res = await fetch(`/api/conversations/${conv._id}/messages`)
            if (res.ok) {
                const data = await res.json()
                if (Array.isArray(data.messages)) {
                    setMessages(data.messages)
                }
                if (data.conversation) {
                    setSelectedConv(prev => prev ? {
                        ...prev,
                        ...data.conversation,
                        propertyImage: data.conversation.propertyImage || prev.propertyImage,
                        poolRootPropertyThumbnail: data.conversation.poolRootPropertyThumbnail || prev.poolRootPropertyThumbnail
                    } : data.conversation)
                    if (Array.isArray(data.conversation.participants)) {
                        setGroupParticipants(data.conversation.participants)
                    }
                }
            }
        } catch (err) {
            console.error("Failed to fetch messages", err)
        } finally {
            setIsLoadingMsgs(false)
            setTimeout(() => inputRef.current?.focus(), 100)
        }
    }, [])

    // Fetch conversations list (non-destructive)
    const fetchConversations = useCallback(async (isManualRefresh = false) => {
        if (isManualRefresh) setIsRefreshing(true)
        try {
            const res = await fetch("/api/conversations")
            let fetchedConvs: Conversation[] = []
            
            if (res.ok) {
                const data = await res.json()
                if (data.success && Array.isArray(data.conversations)) {
                    fetchedConvs = data.conversations.map((c: any) => ({
                        ...c,
                        leadType: c.conversationType === "GROUP" ? "Group Pool" : (c.memberUserId ? "Group Member" : "Individual Lead")
                    }))
                    setConversations(fetchedConvs)
                }
            }

            // Handle query parameter initialization (e.g. from CRM lead header or member row)
            if (chatWith) {
                const cleanChatWith = chatWith.toLowerCase();
                let target = fetchedConvs.find(c => {
                    const leadIdMatch = c.leadId === chatWith || c._id === chatWith;
                    const poolKeyMatch = (c.groupPoolKey || '').toLowerCase() === cleanChatWith || (c.groupPoolKey || '').toLowerCase().includes(cleanChatWith);
                    const matchEntity = leadIdMatch || poolKeyMatch;
                    if (!matchEntity) return false;

                    if (memberId) {
                        return c.conversationType === "DIRECT" && (c.memberUserId === memberId || (c.memberUserId || '').toLowerCase() === memberId.toLowerCase());
                    }
                    if (chatType === "group") {
                        return c.conversationType === "GROUP";
                    }
                    return true;
                });

                if (target) {
                    const isAlreadySelected = activeConvIdRef.current === target._id
                    openConversation(target, isAlreadySelected)
                } else {
                    // Create or find via API
                    try {
                        const leadsRes = await fetch(`/api/leads/${chatWith}`)
                        if (leadsRes.ok) {
                            const leadData = await leadsRes.json()
                            const lead = leadData.lead

                            let postPayload: any = {
                                leadId: lead._id || lead.id,
                                leadName: lead.name,
                                leadPhone: lead.phone,
                                assignee: lead.assignee,
                                groupPoolKey: (lead.groupPoolKey || '').toLowerCase(),
                                poolRootPropertyId: lead.poolRootPropertyId,
                                poolRootPropertyName: lead.poolRootPropertyName || lead.topPropertyName
                            }

                            if (memberId && Array.isArray(lead.mergedMembers)) {
                                const member = lead.mergedMembers.find((m: any) => 
                                    m.userId === memberId || m.visitorId === memberId || (m.phone && m.phone === memberId)
                                );
                                if (member) {
                                    postPayload.conversationType = "DIRECT"
                                    postPayload.memberUserId = member.userId || member.visitorId || memberId
                                    postPayload.memberName = member.name
                                    postPayload.memberPhone = member.phone
                                    postPayload.memberEmail = member.email
                                }
                            } else if (chatType === "group" || lead.isGroup) {
                                postPayload.conversationType = "GROUP"
                            }

                            const initRes = await fetch("/api/conversations", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify(postPayload)
                            })

                            if (initRes.ok) {
                                const initData = await initRes.json()
                                if (initData.conversation) {
                                    const newConv: Conversation = {
                                        ...initData.conversation,
                                        leadType: initData.conversation.conversationType === "GROUP" ? "Group Pool" : (initData.conversation.memberUserId ? "Group Member" : "Individual Lead")
                                    }
                                    setConversations(prev => [newConv, ...prev.filter(c => c._id !== newConv._id)])
                                    openConversation(newConv)
                                }
                            }
                        }
                    } catch (e) {
                        console.error("Error creating targeted chat:", e)
                    }
                }
            } else if (fetchedConvs.length > 0 && !activeConvIdRef.current) {
                openConversation(fetchedConvs[0])
            } else if (activeConvIdRef.current) {
                // Refresh active conversation in background
                const activeMatch = fetchedConvs.find(c => c._id === activeConvIdRef.current)
                if (activeMatch) {
                    openConversation(activeMatch, true)
                }
            }
        } catch (err) {
            console.error("Failed to fetch conversations", err)
        } finally {
            setIsLoadingConvs(false)
            if (isManualRefresh) setIsRefreshing(false)
        }
    }, [chatWith, memberId, chatType, openConversation])

    // Manual refresh for button click
    const handleManualRefresh = useCallback(async () => {
        await fetchConversations(true)
        if (activeConvIdRef.current) {
            const current = conversations.find(c => c._id === activeConvIdRef.current)
            if (current) {
                await openConversation(current, true)
            }
        }
    }, [fetchConversations, conversations, openConversation])

    // Send a message
    const handleSend = useCallback(async () => {
        if (!newMessage.trim() || !selectedConv || isSending) return
        const text = newMessage.trim()
        setNewMessage("")
        setIsSending(true)

        const optimisticMsg: Message = {
            text,
            sender: "agent",
            senderName: "Builder Team",
            createdAt: new Date().toISOString(),
            _id: `optimistic-${Date.now()}`
        }
        setMessages(prev => [...prev, optimisticMsg])

        try {
            const res = await fetch(`/api/conversations/${selectedConv._id}/messages`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text, sender: "agent", senderName: "Builder Team" })
            })
            if (res.ok) {
                const data = await res.json()
                setMessages(prev => prev.map(m =>
                    m._id === optimisticMsg._id ? { ...data.message, _id: data.message._id } : m
                ))
                setConversations(prev => prev.map(c =>
                    c._id === selectedConv._id
                        ? { ...c, lastMessage: text, lastMessageAt: new Date().toISOString() }
                        : c
                ).sort((a, b) => new Date(b.lastMessageAt || 0).getTime() - new Date(a.lastMessageAt || 0).getTime()))
            }
        } catch (err) {
            console.error("Send failed", err)
            setMessages(prev => prev.filter(m => m._id !== optimisticMsg._id))
            setNewMessage(text)
        } finally {
            setIsSending(false)
        }
    }, [newMessage, selectedConv, isSending])

    // SSE subscription for realtime messages, conversation creation & deletion
    useEffect(() => {
        fetchConversations()

        const es = new EventSource("/api/leads/stream")
        es.onmessage = (e) => {
            try {
                const payload = JSON.parse(e.data)
                if (payload.type === "MESSAGE_SENT" && payload.data) {
                    const msg = payload.data
                    if (activeConvIdRef.current === msg.conversationId && (msg.sender === "lead" || msg.sender === "user" || msg.sender === "buyer")) {
                        setMessages(prev => {
                            const exists = prev.some(m => m._id === msg._id)
                            return exists ? prev : [...prev, msg]
                        })
                    }
                    setConversations(prev => prev.map(c =>
                        c._id === msg.conversationId && activeConvIdRef.current !== c._id
                            ? { ...c, unreadCount: (c.unreadCount || 0) + 1, lastMessage: msg.text, lastMessageAt: new Date().toISOString() }
                            : c
                    ).sort((a, b) => new Date(b.lastMessageAt || 0).getTime() - new Date(a.lastMessageAt || 0).getTime()))
                } else if (payload.type === "CONVERSATION_CREATED") {
                    setConversations(prev => {
                        const exists = prev.some(c => c._id === payload.data?._id)
                        return exists ? prev : [payload.data, ...prev]
                    })
                } else if (payload.type === "CONVERSATION_DELETED" || payload.type === "LEAD_DELETED") {
                    const deletedLeadId = payload.leadId;
                    const deletedPoolKey = payload.groupPoolKey?.toLowerCase();
                    setConversations(prev => {
                        const updated = prev.filter(c => {
                            const matchLead = c.leadId === deletedLeadId;
                            const matchPool = deletedPoolKey && (c.groupPoolKey || '').toLowerCase() === deletedPoolKey;
                            return !matchLead && !matchPool;
                        });
                        if (activeConvIdRef.current && (activeConvIdRef.current === deletedLeadId || (deletedPoolKey && (prev.find(c => c._id === activeConvIdRef.current)?.groupPoolKey || '').toLowerCase() === deletedPoolKey))) {
                            if (updated.length > 0) openConversation(updated[0]);
                            else setSelectedConv(null);
                        }
                        return updated;
                    });
                }
            } catch { }
        }

        // Active chat polling (every 4 seconds) to ensure real-time visitor-to-builder sync
        const pollInterval = setInterval(() => {
            const activeId = activeConvIdRef.current;
            if (activeId) {
                fetch(`/api/conversations/${activeId}/messages`)
                    .then(res => res.ok ? res.json() : null)
                    .then(data => {
                        if (data && Array.isArray(data.messages)) {
                            setMessages(prev => {
                                if (prev.length !== data.messages.length) {
                                    return data.messages;
                                }
                                const lastPrev = prev[prev.length - 1];
                                const lastNew = data.messages[data.messages.length - 1];
                                if (lastPrev?._id !== lastNew?._id || lastPrev?.text !== lastNew?.text) {
                                    return data.messages;
                                }
                                return prev;
                            });
                        }
                        if (data?.conversation?.participants && Array.isArray(data.conversation.participants)) {
                            setGroupParticipants(data.conversation.participants);
                        }
                    })
                    .catch(() => {});
            }
        }, 4000);

        return () => {
            es.close();
            clearInterval(pollInterval);
        }
    }, [fetchConversations, openConversation])

    // --- WhatsApp Feature Handlers: Avatar / Member Profile Click & Single Chat Launcher ---
    const handleAvatarClick = useCallback((msg: Message) => {
        const isAgent = msg.sender === "agent";
        if (isAgent) return; // Ignore own staff avatar click

        // Find participant details from conversation
        const participant = selectedConv?.participants?.find(p => 
            (p.userId && p.userId === msg.senderId) ||
            (p.name && msg.senderName && p.name.toLowerCase() === msg.senderName.toLowerCase()) ||
            (p.email && msg.senderName && p.email.toLowerCase() === msg.senderName.toLowerCase())
        );

        setSelectedMemberProfile({
            userId: msg.senderId || participant?.userId || "",
            name: msg.senderName || participant?.name || "Visitor / Buyer",
            avatar: msg.senderAvatar || msg.senderPhoto || participant?.avatar || participant?.photo || "",
            phone: participant?.phone || selectedConv?.leadPhone || "",
            email: participant?.email || "",
            poolName: selectedConv?.poolRootPropertyName || selectedConv?.leadName || "Group Buying Pool",
            leadId: selectedConv?.leadId || "",
            groupPoolKey: selectedConv?.groupPoolKey || "",
            role: selectedConv?.conversationType === "GROUP" ? "Group Pool Buyer" : "Direct Lead"
        });
        setShowMemberProfileModal(true);
    }, [selectedConv]);

    // Open WhatsApp Direct Contact Profile
    const handleDirectHeaderClick = useCallback(() => {
        if (!selectedConv) return;
        const participant = selectedConv.participants?.find(p => p.role === "buyer" || p.userId === selectedConv.memberUserId);

        setSelectedMemberProfile({
            userId: selectedConv.memberUserId || participant?.userId || "",
            name: selectedConv.leadName || participant?.name || "Group Buyer",
            avatar: participant?.avatar || participant?.photo || "",
            phone: selectedConv.leadPhone || participant?.phone || "",
            email: participant?.email || "",
            poolName: selectedConv.poolRootPropertyName || "Property Deal",
            leadId: selectedConv.leadId || "",
            groupPoolKey: selectedConv.groupPoolKey || "",
            role: selectedConv.memberUserId ? "Group Pool Member" : "Direct Lead"
        });
        setShowMemberProfileModal(true);
    }, [selectedConv]);

    // Launch Single 1-on-1 Direct Chat with a member
    const startSingleChatWithMember = useCallback(async (memberProfile: MemberProfileData) => {
        setShowMemberProfileModal(false);
        setShowGroupInfoModal(false);

        const memberUserId = memberProfile.userId || memberProfile.phone || memberProfile.name;
        if (!memberUserId) return;

        // Check if direct conversation already exists in conversations list
        const existingDirect = conversations.find(c => 
            c.conversationType === "DIRECT" && 
            (c.memberUserId === memberUserId || (c.leadPhone && memberProfile.phone && c.leadPhone === memberProfile.phone))
        );

        if (existingDirect) {
            openConversation(existingDirect);
            return;
        }

        // Create new direct conversation
        try {
            const res = await fetch("/api/conversations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    conversationType: "DIRECT",
                    leadId: memberProfile.leadId || selectedConv?.leadId,
                    groupPoolKey: memberProfile.groupPoolKey || selectedConv?.groupPoolKey,
                    poolRootPropertyName: memberProfile.poolName || selectedConv?.poolRootPropertyName,
                    poolRootPropertyId: selectedConv?.poolRootPropertyId,
                    memberUserId: memberUserId,
                    memberName: memberProfile.name,
                    memberPhone: memberProfile.phone,
                    memberEmail: memberProfile.email,
                    leadName: memberProfile.name,
                    leadPhone: memberProfile.phone
                })
            });

            if (res.ok) {
                const data = await res.json();
                if (data.conversation) {
                    const newConv: Conversation = {
                        ...data.conversation,
                        leadType: "Group Member"
                    };
                    setConversations(prev => [newConv, ...prev.filter(c => c._id !== newConv._id)]);
                    openConversation(newConv);
                }
            }
        } catch (err) {
            console.error("Error creating direct single chat:", err);
        }
    }, [conversations, selectedConv, openConversation]);

    // Group messages by date
    const groupedMessages = messages.reduce<{ date: string; msgs: Message[] }[]>((acc, msg) => {
        const dateStr = msg.createdAt
            ? new Date(msg.createdAt).toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })
            : "Today"
        const existing = acc.find(g => g.date === dateStr)
        if (existing) existing.msgs.push(msg)
        else acc.push({ date: dateStr, msgs: [msg] })
        return acc
    }, [])

    const groupCount = conversations.filter(c => c.conversationType === "GROUP").length
    const directCount = conversations.filter(c => c.conversationType === "DIRECT" && !!c.memberUserId).length
    const leadCount = conversations.filter(c => c.conversationType !== "GROUP" && !c.memberUserId).length

    const filteredConversations = conversations.filter(c => {
        const isGroup = c.conversationType === "GROUP"
        const isDirectMember = c.conversationType === "DIRECT" && !!c.memberUserId
        const isLead = !isGroup && !isDirectMember

        if (categoryFilter === "group" && !isGroup) return false
        if (categoryFilter === "direct" && !isDirectMember) return false
        if (categoryFilter === "leads" && !isLead) return false

        if (!searchQuery.trim()) return true
        const q = searchQuery.toLowerCase()
        const matchName = (c.leadName || c.poolRootPropertyName || "").toLowerCase().includes(q)
        const matchPhone = (c.leadPhone || "").includes(q)
        const matchMsg = (c.lastMessage || "").toLowerCase().includes(q)
        return matchName || matchPhone || matchMsg
    })

    const formatTime = (dateStr?: string) => {
        if (!dateStr) return ""
        const date = new Date(dateStr)
        const now = new Date()
        const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000)
        if (diffDays === 0) return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        if (diffDays === 1) return "Yesterday"
        if (diffDays < 7) return date.toLocaleDateString([], { weekday: "short" })
        return date.toLocaleDateString([], { day: "numeric", month: "short" })
    }

    return (
        <div className="flex h-[calc(100vh-140px)] bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">

            {/* ===== SIDEBAR ===== */}
            <div className="w-80 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-white dark:bg-slate-900 shrink-0">
                {/* Header */}
                <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between">
                        <h2 className="text-base font-black text-slate-800 dark:text-slate-200 flex items-center gap-2">
                            <MessageCircle className="w-5 h-5 text-blue-600" />
                            Communications
                        </h2>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 rounded-lg cursor-pointer" 
                            onClick={handleManualRefresh}
                            disabled={isRefreshing}
                            title="Refresh Discussions"
                        >
                            <RefreshCw className={`h-3.5 w-3.5 text-slate-400 ${isRefreshing ? "animate-spin text-blue-600" : ""}`} />
                        </Button>
                    </div>

                    {/* Filter Pills */}
                    <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar pb-0.5">
                        <button
                            type="button"
                            onClick={() => setCategoryFilter("all")}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all shrink-0 cursor-pointer ${
                                categoryFilter === "all"
                                    ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs"
                                    : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800"
                            }`}
                        >
                            All ({conversations.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setCategoryFilter("group")}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all shrink-0 cursor-pointer ${
                                categoryFilter === "group"
                                    ? "bg-purple-600 text-white shadow-xs"
                                    : "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 hover:bg-purple-100"
                            }`}
                        >
                            Pools ({groupCount})
                        </button>
                        <button
                            type="button"
                            onClick={() => setCategoryFilter("direct")}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all shrink-0 cursor-pointer ${
                                categoryFilter === "direct"
                                    ? "bg-indigo-600 text-white shadow-xs"
                                    : "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100"
                            }`}
                        >
                            Direct ({directCount})
                        </button>
                        <button
                            type="button"
                            onClick={() => setCategoryFilter("leads")}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all shrink-0 cursor-pointer ${
                                categoryFilter === "leads"
                                    ? "bg-blue-600 text-white shadow-xs"
                                    : "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100"
                            }`}
                        >
                            Leads ({leadCount})
                        </button>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                        <Input
                            placeholder="Search discussions & pools..."
                            className="pl-8 h-8 bg-slate-50 dark:bg-slate-800 border-slate-200 text-xs rounded-xl"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Conversation List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-1.5 space-y-1">
                    {isLoadingConvs ? (
                        Array.from({ length: 5 }).map((_, i) => <ConversationSkeleton key={i} />)
                    ) : filteredConversations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center p-6">
                            <MessageSquare className="h-10 w-10 text-slate-300 mb-3 opacity-60" />
                            <p className="text-slate-600 dark:text-slate-300 text-xs font-bold">No discussions found</p>
                            <p className="text-slate-400 text-[11px] mt-1">Group buying pools and direct messages appear here</p>
                        </div>
                    ) : (
                        filteredConversations.map(conv => {
                            const isGroup = conv.conversationType === "GROUP"
                            const isMember = conv.conversationType === "DIRECT" && !!conv.memberUserId
                            const title = isGroup ? (conv.poolRootPropertyName || conv.leadName || "Group Pool") : (conv.leadName || "Direct Chat")
                            const propImage = conv.propertyImage || conv.poolRootPropertyThumbnail
                            const memberAvatar = conv.memberAvatar || conv.senderAvatar || conv.photo || (Array.isArray(conv.participants) ? conv.participants.find((p: any) => p.role === 'buyer')?.avatar : '')

                            return (
                                <button
                                    key={conv._id}
                                    onClick={() => openConversation(conv)}
                                    className={`w-full p-2.5 rounded-xl flex items-start gap-3 transition-all text-left cursor-pointer border ${
                                        selectedConv?._id === conv._id 
                                            ? "bg-slate-100/90 dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-xs" 
                                            : "border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                    }`}
                                >
                                    {/* Property / Member Avatar Thumbnail */}
                                    <div className="relative flex-shrink-0 mt-0.5">
                                        {isGroup ? (
                                            <div className="w-10 h-10 rounded-xl overflow-hidden border border-purple-200 dark:border-purple-800/60 bg-purple-100 dark:bg-purple-950 flex items-center justify-center shadow-2xs">
                                                {propImage ? (
                                                    <img 
                                                        src={propImage} 
                                                        alt={title} 
                                                        className="w-full h-full object-cover" 
                                                    />
                                                ) : (
                                                    <Building2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                                )}
                                            </div>
                                        ) : (
                                            <div className="w-10 h-10 rounded-xl overflow-hidden border border-indigo-200 dark:border-indigo-800/60 bg-gradient-to-br from-indigo-500 to-cyan-600 flex items-center justify-center text-white font-bold text-xs shadow-2xs">
                                                {memberAvatar ? (
                                                    <img src={memberAvatar} alt={title} className="w-full h-full object-cover" />
                                                ) : (
                                                    title.charAt(0)?.toUpperCase() || "M"
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-baseline mb-0.5">
                                            <span className="font-bold text-xs truncate text-slate-800 dark:text-slate-200 flex items-center gap-1">
                                                {conv.isPinned && <Pin className="h-3 w-3 text-blue-500 inline mr-0.5" />}
                                                <span>{title}</span>
                                                {conv.memberUsername && (
                                                    <span className="text-[10px] font-mono text-purple-600 dark:text-purple-400 font-normal">@{conv.memberUsername}</span>
                                                )}
                                            </span>
                                            <span className="text-[9.5px] text-slate-400 font-medium shrink-0 ml-1">
                                                {formatTime(conv.lastMessageAt)}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <Badge variant="outline" className={`text-[8.5px] h-4 px-1.5 py-0 font-bold border ${
                                                isGroup 
                                                    ? "border-purple-200 text-purple-700 bg-purple-50 dark:bg-purple-950/40" 
                                                    : isMember 
                                                        ? "border-indigo-200 text-indigo-700 bg-indigo-50 dark:bg-indigo-950/40" 
                                                        : "border-blue-200 text-blue-700 bg-blue-50 dark:bg-blue-950/40"
                                            }`}>
                                                {isGroup ? "Group Pool" : (isMember ? `Member: ${conv.poolRootPropertyName || 'Group'}` : "Lead")}
                                            </Badge>
                                        </div>
                                        <p className="text-[11px] text-slate-400 truncate leading-none font-medium">
                                            {conv.lastMessage || "No messages yet"}
                                        </p>
                                    </div>

                                    {/* Unread Badge */}
                                    {conv.unreadCount > 0 && (
                                        <span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center flex-shrink-0 mt-1">
                                            {conv.unreadCount > 99 ? "99+" : conv.unreadCount}
                                        </span>
                                    )}
                                </button>
                            )
                        })
                    )}
                </div>
            </div>

            {/* ===== MAIN CHAT AREA ===== */}
            {selectedConv ? (
                <div className="flex-1 flex flex-col bg-slate-50/50 dark:bg-slate-900/50 overflow-hidden">
                    {/* Active Chat Top Header */}
                    <div className="p-3.5 md:px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-2xs">
                        <div 
                            onClick={() => {
                                if (selectedConv.conversationType === "GROUP") {
                                    setShowGroupInfoModal(true);
                                } else {
                                    handleDirectHeaderClick();
                                }
                            }}
                            className="flex items-center gap-3 cursor-pointer group hover:opacity-90 transition-opacity min-w-0"
                            title={selectedConv.conversationType === "GROUP" ? "Click to view group info & participating buyers" : "Click to view buyer profile"}
                        >
                            {/* Header Property / Buyer Avatar */}
                            <div className="relative">
                                {selectedConv.conversationType === "GROUP" ? (
                                    <div className="w-11 h-11 rounded-xl overflow-hidden border border-purple-200 dark:border-purple-800 bg-purple-100 dark:bg-purple-950 flex items-center justify-center shadow-xs">
                                        {(selectedConv.propertyImage || selectedConv.poolRootPropertyThumbnail) ? (
                                            <img 
                                                src={selectedConv.propertyImage || selectedConv.poolRootPropertyThumbnail} 
                                                alt="Property" 
                                                className="w-full h-full object-cover" 
                                            />
                                        ) : (
                                            <Building2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                        )}
                                    </div>
                                ) : (
                                    <div className="w-11 h-11 rounded-xl overflow-hidden border border-indigo-200 dark:border-indigo-800 bg-gradient-to-br from-indigo-500 to-cyan-600 flex items-center justify-center text-white font-bold text-base shadow-xs">
                                        {(selectedConv.memberAvatar || selectedConv.senderAvatar || selectedConv.photo || (Array.isArray(selectedConv.participants) ? selectedConv.participants.find((p: any) => p.role === 'buyer')?.avatar : '')) ? (
                                            <img 
                                                src={selectedConv.memberAvatar || selectedConv.senderAvatar || selectedConv.photo || (Array.isArray(selectedConv.participants) ? selectedConv.participants.find((p: any) => p.role === 'buyer')?.avatar : '')} 
                                                alt={selectedConv.leadName} 
                                                className="w-full h-full object-cover" 
                                            />
                                        ) : (
                                            selectedConv.leadName?.charAt(0)?.toUpperCase() || "B"
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="min-w-0">
                                <h3 className="font-black text-sm flex items-center gap-2 truncate text-slate-900 dark:text-slate-100 group-hover:text-blue-600 transition-colors">
                                    <span>
                                        {selectedConv.conversationType === "GROUP" 
                                            ? `${selectedConv.poolRootPropertyName || selectedConv.leadName} — Group Buying Pool` 
                                            : selectedConv.leadName}
                                    </span>
                                    {selectedConv.memberUsername && (
                                        <span className="text-xs font-mono font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/50 px-2 py-0.5 rounded-full font-normal">
                                            @{selectedConv.memberUsername}
                                        </span>
                                    )}
                                    <Badge variant="secondary" className="text-[9.5px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-none shrink-0">
                                        {selectedConv.conversationType === "GROUP" ? "Group Pool" : (selectedConv.memberUserId ? "Group Member" : "Lead")}
                                    </Badge>
                                </h3>
                                <p className="text-[11px] text-slate-500 flex items-center gap-1.5 truncate">
                                    {selectedConv.conversationType === "GROUP" ? (
                                        <span>Click here for group info & participating buyers</span>
                                    ) : (
                                        <span>{selectedConv.leadPhone || "Direct 1-on-1 Member Chat"} · Click to view profile</span>
                                    )}
                                    {selectedConv.assignee && <span className="text-slate-400">· Assignee: {selectedConv.assignee}</span>}
                                </p>
                            </div>
                        </div>

                        {/* Quick Header Actions */}
                        <div className="flex items-center gap-2">
                            {selectedConv.conversationType === "GROUP" ? (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowGroupInfoModal(true)}
                                    className="h-8 text-xs font-bold gap-1.5 rounded-xl border-purple-200 text-purple-700 bg-purple-50/50 hover:bg-purple-100 cursor-pointer"
                                >
                                    <Users className="w-3.5 h-3.5" /> Pool Members
                                </Button>
                            ) : (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleDirectHeaderClick}
                                    className="h-8 text-xs font-bold gap-1.5 rounded-xl border-blue-200 text-blue-700 bg-blue-50/50 hover:bg-blue-100 cursor-pointer"
                                >
                                    <User className="w-3.5 h-3.5" /> View Profile
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Messages Stream Area — WhatsApp Chat Canvas */}
                    <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-2.5 custom-scrollbar">
                        {isLoadingMsgs ? (
                            <div className="space-y-3">
                                <MessageSkeleton />
                                <MessageSkeleton />
                                <MessageSkeleton />
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center text-slate-400">
                                <MessageSquare className="h-10 w-10 mb-2 opacity-50" />
                                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">No messages in this discussion yet</p>
                                <p className="text-xs text-slate-400 mt-0.5">Send a broadcast announcement or message to communicate with the buyers.</p>
                            </div>
                        ) : (
                            groupedMessages.map((group, gIdx) => (
                                <div key={gIdx} className="space-y-2.5">
                                    {/* Date Bubble */}
                                    <div className="flex items-center justify-center my-3">
                                        <span className="text-[10px] font-bold text-slate-500 bg-slate-200/70 dark:bg-slate-800 px-3.5 py-1 rounded-full uppercase tracking-wider shadow-2xs">
                                            {group.date}
                                        </span>
                                    </div>
                                    {group.msgs.map((msg, mIdx) => {
                                        const isAgent = msg.sender === "agent"
                                        return (
                                            <div
                                                key={msg._id || mIdx}
                                                className={`flex gap-2.5 ${isAgent ? "justify-end" : "justify-start"} items-start`}
                                            >
                                                {/* Left Avatar (Clickable Visitor Profile Trigger) */}
                                                {!isAgent && (
                                                    <div 
                                                        onClick={() => handleAvatarClick(msg)}
                                                        className="cursor-pointer transition-transform hover:scale-110 shrink-0 mt-0.5"
                                                        title={`Click to view ${msg.senderName || 'Buyer'}'s profile`}
                                                    >
                                                        <Avatar className="h-8 w-8 rounded-full border-2 border-indigo-200 dark:border-indigo-800 shadow-xs overflow-hidden">
                                                            {(msg.senderAvatar || msg.senderPhoto) ? (
                                                                <AvatarImage 
                                                                    src={msg.senderAvatar || msg.senderPhoto} 
                                                                    alt={msg.senderName || "Buyer"}
                                                                    className="aspect-square size-full object-cover" 
                                                                />
                                                            ) : null}
                                                            <AvatarFallback className="text-[11px] bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-black flex items-center justify-center size-full">
                                                                {msg.senderName?.charAt(0)?.toUpperCase() || "B"}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                    </div>
                                                )}

                                                <div className={`max-w-[75%] md:max-w-[65%] ${isAgent ? "items-end" : "items-start"} flex flex-col`}>
                                                    {!isAgent && msg.senderName && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleAvatarClick(msg)}
                                                            className="flex items-center gap-1.5 mb-1 ml-1 cursor-pointer hover:underline text-left"
                                                        >
                                                            <span className="text-[11px] text-slate-800 dark:text-slate-200 font-bold">{msg.senderName}</span>
                                                            {selectedConv.conversationType === "GROUP" && (
                                                                <Badge variant="outline" className="text-[8px] h-3.5 px-1.5 py-0 font-bold bg-purple-50 text-purple-700 border-purple-200">
                                                                    Buyer Inquiry
                                                                </Badge>
                                                            )}
                                                        </button>
                                                    )}

                                                    {/* WhatsApp Styled Message Bubble */}
                                                    <div className={`rounded-2xl px-4 py-2.5 text-xs font-medium shadow-2xs ${
                                                        isAgent 
                                                            ? "bg-[#1A3C8C] text-white rounded-tr-xs" 
                                                            : "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700/60 rounded-tl-xs"
                                                    }`}>
                                                        <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                                                        <div className={`text-[9px] mt-1 text-right font-medium flex items-center justify-end gap-1 ${
                                                            isAgent ? "text-blue-200" : "text-slate-400"
                                                        }`}>
                                                            {isAgent && selectedConv.conversationType === "GROUP" && (
                                                                <span className="text-[8.5px] bg-white/20 px-1 py-0.2 rounded text-white font-bold mr-1">
                                                                    Broadcast to Pool
                                                                </span>
                                                            )}
                                                            {msg.createdAt && new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                                            {isAgent && <CheckCheck className="h-3.5 w-3.5 inline text-sky-300" />}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            ))
                        )}
                    </div>

                    {/* Chat Input */}
                    <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
                        <form
                            onSubmit={e => {
                                e.preventDefault()
                                handleSend()
                            }}
                            className="flex items-center gap-2"
                        >
                            <Input
                                ref={inputRef}
                                value={newMessage}
                                onChange={e => setNewMessage(e.target.value)}
                                placeholder={selectedConv.conversationType === "GROUP" ? "Broadcast a message to all pool buyers..." : "Type a direct reply..."}
                                className="flex-1 bg-slate-50 dark:bg-slate-800 border-slate-200 text-xs h-10 rounded-xl"
                                disabled={isSending}
                            />
                            <Button
                                type="submit"
                                size="sm"
                                disabled={!newMessage.trim() || isSending}
                                className="bg-[#1A3C8C] hover:bg-[#153070] text-white h-10 px-5 rounded-xl font-bold text-xs cursor-pointer shadow-xs"
                            >
                                <Send className="h-3.5 w-3.5 mr-1" /> Send
                            </Button>
                        </form>
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400">
                    <MessageSquare className="h-12 w-12 text-slate-300 mb-3 opacity-60" />
                    <p className="text-base font-bold text-slate-700 dark:text-slate-200">Select a Conversation</p>
                    <p className="text-xs text-slate-400 max-w-xs mt-1">Choose a Group Buying Pool or Lead from the sidebar to view chat history and reply.</p>
                </div>
            )}

            {/* ========================================================================= */}
            {/* WhatsApp-Style Modal 1: Visitor / Member Profile Card with Single Chat     */}
            {/* ========================================================================= */}
            <Dialog open={showMemberProfileModal} onOpenChange={setShowMemberProfileModal}>
                <DialogContent className="sm:max-w-md p-0 overflow-hidden border border-slate-200 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900 shadow-2xl">
                    <DialogHeader className="sr-only">
                        <DialogTitle>{selectedMemberProfile?.name || "Member Profile"}</DialogTitle>
                        <DialogDescription>Buyer contact and property interest details</DialogDescription>
                    </DialogHeader>
                    {selectedMemberProfile && (
                        <div className="flex flex-col">
                            {/* Profile Header Banner */}
                            <div className="h-28 bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-600 relative flex items-end justify-center pb-0">
                                <div className="absolute -bottom-10 w-20 h-20 rounded-full border-4 border-white dark:border-slate-900 bg-white dark:bg-slate-800 shadow-lg overflow-hidden flex items-center justify-center text-2xl font-black text-slate-800">
                                    {selectedMemberProfile.avatar ? (
                                        <img 
                                            src={selectedMemberProfile.avatar} 
                                            alt={selectedMemberProfile.name} 
                                            className="w-full h-full object-cover" 
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center">
                                            {selectedMemberProfile.name.charAt(0)?.toUpperCase() || "B"}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Profile Info Content */}
                            <div className="pt-12 p-6 text-center space-y-4">
                                <div>
                                    <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
                                        {selectedMemberProfile.name}
                                    </h3>
                                    <div className="flex items-center justify-center gap-1.5 mt-1">
                                        <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 font-bold text-[10px] px-2.5 py-0.5 rounded-full border-none">
                                            {selectedMemberProfile.role || "Group Pool Buyer"}
                                        </Badge>
                                    </div>
                                </div>

                                {/* Contact Details Card */}
                                <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 text-left space-y-3 border border-slate-100 dark:border-slate-700/60 text-xs">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2.5 text-slate-600 dark:text-slate-300 font-medium">
                                            <Phone className="w-4 h-4 text-blue-600 shrink-0" />
                                            <span>{selectedMemberProfile.phone || "Phone not provided"}</span>
                                        </div>
                                        {selectedMemberProfile.phone && (
                                            <div className="flex items-center gap-1">
                                                <a 
                                                    href={`tel:${selectedMemberProfile.phone}`}
                                                    className="px-2.5 py-1 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-800 font-bold text-[10px] transition-colors"
                                                >
                                                    Call
                                                </a>
                                            </div>
                                        )}
                                    </div>

                                    {selectedMemberProfile.email && (
                                        <div className="flex items-center gap-2.5 text-slate-600 dark:text-slate-300 font-medium">
                                            <Mail className="w-4 h-4 text-purple-600 shrink-0" />
                                            <a href={`mailto:${selectedMemberProfile.email}`} className="hover:underline truncate">
                                                {selectedMemberProfile.email}
                                            </a>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-2.5 text-slate-600 dark:text-slate-300 font-medium pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                                        <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                                        <span className="truncate">Interest: <strong className="text-slate-800 dark:text-slate-200">{selectedMemberProfile.poolName}</strong></span>
                                    </div>
                                </div>

                                {/* PRIMARY ACTION: Start Single 1-on-1 Chat */}
                                <Button
                                    onClick={() => startSingleChatWithMember(selectedMemberProfile)}
                                    className="w-full bg-[#1A3C8C] hover:bg-[#153070] text-white font-bold h-11 rounded-2xl flex items-center justify-center gap-2 text-xs cursor-pointer shadow-md transition-all active:scale-98"
                                >
                                    <MessageSquare className="w-4 h-4" />
                                    Start Single Chat (1-on-1 Direct Message)
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* ========================================================================= */}
            {/* WhatsApp-Style Modal 2: Group Pool Info Drawer with Participating Members */}
            {/* ========================================================================= */}
            <Dialog open={showGroupInfoModal} onOpenChange={setShowGroupInfoModal}>
                <DialogContent className="sm:max-w-lg p-0 overflow-hidden border border-slate-200 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900 shadow-2xl">
                    <DialogHeader className="sr-only">
                        <DialogTitle>{selectedConv?.poolRootPropertyName || selectedConv?.leadName || "Group Pool Info"}</DialogTitle>
                        <DialogDescription>Participating group buyers and campaign details</DialogDescription>
                    </DialogHeader>
                    {selectedConv && (
                        <div className="flex flex-col max-h-[85vh]">
                            {/* Property Banner */}
                            <div className="h-36 relative bg-slate-900 overflow-hidden shrink-0">
                                {(selectedConv.propertyImage || selectedConv.poolRootPropertyThumbnail) ? (
                                    <img 
                                        src={selectedConv.propertyImage || selectedConv.poolRootPropertyThumbnail} 
                                        alt="Property Banner" 
                                        className="w-full h-full object-cover opacity-80" 
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-purple-800 to-indigo-900 flex items-center justify-center">
                                        <Building2 className="w-12 h-12 text-white/30" />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex items-end p-5">
                                    <div>
                                        <Badge className="bg-purple-500 text-white font-black text-[10px] mb-1">
                                            Unified Group Buying Pool
                                        </Badge>
                                        <h3 className="text-base font-black text-white leading-tight">
                                            {selectedConv.poolRootPropertyName || selectedConv.leadName}
                                        </h3>
                                    </div>
                                </div>
                            </div>

                            {/* Group Details & Participants */}
                            <div className="p-5 overflow-y-auto space-y-4 custom-scrollbar">
                                <div className="flex items-center justify-between text-xs pb-3 border-b border-slate-100 dark:border-slate-800">
                                    <span className="text-slate-500 font-bold">Group Pool Key:</span>
                                    <span className="font-mono text-slate-800 dark:text-slate-200 font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg">
                                        {selectedConv.groupPoolKey || "unified-pool"}
                                    </span>
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                            <Users className="w-4 h-4 text-purple-600" />
                                            Participating Buyers ({groupParticipants.length})
                                        </h4>
                                        <span className="text-[10px] text-slate-400 font-medium">Click "Chat" to start 1-on-1 single chat</span>
                                    </div>

                                    <div className="space-y-1.5">
                                        {groupParticipants.length === 0 ? (
                                            <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-2xl">
                                                No members recorded yet in this pool.
                                            </div>
                                        ) : (
                                            groupParticipants.map((p, idx) => {
                                                const isStaff = p.role === "builder" || p.role === "mandate" || p.role === "agent";
                                                return (
                                                    <div 
                                                        key={p.userId || idx}
                                                        className="p-2.5 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl flex items-center justify-between gap-3 transition-colors border border-slate-100 dark:border-slate-700/60"
                                                    >
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs shadow-2xs">
                                                                {p.avatar || p.photo ? (
                                                                    <img src={p.avatar || p.photo} alt={p.name} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    p.name?.charAt(0)?.toUpperCase() || "B"
                                                                )}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <div className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate flex items-center gap-1.5">
                                                                    <span>{p.name}</span>
                                                                    {p.username && (
                                                                        <span className="text-[9.5px] font-mono text-purple-600 dark:text-purple-400 font-normal">@{p.username}</span>
                                                                    )}
                                                                    {isStaff && (
                                                                        <Badge variant="secondary" className="text-[8px] h-3.5 px-1 py-0 bg-blue-100 text-blue-800">
                                                                            Staff
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                                <p className="text-[10px] text-slate-400 truncate">
                                                                    {p.phone || p.email || (isStaff ? "Representative" : "Pool Buyer")}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {/* Single Chat Action for this Member */}
                                                        {!isStaff && (
                                                            <Button
                                                                size="sm"
                                                                onClick={() => startSingleChatWithMember({
                                                                    userId: p.userId,
                                                                    name: p.name,
                                                                    avatar: p.avatar || p.photo,
                                                                    phone: p.phone,
                                                                    email: p.email,
                                                                    poolName: selectedConv.poolRootPropertyName || selectedConv.leadName,
                                                                    leadId: selectedConv.leadId,
                                                                    groupPoolKey: selectedConv.groupPoolKey,
                                                                    role: "Group Pool Buyer"
                                                                })}
                                                                className="h-8 px-3 rounded-xl bg-[#1A3C8C] hover:bg-[#153070] text-white text-[11px] font-bold gap-1 cursor-pointer shrink-0"
                                                            >
                                                                <MessageSquare className="w-3 h-3" />
                                                                Single Chat
                                                            </Button>
                                                        )}
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
