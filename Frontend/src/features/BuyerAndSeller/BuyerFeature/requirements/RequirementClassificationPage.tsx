import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { RequirementStepper } from "./wizard/RequirementStepper";
import { useRequirementWizard } from "./wizard/requirementWizardStore";
import { httpClient } from "../../../../services/api/httpClient";
import { useTaxonomySegments, useTaxonomyCategories, useTaxonomyClassifications, TaxonomyClassification } from "../../../../services/referenceData/Taxonomyhooks";
import { useQueryClient } from "@tanstack/react-query";
import { buyerKeys } from "../../../../services/buyer/queryKeys";

export default function RequirementClassificationPage() {
  const nav = useNavigate();
  const { id = "req-001" } = useParams();
  const wizard = useRequirementWizard();
  const qc = useQueryClient();

  // --- Real backend-backed cascading lookups ---------------------------------
  const segmentsQuery = useTaxonomySegments();
  const segments = segmentsQuery.data ?? [];

  const [selectedSegmentCode, setSelectedSegmentCode] = useState<string>("");
  const [selectedCategoryCode, setSelectedCategoryCode] = useState<string>("");
  const [selectedClassificationId, setSelectedClassificationId] = useState<string>("");

  // Default to the first segment once loaded, or restore what the wizard already has.
  useEffect(() => {
    if (!selectedSegmentCode && segments.length > 0) {
      const restored = segments.find((s) => s.segmentCode === wizard.segment || s.segmentName === wizard.segment);
      setSelectedSegmentCode(restored?.segmentCode ?? segments[0].segmentCode);
    }
  }, [segments, selectedSegmentCode, wizard.segment]);

  const categoriesQuery = useTaxonomyCategories(selectedSegmentCode || undefined);
  const categories = categoriesQuery.data ?? [];

  useEffect(() => {
    if (categories.length > 0 && !categories.some((c) => c.categoryCode === selectedCategoryCode)) {
      const restored = categories.find((c) => c.categoryCode === wizard.mainCategoryCode);
      setSelectedCategoryCode(restored?.categoryCode ?? categories[0].categoryCode);
    }
  }, [categories, selectedCategoryCode, wizard.mainCategoryCode]);

  const classificationsQuery = useTaxonomyClassifications(selectedCategoryCode || undefined);
  const classifications = classificationsQuery.data ?? [];

  useEffect(() => {
    if (classifications.length > 0 && !classifications.some((c) => c.id === selectedClassificationId)) {
      const restored = classifications.find((c) => c.recordId === wizard.recordId);
      setSelectedClassificationId(restored?.id ?? classifications[0].id);
    }
  }, [classifications, selectedClassificationId, wizard.recordId]);

  const selectedSegment = segments.find((s) => s.segmentCode === selectedSegmentCode);
  const selectedCategory = categories.find((c) => c.categoryCode === selectedCategoryCode);
  const selectedClassification: TaxonomyClassification | undefined = classifications.find(
    (c) => c.id === selectedClassificationId
  );

  // --- System Derived Classification card — straight from the DB record, no client-side guessing
  const derivedClassification = useMemo(() => {
    if (selectedClassification) {
      return {
        hsnCode: selectedClassification.verifiedCode,
        description: selectedClassification.verifiedClassificationName,
        codeSystem: selectedClassification.codeSystem,
        recordId: selectedClassification.recordId,
      };
    }
    return { hsnCode: "—", description: "—", codeSystem: "—", recordId: "—" };
  }, [selectedClassification]);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleSaveAndNext = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSegment || !selectedCategory || !selectedClassification) return;

    const payload = {
      segment: selectedSegment.segmentName,
      segmentCode: selectedSegment.segmentCode,
      mainCategory: selectedCategory.categoryName,
      mainCategoryCode: selectedCategory.categoryCode,
      classification: selectedClassification.subCategory,
      classificationCode: selectedClassification.verifiedCode, // HSN/SAC digits — this is what MatchingController scores on
      hsnCode: selectedClassification.verifiedCode,
      hsnDescription: selectedClassification.verifiedClassificationName,
      codeSystem: selectedClassification.codeSystem,
      recordId: selectedClassification.recordId,
    };
