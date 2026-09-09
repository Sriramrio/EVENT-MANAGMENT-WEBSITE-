import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Lock, Search } from "lucide-react";
import { Button } from "../../../../components/ui/Button";
import {
  SelectInput,
  TextInput,
} from "../../../../components/forms/FormFields";
import { useSaveDraft } from "../../../../services/buyer/hooks";
import {
  useHsnSearch,
  type HsnEntry,
} from "../../../../services/referenceData/hooks";
import { useRequirementWizard } from "./wizard/requirementWizardStore";
import { RequirementStepper } from "./wizard/RequirementStepper";
import { ChipInput } from "./wizard/ChipInput";

export default function ProductDetailsPage() {
  const { id = "req-001" } = useParams();
  const nav = useNavigate();
  const save = useSaveDraft(`requirements/${id}/steps/classification`);
  const wizard = useRequirementWizard();

  // Extract clean code prefix (e.g., '848240')
  const defaultSearchQuery = useMemo(() => {
    return wizard.classificationCode || wizard.classification || "";
  }, [wizard.classificationCode, wizard.classification]);

  const [query, setQuery] = useState(defaultSearchQuery);
  const [selected, setSelected] = useState<HsnEntry | null>(wizard.hsn);
  const [quantity, setQuantity] = useState(wizard.quantity || 1);
  const [uom, setUom] = useState(
    wizard.uom ||
      (wizard.codeType === "SAC" ? "Hours" : "NOS (Number of Units)"),
  );
  const [keywords, setKeywords] = useState<string[]>(
    wizard.keywords || ["Precision", "Standard Grade"],
  );
  const [error, setError] = useState("");

  // Search through unified master using search query and category context
  const search = useHsnSearch({
    query: query.trim() || wizard.classificationCode || "",
    categoryFilter: wizard.mainCategoryCode,
    codeType: wizard.codeType,
  });

  const searchResults = search.data ?? [];

  useEffect(() => {
    if (!selected) {
      setQuery(wizard.classificationCode || wizard.classification || "");
    }
  }, [wizard.classificationCode, wizard.classification]);

  const handleSave = async (isDraftOnly = false) => {
    if (!isDraftOnly) {
      if (!selected) {
        setError("Search and select a matching HSN/SAC classification.");
        return false;
      }
      if (!quantity || quantity <= 0) {
        setError("Enter a valid quantity.");
        return false;
      }
      if (keywords.length === 0) {
        setError("Add at least one process / keyword.");
        return false;
      }
    }
    setError("");

    const payload = {
      hsnCode: selected?.hsnCode ?? "",
      classification: selected?.classification ?? "",
      codeType: selected?.codeType ?? wizard.codeType ?? "HSN",
      hsnDescription: selected?.hsnDescription ?? "",
      quantity,
      uom,
      keywords,
    };

    wizard.set({ hsn: selected, quantity, uom, keywords });

    const res: any = await save.mutateAsync({
      payload,
      version: 0,
    });

    if (res?.version) {
      // @ts-ignore
      wizard.set({ version: res.version });
    }

    return true;
  };

  const next = async () => {
    const ok = await handleSave(false);
    if (ok) {
      nav(`/buyer/requirements/${id}/technical-quality`);
    }
  };

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-4 text-2xl font-extrabold text-slate-900">
        2. Classification & Quantity
      </h1>
      <div className="card rounded-xl border border-blue-100 bg-white p-6 shadow-sm">
        <RequirementStepper step={2} status={wizard.status} />

        {/* Selected Hierarchy Badges */}
        <div className="mb-2">
          <p className="mb-2 text-xs font-bold text-slate-700">
            Selected Category Filter
          </p>
          <div className="flex flex-wrap gap-3">
            <span className="inline-flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs">
              <span className="text-slate-400">Type</span>
              <span className="font-bold text-slate-800">
                {wizard.codeType || "ALL"}
              </span>
            </span>
            <span className="inline-flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs">
              <span className="text-slate-400">Main Category</span>
              <span className="font-bold text-slate-800">
                {wizard.mainCategory || "Bearings"}
              </span>
            </span>
            <span className="inline-flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs">
              <Lock className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-slate-400">Sub-category</span>
              <span className="font-bold text-slate-800">
                {wizard.classification}{" "}
                {wizard.classificationCode
                  ? `[${wizard.classificationCode}]`
                  : ""}
              </span>
            </span>
          </div>
        </div>

        {/* Search Section */}
        <section className="mt-6">
          <h2 className="border-b border-slate-100 pb-2 text-sm font-extrabold text-blue-900">
            A. Select Classification
          </h2>
          <div className="mt-4">
            <div className="flex items-center justify-between">
              <label className="mb-1 block text-xs font-bold text-slate-700">
                Matching HSN/SAC codes for{" "}
                {wizard.classification || "selection"}
                <span className="ml-1 text-red-600">*</span>
              </label>
              <button
                type="button"
                className="text-xs font-bold text-blue-600 hover:underline"
                onClick={() => {
                  setSelected(null);
                  setQuery("");
                }}
              >
                Clear selection
              </button>
            </div>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelected(null);
                }}
                placeholder="Search code or description (e.g. 848240)"
                className="input-base w-full rounded-lg border border-slate-200 px-3 py-2 pl-9 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
              />
            </div>

            {search.isFetching && (
              <p className="mt-2 text-xs text-slate-400">
                Searching matching codes…
              </p>
            )}

            {/* Results */}
            {!selected && searchResults.length > 0 && (
              <div className="mt-3 space-y-2">
                <div className="text-[11px] font-semibold text-slate-500">
                  {searchResults.length} matching code(s) found:
                </div>
                {searchResults.map((r) => (
                  <button
                    type="button"
                    key={r.id || r.hsnCode}
                    onClick={() => {
                      setSelected(r);
                      setQuery(r.hsnCode);
                    }}
                    className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white p-4 text-left hover:border-blue-300 hover:bg-blue-50/40"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs font-bold text-blue-900">
                          {r.hsnCode}
                        </span>
                        <p className="text-sm font-extrabold text-slate-900">
                          {r.classification}
                        </p>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        {r.codeType} · {r.hsnDescription}
                      </p>
                    </div>
                    {r.bestMatch && (
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-700">
                        Best Match
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* No matches state */}
            {!selected && !search.isFetching && searchResults.length === 0 && (
              <div className="mt-3 rounded-lg border border-dashed border-slate-200 p-4 text-center text-xs text-slate-500">
                No codes matching "{query}". Try entering a standard code like{" "}
                <span className="font-mono font-semibold text-slate-700">
                  {wizard.classificationCode || "8482"}
                </span>
                .
              </div>
            )}

            {/* Selected Match Card */}
            {selected && (
              <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50/40 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-extrabold text-slate-900">
                    {selected.classification}
                  </p>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-700">
                    Selected Match
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  {selected.codeType} - {selected.hsnCode} ·{" "}
                  {selected.hsnDescription}
                </p>
                <div className="mt-3 grid grid-cols-3 gap-3 border-t border-blue-100 pt-3 text-xs">
                  <div>
                    <span className="text-slate-400">Code Type</span>
                    <p className="font-bold text-slate-800">
                      {selected.codeType}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400">HSN/SAC Code</span>
                    <p className="font-mono font-bold text-slate-800">
                      {selected.hsnCode}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400">Description</span>
                    <p className="font-bold text-slate-800">
                      {selected.hsnDescription}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Section B: Quantity & UOM */}
        <section className="mt-6">
          <h2 className="border-b border-slate-100 pb-2 text-sm font-extrabold text-blue-900">
            B. Quantity & UOM
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <TextInput
              label="Quantity"
              type="number"
              required
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
            />
            <SelectInput
              label="UOM"
              required
              value={uom}
              onChange={(e) => setUom(e.target.value)}
            >
              {wizard.codeType === "SAC" ? (
                <>
                  <option value="Hours">Hours</option>
                  <option value="Days">Days</option>
                  <option value="Nos / month">Nos / month</option>
                  <option value="Job / Lot">Job / Lot</option>
                </>
              ) : (
                <>
                  <option value="NOS (Number of Units)">
                    NOS (Number of Units)
                  </option>
                  <option value="Sets">Sets</option>
                  <option value="KG">KG</option>
                  <option value="Pieces">Pieces</option>
                </>
              )}
            </SelectInput>
          </div>
        </section>

        {/* Section C: Keywords */}
        <section className="mt-6">
          <h2 className="border-b border-slate-100 pb-2 text-sm font-extrabold text-blue-900">
            C. Processes / Keywords
          </h2>
          <div className="mt-4">
            <ChipInput
              values={keywords}
              onChange={setKeywords}
              placeholder="e.g. Needle Roller"
            />
          </div>
        </section>

        {error && (
          <p className="mt-4 text-xs font-semibold text-red-600">{error}</p>
        )}

        <div className="mt-6 flex justify-between gap-2 border-t border-slate-100 pt-5">
          <Button
            variant="secondary"
            type="button"
            onClick={() => nav(`/buyer/requirements/new/basic`)}
          >
            ← Back
          </Button>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              type="button"
              loading={save.isPending}
              onClick={() => handleSave(true)}
            >
              Save as Draft
            </Button>
            <Button type="button" loading={save.isPending} onClick={next}>
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
