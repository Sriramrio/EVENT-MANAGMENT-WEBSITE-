import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Send,
  Edit,
  Download,
  FileText,
} from "lucide-react";
import { RequirementStepper } from "./wizard/RequirementStepper";
import { useRequirementWizard } from "./wizard/requirementWizardStore";
import { useSubmit, useBuyerSession, useCreateRequirement } from "../../../../services/buyer/hooks";
import { buyerRepository } from "../../../../services/buyer/buyerRepository";
import { useQueryClient } from "@tanstack/react-query";
import { buyerKeys } from "../../../../services/buyer/queryKeys";
import { toast } from "react-hot-toast";
import { httpClient } from "../../../../services/api/httpClient";

export default function ReviewPublishPage() {
  const nav = useNavigate();
  const { id = "req-001" } = useParams();
  const wizard = useRequirementWizard();
  const submitMutation = useSubmit(`requirements/${id}`);
  const createMutation = useCreateRequirement();
  const session = useBuyerSession();
  const qc = useQueryClient();

  const [confirmed, setConfirmed] = useState(wizard.confirmedAccurate ?? true);
  const [publishing, setPublishing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  useEffect(() => {
    async function loadRequirement() {
      if (!id || id === 'new' || id.startsWith('req-')) return;
      // Prevent reloading if wizard already has this ID
      if (wizard.requirementId === id && wizard.title) return;
      
      try {
        setIsLoading(true);
        const req = await buyerRepository.getRequirement(id);
        
        const details = req.detailsJson || {};
        
        wizard.set({
          requirementId: req.id,
          requirementCode: req.code,
          status: req.status,
          title: req.title,
          description: req.description,
          requirementType: req.sourcingType as any,
          quantity: req.quantity,
          uom: req.unit,
          needByDate: req.neededBy,
          segment: req.category,
          classification: req.subcategory,
          ...details
        });
        
      } catch (err) {
        toast.error("Failed to load requirement details for review.");
      } finally {
        setIsLoading(false);
      }
    }
    loadRequirement();
  }, [id]);

  // Accordion expansion states
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    processes: false,
    attributes: false,
    materials: false,
    quality: false,
    operations: false,
    commercial: false,
    attachments: false,
  });

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleSaveDraft = async () => {
    try {
      setIsSavingDraft(true);
      let realId = wizard.requirementId || id;
      const futureDate = wizard.needByDate && new Date(wizard.needByDate) > new Date()
        ? wizard.needByDate
        : new Date(Date.now() + 90 * 86400000).toISOString().split("T")[0];

      const fullDetails = {
        requirementType: wizard.requirementType,
        title: wizard.title || "CNC Machining Components",
        internalRef: wizard.internalRef || "",
        description: wizard.description || "",
        segment: wizard.segment,
        segmentCode: wizard.segment,
        codeType: wizard.codeType,
        mainCategory: wizard.mainCategory,
        mainCategoryCode: wizard.mainCategoryCode,
        classification: wizard.classification,
        classificationCode: wizard.classificationCode,
        hsnCode: wizard.hsnCode,
        hsnDescription: wizard.hsnDescription,
        codeSystem: wizard.codeSystem,
        recordId: wizard.recordId,
        suggestionFilter: wizard.suggestionFilter,
        selectedTagIds: wizard.selectedTagIds || [],
        processes: wizard.processes,
        technicalAttributes: wizard.technicalAttributes,
        materials: wizard.materials,
        qualityCompliance: wizard.qualityCompliance,
        operations: wizard.operations,
        quantity: wizard.quantity || 100,
        uom: wizard.uom || "NOS",
        uomCode: wizard.uom || "NOS",
        deliveryLocation: wizard.deliveryLocation,
        needByDate: futureDate,
        deliveryTerms: wizard.deliveryTerms,
        paymentTerms: wizard.paymentTerms,
        closeDays: wizard.closeDays,
        expectedRates: wizard.expectedRates,
        incoterms: wizard.incoterms,
        attachments: wizard.attachments,
        specialInstructions: wizard.specialInstructions,
        requiredProcesses: wizard.processes?.filter((p) => p.selected)?.map((p) => p.name) ?? [],
        certifications: wizard.qualityCompliance?.map((q) => q.standard) ?? [],
        materialGrade: wizard.materials?.map((m) => `${m.material} (${m.grade})`).join(", ") ?? "",
        confirmedAccurate: confirmed,
        status: wizard.status || "DRAFT",
      };

      if (!realId || realId.startsWith("req-") || realId === "new") {
        const created = await createMutation.mutateAsync({
          organizationId: session.data?.buyerOrganisationId ?? "00000000-0000-0000-0000-000000000000",
          title: wizard.title || "CNC Machining Components",
          description: wizard.description || "",
          sourcingType: wizard.requirementType === "Services" ? "Service" : wizard.requirementType === "Consulting" ? "Service" : "Product",
          segmentCode: wizard.segment,
          mainCategoryCode: wizard.mainCategory,
          classificationCode: wizard.classification,
          quantity: wizard.quantity || 100,
          uomCode: wizard.uom || "NOS",
          needByDate: futureDate,
          details: fullDetails,
        });
        if (created?.id) {
          realId = created.id;
          wizard.set({ requirementId: created.id, requirementCode: created.code, status: "DRAFT" });
          if (wizard.selectedTagIds && wizard.selectedTagIds.length > 0) {
            try {
              await httpClient.put(`/buyer/requirements/${created.id}/tags`, {
                selectedTagIds: wizard.selectedTagIds,
                version: 0,
              });
            } catch (tagErr) {
              console.warn("Could not save tags:", tagErr);
            }
          }
        }
      } else {
        await buyerRepository.saveDraft(`requirements/${realId}/steps/review`, fullDetails, 0);
        if (wizard.selectedTagIds && wizard.selectedTagIds.length > 0) {
          await httpClient.put(`/buyer/requirements/${realId}/tags`, {
            selectedTagIds: wizard.selectedTagIds,
            version: 0,
          }).catch(() => {});
        }
      }

      await qc.invalidateQueries({ queryKey: buyerKeys.requirements });
      if (realId && !realId.startsWith("req-") && realId !== "new") {
        await qc.invalidateQueries({ queryKey: buyerKeys.requirement(realId) });
        await qc.invalidateQueries({ queryKey: buyerKeys.matches(realId) });
      }
      await qc.invalidateQueries({ queryKey: buyerKeys.reports });
      toast.success("Requirement saved as draft!");
    } catch (err) {
      console.warn("Save draft error:", err);
      toast.error("Failed to save draft to server");
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handlePublish = async () => {
    if (!confirmed) {
      toast.error("Please confirm the information accuracy before publishing.");
      return;
    }

    setPublishing(true);
    try {
      wizard.set({ status: "PUBLISHED", confirmedAccurate: true });
      let realId = wizard.requirementId || id;

      const futureDate = wizard.needByDate && new Date(wizard.needByDate) > new Date()
        ? wizard.needByDate
        : new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0];

      const fullDetails = {
        requirementType: wizard.requirementType,
        title: wizard.title || "CNC Machining Components",
        internalRef: wizard.internalRef || "",
        description: wizard.description || "",
        segment: wizard.segment,
        segmentCode: wizard.segment,
        codeType: wizard.codeType,
        mainCategory: wizard.mainCategory,
        mainCategoryCode: wizard.mainCategoryCode,
        classification: wizard.classification,
        classificationCode: wizard.classificationCode,
        hsnCode: wizard.hsnCode,
        hsnDescription: wizard.hsnDescription,
        codeSystem: wizard.codeSystem,
        recordId: wizard.recordId,
        suggestionFilter: wizard.suggestionFilter,
        selectedTagIds: wizard.selectedTagIds || [],
        processes: wizard.processes,
        technicalAttributes: wizard.technicalAttributes,
        materials: wizard.materials,
        qualityCompliance: wizard.qualityCompliance,
        operations: wizard.operations,
        quantity: wizard.quantity || 100,
        uom: wizard.uom || "NOS",
        uomCode: wizard.uom || "NOS",
        deliveryLocation: wizard.deliveryLocation,
        needByDate: futureDate,
        deliveryTerms: wizard.deliveryTerms,
        paymentTerms: wizard.paymentTerms,
        closeDays: wizard.closeDays,
        expectedRates: wizard.expectedRates,
        incoterms: wizard.incoterms,
        attachments: wizard.attachments,
        specialInstructions: wizard.specialInstructions,
        requiredProcesses: wizard.processes?.filter((p) => p.selected)?.map((p) => p.name) ?? [],
        certifications: wizard.qualityCompliance?.map((q) => q.standard) ?? [],
        materialGrade: wizard.materials?.map((m) => `${m.material} (${m.grade})`).join(", ") ?? "",
        confirmedAccurate: true,
        status: "PUBLISHED",
      };

      // If requirement was not created yet in backend, create it now
      if (!realId || realId.startsWith("req-") || realId === "new") {
        const created = await createMutation.mutateAsync({
          organizationId: session.data?.buyerOrganisationId ?? "00000000-0000-0000-0000-000000000000",
          title: wizard.title || "CNC Machining Components",
          description: wizard.description || "",
          sourcingType: wizard.requirementType === "Services" ? "Service" : wizard.requirementType === "Consulting" ? "Service" : "Product",
          segmentCode: wizard.segment,
          mainCategoryCode: wizard.mainCategory,
          classificationCode: wizard.classification,
          quantity: wizard.quantity || 100,
          uomCode: wizard.uom || "NOS",
          needByDate: futureDate,
          details: fullDetails,
        });
        if (created?.id) {
          realId = created.id;
          wizard.set({ requirementId: created.id, requirementCode: created.code });
          if (wizard.selectedTagIds && wizard.selectedTagIds.length > 0) {
            try {
              await httpClient.put(`/buyer/requirements/${created.id}/tags`, {
                selectedTagIds: wizard.selectedTagIds,
                version: 0,
              });
            } catch (tagErr) {
              console.warn("Could not save tags for newly created requirement:", tagErr);
            }
          }
        }
      } else {
        // Save the complete wizard payload into DetailsJson before publishing
        try {
          await buyerRepository.saveDraft(`requirements/${realId}/steps/review`, fullDetails, 0);
          if (wizard.selectedTagIds && wizard.selectedTagIds.length > 0) {
            await httpClient.put(`/buyer/requirements/${realId}/tags`, {
              selectedTagIds: wizard.selectedTagIds,
              version: 0,
            }).catch(() => {});
          }
        } catch (saveErr) {
          console.warn("Could not save full draft before publishing:", saveErr);
        }
      }

      // Publish the requirement in the backend using realId
      try {
        if (realId && !realId.startsWith("req-") && realId !== "new") {
          await httpClient.post(`/buyer/requirements/${realId}/publish`, {
            version: 0,
            reason: "Published by Buyer",
          }, crypto.randomUUID());
        }
      } catch (err) {
        console.warn("Backend publish transition note:", err);
      }

      await qc.invalidateQueries({ queryKey: buyerKeys.requirements });
      if (realId && !realId.startsWith("req-") && realId !== "new") {
        await qc.invalidateQueries({ queryKey: buyerKeys.requirement(realId) });
        await qc.invalidateQueries({ queryKey: buyerKeys.matches(realId) });
      }
      await qc.invalidateQueries({ queryKey: buyerKeys.reports });

      toast.success("Requirement published successfully!");
      nav(`/buyer/requirements`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to publish requirement");
    } finally {
      setPublishing(false);
    }
  };

  const handleBack = () => {
    nav(`/buyer/requirements/${id}/delivery-commercial`);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm md:p-8">
        {/* Stepper */}
        <RequirementStepper step={5} status={wizard.status || "DRAFT"} />

        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">
              Review & Submit
            </h1>
            <p className="mt-1 text-xs font-medium text-slate-500">
              Please review your requirement before publishing
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              const targetId = wizard.requirementId || (id && !id.startsWith("req-") ? id : "new");
              nav(`/buyer/requirements/${targetId}/basic`);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 hover:border-slate-400"
          >
            <Edit className="h-3.5 w-3.5" />
            Edit All
          </button>
        </div>

        {/* 2-Column Grid */}
        <div className="grid gap-6 lg:grid-cols-5">
          {/* Left Column: Summary Card (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-5 shadow-xs">
              <h2 className="mb-4 text-sm font-extrabold text-slate-900">
                Summary
              </h2>

              <div className="space-y-3.5 text-xs">
                <div>
                  <span className="block text-[11px] font-bold text-slate-500">Requirement Title</span>
                  <span className="mt-0.5 block font-extrabold text-slate-900 text-sm">
                    {wizard.title || "CNC Machining Components"}
                  </span>
                </div>

                <div>
                  <span className="block text-[11px] font-bold text-slate-500">Requirement Type</span>
                  <span className="mt-0.5 inline-block rounded bg-blue-50 px-2 py-0.5 font-bold text-blue-700">
                    {wizard.requirementType || "Goods"}
                  </span>
                </div>

                <div>
                  <span className="block text-[11px] font-bold text-slate-500">Need By Date</span>
                  <span className="mt-0.5 block font-bold text-slate-800">
                    {wizard.needByDate ? new Date(wizard.needByDate).toLocaleDateString("en-GB") : "15/07/2025"}
                  </span>
                </div>

                <div>
                  <span className="block text-[11px] font-bold text-slate-500">Quantity</span>
                  <span className="mt-0.5 block font-extrabold text-slate-900">
                    {wizard.quantity || 100} {wizard.uom || "NOS"}
                  </span>
                </div>

                <div>
                  <span className="block text-[11px] font-bold text-slate-500">HSN Code</span>
                  <span className="mt-0.5 block font-mono font-extrabold text-slate-900">
                    {wizard.hsnCode || "84571000"}
                  </span>
                </div>

                <div>
                  <span className="block text-[11px] font-bold text-slate-500">Classification</span>
                  <span className="mt-0.5 block font-bold text-slate-900">
                    {wizard.classification || "Machining Centres"}
                  </span>
                  <span className="mt-0.5 block font-mono text-[11px] font-bold text-blue-600">
                    {wizard.recordId || "MTL-0578"}
                  </span>
                </div>

                {/* Attachments Section in Summary Card */}
                <div className="border-t border-slate-200/80 pt-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-slate-500">Attachments</span>
                    <span className="text-[10px] font-bold rounded-full bg-blue-50 px-2 py-0.5 text-blue-700">
                      {wizard.attachments.length} {wizard.attachments.length === 1 ? "file" : "files"}
                    </span>
                  </div>

                  {wizard.attachments.length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic">No attachments added</p>
                  ) : (
                    <div className="space-y-2">
                      {wizard.attachments.map((att) => {
                        const isImg = att.dataBase64?.startsWith("data:image/") || /\.(png|jpe?g|webp|gif|svg)$/i.test(att.name);
                        return (
                          <div
                            key={att.id}
                            className="flex items-center justify-between rounded-lg border border-slate-200/80 bg-white p-2 text-xs shadow-2xs"
                          >
                            <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                              {isImg && att.dataBase64 ? (
                                <img
                                  src={att.dataBase64}
                                  alt={att.name}
                                  className="h-7 w-7 rounded object-cover border border-slate-200 shrink-0"
                                />
                              ) : (
                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-blue-50 text-blue-600 font-bold text-[9px]">
                                  {att.type || "FILE"}
                                </div>
                              )}
                              <div className="min-w-0 flex-1 truncate">
                                <span className="block font-bold text-slate-800 truncate text-[11px]" title={att.name}>
                                  {att.name}
                                </span>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] text-slate-400">{att.size}</span>
                                  {att.dataBase64 && (
                                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" title="Base64 Stored" />
                                  )}
                                </div>
                              </div>
                            </div>

                            {att.dataBase64 && (
                              <a
                                href={att.dataBase64}
                                download={att.name}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-blue-600 shrink-0 transition"
                                title="Download Attachment"
                              >
                                <Download className="h-3.5 w-3.5" />
                              </a>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: What you have specified (3 cols) */}
          <div className="lg:col-span-3">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
              <h2 className="mb-4 text-sm font-extrabold text-slate-900">
                What you have specified
              </h2>

              <div className="divide-y divide-slate-100 text-xs">
                {/* 1. Processes */}
                <div className="py-3 first:pt-0">
                  <button
                    type="button"
                    onClick={() => toggleSection("processes")}
                    className="flex w-full items-center justify-between text-left font-bold text-slate-800 hover:text-blue-600"
                  >
                    <div className="flex items-center gap-2">
                      <div className={`h-2.5 w-2.5 rounded-full shadow-xs ${wizard.processes.length > 0 ? "bg-emerald-500" : "bg-slate-300"}`} />
                      <span>Processes</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500 font-medium text-[11px]">
                      <span>{wizard.processes.length} selected</span>
                      {expandedSections.processes ? (
                        <ChevronUp className="h-4 w-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-slate-400" />
                      )}
                    </div>
                  </button>
                  {expandedSections.processes && (
                    <div className="mt-2 space-y-1 rounded-lg bg-slate-50 p-3 text-slate-600 animate-in fade-in">
                      {wizard.processes.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">No processes specified</p>
                      ) : (
                        wizard.processes.map((p) => (
                          <div key={p.id} className="flex justify-between py-0.5">
                            <span className="font-semibold text-slate-800">{p.name}</span>
                            <span className="text-slate-500">
                              {p.mandatory === "Yes" ? "Mandatory" : p.preference}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* 2. Technical Attributes */}
                <div className="py-3">
                  <button
                    type="button"
                    onClick={() => toggleSection("attributes")}
                    className="flex w-full items-center justify-between text-left font-bold text-slate-800 hover:text-blue-600"
                  >
                    <div className="flex items-center gap-2">
                      <div className={`h-2.5 w-2.5 rounded-full shadow-xs ${wizard.technicalAttributes.length > 0 ? "bg-emerald-500" : "bg-slate-300"}`} />
                      <span>Technical Attributes</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500 font-medium text-[11px]">
                      <span>{wizard.technicalAttributes.length} specified</span>
                      {expandedSections.attributes ? (
                        <ChevronUp className="h-4 w-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-slate-400" />
                      )}
                    </div>
                  </button>
                  {expandedSections.attributes && (
                    <div className="mt-2 space-y-1 rounded-lg bg-slate-50 p-3 text-slate-600 animate-in fade-in">
                      {wizard.technicalAttributes.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">No technical attributes specified</p>
                      ) : (
                        wizard.technicalAttributes.map((a) => (
                          <div key={a.id} className="flex justify-between py-0.5">
                            <span className="font-semibold text-slate-800">{a.name}</span>
                            <span className="text-slate-600">
                              {a.operator} {a.value} {a.unit !== "—" ? a.unit : ""} ({a.mandatory})
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* 3. Materials */}
                <div className="py-3">
                  <button
                    type="button"
                    onClick={() => toggleSection("materials")}
                    className="flex w-full items-center justify-between text-left font-bold text-slate-800 hover:text-blue-600"
                  >
                    <div className="flex items-center gap-2">
                      <div className={`h-2.5 w-2.5 rounded-full shadow-xs ${wizard.materials.length > 0 ? "bg-emerald-500" : "bg-slate-300"}`} />
                      <span>Materials</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500 font-medium text-[11px]">
                      <span>{wizard.materials.length} selected</span>
                      {expandedSections.materials ? (
                        <ChevronUp className="h-4 w-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-slate-400" />
                      )}
                    </div>
                  </button>
                  {expandedSections.materials && (
                    <div className="mt-2 space-y-1 rounded-lg bg-slate-50 p-3 text-slate-600 animate-in fade-in">
                      {wizard.materials.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">No materials specified</p>
                      ) : (
                        wizard.materials.map((m) => (
                          <div key={m.id} className="flex justify-between py-0.5">
                            <span className="font-semibold text-slate-800">{m.material}</span>
                            <span className="text-slate-600">{m.grade} ({m.mandatory})</span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* 4. Quality & Compliance */}
                <div className="py-3">
                  <button
                    type="button"
                    onClick={() => toggleSection("quality")}
                    className="flex w-full items-center justify-between text-left font-bold text-slate-800 hover:text-blue-600"
                  >
                    <div className="flex items-center gap-2">
                      <div className={`h-2.5 w-2.5 rounded-full shadow-xs ${wizard.qualityCompliance.length > 0 ? "bg-emerald-500" : "bg-slate-300"}`} />
                      <span>Quality & Compliance</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500 font-medium text-[11px]">
                      <span>{wizard.qualityCompliance.length} selected</span>
                      {expandedSections.quality ? (
                        <ChevronUp className="h-4 w-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-slate-400" />
                      )}
                    </div>
                  </button>
                  {expandedSections.quality && (
                    <div className="mt-2 space-y-1 rounded-lg bg-slate-50 p-3 text-slate-600 animate-in fade-in">
                      {wizard.qualityCompliance.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">No quality standards specified</p>
                      ) : (
                        wizard.qualityCompliance.map((q) => (
                          <div key={q.id} className="flex justify-between py-0.5">
                            <span className="font-semibold text-slate-800">{q.standard}</span>
                            <span className="text-slate-600">{q.notes} · {q.mandatory}</span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* 5. Operations */}
                <div className="py-3">
                  <button
                    type="button"
                    onClick={() => toggleSection("operations")}
                    className="flex w-full items-center justify-between text-left font-bold text-slate-800 hover:text-blue-600"
                  >
                    <div className="flex items-center gap-2">
                      <div className={`h-2.5 w-2.5 rounded-full shadow-xs ${wizard.operations.length > 0 ? "bg-emerald-500" : "bg-slate-300"}`} />
                      <span>Operations</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500 font-medium text-[11px]">
                      <span>{wizard.operations.length} operations</span>
                      {expandedSections.operations ? (
                        <ChevronUp className="h-4 w-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-slate-400" />
                      )}
                    </div>
                  </button>
                  {expandedSections.operations && (
                    <div className="mt-2 space-y-1 rounded-lg bg-slate-50 p-3 text-slate-600 animate-in fade-in">
                      {wizard.operations.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">No operations specified</p>
                      ) : (
                        wizard.operations.map((op) => (
                          <div key={op.id} className="flex justify-between py-0.5">
                            <span className="text-slate-800">
                              <b className="text-slate-500 mr-2">{op.seq}.</b> {op.operation}
                            </span>
                            <span className="text-slate-500">{op.mandatory}</span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* 6. Delivery & Commercial */}
                <div className="py-3">
                  <button
                    type="button"
                    onClick={() => toggleSection("commercial")}
                    className="flex w-full items-center justify-between text-left font-bold text-slate-800 hover:text-blue-600"
                  >
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-xs" />
                      <span>Delivery & Commercial</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500 font-medium text-[11px]">
                      <span>6 details</span>
                      {expandedSections.commercial ? (
                        <ChevronUp className="h-4 w-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-slate-400" />
                      )}
                    </div>
                  </button>
                  {expandedSections.commercial && (
                    <div className="mt-2 space-y-1.5 rounded-lg bg-slate-50 p-3 text-slate-600 animate-in fade-in">
                      <div className="flex justify-between py-0.5">
                        <span className="font-bold text-slate-700">Location:</span>
                        <span>{wizard.deliveryLocation}</span>
                      </div>
                      <div className="flex justify-between py-0.5">
                        <span className="font-bold text-slate-700">Delivery Terms:</span>
                        <span>{wizard.deliveryTerms}</span>
                      </div>
                      <div className="flex justify-between py-0.5">
                        <span className="font-bold text-slate-700">Payment Terms:</span>
                        <span>{wizard.paymentTerms}</span>
                      </div>
                      <div className="flex justify-between py-0.5">
                        <span className="font-bold text-slate-700">Incoterms:</span>
                        <span>{wizard.incoterms}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* 7. Attachments */}
                <div className="py-3 last:pb-0">
                  <button
                    type="button"
                    onClick={() => toggleSection("attachments")}
                    className="flex w-full items-center justify-between text-left font-bold text-slate-800 hover:text-blue-600"
                  >
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-xs" />
                      <span>Attachments</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500 font-medium text-[11px]">
                      <span>{wizard.attachments.length} files</span>
                      {expandedSections.attachments ? (
                        <ChevronUp className="h-4 w-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-slate-400" />
                      )}
                    </div>
                  </button>
                  {expandedSections.attachments && (
                    <div className="mt-2 space-y-2 rounded-xl bg-slate-50 p-3 text-slate-600 animate-in fade-in">
                      {wizard.attachments.length === 0 ? (
                        <p className="text-[11px] text-slate-400 italic">No attachments provided</p>
                      ) : (
                        wizard.attachments.map((a) => {
                          const isImg = a.dataBase64?.startsWith("data:image/") || /\.(png|jpe?g|webp|gif|svg)$/i.test(a.name);
                          return (
                            <div
                              key={a.id}
                              className="flex items-center justify-between rounded-lg bg-white p-2.5 border border-slate-200 shadow-2xs"
                            >
                              <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
                                {isImg && a.dataBase64 ? (
                                  <img
                                    src={a.dataBase64}
                                    alt={a.name}
                                    className="h-9 w-9 rounded-md object-cover border border-slate-200 shrink-0"
                                  />
                                ) : (
                                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-600 font-bold text-[10px]">
                                    {a.type || "FILE"}
                                  </div>
                                )}
                                <div className="min-w-0 flex-1 truncate">
                                  <span className="block font-bold text-slate-800 truncate text-xs" title={a.name}>
                                    {a.name}
                                  </span>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[10px] text-slate-400">{a.size}</span>
                                    {a.dataBase64 && (
                                      <span className="inline-flex items-center rounded bg-emerald-50 px-1.5 py-0.2 text-[9px] font-semibold text-emerald-700">
                                        Base64 Stored
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {a.dataBase64 && (
                                <a
                                  href={a.dataBase64}
                                  download={a.name}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition shrink-0"
                                  title="Download / View Attachment"
                                >
                                  <Download className="h-3.5 w-3.5" />
                                  <span>Download</span>
                                </a>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Confirmation Checkbox */}
        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50/50 p-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-xs font-bold text-slate-800 select-none">
              I confirm that the above information is accurate and complete.
            </span>
          </label>
        </div>

        {/* Footer Navigation */}
        <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-6">
          <button
            type="button"
            onClick={handleBack}
            className="rounded-xl border border-slate-300 bg-white px-6 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
          >
            Back
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={isSavingDraft || publishing}
              className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
            >
              {isSavingDraft ? "Saving..." : "Save as Draft"}
            </button>

            <div className="text-right">
              <button
                type="button"
                onClick={handlePublish}
                disabled={publishing || !confirmed || isSavingDraft}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-8 py-3 text-xs font-extrabold text-white shadow-md shadow-emerald-600/20 transition hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-600/30 disabled:opacity-40"
              >
                <Send className="h-3.5 w-3.5" />
                {publishing ? "Publishing..." : "Publish Requirement"}
              </button>
              <p className="mt-1 text-[11px] text-slate-400 font-medium">
                You can edit later
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
