import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Package, Briefcase, UserCheck, Loader2 } from "lucide-react";
import { useRequirementWizard, RequirementType } from "./wizard/requirementWizardStore";
import { RequirementStepper } from "./wizard/RequirementStepper";
import { useCreateRequirement, useBuyerSession } from "../../../../services/buyer/hooks";
import { buyerRepository } from "../../../../services/buyer/buyerRepository";
import { toast } from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";
import { buyerKeys } from "../../../../services/buyer/queryKeys";

export default function RequirementBasicPage() {
  const nav = useNavigate();
  const { id } = useParams();
  const wizard = useRequirementWizard();
  const createMutation = useCreateRequirement();
  const session = useBuyerSession();
  const qc = useQueryClient();

  const [isLoading, setIsLoading] = useState(false);
  const [reqType, setReqType] = useState<RequirementType>(wizard.requirementType || "Goods");
  const [title, setTitle] = useState(wizard.title || "CNC Machining Components");
  const [internalRef, setInternalRef] = useState(wizard.internalRef || "PR-2025-0001");
  const [description, setDescription] = useState(
    wizard.description ||
      "We are looking to procure high precision CNC Machining components for automotive production expansion. The parts must meet tight dimensional tolerances and require VMC/HMC milling, turning, surface treatment, and complete inspection reports."
  );
  const [errors, setErrors] = useState<{ title?: string; description?: string }>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadRequirement() {
      if (!id || id === 'new' || id.startsWith('req-')) return;
      if (wizard.requirementId === id && wizard.title) {
        setTitle(wizard.title);
        setDescription(wizard.description);
        setInternalRef(wizard.internalRef || '');
        setReqType(wizard.requirementType || 'Goods');
        return;
      }
      
      try {
        setIsLoading(true);
        const req = await buyerRepository.getRequirement(id);
        const details = req.detailsJson || {};
        const reqT = (req.sourcingType === "Service" ? "Services" : req.sourcingType as RequirementType) || "Goods";
        
        wizard.set({
          requirementId: req.id,
          requirementCode: req.code,
          status: req.status,
          title: req.title,
          description: req.description,
          internalRef: details.internalRef || '',
          requirementType: reqT,
          quantity: req.quantity,
          uom: req.unit,
          needByDate: req.neededBy,
          segment: req.category,
          classification: req.subcategory,
          ...details
        });
        
        setTitle(req.title);
        setDescription(req.description);
        setInternalRef(details.internalRef || '');
        setReqType(reqT);
      } catch (err) {
        toast.error("Failed to load requirement details.");
      } finally {
        setIsLoading(false);
      }
    }
    loadRequirement();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const saveRequirement = async (isDraftOnly: boolean = false) => {
    const newErrors: { title?: string; description?: string } = {};
    if (!title.trim()) newErrors.title = "Requirement title is required";
    if (!description.trim()) newErrors.description = "Requirement description is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSaving(true);
    try {
      let savedId = (id && id !== 'new' && !id.startsWith('req-')) ? id : wizard.requirementId;
      const futureDate = wizard.needByDate && new Date(wizard.needByDate) > new Date()
        ? wizard.needByDate
        : new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0];

      const sourcingTypeValue = reqType === "Services" ? "Service" : reqType === "Consulting" ? "Service" : "Product";

      if (!savedId || savedId.startsWith('req-')) {
        const res = await createMutation.mutateAsync({
          organizationId: session.data?.buyerOrganisationId ?? '00000000-0000-0000-0000-000000000000',
          title,
          description,
          sourcingType: sourcingTypeValue,
          segmentCode: null,
          mainCategoryCode: null,
          classificationCode: null,
          quantity: wizard.quantity || 100,
          uomCode: wizard.uom || "NOS",
          needByDate: futureDate,
          details: {
            internalRef,
            requirementType: reqType,
            segment: wizard.segment,
            mainCategory: wizard.mainCategory,
            classification: wizard.classification,
            hsnCode: wizard.hsnCode,
            recordId: wizard.recordId,
          },
        });
        if (res?.id) {
          savedId = res.id;
          wizard.set({
            requirementId: res.id,
            requirementCode: res.code,
            needByDate: futureDate,
            title,
            description,
            internalRef,
            requirementType: reqType,
            status: "DRAFT"
          });
        }
      } else {
        await buyerRepository.saveDraft(`requirements/${savedId}`, {
          title,
          description,
          sourcingType: sourcingTypeValue,
          segmentCode: wizard.segment,
          mainCategoryCode: wizard.mainCategory,
          classificationCode: wizard.classification,
          quantity: wizard.quantity || 100,
          uomCode: wizard.uom || "NOS",
          needByDate: futureDate,
          details: {
            ...wizard,
            title,
            description,
            internalRef,
            requirementType: reqType,
          }
        }, 0);
        wizard.set({
          requirementId: savedId,
          title,
          description,
          internalRef,
          requirementType: reqType,
        });
        await qc.invalidateQueries({ queryKey: buyerKeys.requirements });
        await qc.invalidateQueries({ queryKey: buyerKeys.requirement(savedId) });
      }

      const targetId = savedId || wizard.requirementId || `req-${Date.now()}`;
      if (isDraftOnly) {
        toast.success("Draft saved successfully!");
        if (!id || id === 'new') {
          nav(`/buyer/requirements/${targetId}/basic`, { replace: true });
        }
      } else {
        nav(`/buyer/requirements/${targetId}/classification`);
      }
    } catch (err) {
      toast.error("Failed to save requirement basic info");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndNext = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveRequirement(false);
  };

  const typeOptions: Array<{
    type: RequirementType;
    title: string;
    description: string;
    icon: typeof Package;
  }> = [
    {
      type: "Goods",
      title: "Goods",
      description: "Physical products and equipment",
      icon: Package,
    },
    {
      type: "Services",
      title: "Services",
      description: "Work, job work or professional services",
      icon: Briefcase,
    },
    {
      type: "Consulting",
      title: "Consulting",
      description: "Consulting and advisory services",
      icon: UserCheck,
    },
  ];

  return (
    <div className="mx-auto max-w-5xl">
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm md:p-8">
        <RequirementStepper step={1} status={wizard.status || "DRAFT"} />

        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
            {id && id !== 'new' && !id.startsWith('req-') ? "Edit Requirement — Basic Information" : "Create New Requirement"}
          </h1>
          <p className="mt-1 text-xs font-medium text-slate-500">
            Let&apos;s start by telling us what you need
          </p>
        </div>

        <form onSubmit={handleSaveAndNext} className="space-y-8">
          {/* Requirement Type */}
          <div>
            <label className="mb-3 block text-sm font-bold text-slate-900">
              Requirement Type
            </label>
            <div className="grid gap-4 sm:grid-cols-3">
              {typeOptions.map((opt) => {
                const Icon = opt.icon;
                const isSelected = reqType === opt.type;
                return (
                  <button
                    key={opt.type}
                    type="button"
                    onClick={() => setReqType(opt.type)}
                    className={`group relative flex flex-col items-center rounded-xl border-2 p-6 text-center transition-all ${
                      isSelected
                        ? "border-blue-600 bg-blue-50/40 ring-2 ring-blue-500/20 shadow-sm"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                    }`}
                  >
                    <div
                      className={`flex h-14 w-14 items-center justify-center rounded-xl transition ${
                        isSelected
                          ? "bg-blue-600 text-white shadow-md shadow-blue-500/25"
                          : "bg-slate-100 text-slate-600 group-hover:bg-slate-200/70"
                      }`}
                    >
                      <Icon className="h-7 w-7" />
                    </div>
                    <h3 className="mt-4 text-base font-bold text-slate-900">
                      {opt.title}
                    </h3>
                    <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
                      {opt.description}
                    </p>
                    {isSelected && (
                      <div className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-blue-600 ring-4 ring-blue-100" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Basic Information */}
          <div className="border-t border-slate-100 pt-6">
            <h2 className="mb-4 text-sm font-bold text-slate-900">
              Basic Information
            </h2>

            <div className="grid gap-5 md:grid-cols-2">
              {/* Requirement Title */}
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">
                  Requirement Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (errors.title) setErrors((prev) => ({ ...prev, title: undefined }));
                  }}
                  placeholder="e.g. CNC Machining Components"
                  className={`w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm font-medium text-slate-800 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${
                    errors.title ? "border-red-500 bg-red-50/30" : "border-slate-300"
                  }`}
                />
                {errors.title && (
                  <p className="mt-1 text-xs font-medium text-red-500">{errors.title}</p>
                )}
              </div>

              {/* Internal Reference */}
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">
                  Internal Reference <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={internalRef}
                  onChange={(e) => setInternalRef(e.target.value)}
                  placeholder="e.g. PR-2025-0001"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-800 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className="mb-1.5 block text-xs font-bold text-slate-700">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    if (errors.description) setErrors((prev) => ({ ...prev, description: undefined }));
                  }}
                  placeholder="Briefly describe your requirement"
                  className={`w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm font-medium text-slate-800 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${
                    errors.description ? "border-red-500 bg-red-50/30" : "border-slate-300"
                  }`}
                />
                <div className="mt-1 flex items-center justify-between">
                  {errors.description ? (
                    <p className="text-xs font-medium text-red-500">{errors.description}</p>
                  ) : (
                    <span className="text-[11px] text-slate-400">Detailed description helps match qualified suppliers</span>
                  )}
                  <span className="text-[11px] font-medium text-slate-400">
                    {description.length}/1000
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between border-t border-slate-100 pt-6">
            <button
              type="button"
              onClick={() => nav('/buyer/requirements')}
              className="rounded-xl border border-slate-300 bg-white px-6 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
            >
              ← Back to List
            </button>
            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={saving}
                onClick={() => saveRequirement(true)}
                className="rounded-xl border border-slate-300 bg-white px-6 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save as Draft"}
              </button>
              <button
                type="submit"
                disabled={saving}
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