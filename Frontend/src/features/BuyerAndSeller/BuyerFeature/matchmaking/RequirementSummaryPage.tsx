import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  CheckCircle2,
  ChevronRight,
  Clock,
  MapPin,
  ShieldCheck,
  Sparkles,
  Tag,
  Truck,
  Wrench,
  Paperclip,
  Download,
  FileText,
  Edit,
} from 'lucide-react';
import { ScreenShell } from '../shared/ScreenShell';
import { StatusBadge } from '../../../../components/ui/StatusBadge';
import { Button } from '../../../../components/ui/Button';
import { LoadingState, ErrorState } from '../../../../components/ui/PageStates';
import { apiClient } from '../../../../data/api/apiClient';

export default function RequirementSummaryPage() {
  const { id = '' } = useParams<{ id: string }>();
  const nav = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Direct call using apiConfig.get
        const res: any = await apiClient.get(`/buyer/requirements/${id}`);
        const r = res?.data?.data ? res.data.data : res?.data ? res.data : res;

        // Safely extract detailsJson object or parse if string
        let d: Record<string, any> = {};
        const rawDetails = r.detailsJson ?? r.DetailsJson ?? r.details;
        if (typeof rawDetails === 'object' && rawDetails !== null) {
          d = rawDetails;
        } else if (typeof rawDetails === 'string') {
          try {
            d = JSON.parse(rawDetails);
          } catch {
            d = {};
          }
        }

        const tech = d.technical || d.technicalQualification || d.technicalCriteria || {};
        const comm = d.commercial || {};

        const codeType = d.codeType || (r.sourcingType === 'SERVICE' ? 'SAC' : 'HSN');
        const classificationCode = r.classificationCode || r.ClassificationCode || d.classificationCode || d.hsnCode || '-';
        const classificationName = d.classification || d.hsnDescription || '-';
        const mainCategory = d.mainCategory || r.mainCategoryCode || r.MainCategoryCode || '-';
        const mainCategoryCode = d.mainCategoryCode || r.mainCategoryCode || r.MainCategoryCode || '';
        const budgetRange = comm.budgetRange || d.budgetRange || '-';
        const needByDate = comm.needByDate || d.needByDate || r.needByDate || r.NeedByDate || '-';

        const updatedData: any = {
          id: r.id || id,
          requirementNo: r.requirementNo || r.RequirementNo || 'N/A',
          status: r.status || r.Status || 'DRAFT',
          title: d.title || r.title || r.Title || 'Untitled Requirement',
          description: d.description || r.description || r.Description || 'No description provided.',
          segment: d.segment || r.segmentCode || r.SegmentCode || '-',
          codeType,
          mainCategory,
          mainCategoryCode,
          classification: classificationName,
          classificationCode,
          itemCode: d.hsnCode || classificationCode,
          itemDescription: d.hsnDescription || classificationName,
          quantity: d.quantity ?? r.quantity ?? r.Quantity ?? 1,
          uom: d.uom || r.uomCode || r.UomCode || 'NOS',
          keywords: Array.isArray(d.keywords) ? d.keywords : [],

          // Technical Criteria
          materialGrade: tech.materialGrade?.trim() || d.materialGrade?.trim() || 'Not Specified',
          surfaceFinish: tech.surfaceFinish?.trim() || d.surfaceFinish?.trim() || 'Not Specified',
          maxComponentSize: tech.maxComponentSize?.trim() || d.maxComponentSize?.trim() || 'As per Drawing',
          drawingAvailable: tech.drawingAvailable || d.drawingAvailable || 'No',
          minMachineCapacity: tech.minMachineCapacity ?? d.minMachineCapacity ?? 1,
          minExperience: tech.minExperience || d.minExperience || 'Not Specified',
          requiredProcesses: (tech.requiredProcesses || d.requiredProcesses || []) as string[],
          certifications: (tech.certifications || d.certifications || []) as string[],
          files: (tech.files || d.files || []) as string[],

          // Commercial Terms
          budgetRange,
          moqQuantity: comm.moqQuantity ?? d.moqQuantity ?? 1,
          moqUom: comm.moqUom || d.moqUom || d.uom || 'NOS',
          deliveryTerms: comm.deliveryTerms || d.deliveryTerms || 'EXW',
          maxLeadTimeDays: comm.maxLeadTimeDays || d.maxLeadTimeDays || 30,
          deliveryLocation: comm.deliveryLocation || d.deliveryLocation || '-',
          preferredStates: comm.preferredStates || d.preferredStates || '-',
          considerOtherStates: comm.considerOtherStates || d.considerOtherStates || 'No',
          needByDate,
          lastSavedStep: d.lastSavedStep || '-',
          attachments: (Array.isArray(d.attachments)
            ? d.attachments
            : Array.isArray(comm.attachments)
              ? comm.attachments
              : Array.isArray(tech.attachments)
                ? tech.attachments
                : Array.isArray(d.files)
                  ? d.files.map((f: any, idx: number) => typeof f === 'string' ? { id: `att-${idx}`, name: f, size: '', type: 'FILE' } : f)
                  : []) as Array<{ id: string; name: string; size?: string; type?: string; dataBase64?: string }>,
          tags: [] as any[],
        };

        // Fetch suggested & confirmed tags from database endpoint
        let confirmedTags: Array<{
          tagId: string;
          tagName: string;
          tagCode: string;
          tagGroup?: string;
          tagTypeName?: string;
          selected?: boolean;
          confidenceScore?: number;
          uiBehaviour?: string;
        }> = [];

        try {
          const tagsRes: any = await apiClient.get(`/buyer/requirements/${id}/tags`);
          const tData = tagsRes?.data?.data ? tagsRes.data.data : tagsRes?.data ? tagsRes.data : tagsRes;
          if (tData?.groups && Array.isArray(tData.groups)) {
            for (const grp of tData.groups) {
              if (Array.isArray(grp.tags)) {
                for (const tg of grp.tags) {
                  if (tg.selected) {
                    confirmedTags.push({
                      tagId: tg.tagId,
                      tagName: tg.tagName,
                      tagCode: tg.tagCode,
                      tagGroup: tg.tagGroup || grp.tagTypeCode,
                      tagTypeName: grp.tagTypeName || tg.tagGroup || 'Requirement Tag',
                      selected: true,
                      confidenceScore: tg.confidenceScore,
                      uiBehaviour: tg.uiBehaviour,
                    });
                  }
                }
              }
            }
          }
        } catch (tagErr) {
          console.warn('Could not load confirmed tags for requirement', tagErr);
        }

        // Fallback to tags or selectedTags in detailsJson
        if (confirmedTags.length === 0) {
          if (Array.isArray(d.tags)) confirmedTags = d.tags;
          else if (Array.isArray(d.selectedTags)) confirmedTags = d.selectedTags;
        }

        updatedData.tags = confirmedTags;
        setData(updatedData);
      } catch (err: any) {
        setError(err?.response?.data?.message || err.message || 'An error occurred while fetching details');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) return <LoadingState />;
  if (error || !data) return <ErrorState error={error} retry={() => window.location.reload()} />;

  return (
    <ScreenShell
      screen={11}
      title="Requirement Summary"
      subtitle="Complete view of specifications, classification type, and matching details."
      actions={
        <div className="flex items-center gap-3">
          <StatusBadge status={data.status} />
          <Button
            variant="secondary"
            onClick={() => nav(`/buyer/requirements/${data.id}/basic`)}
          >
            <Edit className="h-4 w-4" />
            Edit Requirement
          </Button>
          <Button onClick={() => nav(`/buyer/requirements/${data.id}/matches`)}>
            <Sparkles className="h-4 w-4" />
            View Matches
          </Button>
        </div>
      }
    >
      {/* 4 Metric Top KPI Badges */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Requirement No
          </span>
          <div className="mt-1 font-mono text-lg font-extrabold text-blue-900">
            {data.requirementNo}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Target Quantity
          </span>
          <div className="mt-1 text-lg font-extrabold text-slate-900">
            {data.quantity} <span className="text-xs font-semibold text-slate-500">{data.uom}</span>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Budget Range
          </span>
          <div className="mt-1 text-lg font-extrabold text-emerald-700">{data.budgetRange}</div>
        </div>
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Need By Date
          </span>
          <div className="mt-1 flex items-center gap-1.5 text-lg font-extrabold text-slate-900">
            <Clock className="h-4 w-4 text-slate-400" />
            {data.needByDate}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          {/* Section 1: Classification & Basic Information */}
          <div className="rounded-xl border border-slate-200/80 bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/50 px-5 py-3">
              <Tag className="h-4 w-4 text-blue-600" />
              <h2 className="text-xs font-extrabold uppercase tracking-wide text-slate-700">
                1. General & Classification Details
              </h2>
            </div>
            <div className="p-5">
              <div className="mb-4">
                <h3 className="text-lg font-extrabold text-slate-900">{data.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">{data.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 rounded-lg bg-slate-50/70 p-4 text-xs">
                <div>
                  <span className="text-slate-400">Segment</span>
                  <p className="mt-0.5 font-bold text-slate-800">{data.segment}</p>
                </div>
                <div>
                  <span className="text-slate-400">Code Type / Scope</span>
                  <p className="mt-0.5 font-bold text-slate-800">
                    <span className="mr-1.5 rounded bg-blue-100 px-2 py-0.5 font-mono text-[11px] font-bold text-blue-800">
                      {data.codeType}
                    </span>
                    {data.codeType === 'SAC' ? 'Services / Job Work' : 'Goods / Products'}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400">Main Category</span>
                  <p className="mt-0.5 font-bold text-slate-800">
                    {data.mainCategory} {data.mainCategoryCode ? `[${data.mainCategoryCode}]` : ''}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400">Classification / Sub-category</span>
                  <p className="mt-0.5 font-bold text-slate-800">{data.classification}</p>
                </div>
                {/* <div>
                  <span className="text-slate-400">Classification Code</span>
                  <p className="mt-0.5 font-mono font-bold text-blue-800">{data.classificationCode}</p>
                </div> */}
                <div>
                  <span className="text-slate-400">{data.codeType} Code</span>
                  <p className="mt-0.5 font-mono font-bold text-blue-800">{data.itemCode}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400">{data.codeType} Description</span>
                  <p className="mt-0.5 font-medium text-slate-700">{data.itemDescription}</p>
                </div>
              </div>

              {data.keywords.length > 0 && (
                <div className="mt-4 flex flex-wrap items-center gap-1.5 pt-2">
                  <span className="text-[11px] font-bold text-slate-400">Keywords & Processes:</span>
                  {data.keywords.map((kw: string, i: number) => (
                    <span
                      key={i}
                      className="rounded-md bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Confirmed Suggestion Tags */}
          <div className="rounded-xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-5 py-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-blue-600" />
                <h2 className="text-xs font-extrabold uppercase tracking-wide text-slate-700">
                  Confirmed Suggestion Tags
                </h2>
              </div>
              <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[11px] font-bold text-blue-700">
                {data.tags?.length || 0} confirmed
              </span>
            </div>
            <div className="p-5">
              {!data.tags || data.tags.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/50 p-4 text-center text-xs text-slate-400">
                  No specific suggestion tags were confirmed for this requirement.
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {data.tags.map((tag: any, idx: number) => {
                    const tagGroup = tag.tagGroup || tag.tagTypeName || 'TAG';
                    return (
                      <div
                        key={tag.tagId || idx}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50/80 px-3 py-1.5 text-xs text-blue-900 shadow-2xs transition hover:bg-blue-100"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                        <span className="font-bold">{tag.tagName || tag.tagCode}</span>
                        {tagGroup && (
                          <span className="rounded bg-blue-200/70 px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider text-blue-800">
                            {tagGroup.replace(/_/g, ' ')}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Technical & Quality Criteria */}
          <div className="rounded-xl border border-slate-200/80 bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/50 px-5 py-3">
              <Wrench className="h-4 w-4 text-blue-600" />
              <h2 className="text-xs font-extrabold uppercase tracking-wide text-slate-700">
                2. Technical / Mandatory Criteria
              </h2>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-2 gap-4 text-xs sm:grid-cols-3">
                <div className="rounded-lg border border-slate-100 p-3">
                  <span className="text-slate-400">Material Grade</span>
                  <p className="mt-1 font-bold text-slate-900">{data.materialGrade}</p>
                </div>
                <div className="rounded-lg border border-slate-100 p-3">
                  <span className="text-slate-400">Drawing Available</span>
                  <p className="mt-1 font-bold text-slate-900">{data.drawingAvailable}</p>
                </div>
                <div className="rounded-lg border border-slate-100 p-3">
                  <span className="text-slate-400">Min Capacity / Mo</span>
                  <p className="mt-1 font-bold text-slate-900">{data.minMachineCapacity} Machines</p>
                </div>
                <div className="rounded-lg border border-slate-100 p-3">
                  <span className="text-slate-400">Supplier Experience</span>
                  <p className="mt-1 font-bold text-slate-900">{data.minExperience}</p>
                </div>
                <div className="rounded-lg border border-slate-100 p-3">
                  <span className="text-slate-400">Max Component Size</span>
                  <p className="mt-1 font-bold text-slate-900">{data.maxComponentSize}</p>
                </div>
                <div className="rounded-lg border border-slate-100 p-3">
                  <span className="text-slate-400">Surface Finish</span>
                  <p className="mt-1 font-bold text-slate-900">{data.surfaceFinish}</p>
                </div>
              </div>

              <div className="mt-5 border-t border-slate-100 pt-4">
                <h4 className="mb-2 text-xs font-bold text-slate-700">Required Processes / Capabilities</h4>
                <div className="flex flex-wrap gap-2">
                  {data.requiredProcesses.length > 0 ? (
                    data.requiredProcesses.map((proc: string, i: number) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1 text-xs font-bold text-blue-900"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />
                        {proc}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400">None specified</span>
                  )}
                </div>
              </div>

              <div className="mt-4 border-t border-slate-100 pt-4">
                <h4 className="mb-2 text-xs font-bold text-slate-700">Mandatory Certifications</h4>
                <div className="flex flex-wrap gap-2">
                  {data.certifications.length > 0 ? (
                    data.certifications.map((cert: string, i: number) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-900"
                      >
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                        {cert}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400">None specified</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Commercial Terms & Supplier Matching */}
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200/80 bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/50 px-5 py-3">
              <Truck className="h-4 w-4 text-blue-600" />
              <h2 className="text-xs font-extrabold uppercase tracking-wide text-slate-700">
                3. Commercial & Delivery Snapshot
              </h2>
            </div>
            <div className="p-5">
              <dl className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <dt className="text-slate-400">Delivery Terms</dt>
                  <dd className="mt-0.5 font-bold text-slate-900">{data.deliveryTerms}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Max Lead Time</dt>
                  <dd className="mt-0.5 font-bold text-slate-900">{data.maxLeadTimeDays} Days</dd>
                </div>
                <div>
                  <dt className="text-slate-400">MOQ Quantity</dt>
                  <dd className="mt-0.5 font-bold text-slate-900">{data.moqQuantity} {data.moqUom}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Consider Other States</dt>
                  <dd className="mt-0.5 font-bold text-slate-900">{data.considerOtherStates}</dd>
                </div>
                <div className="col-span-2 border-t border-slate-100 pt-2">
                  <dt className="text-slate-400">Delivery Destination</dt>
                  <dd className="mt-0.5 flex items-center gap-1.5 font-bold text-slate-900">
                    <MapPin className="h-3.5 w-3.5 text-red-500" />
                    {data.deliveryLocation}
                  </dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-slate-400">Preferred Manufacturing Regions</dt>
                  <dd className="mt-0.5 font-medium text-slate-800">{data.preferredStates}</dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Attachments & Drawings Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <Paperclip className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Attachments & Specifications</h3>
                  <p className="text-[11px] text-slate-400">Technical drawings, certificates, and commercial documents</p>
                </div>
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">
                {data.attachments?.length || 0} {data.attachments?.length === 1 ? 'file' : 'files'}
              </span>
            </div>

            <div className="mt-4">
              {!data.attachments || data.attachments.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400">
                  No attachments or drawing files uploaded for this requirement.
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {data.attachments.map((att: any) => {
                    const isImg = att.dataBase64?.startsWith('data:image/') || /\.(png|jpe?g|webp|gif|svg)$/i.test(att.name || '');
                    return (
                      <div
                        key={att.id || att.name}
                        className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs transition hover:border-blue-200 hover:bg-blue-50/20"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
                          {isImg && att.dataBase64 ? (
                            <img
                              src={att.dataBase64}
                              alt={att.name}
                              className="h-10 w-10 rounded-lg object-cover border border-slate-200 shrink-0"
                            />
                          ) : (
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700 font-extrabold text-[10px]">
                              {att.type || 'DOC'}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <span className="block font-bold text-slate-900 truncate" title={att.name}>
                              {att.name}
                            </span>
                            <div className="flex items-center gap-2 mt-0.5">
                              {att.size && <span className="text-[10px] text-slate-400">{att.size}</span>}
                              {att.dataBase64 && (
                                <span className="inline-flex items-center rounded bg-emerald-50 px-1.5 py-0.2 text-[9px] font-semibold text-emerald-700">
                                  Base64 Ready
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {att.dataBase64 ? (
                          <a
                            href={att.dataBase64}
                            download={att.name}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition shrink-0 shadow-2xs"
                            title="Download Attachment"
                          >
                            <Download className="h-3.5 w-3.5" />
                            <span>Download</span>
                          </a>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">No direct file</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-blue-100 bg-gradient-to-b from-blue-50/40 to-white shadow-sm">
            {/* <div className="border-b border-blue-100 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wide text-blue-900">
                    Supplier Matching
                  </span>
                  <h3 className="text-lg font-extrabold text-slate-900">Match Compatibility</h3>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-blue-600">92%</span>
                  <p className="text-[10px] font-bold text-slate-400">Top Match</p>
                </div>
              </div>
            </div> */}

            <div className="p-5">
              {/* <div className="mb-5 space-y-3">
                {[
                  { label: `${data.codeType} (${data.classificationCode}) Alignment`, score: 100, color: 'bg-emerald-500' },
                  { label: `Processes (${data.requiredProcesses.length} Matched)`, score: 100, color: 'bg-blue-600' },
                  { label: `Certifications (${data.certifications.length} Specified)`, score: 100, color: 'bg-emerald-500' },
                  { label: 'Geographical Proximity (South Region)', score: 90, color: 'bg-blue-600' },
                ].map((item, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between text-[11px]">
                      <span className="font-semibold text-slate-700">{item.label}</span>
                      <b className="text-slate-900">{item.score}%</b>
                    </div>
                    <div className="mt-1 h-2 rounded-full bg-slate-100">
                      <div className={`h-2 rounded-full ${item.color}`} style={{ width: `${item.score}%` }} />
                    </div>
                  </div>
                ))}
              </div> */}

              <Link to={`/buyer/requirements/${data.id}/matches`}>
                <Button className="mt-4 w-full justify-between shadow-md">
                  <span>View All Matching Suppliers</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </ScreenShell>
  );
}