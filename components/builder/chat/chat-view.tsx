"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import {
    Search, Send, MoreVertical, Phone, Video, Paperclip,
    CheckCheck, MessageSquare, RefreshCw, Pin, Circle
} from "lucide-react"

interface Message {
    _id?: string
    text: string
    sender: "agent" | "lead"
    senderName?: string
    createdAt?: string
}

interface Conversation {
    _id: string
    leadId: string
    leadName: string
    leadPhone: string
    assignee?: string
    lastMessage?: string
    lastMessageAt?: string
    unreadCount: number
    isPinned: boolean
    messages?: Message[]
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
    const [isSending, setIsSending] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    // Auto-scroll to bottom
    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [])

    useEffect(() => {
        scrollToBottom()
    }, [messages, scrollToBottom])

    // Fetch conversations list
    const fetchConversations = useCallback(async () => {
        setIsLoadingConvs(true)
        try {
            const res = await fetch("/api/conversations")
            if (res.ok) {
                const data = await res.json()
                if (data.conversations) {
                    setConversations(data.conversations)
                    // Auto-select first conversation
                    if (data.conversations.length > 0 && !selectedConv) {
                        openConversation(data.conversations[0])
                    }
                }
            }
        } catch (err) {
            console.error("Failed to fetch conversations", err)
        } finally {
            setIsLoadingConvs(false)
        }
    }, []) // eslint-disable-line

    // Fetch messages for a specific conversation
    const openConversation = useCallback(async (conv: Conversation) => {
        setSelectedConv(conv)
        setIsLoadingMsgs(true)
        // Clear unread locally
        setConversations(prev => prev.map(c =>
            c._id === conv._id ? { ...c, unreadCount: 0 } : c
        ))
        try {
            const res = await fetch(`/api/conversations/${conv._id}/messages`)
            if (res.ok) {
                const data = await res.json()
                setMessages(data.messages || [])
            }
        } catch (err) {
            console.error("Failed to fetch messages", err)
        } finally {
            setIsLoadingMsgs(false)
            setTimeout(() => inputRef.current?.focus(), 100)
        }
    }, [])

    // Send a message
    const handleSend = useCallback(async () => {
        if (!newMessage.trim() || !selectedConv || isSending) return
        const text = newMessage.trim()
        setNewMessage("")
        setIsSending(true)

        // Optimistic update
        const optimisticMsg: Message = {
            text,
            sender: "agent",
            senderName: "You",
            createdAt: new Date().toISOString(),
            _id: `optimistic-${Date.now()}`
        }
        setMessages(prev => [...prev, optimisticMsg])

        try {
            const res = await fetch(`/api/conversations/${selectedConv._id}/messages`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text, sender: "agent", senderName: "Agent" })
            })
            if (res.ok) {
                const data = await res.json()
                // Replace optimistic with real message
                setMessages(prev => prev.map(m =>
                    m._id === optimisticMsg._id ? { ...data.message, _id: data.message._id } : m
                ))
                // Update conversation preview
                setConversations(prev => prev.map(c =>
                    c._id === selectedConv._id
                        ? { ...c, lastMessage: text, lastMessageAt: new Date().toISOString() }
                        : c
                ).sort((a, b) => new Date(b.lastMessageAt || 0).getTime() - new Date(a.lastMessageAt || 0).getTime()))
            }
        } catch (err) {
            console.error("Send failed", err)
            // Rollback optimistic
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
                    // If the incoming message is for the currently open conversation
                    if (selectedConv && msg.conversationId === selectedConv._id && msg.sender === "lead") {
                        setMessages(prev => {
                            const exists = prev.some(m => m._id === msg._id)
                            return exists ? prev : [...prev, msg]
                        })
                    }
                    // Update unread in sidebar list
                    if (msg.sender === "lead") {
                        setConversations(prev => prev.map(c =>
                            c._id === msg.conversationId && (!selectedConv || selectedConv._id !== c._id)
                                ? { ...c, unreadCount: (c.unreadCount || 0) + 1, lastMessage: msg.text }
                                : c
                        ))
                    }
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
        !searchQuery || c.leadName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
                        <h2 className="text-lg font-bold">Messages</h2>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={fetchConversations}>
                            <RefreshCw className="h-4 w-4 text-slate-400" />
                        </Button>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search chats..."
                            className="pl-9 h-9 bg-slate-50 dark:bg-slate-800 border-slate-200"
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
                            <p className="text-slate-400 text-xs mt-1">Leads from the website will appear here automatically</p>
                        </div>
                    ) : (
                        filteredConversations.map(conv => (
                            <button
                                key={conv._id}
                                onClick={() => openConversation(conv)}
                                className={`w-full p-3 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all border-b border-slate-100 dark:border-slate-800 text-left
                                    ${selectedConv?._id === conv._id ? "bg-blue-50 dark:bg-blue-900/20 border-l-2 border-l-blue-500" : ""}
                                `}
                            >
                                {/* Avatar */}
                                <div className="relative flex-shrink-0">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white font-bold text-sm">
                                        {conv.leadName?.charAt(0)?.toUpperCase() || "?"}
                                    </div>
                                    {/* Online dot — hardcoded for UI purposes */}
                                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full" />
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-baseline mb-0.5">
                                        <span className="font-semibold text-sm truncate flex items-center gap-1">
                                            {conv.isPinned && <Pin className="h-3 w-3 text-blue-500 inline" />}
                                            {conv.leadName}
                                        </span>
                                        <span className="text-[10px] text-slate-400 shrink-0 ml-2">
                                            {formatTime(conv.lastMessageAt)}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 truncate">{conv.lastMessage || "No messages"}</p>
                                </div>

                                {/* Unread Badge */}
                                {conv.unreadCount > 0 && (
                                    <span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center flex-shrink-0">
                                        {conv.unreadCount > 99 ? "99+" : conv.unreadCount}
                                    </span>
                                )}
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* ===== MAIN CHAT AREA ===== */}
            {selectedConv ? (
                <div className="flex-1 flex flex-col min-w-0">
                    {/* Chat Header */}
                    <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white font-bold text-sm">
                                    {selectedConv.leadName?.charAt(0)?.toUpperCase()}
                                </div>
                                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm flex items-center gap-2">
                                    {selectedConv.leadName}
                                    <Badge variant="secondary" className="text-[10px] font-normal">Lead</Badge>
                                </h3>
                                <p className="text-[11px] text-slate-500 flex items-center gap-1">
                                    <Circle className="h-1.5 w-1.5 fill-green-500 text-green-500" />
                                    {selectedConv.leadPhone}
                                    {selectedConv.assignee && <span className="ml-1">· {selectedConv.assignee}</span>}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Phone className="h-4 w-4 text-slate-500" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Video className="h-4 w-4 text-slate-500" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4 text-slate-500" />
                            </Button>
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-1 bg-slate-50/60 dark:bg-slate-950/50">
                        {isLoadingMsgs ? (
                            <div className="space-y-2">
                                {Array.from({ length: 4 }).map((_, i) => <MessageSkeleton key={i} />)}
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center">
                                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                                    <MessageSquare className="h-8 w-8 text-slate-400" />
                                </div>
                                <p className="text-slate-500 text-sm">Start the conversation</p>
                            </div>
                        ) : (
                            groupedMessages.map((group) => (
                                <div key={group.date}>
                                    {/* Date Separator */}
                                    <div className="flex items-center gap-3 my-4">
                                        <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
                                        <span className="text-[10px] text-slate-400 font-medium px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-full">
                                            {group.date}
                                        </span>
                                        <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
                                    </div>

                                    <div className="space-y-2">
                                        {group.msgs.map((msg, idx) => {
                                            const isMe = msg.sender === "agent"
                                            return (
                                                <div key={msg._id || idx} className={`flex ${isMe ? "justify-end" : "justify-start"} gap-2`}>
                                                    {!isMe && (
                                                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 self-end mb-1">
                                                            {selectedConv.leadName?.charAt(0)?.toUpperCase()}
                                                        </div>
                                                    )}
                                                    <div className={`max-w-[70%] flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                                                        <div className={`px-3 py-2 rounded-2xl text-sm shadow-sm ${
                                                            isMe
                                                                ? "bg-blue-600 text-white rounded-tr-sm"
                                                                : "bg-white dark:bg-slate-800 text-slate-800 dark:text-gray-200 border border-slate-200 dark:border-slate-700 rounded-tl-sm"
                                                        } ${msg._id?.startsWith("optimistic") ? "opacity-70" : ""}`}>
                                                            {msg.text}
                                                        </div>
                                                        <div className={`text-[10px] mt-0.5 flex items-center gap-1 ${isMe ? "text-slate-400" : "text-slate-400"}`}>
                                                            {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                                                            {isMe && <CheckCheck className={`h-3 w-3 ${msg._id?.startsWith("optimistic") ? "text-slate-300" : "text-blue-500"}`} />}
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            ))
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0">
                        <div className="flex gap-2 items-center">
                            <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-slate-600">
                                <Paperclip className="h-5 w-5" />
                            </Button>
                            <Input
                                ref={inputRef}
                                value={newMessage}
                                onChange={e => setNewMessage(e.target.value)}
                                onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
                                placeholder="Type a message..."
                                className="flex-1 bg-slate-50 dark:bg-slate-800 rounded-full px-4 border-slate-200 focus-visible:ring-blue-500"
                                disabled={isSending}
                            />
                            <Button
                                onClick={handleSend}
                                disabled={isSending || !newMessage.trim()}
                                className="h-9 w-9 rounded-full bg-blue-600 hover:bg-blue-700 p-0 shrink-0"
                                size="icon"
                            >
                                {isSending
                                    ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                    : <Send className="h-4 w-4" />
                                }
                            </Button>
                        </div>
                    </div>
                </div>
            ) : (
                /* Empty State */
                <div className="flex-1 flex flex-col items-center justify-center text-center p-10 bg-slate-50/40 dark:bg-slate-950/40">
                    <div className="w-20 h-20 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-4">
                        <MessageSquare className="h-10 w-10 text-blue-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-1">Select a conversation</h3>
                    <p className="text-slate-400 text-sm max-w-xs">
                        Choose a conversation from the left to start chatting with a lead.
                        New leads from the website will automatically appear here.
                    </p>
                </div>
            )}
        </div>
    )
}
