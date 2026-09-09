import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  Cog,
  Layers,
  Cpu,
  Sliders,
  ShieldCheck,
  Tag as TagIcon,
  Loader2,
} from "lucide-react";
import { RequirementStepper } from "./wizard/RequirementStepper";
import { useRequirementWizard } from "./wizard/requirementWizardStore";
import { useSaveDraft } from "../../../../services/buyer/hooks";
import {
  useRequirementSuggestedTags,
  useSaveRequirementTags,
  type RequirementSuggestedTagGroup,
} from "../../../../services/referenceData/Taxonomyhooks";

type FilterTab = "All" | "Auto" | "Recommended" | "Optional" | "Conditional" | "Matching Only";

// Icon/colour is purely presentational and keyed off the TagTypeCode coming back from the
// DB (ClassificationTags -> Tags -> TagTypes), not off the category text anymore.
const GROUP_STYLE: Record<string, { icon: typeof Cog; iconBg: string }> = {
  MATERIAL: { icon: Layers, iconBg: "bg-emerald-600 text-white" },
  PROCESS: { icon: Cog, iconBg: "bg-purple-600 text-white" },
  MACHINE: { icon: Cpu, iconBg: "bg-blue-600 text-white" },
  ATTRIBUTE: { icon: Sliders, iconBg: "bg-amber-600 text-white" },
  QUALITY: { icon: ShieldCheck, iconBg: "bg-teal-600 text-white" },
  COMPLIANCE: { icon: ShieldCheck, iconBg: "bg-teal-600 text-white" },
};
const DEFAULT_STYLE = { icon: TagIcon, iconBg: "bg-slate-600 text-white" };

function styleForGroup(tagTypeCode: string) {
  return GROUP_STYLE[tagTypeCode?.toUpperCase()] ?? DEFAULT_STYLE;
}

// Maps the filter pills to RelationshipType/MandatoryStatus values coming back from
// ClassificationTags, so filtering is real (server-driven) instead of static counts.
function tagMatchesTab(tag: RequirementSuggestedTagGroup["tags"][number], tab: FilterTab): boolean {
  if (tab === "All") return true;
  const rel = tag.relationshipType?.toUpperCase();
  const mandatory = tag.mandatoryStatus?.toUpperCase();
  switch (tab) {
    case "Auto":
      return tag.uiBehaviour?.toUpperCase() === "AUTO_APPLY" || rel === "PRIMARY";
    case "Recommended":
      return rel === "RECOMMENDED" || mandatory === "PREFERRED";
    case "Optional":
      return mandatory === "OPTIONAL";
    case "Conditional":
      return mandatory === "CONDITIONAL";
    case "Matching Only":
      return tag.uiBehaviour?.toUpperCase() === "MATCH_ONLY";
    default:
      return true;
  }
}

