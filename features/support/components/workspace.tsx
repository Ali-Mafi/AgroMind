"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CircleDot, CheckCheck, Inbox, MessageSquareText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AccountShell } from "@/features/account/components/account-shell";
import { useTranslation } from "@/features/settings/hooks/use-translation";
import { useSettings } from "@/features/settings/context/settings-context";
import { SUPPORT_CATEGORIES } from "@/features/account/constants/help";
import { readSupport, writeSupport } from "../services/actions";
import {
  statuses,
  priorities,
  statusLabels,
  priorityLabels,
  type SupportData,
} from "../lib/schema";
const control =
  "min-h-11 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20";
const statusTone: Record<string, string> = {
  open: "border-border bg-muted/50 text-foreground",
  waiting_for_support: "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200",
  waiting_for_user: "border-sky-500/30 bg-sky-500/10 text-sky-800 dark:text-sky-200",
  resolved: "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200",
  closed: "border-border bg-muted text-muted-foreground",
};
const priorityTone: Record<string, string> = {
  high: "text-rose-700 dark:text-rose-300",
  normal: "text-muted-foreground",
  low: "text-muted-foreground",
};
function statusLabel(status: string, staff: boolean) {
  if (staff && status === "waiting_for_support") return "Needs staff response";
  if (staff && status === "waiting_for_user") return "Waiting for customer";
  return statusLabels[status as keyof typeof statusLabels] ?? status;
}

