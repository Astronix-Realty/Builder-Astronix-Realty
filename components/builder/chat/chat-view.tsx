"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    Search,
    Send,
    MoreVertical,
    Phone,
    Video,
    Paperclip,
    CheckCheck,
    Briefcase
} from "lucide-react"

// Mock Data
const CONVERSATIONS = [
    {
        id: 1,
        user: { name: "Rahul Sharma", role: "Buyer", avatar: "/avatars/01.png", status: "online" },
        lastMessage: "Is the price for Unit 402 negotiable?",
        time: "10:42 AM",
        unread: 2,
        messages: [
            { id: 1, text: "Hi, I'm interested in Sky High Towers.", sender: "user", time: "10:30 AM" },
            { id: 2, text: "Hello Rahul! Great choice. How can I help you?", sender: "me", time: "10:35 AM" },
            { id: 3, text: "I saw the listing for Unit 402. Is it available?", sender: "user", time: "10:38 AM" },
            { id: 4, text: "Yes, 402 is currently available.", sender: "me", time: "10:40 AM" },
            { id: 5, text: "Is the price for Unit 402 negotiable?", sender: "user", time: "10:42 AM" },
        ]
    },
    {
        id: 2,
        user: { name: "Priya Patel", role: "Investor", avatar: "/avatars/02.png", status: "offline" },
        lastMessage: "Thanks for the brochure.",
        time: "Yesterday",
        unread: 0,
        messages: [
            { id: 1, text: "Can you send me the brochure for Green Valley?", sender: "user", time: "Yesterday" },
            { id: 2, text: "Sure, sending it right now.", sender: "me", time: "Yesterday" },
            { id: 3, text: "Thanks for the brochure.", sender: "user", time: "Yesterday" },
        ]
    },
    {
        id: 3,
        user: { name: "Amit Verma", role: "Agent", avatar: "/avatars/03.png", status: "online" },
        lastMessage: "Client is visiting tomorrow at 11.",
        time: "Yesterday",
        unread: 0,
        messages: []
    }
]

export function ChatView() {
    const [selectedChat, setSelectedChat] = useState(CONVERSATIONS[0])
    const [newMessage, setNewMessage] = useState("")

    const handleSend = () => {
        if (!newMessage.trim()) return

        // In a real app, you'd send this to backend
        const msg = {
            id: Date.now(),
            text: newMessage,
            sender: "me",
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }

        const updatedChat = { ...selectedChat, messages: [...selectedChat.messages, msg] }
        setSelectedChat(updatedChat)
        setNewMessage("")
    }

    return (
        <div className="flex h-[calc(100vh-140px)] bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">

            {/* Sidebar (List) */}
            <div className="w-80 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-slate-50/50 dark:bg-slate-900/50">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                    <h2 className="text-xl font-bold mb-4">Messages</h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Search chats..." className="pl-9 bg-white dark:bg-slate-950" />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {CONVERSATIONS.map(chat => (
                        <div
                            key={chat.id}
                            onClick={() => setSelectedChat(chat)}
                            className={`p-4 flex items-start gap-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${selectedChat.id === chat.id ? "bg-blue-50 dark:bg-blue-900/20" : ""}`}
                        >
                            <div className="relative">
                                <Avatar>
                                    <AvatarFallback>{chat.user.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                {chat.user.status === 'online' && (
                                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full"></span>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-baseline mb-1">
                                    <h3 className="font-semibold text-sm truncate">{chat.user.name}</h3>
                                    <span className="text-xs text-muted-foreground">{chat.time}</span>
                                </div>
                                <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                                    {chat.id === 1 && <Briefcase className="h-3 w-3 inline text-blue-500" />}
                                    {chat.lastMessage}
                                </p>
                            </div>
                            {chat.unread > 0 && (
                                <span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                                    {chat.unread}
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col">
                {/* Chat Header */}
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 z-10">
                    <div className="flex items-center gap-3">
                        <Avatar>
                            <AvatarFallback>{selectedChat.user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <h3 className="font-bold flex items-center gap-2">
                                {selectedChat.user.name}
                                <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-normal text-slate-500">
                                    {selectedChat.user.role}
                                </span>
                            </h3>
                            <span className="text-xs text-emerald-500 flex items-center gap-1">
                                ● Online
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon"><Phone className="h-5 w-5 text-slate-500" /></Button>
                        <Button variant="ghost" size="icon"><Video className="h-5 w-5 text-slate-500" /></Button>
                        <Button variant="ghost" size="icon"><MoreVertical className="h-5 w-5 text-slate-500" /></Button>
                    </div>
                </div>

                {/* Messages List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-slate-950/50">
                    {selectedChat.messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[70%] p-3 rounded-2xl shadow-sm text-sm ${msg.sender === 'me'
                                        ? 'bg-blue-600 text-white rounded-tr-none'
                                        : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-gray-200 border border-slate-200 dark:border-slate-700 rounded-tl-none'
                                    }`}
                            >
                                <p>{msg.text}</p>
                                <div className={`text-[10px] mt-1 flex items-center justify-end gap-1 ${msg.sender === 'me' ? 'text-blue-100' : 'text-slate-400'}`}>
                                    {msg.time}
                                    {msg.sender === 'me' && <CheckCheck className="h-3 w-3" />}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
                    <div className="flex gap-2">
                        <Button variant="ghost" size="icon" className="text-slate-400">
                            <Paperclip className="h-5 w-5" />
                        </Button>
                        <Input
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Type a message..."
                            className="flex-1 bg-slate-50 dark:bg-slate-800 border-0 focus-visible:ring-1 focus-visible:ring-blue-500"
                        />
                        <Button onClick={handleSend} className="bg-blue-600 hover:bg-blue-700 text-white">
                            <Send className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
