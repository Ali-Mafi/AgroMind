import { z } from "zod";
import { SUPPORT_CATEGORIES } from "@/features/account/constants/help";
export const statuses = [
  "open",
  "waiting_for_support",
  "waiting_for_user",
  "resolved",
  "closed",
] as const;
export const priorities = ["low", "normal", "high"] as const;
const base = { requestId: z.uuid() };
export const commandSchema = z.discriminatedUnion("action", [
  z
    .object({
      ...base,
      action: z.literal("create"),
      subject: z.string().trim().min(3).max(120),
      category: z.enum(SUPPORT_CATEGORIES),
      body: z.string().trim().min(20).max(4000),
      language: z.enum(["fa", "en"]).optional(),
    })
    .strict(),
  z
    .object({
      ...base,
      action: z.literal("reply"),
      ticketId: z.uuid(),
      body: z.string().trim().min(1).max(4000),
      internal: z.boolean(),
    })
    .strict(),
  z
    .object({
      ...base,
      action: z.literal("update"),
      ticketId: z.uuid(),
      status: z.enum(statuses),
      priority: z.enum(priorities),
      version: z.number().int().positive(),
    })
    .strict(),
  z
    .object({ ...base, action: z.literal("reopen"), ticketId: z.uuid() })
    .strict(),
]);
export const readSchema = z
  .object({
    ticketId: z.uuid().optional(),
    page: z.number().int().min(0).max(10000).default(0),
    staff: z.boolean().default(false),
    search: z.string().trim().max(120).default(""),
    status: z.enum([...statuses, ""]).default(""),
    priority: z.enum([...priorities, ""]).default(""),
    category: z.enum([...SUPPORT_CATEGORIES, ""]).default(""),
  })
  .strict();
export type Ticket = {
  id: string;
  ticket_number: string;
  subject: string;
  category: string;
  status: (typeof statuses)[number];
  priority: (typeof priorities)[number];
  version: number;
  created_at: string;
  updated_at: string;
  unread?: boolean;
  user_email?: string;
};
export type Message = {
  id: string;
  body: string;
  internal: boolean;
  staff: boolean;
  created_at: string;
};
export type SupportData = {
  tickets?: Ticket[];
  ticket?: Ticket;
  messages?: Message[];
  hasMore?: boolean;
  staff?: boolean;
};
export const statusLabels = {
  open: "Open",
  waiting_for_support: "Waiting for support",
  waiting_for_user: "Waiting for your reply",
  resolved: "Resolved",
  closed: "Closed",
};
export const priorityLabels = { low: "Low", normal: "Normal", high: "High" };
