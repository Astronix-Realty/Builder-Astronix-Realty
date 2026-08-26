"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import {
    Search, Send, MoreVertical, Phone, Video, Paperclip,
    CheckCheck, MessageSquare, RefreshCw, Pin, Circle, Users, Building
} from "lucide-react"

interface Message {
    _id?: string
    text: string
    sender: "agent" | "lead" | "user" | "buyer"
    senderName?: string
    createdAt?: string
}

interface Conversation {
    _id: string
    leadId?: string
    leadName?: string
    leadPhone?: string
    conversationType?: "GROUP" | "DIRECT" | "SUPPORT"
    groupPoolKey?: string
    poolRootPropertyName?: string
    memberUserId?: string
    assignee?: string
    lastMessage?: string
    lastMessageAt?: string
    unreadCount: number
    isPinned: boolean
    messages?: Message[]
    leadType?: string
    parentGroupName?: string
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
    const [searchQuery, setSearchQuery] = useState("")
    const messagesEndRef = useRef<HTMLDivElement>(null)
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

    // Auto-scroll to bottom
    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [])

    useEffect(() => {
        scrollToBottom()
    }, [messages, scrollToBottom])

    // Fetch messages for a specific conversation (non-destructive)
    const openConversation = useCallback(async (conv: Conversation, isBackground = false) => {
        const isSameConv = activeConvIdRef.current === conv._id
        setSelectedConv(conv)

        if (!isSameConv && !isBackground) {
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
                fetchedConvs = (data.conversations || []).map((c: any) => ({
                    ...c,
                    leadType: c.conversationType === "GROUP" ? "Group Pool" : (c.memberUserId ? "Group Member" : "Individual Lead")
                }))
            }
            
            setConversations(fetchedConvs)

            // Handle query parameter initialization (e.g. from CRM lead header or member row)
            if (chatWith) {
                let target = fetchedConvs.find(c => 
                    (c.leadId === chatWith || c._id === chatWith || c.groupPoolKey === chatWith) && 
                    (memberId ? c.memberUserId === memberId : c.conversationType === (chatType === "group" ? "GROUP" : c.conversationType))
                )

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
                                groupPoolKey: lead.groupPoolKey,
                                poolRootPropertyId: lead.poolRootPropertyId,
                                poolRootPropertyName: lead.poolRootPropertyName || lead.topPropertyName
                            }

                            if (chatType === "group" || lead.isGroup) {
                                postPayload.conversationType = "GROUP"
                            }

                            if (memberId && lead.mergedMembers) {
                                const member = lead.mergedMembers.find((m: any) => m.userId === memberId || m.visitorId === memberId)
                                if (member) {
                                    postPayload.conversationType = "DIRECT"
                                    postPayload.memberUserId = member.userId || memberId
                                    postPayload.memberName = member.name
                                    postPayload.memberPhone = member.phone
                                    postPayload.memberEmail = member.email
                                }
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

    // SSE subscription for realtime messages
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
                }
            } catch { }
        }

        return () => es.close()
    }, [fetchConversations]) // eslint-disable-line


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

    const filteredConversations = conversations.filter(c =>
        !searchQuery || (c.leadName || c.poolRootPropertyName || "")?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.leadPhone?.includes(searchQuery) || c.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase())
    )

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
            <div className="w-80 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-white dark:bg-slate-900">
                {/* Header */}
                <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-lg font-bold">Communications</h2>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8" 
                            onClick={handleManualRefresh}
                            disabled={isRefreshing}
                            title="Refresh Conversations"
                        >
                            <RefreshCw className={`h-4 w-4 text-slate-400 ${isRefreshing ? "animate-spin text-blue-600" : ""}`} />
                        </Button>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search chats..."
                            className="pl-9 h-9 bg-slate-50 dark:bg-slate-800 border-slate-200 text-xs"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Conversation List */}
                <div className="flex-1 overflow-y-auto">
                    {isLoadingConvs ? (
                        Array.from({ length: 5 }).map((_, i) => <ConversationSkeleton key={i} />)
                    ) : filteredConversations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center p-6">
                            <MessageSquare className="h-10 w-10 text-slate-300 mb-3" />
                            <p className="text-slate-500 text-sm font-medium">No conversations yet</p>
                            <p className="text-slate-400 text-xs mt-1">Group deals and visitor enquiries will appear here</p>
                        </div>
                    ) : (
                        filteredConversations.map(conv => {
                            const isGroup = conv.conversationType === "GROUP"
                            const isMember = conv.conversationType === "DIRECT" && !!conv.memberUserId
                            const title = isGroup ? (conv.poolRootPropertyName || conv.leadName || "Group Pool") : (conv.leadName || "Direct Chat")

                            return (
                                <button
                                    key={conv._id}
                                    onClick={() => openConversation(conv)}
                                    className={`w-full p-3 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all border-b border-slate-100 dark:border-slate-800 text-left
                                        ${selectedConv?._id === conv._id ? "bg-blue-50/80 dark:bg-blue-900/20 border-l-2 border-l-blue-500" : ""}
                                    `}
                                >
                                    {/* Avatar */}
                                    <div className="relative flex-shrink-0">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-xs ${
                                            isGroup 
                                                ? "bg-gradient-to-br from-purple-600 to-indigo-600" 
                                                : isMember 
                                                    ? "bg-gradient-to-br from-blue-600 to-cyan-600" 
                                                    : "bg-gradient-to-br from-slate-600 to-slate-800"
                                        }`}>
                                            {isGroup ? <Users className="w-5 h-5" /> : (title.charAt(0)?.toUpperCase() || "?")}
                                        </div>
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-baseline mb-0.5">
                                            <span className="font-semibold text-xs truncate text-slate-900 dark:text-slate-100">
                                                {conv.isPinned && <Pin className="h-3 w-3 text-blue-500 inline mr-1" />}
                                                {title}
                                            </span>
                                            <span className="text-[9px] text-slate-400 shrink-0 ml-1">
                                                {formatTime(conv.lastMessageAt)}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5 mb-0.5">
                                            <Badge variant="outline" className={`text-[8.5px] h-4 px-1 py-0 font-bold border ${
                                                isGroup 
                                                    ? "border-purple-200 text-purple-700 bg-purple-50" 
                                                    : isMember 
                                                        ? "border-indigo-200 text-indigo-700 bg-indigo-50" 
                                                        : "border-blue-200 text-blue-700 bg-blue-50"
                                            }`}>
                                                {isGroup ? "Group Pool" : (isMember ? "Group Member" : "Lead")}
                                            </Badge>
                                            <p className="text-[11px] text-slate-500 truncate flex-1">{conv.lastMessage || "No messages yet"}</p>
                                        </div>
                                    </div>

                                    {/* Unread Badge */}
                                    {conv.unreadCount > 0 && (
                                        <span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center flex-shrink-0">
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
                <div className="flex-1 flex flex-col min-w-0">
                    {/* Chat Header */}
                    <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 shrink-0">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="relative shrink-0">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-xs ${
                                    selectedConv.conversationType === "GROUP"
                                        ? "bg-gradient-to-br from-purple-600 to-indigo-600"
                                        : "bg-gradient-to-br from-blue-600 to-cyan-600"
                                }`}>
                                    {selectedConv.conversationType === "GROUP" ? <Users className="w-5 h-5" /> : (selectedConv.leadName?.charAt(0)?.toUpperCase() || "?")}
                                </div>
                            </div>
                            <div className="min-w-0">
                                <h3 className="font-bold text-sm flex items-center gap-2 truncate">
                                    {selectedConv.conversationType === "GROUP" 
                                        ? `${selectedConv.poolRootPropertyName || selectedConv.leadName} — Group Buying Pool` 
                                        : selectedConv.leadName}
                                    <Badge variant="secondary" className="text-[9.5px] font-bold bg-blue-50 text-blue-700 border-none shrink-0">
                                        {selectedConv.conversationType === "GROUP" ? "Group Pool" : (selectedConv.memberUserId ? "Group Member" : "Lead")}
                                    </Badge>
                                </h3>
                                <p className="text-[11px] text-slate-500 flex items-center gap-1 truncate">
                                    {selectedConv.conversationType === "GROUP" 
                                        ? "Shared pool chat for all verified buyers & staff"
                                        : (selectedConv.leadPhone || "Direct Member Chat")}
                                    {selectedConv.assignee && <span className="ml-1">· Assignee: {selectedConv.assignee}</span>}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-slate-50/60 dark:bg-slate-950/50">
                        {isLoadingMsgs ? (
                            <div className="space-y-2">
                                <MessageSkeleton />
                                <MessageSkeleton />
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center text-slate-400">
                                <MessageSquare className="h-10 w-10 mb-2 opacity-50" />
                                <p className="text-sm font-semibold text-slate-600">No messages in this chat yet</p>
                                <p className="text-xs">Send a message to start communicating with the buyer.</p>
                            </div>
                        ) : (
                            groupedMessages.map((group, gIdx) => (
                                <div key={gIdx} className="space-y-2">
                                    <div className="flex items-center justify-center my-3">
                                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full uppercase tracking-wider">
                                            {group.date}
                                        </span>
                                    </div>
                                    {group.msgs.map((msg, mIdx) => {
                                        const isAgent = msg.sender === "agent"
                                        return (
                                            <div
                                                key={msg._id || mIdx}
                                                className={`flex gap-2.5 ${isAgent ? "justify-end" : "justify-start"}`}
                                            >
                                                {!isAgent && (
                                                    <Avatar className="h-7 w-7 mt-0.5 shrink-0">
                                                        <AvatarFallback className="text-[10px] bg-slate-200 text-slate-700 font-bold">
                                                            {msg.senderName?.charAt(0) || "B"}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                )}
                                                <div className={`max-w-[70%] ${isAgent ? "items-end" : "items-start"} flex flex-col`}>
                                                    {!isAgent && msg.senderName && (
                                                        <span className="text-[10px] text-slate-400 mb-0.5 ml-1 font-bold">{msg.senderName}</span>
                                                    )}
                                                    <div className={`rounded-2xl px-4 py-2.5 text-xs font-medium ${
                                                        isAgent 
                                                            ? "bg-[#1A3C8C] text-white rounded-tr-xs" 
                                                            : "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700/60 rounded-tl-xs shadow-2xs"
                                                    }`}>
                                                        <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                                                        <div className={`text-[9px] mt-1 text-right font-medium flex items-center justify-end gap-1 ${
                                                            isAgent ? "text-blue-200" : "text-slate-400"
                                                        }`}>
                                                            {msg.createdAt && new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                                            {isAgent && <CheckCheck className="h-3 w-3 inline" />}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            ))
                        )}
                        <div ref={messagesEndRef} />
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
                                placeholder="Type a reply..."
                                className="flex-1 bg-slate-50 dark:bg-slate-800 border-slate-200 text-xs h-10"
                                disabled={isSending}
                            />
                            <Button
                                type="submit"
                                size="sm"
                                disabled={!newMessage.trim() || isSending}
                                className="bg-[#1A3C8C] hover:bg-[#153070] text-white h-10 px-4 rounded-xl font-bold text-xs"
                            >
                                <Send className="h-3.5 w-3.5 mr-1" /> Send
                            </Button>
                        </form>
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400">
                    <MessageSquare className="h-12 w-12 text-slate-300 mb-3" />
                    <p className="text-base font-bold text-slate-700 dark:text-slate-200">Select a Conversation</p>
                    <p className="text-xs text-slate-400 max-w-xs mt-1">Choose a Group Buying Pool or Lead from the sidebar to view chat history and reply.</p>
                </div>
            )}
        </div>
    )
}