// @ts-ignore
    wizard.set(payload);
    setSaveError(null);

    if (id && !id.startsWith("req-")) {
      setSaving(true);
      try {
        await httpClient.patch(`/buyer/requirements/${id}/classification`, {
          segmentCode: selectedSegment.segmentCode,
          mainCategoryCode: selectedCategory.categoryCode,
          classificationCode: selectedClassification.verifiedCode,
          version: 0,
        });
        await qc.invalidateQueries({ queryKey: buyerKeys.requirements });
        await qc.invalidateQueries({ queryKey: buyerKeys.requirement(id) });
      } catch (err) {
        console.warn("Could not save classification to backend", err);
        setSaveError("Could not save to the server. Your selection is kept locally — please retry before publishing.");
      } finally {
        setSaving(false);
      }
    }

    nav(`/buyer/requirements/${id}/suggestions`);
  };

  const handleSaveDraft = async () => {
    if (!selectedSegment || !selectedCategory || !selectedClassification) {
      toast.error("Please select Segment, Category, and Classification to save draft.");
      return;
    }

    const payload = {
      segment: selectedSegment.segmentName,
      segmentCode: selectedSegment.segmentCode,
      mainCategory: selectedCategory.categoryName,
      mainCategoryCode: selectedCategory.categoryCode,
      classification: selectedClassification.subCategory,
      classificationCode: selectedClassification.verifiedCode,
      hsnCode: selectedClassification.verifiedCode,
      hsnDescription: selectedClassification.verifiedClassificationName,
      codeSystem: selectedClassification.codeSystem,
      recordId: selectedClassification.recordId,
    };
    // @ts-ignore
    wizard.set(payload);

    if (id && !id.startsWith("req-")) {
      setSaving(true);
      try {
        await httpClient.patch(`/buyer/requirements/${id}/classification`, {
          segmentCode: selectedSegment.segmentCode,
          mainCategoryCode: selectedCategory.categoryCode,
          classificationCode: selectedClassification.verifiedCode,
          version: 0,
        });
        await qc.invalidateQueries({ queryKey: buyerKeys.requirements });
        await qc.invalidateQueries({ queryKey: buyerKeys.requirement(id) });
        toast.success("Draft saved successfully!");
      } catch (err) {
        console.warn("Could not save classification to backend", err);
        toast.error("Failed to save draft to server.");
      } finally {
        setSaving(false);
      }
    } else {
      toast.success("Draft saved locally!");
    }
  };

  const handleBack = () => {
    if (id && !id.startsWith("req-")) {
      nav(`/buyer/requirements/${id}/basic`);
    } else {
      nav("/buyer/requirements/new/basic");
    }
  };

  const isLoading = segmentsQuery.isLoading || categoriesQuery.isLoading || classificationsQuery.isLoading;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm md:p-8">
        <RequirementStepper step={2} status={wizard.status || "DRAFT"} />

        <div className="mb-6">
          <h1 className="text-xl font-extrabold text-slate-900">Classification Selection</h1>
          <p className="mt-1 text-xs font-medium text-slate-500">
            Select the most relevant classification for your requirement
          </p>
        </div>

        <form onSubmit={handleSaveAndNext} className="space-y-6">
          {/* Segment */}
          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-700">
              Segment <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedSegmentCode}
              onChange={(e) => {
                setSelectedSegmentCode(e.target.value);
                setSelectedCategoryCode("");
                setSelectedClassificationId("");
              }}
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              {segments.map((seg) => (
                <option key={seg.id} value={seg.segmentCode}>
                  {seg.segmentName}
                </option>
              ))}
            </select>
          </div>

          {/* Main Category */}
          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-700">
              Main Category <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedCategoryCode}
              onChange={(e) => {
                setSelectedCategoryCode(e.target.value);
                setSelectedClassificationId("");
              }}
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.categoryCode}>
                  {cat.categoryName}
                </option>
              ))}
            </select>
          </div>

          {/* Classification / Sub-category */}
          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-700">
              Classification / Sub-category <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedClassificationId}
              onChange={(e) => setSelectedClassificationId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              {classifications.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.subCategory}
                </option>
              ))}
            </select>
          </div>

          {/* System Derived Classification Card */}
          <div className="rounded-xl border border-emerald-300 bg-emerald-50/50 p-5 shadow-xs">
            <h3 className="text-sm font-extrabold text-emerald-800">
              System Derived Classification {isLoading && <span className="font-normal text-emerald-600">(loading…)</span>}
            </h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-600 w-28">HSN Code</span>
                <span className="text-slate-400 font-bold">:</span>
                <span className="font-extrabold text-slate-900">{derivedClassification.hsnCode}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-600 w-28">Description</span>
                <span className="text-slate-400 font-bold">:</span>
                <span className="font-bold text-slate-900">{derivedClassification.description}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-600 w-28">Code System</span>
                <span className="text-slate-400 font-bold">:</span>
                <span className="font-bold text-slate-900">{derivedClassification.codeSystem}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-600 w-28">Record ID</span>
                <span className="text-slate-400 font-bold">:</span>
                <span className="font-extrabold text-blue-700 font-mono">{derivedClassification.recordId}</span>
              </div>
            </div>
            {saveError && <p className="mt-3 text-xs font-semibold text-amber-700">{saveError}</p>}
          </div>

          {/* Footer Navigation */}
          <div className="flex items-center justify-between border-t border-slate-100 pt-6">
            <button
              type="button"
              onClick={handleBack}
              className="rounded-xl border border-slate-300 bg-white px-6 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
            >
              ← Back
            </button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={saving || !selectedClassification}
                onClick={handleSaveDraft}
                className="rounded-xl border border-slate-300 bg-white px-6 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save as Draft"}
              </button>

              <button
                type="submit"
                disabled={saving || !selectedClassification}
                className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-7 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 transition hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/30 disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save & Next →"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}