export default function RequirementSuggestionsPage() {
  const nav = useNavigate();
  const { id = "req-001" } = useParams();
  const wizard = useRequirementWizard();
  const saveDraftMutation = useSaveDraft(`requirements/${id}/suggestions`);

  const isPersistedRequirement = Boolean(id && !id.startsWith("req-"));

  const tagsQuery = useRequirementSuggestedTags(isPersistedRequirement ? id : undefined);
  const saveTagsMutation = useSaveRequirementTags(isPersistedRequirement ? id : undefined);

  const [activeTab, setActiveTab] = useState<FilterTab>(wizard.suggestionFilter || "All");
  // Local checkbox state for chips, keyed by tagId. Seeded from the server's `selected`
  // flag (previously saved selection, or ClassificationTags.DefaultSelected as a fallback).
  const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(new Set());
  const [saveError, setSaveError] = useState<string | null>(null);

  const groups = tagsQuery.data?.groups ?? [];

  useEffect(() => {
    if (!tagsQuery.data) return;
    const initial = new Set<string>();
    for (const group of tagsQuery.data.groups) {
      for (const tag of group.tags) {
        if (tag.selected) initial.add(tag.tagId);
      }
    }
    setSelectedTagIds(initial);
  }, [tagsQuery.data]);

  const toggleTag = (tagId: string) => {
    setSelectedTagIds((prev) => {
      const next = new Set(prev);
      if (next.has(tagId)) next.delete(tagId);
      else next.add(tagId);
      return next;
    });
  };

  const tabs: Array<{ id: FilterTab; label: string; count?: number }> = useMemo(() => {
    const allTags = groups.flatMap((g) => g.tags);
    const countFor = (tab: FilterTab) => allTags.filter((t) => tagMatchesTab(t, tab)).length;
    return [
      { id: "All", label: "All", count: allTags.length || undefined },
      { id: "Auto", label: "Auto", count: countFor("Auto") },
      { id: "Recommended", label: "Recommended", count: countFor("Recommended") },
      { id: "Optional", label: "Optional", count: countFor("Optional") },
      { id: "Conditional", label: "Conditional", count: countFor("Conditional") },
      { id: "Matching Only", label: "Matching Only", count: countFor("Matching Only") },
    ];
  }, [groups]);

  const handleNext = async () => {
    wizard.set({ suggestionFilter: activeTab, selectedTagIds: Array.from(selectedTagIds) });
    setSaveError(null);

    if (isPersistedRequirement) {
      try {
        await saveTagsMutation.mutateAsync({
          selectedTagIds: Array.from(selectedTagIds),
          version: 0,
        });
      } catch (err) {
        console.warn("Could not save selected tags to backend", err);
        setSaveError("Could not save your selections to the server. Please retry before publishing.");
        return;
      }
      try {
        await saveDraftMutation.mutateAsync({ payload: { suggestionFilter: activeTab } });
      } catch (err) {
        console.warn("Could not save suggestions draft directly to backend", err);
      }
    }

    nav(`/buyer/requirements/${id}/processes`);
  };

  const handleSaveDraft = async () => {
    wizard.set({
      selectedTagIds: Array.from(selectedTagIds),
      suggestionFilter: activeTab,
    });
    if (isPersistedRequirement) {
      try {
        await saveTagsMutation.mutateAsync({
          selectedTagIds: Array.from(selectedTagIds),
          version: 0,
        });
        await saveDraftMutation.mutateAsync({ payload: { suggestionFilter: activeTab } }).catch(() => {});
        toast.success("Draft saved successfully!");
      } catch (err) {
        toast.error("Failed to save draft to server.");
      }
    } else {
      toast.success("Draft saved locally!");
    }
  };

  const handleBack = () => {
    nav(`/buyer/requirements/${id}/classification`);
  };

  const isLoading = tagsQuery.isLoading;
  const hasNoClassification = isPersistedRequirement && tagsQuery.data && !tagsQuery.data.classificationCode;
  const hasNoSuggestions = isPersistedRequirement && tagsQuery.data && tagsQuery.data.classificationCode && groups.length === 0;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm md:p-8">
        {/* Stepper */}
        <RequirementStepper step={3} status={wizard.status || "DRAFT"} />

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-extrabold text-slate-900">
            Intelligent Suggestions
          </h1>
          <p className="mt-1 text-xs font-medium text-slate-500">
            Based on your selected classification, we suggest the following
          </p>
        </div>

        {/* Filter Pills */}
        <div className="mb-6 flex flex-wrap items-center gap-2 border-b border-slate-100 pb-4">
          {tabs.map((tab) => {
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
                  isSelected
                    ? "bg-blue-600 text-white shadow-sm shadow-blue-500/20"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
                }`}
              >
                {tab.label}
                {tab.count !== undefined && (
                  <span className={`ml-1 text-[11px] opacity-85`}>
                    ({tab.count})
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Loading / empty states */}
        {isPersistedRequirement && isLoading && (
          <div className="flex items-center justify-center gap-2 py-10 text-sm font-semibold text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading suggestions from your classification…
          </div>
        )}

        {hasNoClassification && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs font-semibold text-amber-800">
            No classification was saved for this requirement yet. Go back and select a
            Segment / Category / Classification first — suggestions are generated from that.
          </div>
        )}

        {hasNoSuggestions && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs font-semibold text-slate-600">
            No tag suggestions are configured for this classification yet.
          </div>
        )}

        {/* Suggestion Groups — sourced from ClassificationTags via the backend, not hardcoded */}
        {!isLoading && groups.length > 0 && (
          <div className="space-y-4">
            {groups.map((group) => {
              const { icon: Icon, iconBg } = styleForGroup(group.tagTypeCode);
              const visibleTags = group.tags.filter((t) => tagMatchesTab(t, activeTab));
              if (visibleTags.length === 0) return null;
              const shown = visibleTags.slice(0, 6);
              const extraCount = visibleTags.length - shown.length;

              return (
                <div
                  key={group.tagTypeCode}
                  className="flex flex-col gap-4 rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 transition-all hover:bg-white hover:border-blue-200 md:flex-row md:items-center md:justify-between"
                >
                  {/* Category Title & Icon */}
                  <div className="flex items-center gap-3 min-w-[200px]">
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg shadow-xs ${iconBg}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        {group.tagTypeName}
                      </h3>
                    </div>
                  </div>

                  {/* Chips — each one toggles selection, saved on Next */}
                  <div className="flex flex-wrap items-center gap-2 flex-1 md:justify-end">
                    {shown.map((tag) => {
                      const isChecked = selectedTagIds.has(tag.tagId);
                      const isMandatoryLocked =
                        tag.mandatoryStatus?.toUpperCase() === "MANDATORY" && !tag.editableByUser;
                      return (
                        <button
                          key={tag.tagId}
                          type="button"
                          disabled={isMandatoryLocked}
                          onClick={() => toggleTag(tag.tagId)}
                          title={
                            tag.mandatoryStatus
                              ? `${tag.mandatoryStatus}${tag.relationshipType ? ` · ${tag.relationshipType}` : ""}`
                              : undefined
                          }
                          className={`rounded-lg border px-3 py-1 text-xs font-semibold shadow-2xs transition ${
                            isChecked
                              ? "border-blue-400 bg-blue-50 text-blue-700"
                              : "border-slate-200 bg-white text-slate-700 hover:border-blue-300"
                          } ${isMandatoryLocked ? "cursor-not-allowed opacity-80" : ""}`}
                        >
                          {tag.tagName}
                        </button>
                      );
                    })}
                    {extraCount > 0 && (
                      <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-extrabold text-blue-600">
                        +{extraCount} more
                      </span>
                    )}
                  </div>

                  {/* Badge indicator — derived from the classification's own metadata */}
                  <div className="shrink-0 text-right">
                    <span className="text-[11px] font-bold text-blue-600">
                      {visibleTags.filter((t) => selectedTagIds.has(t.tagId)).length} selected
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {saveError && <p className="mt-4 text-xs font-semibold text-amber-700">{saveError}</p>}

        {/* Footer Navigation */}
        <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-6">
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
              disabled={saveTagsMutation.isPending}
              onClick={handleSaveDraft}
              className="rounded-xl border border-slate-300 bg-white px-6 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              {saveTagsMutation.isPending ? "Saving…" : "Save as Draft"}
            </button>

            <button
              type="button"
              onClick={handleNext}
              disabled={saveTagsMutation.isPending}
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-7 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 transition hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/30 disabled:opacity-50"
            >
              {saveTagsMutation.isPending ? "Saving…" : "Save & Next →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}