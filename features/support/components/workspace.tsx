"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
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
  "min-h-11 w-full rounded-xl border bg-background px-3 py-2 text-base";
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
  return (
    <section
      className="app-card min-w-0 space-y-5 p-5 sm:p-7"
      aria-busy={loading || busy}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">
          {t(
            ticketId
              ? "Support ticket"
              : staff
                ? "Support workspace"
                : "My support tickets",
          )}
        </h2>
        <Button
          variant="outline"
          disabled={loading || busy}
          onClick={() => { setLoading(true); void refresh(); }}
        >
          {t("Refresh")}
        </Button>
      </div>
      {staff && (
        <p className="text-sm text-muted-foreground">
          {t(
            "Staff actions require an authenticator verification within the last 15 minutes.",
          )}{" "}
          <Link href="/admin/support/verify" className="text-primary underline">
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
          <div className="grid gap-3 sm:grid-cols-2">
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
                  className="flex items-end gap-2"
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
          {!loading && !error && !data.tickets?.length && (
            <p className="text-sm text-muted-foreground">
              {t("No tickets match this view.")}
            </p>
          )}
          <ul className="divide-y">
            {data.tickets?.slice(0, 20).map((item) => (
              <li key={item.id} className="py-4">
                <Link
                  className="block space-y-2 rounded-lg focus-visible:outline-2 focus-visible:outline-primary"
                  href={
                    staff
                      ? `/admin/support?ticket=${item.id}`
                      : `/account/help/tickets/${item.id}`
                  }
                >
                  <div className="flex flex-wrap gap-2">
                    <bdi className="text-sm text-muted-foreground">
                      {item.ticket_number}
                    </bdi>
                    {item.unread && (
                      <span className="text-sm font-semibold text-primary">
                        {t("Unread")}
                      </span>
                    )}
                  </div>
                  <p className="break-words font-medium">{item.subject}</p>
                  <p className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                    <span>{t(statusLabels[item.status])}</span>
                    <span>{t(priorityLabels[item.priority])}</span>
                    <time dateTime={item.updated_at}>
                      {date(item.updated_at)}
                    </time>
                  </p>
                  {staff && (
                    <p className="break-all text-sm text-muted-foreground">
                      {item.user_email}
                    </p>
                  )}
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
          <div className="space-y-2">
            <bdi>{ticket.ticket_number}</bdi>
            <h3 className="break-words text-lg font-semibold">
              {ticket.subject}
            </h3>
            <p className="text-sm">
              {t(ticket.category)} · {t(statusLabels[ticket.status])} ·{" "}
              {t(priorityLabels[ticket.priority])}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("Created")}:{" "}
              <time dateTime={ticket.created_at}>
                {date(ticket.created_at)}
              </time>
              <br />
              {t("Updated")}:{" "}
              <time dateTime={ticket.updated_at}>
                {date(ticket.updated_at)}
              </time>
            </p>
          </div>
          <ol className="divide-y">
            {data.messages?.map((message) => (
              <li key={message.id} className="space-y-2 py-4">
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span>
                    {t(
                      message.internal
                        ? "Internal note"
                        : message.staff
                          ? "Support team"
                          : "Customer",
                    )}
                  </span>
                  <time dateTime={message.created_at}>
                    {date(message.created_at)}
                  </time>
                </div>
                <p
                  dir="auto"
                  className="whitespace-pre-wrap break-words text-sm leading-7"
                >
                  {message.body}
                </p>
              </li>
            ))}
          </ol>
          {staff && (
            <form
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