export function SupportPage({
  staff = false,
  ticketId,
}: {
  staff?: boolean;
  ticketId?: string;
}) {
  return (
    <AccountShell title={staff ? "Support workspace" : "Support ticket"}>
      <SupportWorkspace staff={staff} ticketId={ticketId} />
    </AccountShell>
  );
}
export function SupportWorkspace({
  staff = false,
  ticketId,
}: {
  staff?: boolean;
  ticketId?: string;
}) {
  const t = useTranslation();
  const { language } = useSettings();
  const [data, setData] = useState<SupportData>({});
  const [page, setPage] = useState(0);
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [body, setBody] = useState("");
  const [internal, setInternal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const request = useRef<{ payload: string; id: string } | null>(null);
  const generation = useRef(0);
  const refresh = useCallback(() => {
    const version = ++generation.current;
    return readSupport({ staff, ticketId, page, status, priority, category, search: query })
      .then((result) => {
        if (version !== generation.current) return;
        setError(result.error ?? "");
        setData(result.error ? {} : result.data ?? {});
      })
      .catch(() => {
        if (version !== generation.current) return;
        setError("Support is unavailable. Please try again.");
        setData({});
      })
      .finally(() => { if (version === generation.current) setLoading(false); });
  }, [staff, ticketId, page, status, priority, category, query]);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  async function submit(payload: Record<string, unknown>) {
    if (busy) return;
    const encoded = JSON.stringify(payload);
    if (request.current?.payload !== encoded)
      request.current = { payload: encoded, id: crypto.randomUUID() };
    setBusy(true);
    setError("");
    setSuccess(false);
    try {
      const result = await writeSupport({
        ...payload,
        requestId: request.current.id,
      });
      if (result.error) setError(result.error);
      else {
        request.current = null;
        setBody("");
        setSuccess(true);
        await refresh();
      }
    } catch {
      setError("Support is unavailable. Please try again.");
    } finally {
      setBusy(false);
    }
  }
  const date = (value: string) =>
    new Intl.DateTimeFormat(language === "fa" ? "fa-IR" : "en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  const ticket = data.ticket;
  const visibleTickets = data.tickets?.slice(0, 20) ?? [];
  const unreadCount = visibleTickets.filter((item) => item.unread).length;
  return (
    <section
      className="app-card min-w-0 space-y-5 p-5 sm:p-7"
      aria-busy={loading || busy}
    >
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border/70 pb-5">
        <div className="min-w-0 space-y-2">
          <h2 className="flex items-center gap-2 text-lg font-semibold sm:text-xl">
            <Inbox className="size-5 shrink-0 text-primary" aria-hidden="true" />
            {t(ticketId ? "Support ticket" : staff ? "Support workspace" : "My support tickets")}
          </h2>
          {!ticketId && (
            <p className="max-w-xl text-sm leading-6 text-muted-foreground">
              {t(staff ? "Review new requests, reply to customers and track unresolved cases." : "Follow your requests, read replies and continue the conversation here.")}
            </p>
          )}
        </div>
        <Button
          variant="outline"
          className="min-h-11 shrink-0"
          disabled={loading || busy}
          onClick={() => { setLoading(true); void refresh(); }}
        >
          {t("Refresh")}
        </Button>
      </header>
      {staff && (
        <p className="rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-xs leading-6 text-muted-foreground">
          {t("Staff actions require an authenticator verification within the last 15 minutes.")}{" "}
          <Link href="/admin/support/verify" className="font-semibold text-primary underline-offset-4 hover:underline">
            {t("Verify identity")}
          </Link>
        </p>
      )}
      {loading && <p role="status">{t("Loading tickets…")}</p>}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {t(error)}
        </p>
      )}
      {success && (
        <p role="status" className="text-sm text-primary">
          {t("Your changes have been saved.")}
        </p>
      )}
      {!ticketId && (
        <>
          <div className="grid gap-3 rounded-xl border border-border/70 bg-muted/15 p-3 sm:grid-cols-2 xl:grid-cols-3">
            <label className="space-y-1 text-sm">
              {t("Status")}
              <select
                className={control}
                value={status}
                onChange={(e) => {
                  setLoading(true); setStatus(e.target.value);
                  setPage(0);
                }}
              >
                <option value="">{t("All statuses")}</option>
                {statuses.map((s) => (
                  <option key={s} value={s}>
                    {t(statusLabels[s])}
                  </option>
                ))}
              </select>
            </label>
            {staff && (
              <>
                <label className="space-y-1 text-sm">
                  {t("Priority")}
                  <select
                    className={control}
                    value={priority}
                    onChange={(e) => {
                      setLoading(true); setPriority(e.target.value);
                      setPage(0);
                    }}
                  >
                    <option value="">{t("All priorities")}</option>
                    {priorities.map((s) => (
                      <option key={s} value={s}>
                        {t(priorityLabels[s])}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1 text-sm">
                  {t("Category")}
                  <select
                    className={control}
                    value={category}
                    onChange={(e) => {
                      setLoading(true); setCategory(e.target.value);
                      setPage(0);
                    }}
                  >
                    <option value="">{t("All categories")}</option>
                    {SUPPORT_CATEGORIES.map((s) => (
                      <option key={s} value={s}>
                        {t(s)}
                      </option>
                    ))}
                  </select>
                </label>
                <form
                  className="flex items-end gap-2 sm:col-span-2 xl:col-span-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (query === search && page === 0) { setLoading(true); void refresh(); } else { setLoading(true); setQuery(search); }
                    setPage(0);
                  }}
                >
                  <label className="min-w-0 flex-1 text-sm">
                    {t("Ticket number, subject or user email")}
                    <input
                      className={control}
                      value={search}
                      maxLength={120}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </label>
                  <Button type="submit">{t("Search")}</Button>
                </form>
              </>
            )}
          </div>
          {!loading && !error && (
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground" aria-live="polite">
              <span>{t("Tickets on this page")}: <strong className="tabular-nums text-foreground">{visibleTickets.length}</strong></span>
              <span className={unreadCount ? "font-semibold text-primary" : ""}>
                {t("Unread on this page")}: <strong className="tabular-nums">{unreadCount}</strong>
              </span>
            </div>
          )}
          {!loading && !error && !visibleTickets.length && (
            <div className="rounded-xl border border-dashed border-border p-7 text-center">
              <Inbox className="mx-auto mb-3 size-8 text-muted-foreground/60" aria-hidden="true" />
              <p className="font-medium">{t("No tickets match this view.")}</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                {t(staff ? "Try another status or search term." : "Your submitted requests will appear here.")}
              </p>
            </div>
          )}
          <ul className="space-y-2" aria-label={t(staff ? "Support workspace" : "My support tickets")}>
            {visibleTickets.map((item) => (
              <li key={item.id}>
                <Link
                  className={`group block rounded-xl border border-s-4 px-4 py-3.5 transition-colors hover:border-primary/50 hover:bg-primary/[0.04] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                    item.unread
                      ? "border-primary/30 border-s-primary bg-primary/[0.07] shadow-sm"
                      : "border-border border-s-transparent bg-card"
                  }`}
                  href={staff ? `/admin/support?ticket=${item.id}` : `/account/help/tickets/${item.id}`}
                  aria-label={`${t(item.unread ? "Unread" : "Read")} · ${item.ticket_number} · ${item.subject}`}
                >
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                        <bdi className="text-xs font-medium tabular-nums text-muted-foreground">{item.ticket_number}</bdi>
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold ${item.unread ? "text-primary" : "text-muted-foreground"}`}>
                          {item.unread ? <CircleDot className="size-3.5" aria-hidden="true" /> : <CheckCheck className="size-3.5" aria-hidden="true" />}
                          {t(item.unread ? "Unread" : "Read")}
                        </span>
                      </div>
                      <h3 className={`break-words text-sm leading-6 sm:text-base ${item.unread ? "font-bold" : "font-medium"}`}>{item.subject}</h3>
                      {staff && item.user_email && <p className="break-all text-xs text-muted-foreground">{item.user_email}</p>}
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className={`rounded-md border px-2 py-1 font-medium ${statusTone[item.status]}`}>
                          {t(statusLabel(item.status, staff))}
                        </span>
                        {staff && <span className={`font-medium ${priorityTone[item.priority]}`}>{t("Priority")}: {t(priorityLabels[item.priority])}</span>}
                        {!staff && <span className="text-muted-foreground">{t(item.category)}</span>}
                      </div>
                    </div>
                    <time dateTime={item.updated_at} className="shrink-0 text-end text-[11px] leading-5 text-muted-foreground sm:text-xs">
                      {date(item.updated_at)}
                    </time>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
      {ticket && (
        <>
          <Link
            href={staff ? "/admin/support" : "/account/help"}
            className="text-sm text-primary underline"
          >
            {t("Back to tickets")}
          </Link>
          <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-4">
            <bdi className="text-xs font-medium tabular-nums text-muted-foreground">{ticket.ticket_number}</bdi>
            <h3 className="break-words text-lg font-semibold">{ticket.subject}</h3>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className={`rounded-md border px-2 py-1 font-medium ${statusTone[ticket.status]}`}>{t(statusLabel(ticket.status, staff))}</span>
              <span className="rounded-md border border-border bg-card px-2 py-1">{t(ticket.category)}</span>
              {staff && <span className={`rounded-md border border-border bg-card px-2 py-1 ${priorityTone[ticket.priority]}`}>{t("Priority")}: {t(priorityLabels[ticket.priority])}</span>}
            </div>
            <p className="text-xs leading-6 text-muted-foreground">
              {t("Created")}: <time dateTime={ticket.created_at}>{date(ticket.created_at)}</time>
              {" · "}
              {t("Updated")}: <time dateTime={ticket.updated_at}>{date(ticket.updated_at)}</time>
            </p>
          </div>
          <div className="space-y-3">
            <h4 className="flex items-center gap-2 text-sm font-semibold">
              <MessageSquareText className="size-4 text-primary" aria-hidden="true" /> {t("Conversation history")}
            </h4>
            <ol className="space-y-3" aria-label={t("Conversation history")}>
              {data.messages?.map((message) => (
                <li key={message.id} className={`max-w-[95%] space-y-2 rounded-xl border px-4 py-3 sm:max-w-[88%] ${
                  message.internal
                    ? "border-amber-500/30 bg-amber-500/10"
                    : message.staff
                      ? "ms-auto border-primary/20 bg-primary/[0.07]"
                      : "me-auto border-border bg-muted/35"
                }`}>
                  <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">
                      {t(message.internal ? "Internal note" : message.staff ? "Support team" : "Customer")}
                    </span>
                    <time dateTime={message.created_at}>{date(message.created_at)}</time>
                  </div>
                  <p dir="auto" className="whitespace-pre-wrap break-words text-sm leading-7">{message.body}</p>
                </li>
              ))}
            </ol>
          </div>
          {staff && (
            <form
              className="rounded-xl border border-border/70 bg-muted/15 p-4"
              key={ticket.version}
              onSubmit={(e) => {
                e.preventDefault();
                const form = new FormData(e.currentTarget);
                void submit({
                  action: "update",
                  ticketId,
                  version: ticket.version,
                  status: form.get("status"),
                  priority: form.get("priority"),
                });
              }}
            >
              <fieldset disabled={busy} className="grid gap-3 sm:grid-cols-3">
                <label className="text-sm">
                  {t("Status")}
                  <select
                    name="status"
                    defaultValue={ticket.status}
                    className={control}
                  >
                    {statuses.map((s) => (
                      <option key={s} value={s}>
                        {t(statusLabels[s])}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm">
                  {t("Priority")}
                  <select
                    name="priority"
                    defaultValue={ticket.priority}
                    className={control}
                  >
                    {priorities.map((s) => (
                      <option key={s} value={s}>
                        {t(priorityLabels[s])}
                      </option>
                    ))}
                  </select>
                </label>
                <Button type="submit" className="self-end">
                  {t("Save changes")}
                </Button>
              </fieldset>
            </form>
          )}
          {ticket.status === "resolved" && (
            <Button
              disabled={busy}
              onClick={() => void submit({ action: "reopen", ticketId })}
            >
              {t("Reopen ticket")}
            </Button>
          )}
          {(staff || !["resolved", "closed"].includes(ticket.status)) && (
            <form
              className="rounded-xl border border-border/70 p-4"
              onSubmit={(e) => {
                e.preventDefault();
                void submit({ action: "reply", ticketId, body, internal });
              }}
            >
              <fieldset disabled={busy} className="space-y-3">
                <label className="block space-y-2 text-sm">
                  {t("Reply")}
                  <textarea
                    className={`${control} min-h-32`}
                    rows={5}
                    required
                    maxLength={4000}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                  />
                </label>
                <p className="text-xs text-muted-foreground">
                  {t(
                    "Tell us what happened and what you expected. Do not include passwords or verification codes.",
                  )}
                </p>
                {staff && (
                  <label className="flex min-h-11 items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={internal}
                      onChange={(e) => setInternal(e.target.checked)}
                    />
                    {t("Internal note — only visible to support staff")}
                  </label>
                )}
                <Button type="submit" disabled={!body.trim()}>
                  {t(busy ? "Sending…" : "Send reply")}
                </Button>
              </fieldset>
            </form>
          )}
        </>
      )}
      <nav
        aria-label={t("Ticket pagination")}
        className="flex justify-between gap-3"
      >
        <Button
          variant="outline"
          disabled={page === 0 || loading || busy}
          onClick={() => { setLoading(true); setPage((p) => p - 1); }}
        >
          {t("Previous")}
        </Button>
        <Button
          variant="outline"
          disabled={
            loading ||
            busy ||
            !(ticketId ? data.hasMore : (data.tickets?.length ?? 0) > 20)
          }
          onClick={() => { setLoading(true); setPage((p) => p + 1); }}
        >
          {t("Next")}
        </Button>
      </nav>
    </section>
  );
}
