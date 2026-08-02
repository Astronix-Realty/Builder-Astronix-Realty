const fs = require('fs');
let content = fs.readFileSync('components/builder/crm/crm-clone-view.tsx', 'utf8');

const correctImports = `import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Users, Search, Filter, Phone, Mail, MoreHorizontal, Calendar, MessageSquare,
    UserPlus, ArrowUpRight, GripVertical, Clock, MapPin, DollarSign,
    CheckCircle2, XCircle, AlertCircle, TrendingUp, User, Activity, FileText, Send, Crown,
    Building2, Lock, RefreshCw, Database, Trash2, Home, ArrowRight, ArrowLeft, Split, Merge, Percent, UserMinus
} from "lucide-react"

// --- Types ---
type LeadStatus = "Fresh" | "Token VIP" | "Connected" | "Site Visit" | "Negotiation" | "Final Negotiation" | "Booked" | "Junk"
type Urgency = "Low" | "Medium" | "High"

interface Lead {
    id: string
    _id: string
    name: string
    phone: string
    email: string
    status: LeadStatus
    isTokenPaid: boolean
    requirement: string
    budget: string
    source: string
    assignee: string
    lastActivity: string
    nextAction?: string
    nextActionTime?: string
    notes: string[]
    timeline: { date: string, title: string, desc: string, type: "call" | "visit" | "system" | "note" | "booking" }[]
    interestedUnit?: string
    builderId?: string
    projectId?: string
    createdAt?: string
    isGroup?: boolean
    groupSize?: number
    groupDiscount?: string
    mergedMembers?: any[]
}

// --- Mock Sentry Logger ---
const logger = {
    error: (err: any, context?: any) => {
        console.error("[Sentry Mock] Error:", err, context);
    },
    info: (msg: string, context?: any) => {
        console.info("[Sentry Mock] Info:", msg, context);
    }
}

// --- Mock Data ---
const INITIAL_LEADS: Lead[] = []

// --- Utility: always get a clean string ID from any lead/ObjectId ---
function toId(val: any): string {
    if (!val) return "";
    // Handle MongoDB extended JSON format if it leaks through
    if (typeof val === "object" && val.$oid) return String(val.$oid).trim();
    if (typeof val === "string") return val.trim();
    if (typeof val.toString === "function") {
        const s = val.toString();
        return s === "[object Object]" ? "" : s.trim();
    }
    return String(val).trim();
}

// --- Components ---`;

const startIdx = content.indexOf('import {\r\n    Table,');
const startIdxFallback = content.indexOf('import {\n    Table,');

const finalStartIdx = startIdx !== -1 ? startIdx : startIdxFallback;
const endIdx = content.indexOf('// --- Components ---') + '// --- Components ---'.length;

if (finalStartIdx !== -1 && endIdx !== -1) {
    const newContent = content.substring(0, finalStartIdx) + correctImports + content.substring(endIdx);
    fs.writeFileSync('components/builder/crm/crm-clone-view.tsx', newContent);
    console.log("Fixed!");
} else {
    console.log("Not found.", finalStartIdx, endIdx);
}
