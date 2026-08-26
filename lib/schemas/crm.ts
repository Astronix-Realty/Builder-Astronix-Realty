import { z } from "zod";

export const TimelineEventSchema = z.object({
  date: z.string().or(z.date()).transform(d => new Date(d).toISOString()),
  title: z.string(),
  desc: z.string(),
  type: z.enum(["call", "visit", "system", "note", "booking"]).catch("system"),
});

export const LeadSchema = z.object({
  id: z.string(),
  _id: z.string(),
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(1, "Phone is required"),
  email: z.string().optional().or(z.null()).or(z.literal("")),
  status: z.enum(["Fresh", "Token VIP", "Connected", "Site Visit", "Negotiation", "Final Negotiation", "Booked", "Junk"]).catch("Fresh"),
  isTokenPaid: z.boolean().default(false),
  requirement: z.string().optional(),
  budget: z.string().optional(),
  isGroup: z.boolean().optional(),
  groupSize: z.number().optional(),
  groupDiscount: z.string().optional(),
  source: z.string().default("Website"),
  assignee: z.string().optional(),
  lastActivity: z.string().optional(),
  nextAction: z.string().optional(),
  nextActionTime: z.string().optional(),
  notes: z.array(z.string()).default([]),
  timeline: z.array(TimelineEventSchema).default([]),
  mergedMembers: z.array(z.any()).optional(),
  groupPoolKey: z.string().optional(),
  poolRootLevel: z.string().optional(),
  poolRootPropertyId: z.string().optional(),
  poolRootPropertyName: z.string().optional(),
  topPropertyName: z.string().optional(),
  clickedLevel: z.string().optional(),
  clickedPropertyName: z.string().optional(),
  sourceUrl: z.string().optional(),
  interestedUnit: z.string().optional(),
  builderId: z.string().optional(),
  projectId: z.string().optional(),
  createdAt: z.string().optional(),
  // New property for optimistic mutation tracking
  clientMutationId: z.string().optional(),
});

export type ValidatedLead = z.infer<typeof LeadSchema>;
export type ValidatedTimelineEvent = z.infer<typeof TimelineEventSchema>;
