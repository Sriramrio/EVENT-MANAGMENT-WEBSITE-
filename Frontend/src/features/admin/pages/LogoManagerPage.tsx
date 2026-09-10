import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Image as ImageIcon,
  Search,
  Download,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from "lucide-react";
import { apiClient, ApiError } from "../../../data/api/apiClient";
import { PageHeader } from "../../../shared/components/PageHeader";

interface LogoStatusRow {
  exhibitorId: string;
  companyName: string;
  tradeName: string | null;
  email: string;
  mobile: string;
  hasLogo: boolean;
  createdAt: string;
}

interface LogoStatusResponse {
  total: number;
  uploaded: number;
  pending: number;
  exhibitors: LogoStatusRow[];
}

const LOGO_STATUS_KEY = ["admin", "logo-manager", "exhibitors"] as const;

function triggerBlobDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export default function LogoManagerPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "uploaded" | "pending">("all");
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState("");

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: LOGO_STATUS_KEY,
    queryFn: () =>
      apiClient.get<LogoStatusResponse>("/admin/logo-manager/exhibitors"),
  });

  const rows = data?.exhibitors ?? [];

  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      if (filter === "uploaded" && !r.hasLogo) return false;
      if (filter === "pending" && r.hasLogo) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        return (
          r.companyName.toLowerCase().includes(q) ||
          (r.tradeName ?? "").toLowerCase().includes(q) ||
          r.email.toLowerCase().includes(q) ||
          r.mobile.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [rows, filter, search]);

  async function handleDownloadZip() {
    try {
      setIsDownloading(true);
      setError("");
      const { blob, fileName } = await apiClient.getBlob(
        "/admin/logo-manager/download-zip",
      );
      triggerBlobDownload(blob, fileName ?? "exhibitor-logos.zip");
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Unable to download logos.";
      setError(message);
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Logo Manager"
        description="Track which exhibitors have uploaded their company logo, and download every uploaded logo as a single ZIP."
        actions={
          <>
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={isFetching ? "animate-spin" : ""}
              />
              Refresh
            </button>
            <button
              type="button"
              onClick={handleDownloadZip}
              disabled={isDownloading || (data?.uploaded ?? 0) === 0}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download size={16} />
              {isDownloading
                ? "Preparing ZIP..."
                : `Download All Logos (${data?.uploaded ?? 0})`}
            </button>
          </>
        }
      />

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-500">Total Exhibitors</p>
          <p className="mt-1 text-2xl font-bold text-slate-950">
            {data?.total ?? 0}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setFilter("uploaded")}
          className={`rounded-xl border p-4 text-left transition ${
            filter === "uploaded"
              ? "border-emerald-400 bg-emerald-50"
              : "border-slate-200 bg-white"
          }`}
        >
          <p className="text-xs font-medium text-emerald-700">Logo Uploaded</p>
          <p className="mt-1 text-2xl font-bold text-emerald-700">
            {data?.uploaded ?? 0}
          </p>
        </button>
        <button
          type="button"
          onClick={() => setFilter("pending")}
          className={`rounded-xl border p-4 text-left transition ${
            filter === "pending"
              ? "border-amber-400 bg-amber-50"
              : "border-slate-200 bg-white"
          }`}
        >
          <p className="text-xs font-medium text-amber-700">Logo Pending</p>
          <p className="mt-1 text-2xl font-bold text-amber-700">
            {data?.pending ?? 0}
          </p>
        </button>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search company, email, mobile..."
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-indigo-400"
          />
        </div>
        {filter !== "all" && (
          <button
            type="button"
            onClick={() => setFilter("all")}
            className="text-sm font-medium text-indigo-600 hover:underline"
          >
            Clear filter ({filter})
          </button>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-100 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">
                Company Name
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">
                Email
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">
                Mobile
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">
                Logo Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading && (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-8 text-center text-slate-400"
                >
                  Loading...
                </td>
              </tr>
            )}
            {!isLoading && filteredRows.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-8 text-center text-slate-400"
                >
                  No exhibitors found.
                </td>
              </tr>
            )}
            {filteredRows.map((row) => (
              <tr key={row.exhibitorId} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <ImageIcon size={16} className="text-slate-400" />
                    <span className="font-medium text-slate-900">
                      {row.companyName}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-600">{row.email}</td>
                <td className="px-4 py-3 text-slate-600">{row.mobile}</td>
                <td className="px-4 py-3">
                  {row.hasLogo ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                      <CheckCircle2 size={14} />
                      Uploaded
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                      <XCircle size={14} />
                      Not Uploaded
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
