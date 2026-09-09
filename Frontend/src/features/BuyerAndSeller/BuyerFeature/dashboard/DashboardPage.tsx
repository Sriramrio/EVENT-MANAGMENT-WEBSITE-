import { useState } from "react";
import { CalendarDays, ClipboardList, FileText, Target, ChevronLeft, ChevronRight } from "lucide-react";
import { KpiCard } from "../../../../components/data-display/KpiCard";
import { ErrorState, LoadingState } from "../../../../components/ui/PageStates";
import {
  useMeetings,
  useRequirementMatches,
  useRequirements,
  useRfqs,
} from "../../../../services/buyer/hooks";
import { ScreenShell } from "../shared/ScreenShell";
import { Card, CardHeader } from "../../../../components/ui/Card";
import { StatusBadge } from "../../../../components/ui/StatusBadge";
import { Button } from "../../../../components/ui/Button";

const ITEMS_PER_PAGE = 5;

export default function DashboardPage() {
  const [currentPage, setCurrentPage] = useState(1);

  const req = useRequirements();
  const meetings = useMeetings();
  const rfq = useRfqs();

  const priorityRequirement =
    req.data?.find((x) => x.status === "Active") ?? req.data?.[0];
  const matches = useRequirementMatches(priorityRequirement?.id ?? "");

  if (req.isLoading) {
    return <LoadingState label="Building Buyer dashboard…" />;
  }

  if (req.isError) {
    return <ErrorState error={req.error} retry={() => req.refetch()} />;
  }

  const matchesHref = priorityRequirement
    ? `/buyer/requirements/${priorityRequirement.id}/matches`
    : "/buyer/requirements";

  const active = req.data?.filter((x) => x.status === "Active").length ?? 0;

  // Derive category breakdown dynamically
  const categoryBreakdown = (() => {
    const rows = req.data ?? [];
    if (rows.length === 0)
      return [] as { name: string; count: number; pct: number }[];
    const counts = new Map<string, number>();
    for (const r of rows) {
      const key =
        r.category && r.category !== "Not selected"
          ? r.category
          : "Uncategorised";
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([name, count]) => ({
        name,
        count,
        pct: Math.round((count / rows.length) * 100),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);
  })();

  // Pagination for Requirements Snapshot
  const totalItems = req.data?.length ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedRequirements = req.data?.slice(startIndex, startIndex + ITEMS_PER_PAGE) ?? [];

  return (
    <ScreenShell
      screen={5}
      title="Buyer Dashboard Overview"
      subtitle="Track requirements, matches, meetings and opportunities in one place."
    >
      {/* KPI Cards Grid */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Active Requirements"
          value={active}
          detail="Across current sourcing plans"
          icon={ClipboardList}
          href="/buyer/requirements?status=Active"
        />
        <KpiCard
          label="Matches Found"
          value={matches.data?.length ?? 0}
          detail="For priority requirement"
          icon={Target}
          href={matchesHref}
        />
        <KpiCard
          label="Meetings Scheduled"
          value={meetings.data?.length ?? 0}
          icon={CalendarDays}
          href="/buyer/meetings"
        />
        <KpiCard
          label="RFQs Sent"
          value={rfq.data?.filter((x) => x.status !== "Draft").length ?? 0}
          icon={FileText}
          href="/buyer/rfqs"
        />
      </div>

      {/* Analytics & Matches Grid */}
      <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_.8fr_.9fr]">
        <Card>
          <CardHeader
            title="Opportunity Summary"
            subtitle="Current requirement mix"
          />
          <div className="p-5">
            <div className="mx-auto grid h-36 w-36 place-items-center rounded-full border-[18px] border-blue-100">
              <div className="text-center">
                <div className="text-2xl font-extrabold">
                  {req.data?.length ?? 0}
                </div>
                <div className="text-[10px] text-slate-500">Total</div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              {["Active", "Draft", "Matching", "Closed"].map((s) => (
                <div
                  className="flex justify-between rounded-lg bg-slate-50 p-2"
                  key={s}
                >
                  <span>{s}</span>
                  <b>{req.data?.filter((x) => x.status === s).length ?? 0}</b>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Top Sourcing Categories" />
          <div className="space-y-4 p-5">
            {categoryBreakdown.length === 0 ? (
              <p className="text-xs text-slate-400">No requirements yet.</p>
            ) : (
              categoryBreakdown.map((c) => (
                <div key={c.name}>
                  <div className="flex justify-between text-xs">
                    <b>{c.name}</b>
                    <span>{c.pct}%</span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-blue-600"
                      style={{ width: `${c.pct}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Recent Matches"
            action={
              <a href={matchesHref} className="text-xs font-bold text-blue-600">
                View all
              </a>
            }
          />
          <div className="divide-y divide-slate-100">
            {matches.data?.slice(0, 4).map((m) => (
              <a
                href={`/buyer/suppliers/${m.supplierId}?requirement=${priorityRequirement?.id ?? ""}`}
                className="flex items-center justify-between p-4 hover:bg-slate-50"
                key={m.id}
              >
                <div>
                  <div className="text-xs font-bold">{m.supplierName}</div>
                  <div className="text-[10px] text-slate-500">{m.location}</div>
                </div>
                <span className="text-sm font-extrabold text-emerald-600">
                  {m.overallScore}%
                </span>
              </a>
            ))}
          </div>
        </Card>
      </div>

      {/* Bottom Grids */}
      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader title="Upcoming Meetings" />
          <div className="p-4">
            {meetings.data?.slice(0, 4).map((m) => (
              <div
                className="mb-2 flex items-center justify-between rounded-xl border border-slate-100 p-3"
                key={m.id}
              >
                <div>
                  <b className="text-xs">{m.supplierName}</b>
                  <p className="text-[10px] text-slate-500">
                    {m.date} · {m.startTime} · {m.venue}
                  </p>
                </div>
                <StatusBadge status={m.status} />
              </div>
            ))}
          </div>
        </Card>

        {/* Requirements Snapshot with Pagination */}
        <Card>
          <CardHeader
            title="Requirements Snapshot"
            action={
              <span className="text-[11px] text-slate-500">
                Page {currentPage} of {totalPages}
              </span>
            }
          />
          <div className="p-4">
            <div className="min-h-[220px]">
              {paginatedRequirements.length === 0 ? (
                <p className="text-xs text-slate-400">No requirements found.</p>
              ) : (
                paginatedRequirements.map((r) => (
                  <div
                    className="mb-2 grid grid-cols-[5.5rem_1fr_auto] items-center gap-3 rounded-lg p-2 hover:bg-slate-50"
                    key={r.id}
                  >
                    <span className="text-xs font-extrabold text-brand-600">
                      {r.code}
                    </span>
                    <span className="truncate text-xs">{r.title}</span>
                    <StatusBadge status={r.status} />
                  </div>
                ))
              )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                <span className="text-[11px] text-slate-500">
                  Showing {startIndex + 1}–
                  {Math.min(startIndex + ITEMS_PER_PAGE, totalItems)} of{" "}
                  {totalItems}
                </span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    className="inline-flex h-7 w-7 items-center justify-center rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Previous Page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    disabled={currentPage === totalPages}
                    onClick={() =>
                      setCurrentPage((p) => Math.min(p + 1, totalPages))
                    }
                    className="inline-flex h-7 w-7 items-center justify-center rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Next Page"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </ScreenShell>
  );
}