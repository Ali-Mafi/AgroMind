import { handleAuthEmail } from "@/features/authentication/services/email-hook";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 10;
export const POST = handleAuthEmail;
