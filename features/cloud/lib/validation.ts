import { z } from "zod";
import { COUNTRY_CODES } from "@/features/settings/constants/locale-options";

export const entityIdSchema = z.string().regex(/^[A-Za-z0-9_-]{1,128}$/);
export const timeZoneSchema = z
  .string()
  .max(100)
  .refine((value) => {
    try {
      new Intl.DateTimeFormat("en", { timeZone: value });
      return true;
    } catch {
      return false;
    }
  }, "Choose a valid time zone.");

const text = z.string().min(1).max(120);
export const farmSchema = z
  .object({
    id: entityIdSchema,
    name: z.string().min(1).max(120).refine((value) => value.trim().length > 0),
    location: z.string().max(500),
    coordinates: z
      .object({
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
      })
      .passthrough()
      .optional(),
    area: z.number().min(0).max(1e12),
    type: z.enum(["farm", "garden"]),
    crop: z.object({ id: z.string().min(1).max(128), name: text }).passthrough().optional(),
    irrigationType: z.enum(["flood", "drip", "sprinkler", "other"]).optional(),
    plants: z
      .array(
        z
          .object({
            id: z.string().min(1).max(128),
            name: text,
            quantity: z.number().min(0),
            spacing: z.number().min(0),
            age: z.number().min(0),
          })
          .passthrough(),
      )
      .max(1000)
      .optional(),
  })
  .passthrough();

export const scheduleSchema = z
  .object({
    id: z.string().min(1).max(128).optional(),
    revision: z.number().int().min(1).optional(),
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .refine((s) => {
        const d = new Date(`${s}T00:00:00Z`);
        return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === s;
      }),
    time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    duration: z.number().min(1).max(1440),
    timeZone: timeZoneSchema.optional(),
    createdAt: z.iso.datetime({ offset: true }).optional(),
    updatedAt: z.iso.datetime({ offset: true }).optional(),
  })
  .passthrough();

export const legacySnapshotSchema = z
  .object({
    farms: z.array(farmSchema).max(1000),
    schedules: z.record(entityIdSchema, scheduleSchema),
  })
  .strict()
  .superRefine((value, context) => {
    const ids = new Set(value.farms.map((farm) => farm.id));
    if (ids.size !== value.farms.length || Object.keys(value.schedules).some((id) => !ids.has(id))) {
      context.addIssue({
        code: "custom",
        message: "The local backup contains duplicate IDs or orphan schedules.",
      });
    }
  });

const profileFirstName = z
  .string()
  .trim()
  .min(1, "Enter your first name.")
  .max(60, "Use no more than 60 characters.");

const profileLastName = z
  .string()
  .trim()
  .max(60, "Use no more than 60 characters.");

export const profileSchema = z
  .object({
    first_name: profileFirstName,
    last_name: profileLastName,
    country_code: z
      .string()
      .refine((value) => COUNTRY_CODES.includes(value), "Choose a valid country."),
    language: z.enum(["en", "fa"]),
    timezone: timeZoneSchema,
    onboarding_step: z.number().int().min(0).max(5).optional(),
  })
  .strict();
