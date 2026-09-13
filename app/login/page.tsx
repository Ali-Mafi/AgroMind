import { redirect } from "next/navigation";
import { safeNextPath } from "@/features/authentication/lib/redirects";
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  redirect("/sign-in?next=" + encodeURIComponent(safeNextPath((await searchParams).next)));
}
