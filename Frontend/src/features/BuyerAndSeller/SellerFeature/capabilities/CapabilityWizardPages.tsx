import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  useCapabilityStep,
  useCreateCapability,
  usePublishCapability,
  useSellerCapability,
  useSellerSession,
  useUpdateCapability,
} from '../../../../services/seller/hooks';
import {
  Field,
  Footer,
  inputClass,
  SellerWizard,
} from '../shared/SellerWizard';
import { useTaxonomySegments, useTaxonomyCategories, useTaxonomyClassifications, TaxonomyClassification, useCapabilitySuggestedTags, useSaveCapabilityTags, type RequirementSuggestedTagGroup } from '../../../../services/referenceData/Taxonomyhooks';
import { AlertCircle, FileText, Info, Search, ShieldCheck, Box, Network, Tag, Hash, Ruler, Settings, Factory, Package, Building2, LayoutGrid, Tags, MoreVertical, ChevronUp, ChevronDown, CheckCircle2, Plus, UploadCloud, X, Globe, Truck, Plane, IndianRupee, Headphones, Check, User, Star, Boxes, BarChart3, Edit2, Eye, Send, Layers, Cog, Cpu, Sliders, Loader2, Download, Paperclip } from 'lucide-react';
import { parseTechnicalJson, parseCommercialJson } from './schema';
import { httpClient } from '../../../../services/api/httpClient';

const emptyId = '00000000-0000-0000-0000-000000000000';

// ----------------------------------------------------------------------
// 1. Basic Information Step
// ----------------------------------------------------------------------
export function CapabilityBasicPage() {
  const { id } = useParams();
  const isNew = !id || id === 'new';
  const nav = useNavigate();
  const session = useSellerSession();
  const create = useCreateCapability();
  const updateCap = useUpdateCapability();
  const q = useSellerCapability(isNew ? '' : id);

  const [form, setForm] = useState({
    title: '',
    description: '',
    businessType: '',
    capabilityType: '',
    plantLocation: '',
    contactPerson: '',
    contactEmail: '',
    mobileCode: '+91',
    mobileNumber: '',
    designation: '',
  });

  const [locations, setLocations] = useState<string[]>(['Coimbatore', 'Chennai', 'Hosur', 'Bengaluru']);
  const [isAddingLocation, setIsAddingLocation] = useState(false);
  const [newLocationText, setNewLocationText] = useState('');

  useEffect(() => {
    if (q.data && !isNew) {
      setForm({
        title: q.data.title || '',
        description: q.data.description || '',
        businessType: q.data.businessType || '',
        capabilityType: 'Both', // default mock if not in db
        plantLocation: q.data.plantLocation || '',
        contactPerson: q.data.contactPerson || '',
        contactEmail: q.data.contactEmail || '',
        mobileCode: '+91',
        mobileNumber: '',
        designation: '',
      });
      if (q.data.plantLocation && !locations.includes(q.data.plantLocation)) {
        setLocations(prev => [...prev, q.data.plantLocation!]);
      }
    } else {
      setForm((prev) => ({ ...prev, contactEmail: prev.contactEmail || '' }));
    }
  }, [q.data, isNew]);

  const set = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const save = async (isDraftOnly = false) => {
    if (!form.title.trim()) {
      toast.error('Capability Title is required.');
      return;
    }
    if (!form.description.trim()) {
      toast.error('Capability Description is required.');
      return;
    }

    try {
      if (!isNew && id && id !== 'undefined' && id !== 'new') {
        await updateCap.mutateAsync({
          id,
          payload: {
            title: form.title.trim(),
            description: form.description.trim(),
            businessType: form.businessType,
            plantLocation: form.plantLocation,
            contactPerson: form.contactPerson,
            contactEmail: form.contactEmail,
          },
          version: q.data?.version ?? 0,
        });
        toast.success(isDraftOnly ? 'Capability draft updated!' : 'Basic details saved!');
        if (!isDraftOnly) {
          nav(`/seller/capabilities/${id}/classification`);
        }
        return;
      }

      let orgId = session.data?.sellerOrganisationId;
      if (!orgId || orgId === emptyId) {
        try {
          const org: any = await httpClient.get('/seller/organisation');
          if (org?.id) orgId = org.id;
        } catch {
          // ignore
        }
      }

      const row: any = await create.mutateAsync({
        ...form,
        title: form.title.trim(),
        description: form.description.trim(),
        organizationId: orgId ?? emptyId,
      });
      const createdId = row?.id ?? row?.capabilityId ?? row?.data?.id;
      if (createdId && createdId !== 'undefined') {
        toast.success(isDraftOnly ? 'Capability saved as draft!' : 'Basic details saved!');
        if (isDraftOnly) {
          nav(`/seller/capabilities/${createdId}/basic`);
        } else {
          nav(`/seller/capabilities/${createdId}/classification`);
        }
      } else {
        toast.error('Unable to create capability: No valid ID returned from server.');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save capability. Please try again.');
    }
  };

  return (
    <SellerWizard step={1} title={isNew ? 'Create Seller Capability' : 'Edit Seller Capability'}>
      <div className="mb-6 -mt-2 text-slate-500 text-sm">
        Provide basic information about your capability to get started.
      </div>

      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 p-5 md:p-6 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Seller Basic Information</h2>
            <p className="mt-1 text-sm text-slate-500">
              Enter the basic details of your capability. You can edit these details any time before publishing.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">Status <span className="text-xs">(System Controlled)</span></span>
            <span className="rounded bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">DRAFT</span>
          </div>
        </div>

        <div className="p-5 md:p-6 space-y-7">
          <div>
            <Field label="Capability Title" required>
              <input
                className={inputClass}
                placeholder="Enter a short and clear title for your capability"
                value={form.title}
                onChange={(e) => set('title', e.target.value)}

                maxLength={120}
              />
              <span className="mt-1 block text-left text-[11px] text-slate-500">
                Maximum 120 characters
              </span>
            </Field>
          </div>

          <div>
            <Field label="Capability Description" required>
              <textarea
                rows={4}
                maxLength={1000}
                className={inputClass}
                placeholder="Describe what your capability is, what you offer, and key differentiators"
                value={form.description}
                onChange={(e) => set('description', e.target.value)}

              />
              <div className="mt-1 flex justify-between text-[11px] text-slate-500">
                <span>Maximum 1000 characters</span>
                <span>{form.description.length} / 1000</span>
              </div>
            </Field>
          </div>

          <div className="grid gap-6 md:grid-cols-2 items-start">
            <Field label="Business Type" required>
              <div className="relative">
                <select
                  className={`${inputClass} appearance-none`}
                  value={form.businessType}
                  onChange={(e) => set('businessType', e.target.value)}

                >
                  <option value="" disabled>Select business type</option>
                  <option value="MANUFACTURER">Manufacturer</option>
                  <option value="SERVICE_PROVIDER">Service Provider</option>
                  <option value="TRADER">Trader</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                  <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                </div>
              </div>
            </Field>

            <Field label="Capability Type" required>
              <div className="grid grid-cols-3 gap-3">
                {['Goods', 'Services', 'Both'].map((type) => (
                  <label key={type} className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 text-sm font-medium transition ${form.capabilityType === type ? 'border-blue-600 bg-blue-50 text-blue-800' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'}`}>
                    <div className="flex items-center gap-2">
                      {type === 'Goods' && <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>}
                      {type === 'Services' && <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
                      {type === 'Both' && <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>}
                      <span>{type}</span>
                    </div>
                    <div className={`h-4 w-4 rounded-full border ${form.capabilityType === type ? 'border-4 border-blue-600 bg-white' : 'border-slate-300 bg-white'}`} />
                    <input type="radio" name="capabilityType" value={type} className="sr-only" checked={form.capabilityType === type} onChange={(e) => set('capabilityType', e.target.value)} />
                  </label>
                ))}
              </div>
            </Field>
          </div>

          <div>
            <Field label="Plant / Service Location" required>
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <select
                    className={`${inputClass} appearance-none`}
                    value={form.plantLocation}
                    onChange={(e) => set('plantLocation', e.target.value)}

                  >
                    <option value="" disabled>Select Plant / Service Location</option>
                    {locations.map(loc => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                    <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                  </div>
                </div>
                {isAddingLocation ? (
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={newLocationText}
                      onChange={e => setNewLocationText(e.target.value)}
                      placeholder="Location name"
                      className={`${inputClass} w-48`}
                      autoFocus
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (newLocationText.trim()) {
                            setLocations(prev => [...prev, newLocationText.trim()]);
                            set('plantLocation', newLocationText.trim());
                            setIsAddingLocation(false);
                            setNewLocationText('');
                          }
                        }
                      }}
                    />
                    <button type="button" onClick={() => {
                      if (newLocationText.trim()) {
                        setLocations(prev => [...prev, newLocationText.trim()]);
                        set('plantLocation', newLocationText.trim());
                        setIsAddingLocation(false);
                        setNewLocationText('');
                      }
                    }} className="px-4 py-2.5 bg-blue-600 text-white rounded-lg font-bold text-xs hover:bg-blue-700 transition">Save</button>
                    <button type="button" onClick={() => { setIsAddingLocation(false); setNewLocationText(''); }} className="px-3 py-2.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition"><X className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <button type="button" onClick={() => setIsAddingLocation(true)} className="flex items-center gap-2 whitespace-nowrap rounded-lg border border-blue-200 bg-blue-50 px-5 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100" >
                    <span className="text-lg leading-none">+</span> Add New Location
                  </button>
                )}
              </div>
              <span className="mt-1 block text-[11px] text-slate-500">
                Select the primary location where your capability is based or delivered.
              </span>
            </Field>
          </div>

          <div className="border-t border-slate-100 pt-6">
            <h3 className="mb-4 text-base font-bold text-blue-700">Primary Contact</h3>
            <div className="grid gap-6 md:grid-cols-2">
              <Field label="Contact Person Name" required>
                <input
                  className={inputClass}
                  placeholder="Enter full name of primary contact"
                  value={form.contactPerson}
                  onChange={(e) => set('contactPerson', e.target.value)}

                />
              </Field>

              <Field label="Email Address" required>
                <input
                  type="email"
                  className={inputClass}
                  placeholder="Enter email address"
                  value={form.contactEmail}
                  onChange={(e) => set('contactEmail', e.target.value)}

                />
              </Field>

              <Field label="Mobile Number" required>
                <div className="flex gap-3">
                  <div className="relative w-24">
                    <select
                      className={`${inputClass} appearance-none pr-8`}
                      value={form.mobileCode}
                      onChange={(e) => set('mobileCode', e.target.value)}

                    >
                      <option value="+91">+91</option>
                      <option value="+1">+1</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                      <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <input
                      type="tel"
                      className={inputClass}
                      placeholder="Enter 10 digit mobile number"
                      value={form.mobileNumber}
                      onChange={(e) => set('mobileNumber', e.target.value)}

                    />
                  </div>
                </div>
                <span className="mt-1 block text-[11px] text-slate-500">
                  OTP will be sent to this number for verification.
                </span>
              </Field>

              <Field label="Designation">
                <input
                  className={inputClass}
                  placeholder="Enter designation"
                  value={form.designation}
                  onChange={(e) => set('designation', e.target.value)}
                  disabled={!isNew}
                />
              </Field>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-5">
        <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-blue-100">
          <svg className="h-4 w-4 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
        </div>
        <div>
          <h4 className="font-bold text-blue-900">Implementation Tips</h4>
          <div className="mt-3 grid gap-4 text-xs text-blue-800 md:grid-cols-4">
            <div className="flex gap-2"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 font-bold text-white">1</span><span>Keep company profile information separate from capability details. This helps in accurate matching.</span></div>
            <div className="flex gap-2"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 font-bold text-white">2</span><span>Status is system-controlled. It will change automatically as you progress through the steps.</span></div>
            <div className="flex gap-2"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 font-bold text-white">3</span><span>Capture business-level capability first. Detailed classification and attributes will be added in later steps.</span></div>
            <div className="flex gap-2"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 font-bold text-white">4</span><span>Do not ask for HSN/SAC on this screen. Classification will be captured in later steps.</span></div>
          </div>
        </div>
      </div>

      <Footer back={() => nav('/seller/capabilities')} onSave={() => save(true)} onContinue={() => save(false)} loading={create.isPending || updateCap.isPending} />
    </SellerWizard>
  );
}

// ----------------------------------------------------------------------
// 2. Classification & UOM Step
// ----------------------------------------------------------------------
export function CapabilityClassificationPage() {
  const { id = '' } = useParams();
  const nav = useNavigate();
  const q = useSellerCapability(id && id !== 'undefined' && id !== 'new' ? id : '');
  const save = useCapabilityStep('classification');

  if (!id || id === 'undefined' || id === 'new') {
    return (
      <SellerWizard step={2} title="Classification & HSN/SAC">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-amber-600 mb-2" />
          <h3 className="text-lg font-bold text-amber-800">Capability Not Found</h3>
          <p className="text-sm text-amber-700 mt-1 mb-4">Please complete the basic information first to create your capability.</p>
          <button onClick={() => nav('/seller/capabilities/new')} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700">
            Go to Step 1: Basic Information
          </button>
        </div>
      </SellerWizard>
    );
  }

  // --- Real backend-backed cascading lookups (same taxonomyHooks the buyer
  // classification screen uses — Segments/MainCategories/Classifications tables
  // seeded by the HSN_SAC_Public_Master_Seed package) ---------------------
  const segmentsQuery = useTaxonomySegments();
  const segments = segmentsQuery.data ?? [];

  const [selectedSegmentCode, setSelectedSegmentCode] = useState<string>('');
  const [selectedCategoryCode, setSelectedCategoryCode] = useState<string>('');
  const [selectedClassificationId, setSelectedClassificationId] = useState<string>('');
  const [uomCode, setUomCode] = useState<string>('NOS');

  // Restore from the saved capability once it loads, else default to the first segment.
  useEffect(() => {
    if (!selectedSegmentCode && segments.length > 0) {
      const restored = segments.find((s) => s.segmentCode === q.data?.segmentCode);
      setSelectedSegmentCode(restored?.segmentCode ?? segments[0].segmentCode);
    }
  }, [segments, selectedSegmentCode, q.data?.segmentCode]);

  useEffect(() => {
    if (q.data?.uomCode) setUomCode(q.data.uomCode);
  }, [q.data?.uomCode]);

  const categoriesQuery = useTaxonomyCategories(selectedSegmentCode || undefined);
  const categories = categoriesQuery.data ?? [];

  useEffect(() => {
    if (categories.length > 0 && !categories.some((c) => c.categoryCode === selectedCategoryCode)) {
      const restored = categories.find((c) => c.categoryCode === q.data?.mainCategoryCode);
      setSelectedCategoryCode(restored?.categoryCode ?? categories[0].categoryCode);
    }
  }, [categories, selectedCategoryCode, q.data?.mainCategoryCode]);

  const classificationsQuery = useTaxonomyClassifications(selectedCategoryCode || undefined);
  const classifications = classificationsQuery.data ?? [];

  useEffect(() => {
    if (classifications.length > 0 && !classifications.some((c) => c.id === selectedClassificationId)) {
      const restored = classifications.find((c) => c.verifiedCode === q.data?.classificationCode);
      setSelectedClassificationId(restored?.id ?? classifications[0].id);
    }
  }, [classifications, selectedClassificationId, q.data?.classificationCode]);

  const activeSegment = segments.find((s) => s.segmentCode === selectedSegmentCode);
  const activeCategory = categories.find((c) => c.categoryCode === selectedCategoryCode);
  const activeClassification: TaxonomyClassification | undefined = classifications.find(
    (c) => c.id === selectedClassificationId
  );

  const activeCategoryCode = activeCategory?.categoryCode ?? '';
  const activeClassificationCode = activeClassification?.verifiedCode ?? '';

  // System-derived HSN/SAC card — straight from the DB record (verifiedCode IS
  // the HSN/SAC code, codeSystem tells HSN vs SAC), no client-side guessing.
  const derivedCodeDetails = useMemo(() => {
    if (activeClassification) {
      return {
        codeType: activeClassification.codeSystem,
        code: activeClassification.verifiedCode,
        description: activeClassification.verifiedClassificationName,
        recordId: activeClassification.recordId,
      };
    }
    return { codeType: 'HSN', code: '—', description: 'Standard classification item', recordId: '—' };
  }, [activeClassification]);

  const availableSegments = segments;
  const availableCategories = categories;
  const availableSubCategories = classifications;

  const handleSegmentChange = (segmentCode: string) => {
    setSelectedSegmentCode(segmentCode);
    setSelectedCategoryCode('');
    setSelectedClassificationId('');
  };

  const handleCategoryChange = (categoryCode: string) => {
    setSelectedCategoryCode(categoryCode);
    setSelectedClassificationId('');
  };

  const go = async () => {
    if (!id || id === 'undefined') {
      toast.error("Capability ID is invalid. Please start from Step 1.");
      nav('/seller/capabilities/new');
      return;
    }
    if (!activeSegment || !activeCategory || !activeClassification) {
      toast.error("Please select Segment, Category, and Classification before proceeding.");
      return;
    }
    try {
      await save.mutateAsync({
        id,
        payload: {
          codeType: derivedCodeDetails.codeType,
          segment: activeSegment.segmentName,
          segmentCode: activeSegment.segmentCode,
          mainCategoryCode: activeCategory.categoryCode,
          classificationCode: activeClassification.verifiedCode,
          hsnCode: derivedCodeDetails.code,
          hsnDescription: derivedCodeDetails.description,
          classification: derivedCodeDetails.description,
          uomCode,
        },
        version: q.data?.version ?? 1,
      });
      nav(`/seller/capabilities/${id}/suggestions`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to save classification.");
    }
  };

  return (
    <SellerWizard step={2} title="Classification & HSN/SAC">
      <div className="mb-6 -mt-2 text-slate-500 text-sm">
        Select the capability classification to derive HSN/SAC and get intelligent suggestions.
      </div>

      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Classification Details</h2>
            <p className="mt-1 text-sm text-slate-500">
              Choose the classification that best describes your capability.
            </p>
          </div>
          <div className="flex items-start gap-3 rounded-lg border border-blue-100 bg-blue-50 p-4 md:max-w-sm">
            <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
              <span className="text-xs font-bold font-serif italic">i</span>
            </div>
            <span className="text-xs text-blue-900 leading-tight">
              <strong className="text-blue-700 block mb-0.5">HSN/SAC code alone is not the capability key.</strong>
              Complete your full capability details in the subsequent steps.
            </span>
          </div>
        </div>

        <div className="p-5 md:p-6 space-y-6">
          <Field label="Segment" required>
            <div className="relative">
              <select
                className={`${inputClass} appearance-none`}
                value={selectedSegmentCode}
                onChange={(e) => handleSegmentChange(e.target.value)}
              >
                <option value="" disabled>Select segment</option>
                {availableSegments.map((segment) => (
                  <option key={segment.id} value={segment.segmentCode}>
                    {segment.segmentName}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
              </div>
            </div>
          </Field>

          <Field label="Main Category" required>
            <div className="relative">
              <select
                className={`${inputClass} appearance-none`}
                value={activeCategoryCode}
                onChange={(e) => handleCategoryChange(e.target.value)}
              >
                <option value="" disabled>Select category</option>
                {availableCategories.map((cat) => (
                  <option key={cat.id} value={cat.categoryCode}>
                    {cat.categoryName}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
              </div>
            </div>
          </Field>

          <Field label="Classification / Sub-category" required>
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <select
                className={`${inputClass} appearance-none pl-10 pr-10`}
                value={selectedClassificationId}
                onChange={(e) => setSelectedClassificationId(e.target.value)}
              >
                <option value="" disabled>Search and select classification</option>
                {availableSubCategories.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.subCategory}
                  </option>
                ))}
              </select>
              {selectedClassificationId && (
                <button type="button" onClick={() => setSelectedClassificationId('')} className="absolute right-3 top-3 text-slate-400 hover:text-slate-600">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              )}
            </div>
            <span className="mt-1 block text-left text-[11px] text-slate-500">
              Type to search and select the most relevant classification.
            </span>
          </Field>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <Field label={<>Record ID <Info className="h-3.5 w-3.5 text-slate-400" /></>}>
              <input type="text" className={`${inputClass} bg-slate-50 text-slate-600 font-mono`} disabled value={derivedCodeDetails.recordId} />
            </Field>

            <Field label={<>Code Type <Info className="h-3.5 w-3.5 text-slate-400" /></>}>
              <input type="text" className={`${inputClass} bg-slate-50 text-slate-600`} disabled value={derivedCodeDetails.codeType} />
            </Field>

            <Field label={<>HSN/SAC Code (Derived) <Info className="h-3.5 w-3.5 text-slate-400" /></>}>
              <input type="text" className={`${inputClass} bg-slate-50 text-slate-600`} disabled value={derivedCodeDetails.code || '—'} />
            </Field>

            <Field label={<>Classification Description <Info className="h-3.5 w-3.5 text-slate-400" /></>}>
              <input type="text" className={`${inputClass} bg-slate-50 text-slate-600`} disabled value={derivedCodeDetails.description} />
            </Field>

            <div>
              <Field label={<>Tax Use Status <Info className="h-3.5 w-3.5 text-slate-400" /></>} />
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 text-green-700 text-sm font-semibold">
                <ShieldCheck className="w-4 h-4" /> Allowed for Tax Use
              </div>
            </div>

            <Field label={<>Default UOM <Info className="h-3.5 w-3.5 text-slate-400" /></>}>
              <div className="relative">
                <select
                  className={`${inputClass} appearance-none`}
                  value={uomCode}
                  onChange={(e) => setUomCode(e.target.value)}
                >
                  <option value="NOS">NOS – Numbers (Each)</option>
                  <option value="KG">KG – Kilograms</option>
                  <option value="HRS">HRS – Hours</option>
                  <option value="SET">SET – Sets</option>
                  <option value="MTR">MTR – Meters</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                  <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                </div>
              </div>
            </Field>
          </div>

          <div className="mt-6 flex items-start gap-3 rounded-lg border border-blue-100 bg-blue-50 p-4">
            <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-blue-600 text-blue-600">
              <span className="text-xs font-bold font-serif italic">i</span>
            </div>
            <div>
              <strong className="text-blue-900 text-sm block mb-1">HSN/SAC is derived from the selected Record ID and should not be edited manually.</strong>
              <p className="text-xs text-blue-800">If you believe the classification is incorrect, please choose a different classification.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-5">
        <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-blue-100">
          <svg className="h-4 w-4 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
        </div>
        <div>
          <h4 className="font-bold text-blue-900">Implementation Tips</h4>
          <div className="mt-3 grid gap-4 text-xs text-blue-800 md:grid-cols-4">
            <div className="flex gap-2"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 font-bold text-white">1</span><span>Use the cascading selections (Segment → Category → Sub-category) to find the most accurate classification.</span></div>
            <div className="flex gap-2"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 font-bold text-white">2</span><span>Record_ID is the canonical key that maps your capability to the official HSN/SAC master.</span></div>
            <div className="flex gap-2"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 font-bold text-white">3</span><span>HSN/SAC code is derived and read-only to ensure data integrity and compliance.</span></div>
            <div className="flex gap-2"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 font-bold text-white">4</span><span>Tax Use Status is context-sensitive and helps determine taxability and invoice requirements.</span></div>
          </div>
        </div>
      </div>

      <Footer
        back={() => nav(id && id !== 'new' && id !== 'undefined' ? `/seller/capabilities/${id}/basic` : '/seller/capabilities/new/basic')}
        onSave={go}
        onContinue={go}
        loading={save.isPending}
      />
    </SellerWizard>
  );
}

// ----------------------------------------------------------------------
// 3. Suggestions Step
// ----------------------------------------------------------------------
type FilterTab = "All" | "Auto" | "Recommended" | "Optional" | "Conditional" | "Matching Only";

const GROUP_STYLE: Record<string, { icon: typeof Cog; iconBg: string }> = {
  MATERIAL: { icon: Layers, iconBg: "bg-emerald-600 text-white" },
  PROCESS: { icon: Cog, iconBg: "bg-purple-600 text-white" },
  MACHINE: { icon: Cpu, iconBg: "bg-blue-600 text-white" },
  ATTRIBUTE: { icon: Sliders, iconBg: "bg-amber-600 text-white" },
  QUALITY: { icon: ShieldCheck, iconBg: "bg-teal-600 text-white" },
  COMPLIANCE: { icon: ShieldCheck, iconBg: "bg-teal-600 text-white" },
};
const DEFAULT_STYLE = { icon: Tag, iconBg: "bg-slate-600 text-white" };

function styleForGroup(tagTypeCode: string) {
  return GROUP_STYLE[tagTypeCode?.toUpperCase()] ?? DEFAULT_STYLE;
}

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

export function CapabilitySuggestionsPage() {
  const { id = '' } = useParams();
  const nav = useNavigate();
  const q = useSellerCapability(id && id !== 'undefined' && id !== 'new' ? id : '');
  const tagsQuery = useCapabilitySuggestedTags(id && id !== 'undefined' && id !== 'new' ? id : undefined);
  const saveTagsMutation = useSaveCapabilityTags(id);

  if (!id || id === 'undefined' || id === 'new') {
    return (
      <SellerWizard step={3} title="Intelligent Suggestions">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-amber-600 mb-2" />
          <h3 className="text-lg font-bold text-amber-800">Capability Not Found</h3>
          <p className="text-sm text-amber-700 mt-1 mb-4">Please complete the basic information first to create your capability.</p>
          <button onClick={() => nav('/seller/capabilities/new')} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700">
            Go to Step 1: Basic Information
          </button>
        </div>
      </SellerWizard>
    );
  }

  const [activeTab, setActiveTab] = useState<FilterTab>("All");
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

  const go = async () => {
    setSaveError(null);
    if (id && id !== 'new') {
      try {
        await saveTagsMutation.mutateAsync({
          selectedTagIds: Array.from(selectedTagIds),
          version: q.data?.version ?? 0,
        });
      } catch (err) {
        console.warn("Could not save selected tags to backend", err);
        setSaveError("Could not save your selections to the server. Please retry.");
        return;
      }
    }
    nav(`/seller/capabilities/${id}/technical`);
  };

  const summary = {
    segment: q.data?.segmentCode || 'Industrial Manufacturing',
    category: q.data?.mainCategoryCode || 'Machinery & Equipment',
    classification: q.data?.classificationCode || 'Not specified',
    hsnCode: q.data?.classificationCode || 'N/A',
    uom: q.data?.uomCode || 'NOS',
  };

  const isLoading = tagsQuery.isLoading;
  const hasNoClassification = !isLoading && tagsQuery.data && !tagsQuery.data.classificationCode;
  const hasNoSuggestions = !isLoading && tagsQuery.data && tagsQuery.data.classificationCode && groups.length === 0;

  return (
    <SellerWizard step={3} title="Intelligent Suggestions">
      <div className="mb-6 -mt-2 text-slate-500 text-sm">
        System-generated suggestions based on your selected classification. Select the tags that apply to your offering.
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 md:p-6 mb-6 shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-4">
          <h3 className="text-base font-extrabold text-slate-900">Selected Classification Summary</h3>
          <span className="rounded-full border border-green-200 bg-green-50 px-2.5 py-0.5 text-xs font-bold text-green-700">From Step 02</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-5 gap-x-10">
          <div className="flex items-start gap-3">
            <Box className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Segment</p>
              <p className="font-semibold text-slate-900 text-sm">{summary.segment}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Network className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Main Category</p>
              <p className="font-semibold text-slate-900 text-sm">{summary.category}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Tag className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Classification / Sub-category</p>
              <p className="font-semibold text-slate-900 text-sm">{summary.classification}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Hash className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-slate-500 mb-0.5">HSN / SAC Code</p>
              <p className="font-semibold text-slate-900 text-sm">{summary.hsnCode}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Ruler className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Default UOM</p>
              <p className="font-semibold text-slate-900 text-sm">{summary.uom}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6 flex flex-wrap items-center gap-2 border-b border-slate-100 pb-4">
        {tabs.map((tab) => {
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all ${isSelected
                ? "bg-blue-600 text-white shadow-sm shadow-blue-500/20"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
                }`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className="ml-1 text-[11px] opacity-85">
                  ({tab.count})
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center gap-2 py-10 text-sm font-semibold text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
          Loading intelligent suggestions for your classification…
        </div>
      )}

      {hasNoClassification && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs font-semibold text-amber-800 mb-6">
          No classification was saved for this capability yet. Please go back to Step 02 and select a Segment / Category / Classification first.
        </div>
      )}

      {hasNoSuggestions && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs font-semibold text-slate-600 mb-6">
          No automated suggestions are currently configured for this classification. You can continue to manually add your processes and capabilities.
        </div>
      )}

      {/* Suggestion Groups from DB */}
      {!isLoading && groups.length > 0 && (
        <div className="space-y-4 mb-6">
          {groups.map((group) => {
            const { icon: Icon, iconBg } = styleForGroup(group.tagTypeCode);
            const visibleTags = group.tags.filter((t) => tagMatchesTab(t, activeTab));
            if (visibleTags.length === 0) return null;

            return (
              <div
                key={group.tagTypeCode}
                className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-blue-200 md:flex-row md:items-center md:justify-between"
              >
                {/* Category Title & Icon */}
                <div className="flex items-center gap-3 min-w-[200px]">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-xs ${iconBg}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{group.tagTypeName}</h3>
                    <p className="text-[11px] text-slate-400">{visibleTags.length} suggestions</p>
                  </div>
                </div>

                {/* Chips */}
                <div className="flex flex-wrap items-center gap-2 flex-1 md:justify-end">
                  {visibleTags.map((tag) => {
                    const isChecked = selectedTagIds.has(tag.tagId);
                    const isMandatoryLocked = tag.mandatoryStatus?.toUpperCase() === "MANDATORY" && !tag.editableByUser;
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
                        className={`rounded-lg border px-3 py-1.5 text-xs font-semibold shadow-2xs transition flex items-center gap-1.5 ${isChecked
                          ? "border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-400/30"
                          : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-slate-50"
                          } ${isMandatoryLocked ? "cursor-not-allowed opacity-80" : ""}`}
                      >
                        {tag.tagName}
                        {isChecked && <Check className="w-3.5 h-3.5 text-blue-600" />}
                      </button>
                    );
                  })}
                </div>

                {/* Badge count */}
                <div className="shrink-0 text-right min-w-[70px]">
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
                    {visibleTags.filter((t) => selectedTagIds.has(t.tagId)).length} picked
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {saveError && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-xs font-semibold text-red-700">
          {saveError}
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-col md:flex-row gap-6 mb-6">
        <div className="flex-1 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h4 className="font-bold text-slate-900 mb-4 text-sm">Legend – Suggestion States</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="flex items-center gap-1.5 font-bold text-slate-700 text-xs mb-1 uppercase"><div className="w-2.5 h-2.5 rounded-full bg-blue-600" /> AUTO</div>
              <p className="text-[10px] text-slate-500 leading-tight">Derived automatically from taxonomy</p>
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-bold text-slate-700 text-xs mb-1 uppercase"><div className="w-2.5 h-2.5 rounded-full bg-blue-400" /> RECOMMENDED</div>
              <p className="text-[10px] text-slate-500 leading-tight">Strongly aligned with this classification</p>
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-bold text-slate-700 text-xs mb-1 uppercase"><div className="w-2.5 h-2.5 rounded-full bg-slate-400" /> OPTIONAL</div>
              <p className="text-[10px] text-slate-500 leading-tight">Applies based on your specialized capability</p>
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-bold text-slate-700 text-xs mb-1 uppercase"><div className="w-2.5 h-2.5 rounded-full bg-purple-400" /> CONDITIONAL</div>
              <p className="text-[10px] text-slate-500 leading-tight">Applies under specific buyer conditions</p>
            </div>
          </div>
        </div>
        <div className="md:w-1/3 shrink-0 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start gap-2 text-blue-700 font-bold text-sm mb-2">
            <Info className="w-4 h-4 mt-0.5" /> Important Note
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Your selected tags are stored directly in the marketplace match index to connect you with relevant buyer RFQs and requirements.
          </p>
        </div>
      </div>

      <Footer
        back={() => nav(`/seller/capabilities/${id}/classification`)}
        onSave={go}
        onContinue={go}
      />
    </SellerWizard>
  );
}

// ----------------------------------------------------------------------
// 4. Technical Capabilities Step
// ----------------------------------------------------------------------
export function CapabilityTechnicalPage() {
  const { id = '' } = useParams();
  const nav = useNavigate();
  const q = useSellerCapability(id);
  const save = useCapabilityStep('technical');

  const technical = useMemo(() => parseTechnicalJson(q.data?.technicalJson), [q.data?.technicalJson]);

  const [selectedProcesses, setSelectedProcesses] = useState<string[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [machines, setMachines] = useState<{ type: string; make?: string; count: string; capacity?: string }[]>([]);
  const [attributes, setAttributes] = useState<{ attribute: string; value: string }[]>([]);
  const [newProcess, setNewProcess] = useState('');
  const [newMaterial, setNewMaterial] = useState('');

  useEffect(() => {
    if (technical) {
      if (technical.processes) setSelectedProcesses(technical.processes);
      if (technical.materials) setSelectedMaterials(technical.materials);
      if (technical.machines) setMachines(technical.machines);
      if (technical.attributes) setAttributes(technical.attributes);
    }
  }, [technical]);

  const addMachine = () => {
    setMachines(prev => [...prev, { type: '', make: '', count: '1', capacity: '' }]);
  };

  const updateMachine = (index: number, field: string, value: string) => {
    setMachines(prev => prev.map((m, i) => i === index ? { ...m, [field]: value } : m));
  };

  const removeMachine = (index: number) => {
    setMachines(prev => prev.filter((_, i) => i !== index));
  };

  const addAttribute = () => {
    setAttributes(prev => [...prev, { attribute: '', value: '' }]);
  };

  const updateAttribute = (index: number, field: string, val: string) => {
    setAttributes(prev => prev.map((a, i) => i === index ? { ...a, [field]: val } : a));
  };

  const removeAttribute = (index: number) => {
    setAttributes(prev => prev.filter((_, i) => i !== index));
  };

  const addProcess = () => {
    if (newProcess.trim() && !selectedProcesses.includes(newProcess.trim())) {
      setSelectedProcesses(prev => [...prev, newProcess.trim()]);
    }
    setNewProcess('');
  };

  const removeProcess = (p: string) => {
    setSelectedProcesses(prev => prev.filter(x => x !== p));
  };

  const addMaterial = () => {
    if (newMaterial.trim() && !selectedMaterials.includes(newMaterial.trim())) {
      setSelectedMaterials(prev => [...prev, newMaterial.trim()]);
    }
    setNewMaterial('');
  };

  const removeMaterial = (m: string) => {
    setSelectedMaterials(prev => prev.filter(x => x !== m));
  };

  const toggleProcess = (p: string) => {
    setSelectedProcesses(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  };

  const toggleMaterial = (m: string) => {
    setSelectedMaterials(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]);
  };

  const go = async () => {
    try {
      const existing = parseTechnicalJson(q.data?.technicalJson);
      await save.mutateAsync({
        id,
        payload: { ...existing, processes: selectedProcesses, materials: selectedMaterials, machines, attributes },
        version: q.data?.version ?? 1,
      });
      nav(`/seller/capabilities/${id}/quality`);
    } catch (e) {
      console.error('Failed to save technical capability', e);
      alert('Failed to save capability. Please check the console for errors.');
    }
  };

  return (
    <SellerWizard step={4} title="Processes & Technical Capabilities">
      <div className="mb-6 -mt-2 text-slate-500 text-sm">
        Confirm the actual processes you offer and the measurable technical parameters.
      </div>

      <div className="rounded-xl border border-slate-200 bg-white mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between p-5 md:p-6 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Confirm Your Processes & Technical Capabilities</h2>
            <p className="mt-1 text-sm text-slate-500">
              Select only what is actually supported with your equipment, skills and quality systems.
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center gap-3">
            <span className="text-xs text-slate-500">Status (System Controlled)</span>
            <span className="rounded bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">DRAFT</span>
          </div>
        </div>

        <div className="p-5 md:p-6">
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-slate-900 text-base">A. Confirmed Processes <span className="text-red-500">*</span></h3>
              <Info className="w-4 h-4 text-slate-400" />
            </div>
            <p className="text-xs text-slate-500 mb-4">Add all processes you actually perform in-house.</p>

            <div className="flex gap-2 mb-4">
              <input type="text" value={newProcess} onChange={e => setNewProcess(e.target.value)} onKeyDown={e => e.key === 'Enter' && addProcess()} placeholder="e.g. CNC Machining" className={inputClass} />
              <button type="button" onClick={addProcess} className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 whitespace-nowrap">Add Process</button>
            </div>

            {selectedProcesses.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {selectedProcesses.map(p => (
                  <span key={p} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-blue-200 bg-blue-50 text-xs font-semibold text-blue-900">
                    {p}
                    <button type="button" onClick={() => removeProcess(p)} className="text-blue-400 hover:text-red-500"><X className="w-3.5 h-3.5" /></button>
                  </span>
                ))}
              </div>
            ) : (
              <div className="text-sm text-slate-400 italic">No processes added yet.</div>
            )}
            <p className="text-[11px] text-slate-500 mt-3">Buyers will match against your confirmed list.</p>
          </section>

          <div className="flex flex-col xl:flex-row gap-8 mb-8 border-t border-slate-100 pt-8">
            <section className="xl:w-3/5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-slate-900 text-base">B. Machines / Equipment <span className="text-red-500">*</span></h3>
                    <Info className="w-4 h-4 text-slate-400" />
                  </div>
                  <p className="text-xs text-slate-500">Add key machines/equipment for the selected processes.</p>
                </div>
                <button type="button" onClick={addMachine} className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold text-blue-700 border border-blue-200 hover:bg-blue-50">
                  <Plus className="w-3.5 h-3.5" /> Add Machine
                </button>
              </div>

              <div className="rounded-lg border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Machine / Equipment</th>
                      <th className="px-4 py-3">Make / Model</th>
                      <th className="px-4 py-3 w-20">QTY</th>
                      <th className="px-4 py-3">Working Range / Capacity</th>
                      <th className="px-4 py-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {machines.map((m, i) => (
                      <tr key={i}>
                        <td className="px-2 py-2"><input type="text" value={m.type} onChange={e => updateMachine(i, 'type', e.target.value)} placeholder="Type" className={`${inputClass} text-xs py-1`} /></td>
                        <td className="px-2 py-2"><input type="text" value={m.make || ''} onChange={e => updateMachine(i, 'make', e.target.value)} placeholder="Make" className={`${inputClass} text-xs py-1`} /></td>
                        <td className="px-2 py-2"><input type="number" value={m.count} onChange={e => updateMachine(i, 'count', e.target.value)} min="1" className={`${inputClass} text-xs py-1`} /></td>
                        <td className="px-2 py-2"><input type="text" value={m.capacity || ''} onChange={e => updateMachine(i, 'capacity', e.target.value)} placeholder="Capacity" className={`${inputClass} text-xs py-1`} /></td>
                        <td className="px-4 py-3 text-center"><button type="button" onClick={() => removeMachine(i)} className="text-red-400 hover:text-red-600"><X className="w-4 h-4 mx-auto" /></button></td>
                      </tr>
                    ))}
                    {machines.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-slate-400 italic">No machines added. Click "Add Machine" to start building your equipment list.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="xl:w-2/5">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-slate-900 text-base">C. Materials Handled <span className="text-red-500">*</span></h3>
                <Info className="w-4 h-4 text-slate-400" />
              </div>
              <p className="text-xs text-slate-500 mb-4">Add the materials you can work with.</p>

              <div className="flex gap-2 mb-4">
                <input type="text" value={newMaterial} onChange={e => setNewMaterial(e.target.value)} onKeyDown={e => e.key === 'Enter' && addMaterial()} placeholder="e.g. Stainless Steel" className={inputClass} />
                <button type="button" onClick={addMaterial} className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 whitespace-nowrap">Add Material</button>
              </div>

              {selectedMaterials.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {selectedMaterials.map(m => (
                    <span key={m} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-blue-200 bg-blue-50 text-xs font-semibold text-blue-900">
                      {m}
                      <button type="button" onClick={() => removeMaterial(m)} className="text-blue-400 hover:text-red-500"><X className="w-3.5 h-3.5" /></button>
                    </span>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-slate-400 italic">No materials added yet.</div>
              )}
              <p className="text-[11px] text-slate-500 mt-3">List applies to all confirmed processes.</p>
            </section>
          </div>

          <section className="mb-8 border-t border-slate-100 pt-8">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-slate-900 text-base">D. Technical Attributes <span className="text-red-500">*</span></h3>
                  <Info className="w-4 h-4 text-slate-400" />
                </div>
                <p className="text-xs text-slate-500">Provide measurable technical limits for your confirmed processes. Values with units are mandatory where marked.</p>
              </div>
              <span className="text-xs text-slate-400 italic">Attributes are dynamic based on process selection.</span>
            </div>

            <div className="space-y-3">
              {attributes.map((attr, i) => (
                <div key={i} className="flex items-center gap-3">
                  <input type="text" value={attr.attribute} onChange={e => updateAttribute(i, 'attribute', e.target.value)} placeholder="e.g. Dimensional Tolerance" className={`${inputClass} flex-1`} />
                  <input type="text" value={attr.value} onChange={e => updateAttribute(i, 'value', e.target.value)} placeholder="e.g. ±0.010 mm" className={`${inputClass} flex-1`} />
                  <button type="button" onClick={() => removeAttribute(i)} className="text-red-400 hover:text-red-600 px-2"><X className="w-4 h-4" /></button>
                </div>
              ))}
              {attributes.length === 0 && (
                <div className="text-sm text-slate-400 italic">No specific technical attributes defined.</div>
              )}
            </div>

            <button type="button" onClick={addAttribute} className="mt-4 flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold text-blue-700 border border-blue-200 hover:bg-blue-50">
              <Plus className="w-3.5 h-3.5" /> Add Attribute
            </button>
            <p className="text-[11px] text-slate-500 mt-2">These values help buyers assess feasibility and match requirements.</p>
          </section>
        </div>
      </div>

      <div className="mt-6 flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-5">
        <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100">
          <svg className="h-4 w-4 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
        </div>
        <div>
          <h4 className="font-bold text-blue-900">Implementation Tips</h4>
          <div className="mt-3 grid gap-4 text-xs text-blue-800 md:grid-cols-4">
            <div className="flex gap-2"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 font-bold text-white">1</span><span>Confirm only the processes and equipment you actually use regularly. Over-claiming reduces buyer trust and relevance.</span></div>
            <div className="flex gap-2"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 font-bold text-white">2</span><span>Capture measurable values with units (mm, µm, kg, bar, kW, etc.). Accurate data improves matching accuracy.</span></div>
            <div className="flex gap-2"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 font-bold text-white">3</span><span>Attributes are dynamic by process classification. Add only relevant technical parameters for each process.</span></div>
            <div className="flex gap-2"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 font-bold text-white">4</span><span>Buyer mandatory criteria will be checked against these values in later steps to determine eligibility.</span></div>
          </div>
        </div>
      </div>

      <Footer
        back={() => nav(`/seller/capabilities/${id}/suggestions`)}
        onSave={go}
        onContinue={go}
      />
    </SellerWizard>
  );
}

// ----------------------------------------------------------------------
// 5. Quality & Compliance Step
// ----------------------------------------------------------------------
export function CapabilityQualityPage() {
  const { id = '' } = useParams();
  const nav = useNavigate();
  const q = useSellerCapability(id);
  const save = useCapabilityStep('technical');

  const technical = useMemo(() => parseTechnicalJson(q.data?.technicalJson), [q.data?.technicalJson]);

  const [selectedInspections, setSelectedInspections] = useState<string[]>([]);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [selectedCertifications, setSelectedCertifications] = useState<string[]>([]);
  const [selectedCompliance, setSelectedCompliance] = useState<string[]>([]);

  const [newInspection, setNewInspection] = useState('');
  const [newDocument, setNewDocument] = useState('');
  const [newCertification, setNewCertification] = useState('');
  const [newCompliance, setNewCompliance] = useState('');

  const [uploadedFiles, setUploadedFiles] = useState<{ name: string, size: string }[]>([]);

  useEffect(() => {
    if (technical) {
      if (technical.inspectionMethods) setSelectedInspections(technical.inspectionMethods);
      if (technical.certifications) setSelectedCertifications(technical.certifications);
      if (technical.environmentalStandards) setSelectedCompliance(technical.environmentalStandards);
    }
  }, [technical]);

  const addArrayItem = (setter: React.Dispatch<React.SetStateAction<string[]>>, val: string, setVal: React.Dispatch<React.SetStateAction<string>>) => {
    if (val.trim()) {
      setter(prev => prev.includes(val.trim()) ? prev : [...prev, val.trim()]);
      setVal('');
    }
  };

  const removeArrayItem = (setter: React.Dispatch<React.SetStateAction<string[]>>, val: string) => {
    setter(prev => prev.filter(x => x !== val));
  };

  const go = async () => {
    try {
      const existing = parseTechnicalJson(q.data?.technicalJson);
      await save.mutateAsync({
        id,
        payload: {
          ...existing,
          inspectionMethods: selectedInspections,
          certifications: selectedCertifications,
          environmentalStandards: selectedCompliance
        },
        version: q.data?.version ?? 1,
      });
      nav(`/seller/capabilities/${id}/operations`);
    } catch (e) {
      console.error('Failed to save quality capability', e);
      alert('Failed to save capability. Please check the console for errors.');
    }
  };

  return (
    <SellerWizard step={5} title="Materials, Quality & Compliance">
      <div className="mb-6 -mt-2 text-slate-500 text-sm">
        Share details of the materials you handle, inspection capability, quality documents and compliance.
      </div>

      <div className="rounded-xl border border-slate-200 bg-white mb-6">

        {/* A. Inspection Capability */}
        <section className="p-5 md:p-6 border-b border-slate-100">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="font-bold text-slate-900 text-base">A. Inspection Capability</h3>
            <Info className="w-4 h-4 text-slate-400" />
          </div>

          <div className="flex gap-2 mb-4">
            <input type="text" value={newInspection} onChange={e => setNewInspection(e.target.value)} onKeyDown={e => e.key === 'Enter' && addArrayItem(setSelectedInspections, newInspection, setNewInspection)} placeholder="e.g. CMM Inspection" className={inputClass} />
            <button type="button" onClick={() => addArrayItem(setSelectedInspections, newInspection, setNewInspection)} className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 whitespace-nowrap">Add Inspection</button>
          </div>

          <div className="flex flex-wrap gap-2">
            {selectedInspections.map(i => (
              <span key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-blue-200 bg-blue-50 text-xs font-semibold text-blue-900">
                {i}
                <button type="button" onClick={() => removeArrayItem(setSelectedInspections, i)} className="text-blue-400 hover:text-red-500"><X className="w-3.5 h-3.5" /></button>
              </span>
            ))}
            {selectedInspections.length === 0 && <span className="text-sm text-slate-400 italic">No inspection capabilities added.</span>}
          </div>
        </section>

        <div className="flex flex-col md:flex-row border-b border-slate-100">
          {/* B. Quality Documents */}
          <section className="p-5 md:p-6 md:w-1/2 md:border-r border-slate-100">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="font-bold text-slate-900 text-base">B. Quality Documents</h3>
              <Info className="w-4 h-4 text-slate-400" />
            </div>

            <div className="flex gap-2 mb-4">
              <input type="text" value={newDocument} onChange={e => setNewDocument(e.target.value)} onKeyDown={e => e.key === 'Enter' && addArrayItem(setSelectedDocuments, newDocument, setNewDocument)} placeholder="e.g. Inspection Report" className={inputClass} />
              <button type="button" onClick={() => addArrayItem(setSelectedDocuments, newDocument, setNewDocument)} className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 whitespace-nowrap">Add Document Type</button>
            </div>

            <div className="flex flex-col gap-2">
              {selectedDocuments.map(d => (
                <div key={d} className="flex items-center justify-between p-2 rounded-lg border border-slate-200 bg-white shadow-sm">
                  <span className="text-xs font-semibold text-slate-800">{d}</span>
                  <button type="button" onClick={() => removeArrayItem(setSelectedDocuments, d)} className="text-slate-400 hover:text-red-500"><X className="w-4 h-4" /></button>
                </div>
              ))}
              {selectedDocuments.length === 0 && <div className="text-sm text-slate-400 italic">No document types added.</div>}
            </div>
          </section>

          {/* C. Certifications */}
          <section className="p-5 md:p-6 md:w-1/2">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="font-bold text-slate-900 text-base">C. Certifications</h3>
              <Info className="w-4 h-4 text-slate-400" />
            </div>

            <div className="flex gap-2 mb-4">
              <input type="text" value={newCertification} onChange={e => setNewCertification(e.target.value)} onKeyDown={e => e.key === 'Enter' && addArrayItem(setSelectedCertifications, newCertification, setNewCertification)} placeholder="e.g. ISO 9001:2015" className={inputClass} />
              <button type="button" onClick={() => addArrayItem(setSelectedCertifications, newCertification, setNewCertification)} className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 whitespace-nowrap">Add Certification</button>
            </div>

            <div className="flex flex-col gap-2">
              {selectedCertifications.map(c => (
                <div key={c} className="flex items-center justify-between p-2 rounded-lg border border-slate-200 bg-white shadow-sm">
                  <span className="text-xs font-semibold text-slate-800">{c}</span>
                  <button type="button" onClick={() => removeArrayItem(setSelectedCertifications, c)} className="text-slate-400 hover:text-red-500"><X className="w-4 h-4" /></button>
                </div>
              ))}
              {selectedCertifications.length === 0 && <div className="text-sm text-slate-400 italic">No certifications added.</div>}
            </div>
          </section>
        </div>

        <div className="flex flex-col xl:flex-row">
          {/* D. Compliance / Industry Requirements */}
          <section className="p-5 md:p-6 xl:w-3/5 xl:border-r border-slate-100">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="font-bold text-slate-900 text-base">D. Compliance / Industry Requirements</h3>
              <Info className="w-4 h-4 text-slate-400" />
            </div>

            <div className="flex gap-2 mb-4">
              <input type="text" value={newCompliance} onChange={e => setNewCompliance(e.target.value)} onKeyDown={e => e.key === 'Enter' && addArrayItem(setSelectedCompliance, newCompliance, setNewCompliance)} placeholder="e.g. RoHS Compliant" className={inputClass} />
              <button type="button" onClick={() => addArrayItem(setSelectedCompliance, newCompliance, setNewCompliance)} className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 whitespace-nowrap">Add Compliance</button>
            </div>

            <div className="flex flex-wrap gap-2">
              {selectedCompliance.map(c => (
                <span key={c} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 bg-slate-50 text-xs font-medium text-slate-700">
                  {c}
                  <button type="button" onClick={() => removeArrayItem(setSelectedCompliance, c)} className="text-slate-400 hover:text-red-500"><X className="w-3.5 h-3.5" /></button>
                </span>
              ))}
              {selectedCompliance.length === 0 && <span className="text-sm text-slate-400 italic">No compliance requirements added.</span>}
            </div>
          </section>

          {/* E. Supporting Evidence */}
          <section className="p-5 md:p-6 xl:w-2/5">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-slate-900 text-base">E. Supporting Evidence</h3>
              <Info className="w-4 h-4 text-slate-400" />
            </div>
            <p className="text-xs text-slate-500 mb-4">Upload certificates, reports or any supporting documents (PDF, JPG, PNG).</p>

            <div className="rounded-xl border border-dashed border-blue-300 bg-blue-50/50 p-6 flex flex-col items-center justify-center text-center mb-4 relative cursor-pointer hover:bg-blue-50 transition">
              <input
                type="file"
                multiple
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={(e) => {
                  if (e.target.files) {
                    const newFiles = Array.from(e.target.files).map(f => ({ name: f.name, size: (f.size / 1024 / 1024).toFixed(2) + ' MB' }));
                    setUploadedFiles(prev => [...prev, ...newFiles]);
                  }
                }}
              />
              <UploadCloud className="w-8 h-8 text-blue-400 mb-2" />
              <div className="text-sm font-semibold text-slate-700 mb-1">Drag & drop files here or <span className="text-blue-600 font-bold ml-1">Browse Files</span></div>
              <div className="text-[10px] text-slate-500">Max file size 25MB</div>
            </div>

            {uploadedFiles.length > 0 && (
              <div>
                <div className="text-[10px] font-bold text-slate-500 mb-2">Uploaded Files ({uploadedFiles.length})</div>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {uploadedFiles.map((f, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded border border-slate-100 bg-slate-50 text-xs">
                      <div className="flex items-center gap-2 font-medium text-slate-700 truncate mr-2" title={f.name}>
                        <FileText className="w-4 h-4 text-blue-500 shrink-0" /> <span className="truncate">{f.name}</span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-slate-400 text-[10px]">{f.size}</span>
                        <X className="w-3.5 h-3.5 text-slate-400 cursor-pointer hover:text-red-500" onClick={() => setUploadedFiles(prev => prev.filter((_, idx) => idx !== i))} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-orange-200 bg-orange-50 p-4 flex items-start gap-3">
        <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-orange-500 text-orange-600">
          <span className="text-xs font-bold font-serif italic">i</span>
        </div>
        <div className="text-sm text-orange-900">
          Certifications and compliance items are system suggestions to help you get started and are conditional.
          <br />
          They must be confirmed by you. They are <strong>not inferred solely from HSN/SAC classification.</strong>
        </div>
      </div>

      <div className="mt-6 flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-5">
        <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100">
          <svg className="h-4 w-4 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
        </div>
        <div>
          <h4 className="font-bold text-blue-900">Implementation Tips</h4>
          <div className="mt-3 grid gap-4 text-xs text-blue-800 md:grid-cols-4">
            <div className="flex gap-2"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 font-bold text-white">1</span><span>Separate quality documents from certifications. Each serves a different purpose in buyer evaluation.</span></div>
            <div className="flex gap-2"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 font-bold text-white">2</span><span>Make compliance items conditional. Seller must confirm what is applicable to them.</span></div>
            <div className="flex gap-2"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 font-bold text-white">3</span><span>Upload supporting evidence for key certificates and inspection reports. Clear documents build trust.</span></div>
            <div className="flex gap-2"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 font-bold text-white">4</span><span>Persist only confirmed capability. Suggested items will not be shown to buyers.</span></div>
          </div>
        </div>
      </div>

      <Footer
        back={() => nav(`/seller/capabilities/${id}/technical`)}
        onSave={go}
        onContinue={go}
      />
    </SellerWizard>
  );
}

// ----------------------------------------------------------------------
// 6. Operations & Capacity Step
// ----------------------------------------------------------------------
export function CapabilityOperationsPage() {
  const { id = '' } = useParams();
  const nav = useNavigate();
  const q = useSellerCapability(id);
  const save = useCapabilityStep('commercial'); // save to commercialJson

  const commercial = useMemo(() => parseCommercialJson(q.data?.commercialJson), [q.data?.commercialJson]);

  const [selectedRoute, setSelectedRoute] = useState(1);

  const [sequence, setSequence] = useState<{ code: string; name: string; type: string; applicability: string; notes: string }[]>([]);
  const [capData, setCapData] = useState({
    uom: 'Nos',
    monthlyCapacity: '',
    annualCapacity: '',
    moq: '',
    batchSize: '',
    setupTime: '',
    turnaroundTime: ''
  });

  useEffect(() => {
    if (commercial) {
      if (commercial.primaryRouteId) setSelectedRoute(commercial.primaryRouteId);
      if (commercial.operations) {
        if (commercial.operations.sequence) setSequence(commercial.operations.sequence);
        setCapData({
          uom: commercial.operations.uom || 'Nos',
          monthlyCapacity: commercial.operations.monthlyCapacity || '',
          annualCapacity: commercial.operations.annualCapacity || '',
          moq: commercial.operations.moq || '',
          batchSize: commercial.operations.batchSize || '',
          setupTime: commercial.operations.setupTime || '',
          turnaroundTime: commercial.operations.turnaroundTime || ''
        });
      }
    }
  }, [commercial]);

  const addSequence = () => {
    setSequence(prev => [...prev, { code: `OP${(prev.length + 1) * 10}`, name: '', type: 'Core', applicability: 'All Orders', notes: '' }]);
  };

  const updateSequence = (idx: number, field: string, val: string) => {
    setSequence(prev => prev.map((s, i) => i === idx ? { ...s, [field]: val } : s));
  };

  const removeSequence = (idx: number) => {
    setSequence(prev => prev.filter((_, i) => i !== idx));
  };

  const go = async () => {
    try {
      const existing = parseCommercialJson(q.data?.commercialJson);
      await save.mutateAsync({
        id,
        payload: {
          ...existing,
          primaryRouteId: selectedRoute,
          operations: {
            ...capData,
            sequence
          }
        },
        version: q.data?.version ?? 1,
      });
      nav(`/seller/capabilities/${id}/commercial`);
    } catch (e) {
      console.error('Failed to save operations capability', e);
      alert('Failed to save capability. Please check the console for errors.');
    }
  };

  const renderRouteCard = (routeId: number, title: string, subtitle: string, badgeText: string, badgeColor: string) => {
    const isSelected = selectedRoute === routeId;
    return (
      <div
        className={`relative p-5 rounded-xl border-2 cursor-pointer transition ${isSelected ? 'border-blue-600 bg-blue-50/30' : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        onClick={() => setSelectedRoute(routeId)}
      >
        <div className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase mb-3 ${badgeColor}`}>
          {badgeText}
        </div>
        <h4 className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-2">
          {title}
          {routeId === 1 && <span className="px-1.5 py-0.5 rounded bg-green-100 text-green-700 text-[10px] font-bold uppercase tracking-wide">Default</span>}
        </h4>
        <p className="text-xs text-slate-500 leading-relaxed pr-6">{subtitle}</p>
        <div className="absolute bottom-5 right-5">
          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-blue-600' : 'border-slate-300'}`}>
            {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />}
          </div>
        </div>
      </div>
    );
  };

  return (
    <SellerWizard step={6} title="Operations, Capacity & UOM">
      <div className="mb-6 -mt-2 text-slate-500 text-sm">
        Add your operation sequences, capacity and units of measure to help buyers evaluate your capability.
      </div>

      <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 flex items-start gap-3 mb-6">
        <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-blue-500 text-blue-600">
          <span className="text-xs font-bold font-serif italic">i</span>
        </div>
        <div className="text-sm text-blue-900">
          Operation routes are suggestion templates to help buyers understand your process flow. They are not universal mandates.
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white mb-6">
        <section className="p-5 md:p-6 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 text-base mb-1">Suggested Route Variants</h3>
          <p className="text-sm text-slate-500 mb-4">Choose your primary (default) route and add alternate or conditional routes if applicable.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {renderRouteCard(1, 'Route 1 (Primary)', 'Standard manufacturing flow for most regular orders.', 'CORE', 'bg-green-100 text-green-700')}
            {renderRouteCard(2, 'Route 2 (Alternative)', 'Alternate flow for high mix / low volume requirements.', 'SUGGESTED', 'bg-blue-100 text-blue-700')}
            {renderRouteCard(3, 'Route 3 (Conditional)', 'Used when specific capability or material constraints apply.', 'CONDITIONAL', 'bg-orange-100 text-orange-700')}
          </div>
        </section>

        <section className="p-5 md:p-6 border-b border-slate-100 overflow-x-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 text-base">Operation Sequence – Route {selectedRoute}</h3>
            <button type="button" onClick={addSequence} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-200 text-blue-600 text-xs font-bold hover:bg-blue-50 transition">
              <Plus className="w-4 h-4" /> Add Operation
            </button>
          </div>

          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-y border-slate-200 text-xs text-slate-700 font-bold bg-slate-50">
                <th className="p-3 w-16 text-center">Seq.</th>
                <th className="p-3 border-l border-slate-200">Operation Code</th>
                <th className="p-3 border-l border-slate-200">Operation Name</th>
                <th className="p-3 border-l border-slate-200"><div className="flex items-center gap-1.5">Stage Type</div></th>
                <th className="p-3 border-l border-slate-200"><div className="flex items-center gap-1.5">Applicability</div></th>
                <th className="p-3 border-l border-slate-200">Notes (Optional)</th>
                <th className="p-3 w-10 border-l border-slate-200"></th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {sequence.map((s, idx) => (
                <tr key={idx} className="border-b border-slate-100">
                  <td className="p-2 text-center text-slate-500 font-medium">{idx + 1}</td>
                  <td className="p-2 border-l border-slate-100"><input type="text" value={s.code} onChange={e => updateSequence(idx, 'code', e.target.value)} className={`${inputClass} text-xs py-1`} /></td>
                  <td className="p-2 border-l border-slate-100"><input type="text" value={s.name} onChange={e => updateSequence(idx, 'name', e.target.value)} className={`${inputClass} text-xs py-1`} placeholder="e.g. CNC Machining" /></td>
                  <td className="p-2 border-l border-slate-100">
                    <select value={s.type} onChange={e => updateSequence(idx, 'type', e.target.value)} className={`${inputClass} text-xs py-1`}>
                      <option>Core</option>
                      <option>Inspection</option>
                      <option>Setup</option>
                      <option>Post-Processing</option>
                    </select>
                  </td>
                  <td className="p-2 border-l border-slate-100"><input type="text" value={s.applicability} onChange={e => updateSequence(idx, 'applicability', e.target.value)} className={`${inputClass} text-xs py-1`} /></td>
                  <td className="p-2 border-l border-slate-100"><input type="text" value={s.notes} onChange={e => updateSequence(idx, 'notes', e.target.value)} className={`${inputClass} text-xs py-1`} /></td>
                  <td className="p-2 border-l border-slate-100 text-center"><button type="button" onClick={() => removeSequence(idx)} className="text-slate-400 hover:text-red-500"><X className="w-4 h-4 mx-auto" /></button></td>
                </tr>
              ))}
              {sequence.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-400 italic text-xs">No operations added. Click "Add Operation" to define your process flow.</td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        <section className="p-5 md:p-6">
          <h3 className="font-bold text-slate-900 text-base mb-4">Capacity & Units of Measure</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Default UOM (Primary) <span className="text-red-500">*</span></label>
              <select className={inputClass} value={capData.uom} onChange={e => setCapData({ ...capData, uom: e.target.value })}>
                <option>Nos</option>
                <option>Kg</option>
                <option>Meter</option>
                <option>Liter</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Monthly Capacity <span className="text-red-500">*</span></label>
              <div className="flex">
                <input type="text" className={`${inputClass} rounded-r-none border-r-0`} value={capData.monthlyCapacity} onChange={e => setCapData({ ...capData, monthlyCapacity: e.target.value })} placeholder="e.g. 50,000" />
                <div className="px-3 py-2.5 border border-slate-300 border-l-0 bg-slate-50 rounded-r-lg text-sm text-slate-500">{capData.uom}</div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Annual Capacity <span className="text-red-500">*</span></label>
              <div className="flex">
                <input type="text" className={`${inputClass} rounded-r-none border-r-0`} value={capData.annualCapacity} onChange={e => setCapData({ ...capData, annualCapacity: e.target.value })} placeholder="e.g. 600,000" />
                <div className="px-3 py-2.5 border border-slate-300 border-l-0 bg-slate-50 rounded-r-lg text-sm text-slate-500">{capData.uom}</div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">MOQ (Minimum Order Quantity) <span className="text-red-500">*</span></label>
              <div className="flex">
                <input type="text" className={`${inputClass} rounded-r-none border-r-0`} value={capData.moq} onChange={e => setCapData({ ...capData, moq: e.target.value })} placeholder="e.g. 100" />
                <div className="px-3 py-2.5 border border-slate-300 border-l-0 bg-slate-50 rounded-r-lg text-sm text-slate-500">{capData.uom}</div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Batch Size (Typical) <span className="text-red-500">*</span></label>
              <div className="flex">
                <input type="text" className={`${inputClass} rounded-r-none border-r-0`} value={capData.batchSize} onChange={e => setCapData({ ...capData, batchSize: e.target.value })} placeholder="e.g. 500" />
                <div className="px-3 py-2.5 border border-slate-300 border-l-0 bg-slate-50 rounded-r-lg text-sm text-slate-500">{capData.uom}</div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Setup Time (Typical) <span className="text-red-500">*</span></label>
              <div className="flex">
                <input type="text" className={`${inputClass} rounded-r-none border-r-0`} value={capData.setupTime} onChange={e => setCapData({ ...capData, setupTime: e.target.value })} placeholder="e.g. 120" />
                <div className="px-3 py-2.5 border border-slate-300 border-l-0 bg-slate-50 rounded-r-lg text-sm text-slate-500">Min</div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Turnaround Time (Typical) <span className="text-red-500">*</span></label>
              <div className="flex">
                <input type="text" className={`${inputClass} rounded-r-none border-r-0`} value={capData.turnaroundTime} onChange={e => setCapData({ ...capData, turnaroundTime: e.target.value })} placeholder="e.g. 7" />
                <div className="px-3 py-2.5 border border-slate-300 border-l-0 bg-slate-50 rounded-r-lg text-sm text-slate-500">Days</div>
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-500">
            <Info className="w-4 h-4 text-slate-400" /> Capacity values should reflect your realistic and sustainable production potential.
          </div>
        </section>
      </div>

      <div className="mt-6 flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-5">
        <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100">
          <svg className="h-4 w-4 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
        </div>
        <div>
          <h4 className="font-bold text-blue-900">Implementation Tips</h4>
          <div className="mt-3 grid gap-4 text-xs text-blue-800 md:grid-cols-4">
            <div className="flex gap-2"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 font-bold text-white">1</span><span>Use OP10 / OP20 / OP30 codes as templates. You can add, remove or rename operations as per your actual process flow.</span></div>
            <div className="flex gap-2"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 font-bold text-white">2</span><span>Keep one Default UOM that best represents your primary output. Add alternative UOMs only if regularly used.</span></div>
            <div className="flex gap-2"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 font-bold text-white">3</span><span>Capture capacity as measurable values (monthly & annual) to improve buyer confidence and matching accuracy.</span></div>
            <div className="flex gap-2"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 font-bold text-white">4</span><span>Well-defined operations and capacity help in advanced matching, accurate planning and better order allocation.</span></div>
          </div>
        </div>
      </div>

      <Footer
        back={() => nav(`/seller/capabilities/${id}/quality`)}
        onSave={go}
        onContinue={go}
      />
    </SellerWizard>
  );
}


export function CapabilityCommercialPage() {
  const { id = '' } = useParams();
  const nav = useNavigate();
  const q = useSellerCapability(id);
  const save = useCapabilityStep('commercial');

  const commercial = useMemo(() => parseCommercialJson(q.data?.commercialJson), [q.data?.commercialJson]);

  // Section 1: Service Geography
  const [states, setStates] = useState<string[]>(['Tamil Nadu', 'Karnataka', 'Maharashtra']);
  const [countries, setCountries] = useState<string[]>(['India', 'UAE']);
  const [newStateInput, setNewStateInput] = useState('');
  const [newCountryInput, setNewCountryInput] = useState('');

  // Section 2: Delivery Support
  const [installation, setInstallation] = useState<string>('Yes');
  const [onsiteService, setOnsiteService] = useState<string>('Yes');
  const [packaging, setPackaging] = useState<string>('Standard Packaging & Logistics');
  const [leadTime, setLeadTime] = useState<string>('15 - 30 Days');

  // Section 3: Export / Domestic Capability
  const [typeOfSales, setTypeOfSales] = useState<string[]>(['Domestic', 'Export']);
  const [exportExperience, setExportExperience] = useState<string>('3 - 5 Years');
  const [exportDocumentation, setExportDocumentation] = useState<string[]>(['IEC', 'GST', 'RoDTEP', 'COO']);
  const [customsSupport, setCustomsSupport] = useState<string>('Yes');

  // Section 4: Commercial Terms
  const [incoterm, setIncoterm] = useState<string>('EXW - Ex Works');
  const [moq, setMoq] = useState<string>('10');
  const [moqUom, setMoqUom] = useState<string>('Nos');
  const [paymentPreferences, setPaymentPreferences] = useState<string[]>(['Advance', '30 Days Net']);
  const [priceValidity, setPriceValidity] = useState<string>('30 Days');

  // Section 5: Contact / Response SLA
  const [salesResponse, setSalesResponse] = useState<string>('Within 4 Hours');
  const [quoteTurnaround, setQuoteTurnaround] = useState<string>('1 - 2 Days');
  const [supportResponse, setSupportResponse] = useState<string>('Within 24 Hours');
  const [communication, setCommunication] = useState<string[]>(['Email', 'Phone', 'WhatsApp']);

  // Section 6: Warranty / Service Support
  const [warrantyOffered, setWarrantyOffered] = useState<string>('12 Months');
  const [serviceCoverage, setServiceCoverage] = useState<string>('On-site & Remote Support');
  const [spareParts, setSpareParts] = useState<string>('7 - 10 Years');
  const [amc, setAmc] = useState<string>('Yes');

  // Section 7: Documents
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, { name: string; size: string; type?: string; dataBase64?: string } | null>>({
    'Company Brochure': null,
    'Machine / Equipment List': null,
    'Capability Statement': null,
    'Sample Certificates': null,
  });

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };

  useEffect(() => {
    if (commercial) {
      if (commercial.serviceGeography) {
        if (commercial.serviceGeography.states?.length) setStates(commercial.serviceGeography.states);
        if (commercial.serviceGeography.countries?.length) setCountries(commercial.serviceGeography.countries);
      }
      if (commercial.deliverySupport) {
        if (commercial.deliverySupport.installation) setInstallation(commercial.deliverySupport.installation);
        if (commercial.deliverySupport.onsiteService) setOnsiteService(commercial.deliverySupport.onsiteService);
        if ((commercial.deliverySupport as any).packaging) setPackaging((commercial.deliverySupport as any).packaging);
        if ((commercial.deliverySupport as any).leadTime) setLeadTime((commercial.deliverySupport as any).leadTime);
      }
      if (commercial.exportCapability) {
        if (commercial.exportCapability.typeOfSales?.length) setTypeOfSales(commercial.exportCapability.typeOfSales);
        if (commercial.exportCapability.exportExperience) setExportExperience(commercial.exportCapability.exportExperience);
        if (commercial.exportCapability.exportDocumentation?.length) setExportDocumentation(commercial.exportCapability.exportDocumentation);
        if (commercial.exportCapability.customsSupport) setCustomsSupport(commercial.exportCapability.customsSupport);
      }
      if (commercial.commercialTerms) {
        if (commercial.commercialTerms.incoterm) setIncoterm(commercial.commercialTerms.incoterm);
        if (commercial.commercialTerms.moq) setMoq(commercial.commercialTerms.moq);
        if (commercial.commercialTerms.moqUom) setMoqUom(commercial.commercialTerms.moqUom);
        if (commercial.commercialTerms.paymentPreferences?.length) setPaymentPreferences(commercial.commercialTerms.paymentPreferences);
        if (commercial.commercialTerms.priceValidity) setPriceValidity(commercial.commercialTerms.priceValidity);
      }
      if (commercial.slas) {
        if (commercial.slas.salesResponse) setSalesResponse(commercial.slas.salesResponse);
        if (commercial.slas.quoteTurnaround) setQuoteTurnaround(commercial.slas.quoteTurnaround);
        if (commercial.slas.supportResponse) setSupportResponse(commercial.slas.supportResponse);
        if (commercial.slas.communication?.length) setCommunication(commercial.slas.communication);
      }
      if (commercial.warranty) {
        if (commercial.warranty.warrantyOffered) setWarrantyOffered(commercial.warranty.warrantyOffered);
        if (commercial.warranty.serviceCoverage) setServiceCoverage(commercial.warranty.serviceCoverage);
        if (commercial.warranty.spareParts) setSpareParts(commercial.warranty.spareParts);
        if (commercial.warranty.amc) setAmc(commercial.warranty.amc);
      }
      if (commercial.documents) {
        setUploadedDocs({
          'Company Brochure': (commercial.documents as any).companyBrochureDoc || (commercial.documents.companyBrochure ? { name: commercial.documents.companyBrochure, size: 'Attached', type: 'PDF' } : null),
          'Machine / Equipment List': (commercial.documents as any).machineListDoc || (commercial.documents.machineList ? { name: commercial.documents.machineList, size: 'Attached', type: 'PDF' } : null),
          'Capability Statement': (commercial.documents as any).capabilityStatementDoc || (commercial.documents.capabilityStatement ? { name: commercial.documents.capabilityStatement, size: 'Attached', type: 'PDF' } : null),
          'Sample Certificates': (commercial.documents as any).sampleCertificatesDoc || (commercial.documents.sampleCertificates ? { name: commercial.documents.sampleCertificates, size: 'Attached', type: 'PDF' } : null),
        });
      }
    }
  }, [commercial]);

  const toggleArrayItem = (setter: React.Dispatch<React.SetStateAction<string[]>>, item: string) => {
    setter(prev => prev.includes(item) ? prev.filter(x => x !== item) : [...prev, item]);
  };

  const removeArrayItem = (setter: React.Dispatch<React.SetStateAction<string[]>>, item: string) => {
    setter(prev => prev.filter(x => x !== item));
  };

  const addArrayItem = (setter: React.Dispatch<React.SetStateAction<string[]>>, item: string, clearInput: () => void) => {
    if (!item.trim()) return;
    setter(prev => prev.includes(item.trim()) ? prev : [...prev, item.trim()]);
    clearInput();
  };

  const go = async () => {
    try {
      const existing = parseCommercialJson(q.data?.commercialJson);
      const updatedCommercial = {
        ...existing,
        serviceGeography: {
          states,
          countries,
        },
        deliverySupport: {
          installation,
          onsiteService,
          packaging,
          leadTime,
        },
        exportCapability: {
          typeOfSales,
          exportExperience,
          exportDocumentation,
          customsSupport,
        },
        commercialTerms: {
          incoterm,
          moq,
          moqUom,
          paymentPreferences,
          priceValidity,
        },
        slas: {
          salesResponse,
          quoteTurnaround,
          supportResponse,
          communication,
        },
        warranty: {
          warrantyOffered,
          serviceCoverage,
          spareParts,
          amc,
        },
        documents: {
          companyBrochure: uploadedDocs['Company Brochure']?.name,
          machineList: uploadedDocs['Machine / Equipment List']?.name,
          capabilityStatement: uploadedDocs['Capability Statement']?.name,
          sampleCertificates: uploadedDocs['Sample Certificates']?.name,
          companyBrochureDoc: uploadedDocs['Company Brochure'] || undefined,
          machineListDoc: uploadedDocs['Machine / Equipment List'] || undefined,
          capabilityStatementDoc: uploadedDocs['Capability Statement'] || undefined,
          sampleCertificatesDoc: uploadedDocs['Sample Certificates'] || undefined,
          files: Object.entries(uploadedDocs)
            .filter(([_, d]) => d !== null)
            .map(([category, d]) => ({ category, ...d! })),
        }
      };

      await save.mutateAsync({
        id,
        payload: updatedCommercial,
        version: q.data?.version ?? 0,
      });
      nav(`/seller/capabilities/${id}/review`);
    } catch (e) {
      console.error('Failed to save commercial capability', e);
      alert('Failed to save capability. Please check the console for errors.');
    }
  };

  const renderMultiSelect = (
    selected: string[],
    onRemove: (item: string) => void,
    suggestions: string[],
    onToggle: (item: string) => void
  ) => (
    <div>
      <div className="w-full rounded-lg border border-slate-300 bg-white p-2 text-sm flex flex-wrap items-center gap-1.5 min-h-[42px]">
        {selected.map(item => (
          <span key={item} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 border border-blue-200 rounded-md text-blue-700 text-xs font-semibold">
            {item}
            <button type="button" onClick={() => onRemove(item)} className="hover:text-blue-900">
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        {selected.length === 0 && (
          <span className="text-xs text-slate-400 italic">No selections yet. Pick from below:</span>
        )}
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5 items-center">
        <span className="text-[10px] uppercase font-bold text-slate-400 mr-1">Suggested:</span>
        {suggestions.map(opt => {
          const isPicked = selected.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onToggle(opt)}
              className={`text-[11px] px-2 py-0.5 rounded-full border transition ${isPicked
                ? 'bg-blue-600 border-blue-600 text-white font-bold'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 font-medium'
                }`}
            >
              {opt} {isPicked ? '✓' : '+'}
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderToggle = (
    value: string,
    onChange: (val: string) => void,
    options: string[]
  ) => (
    <div className="flex gap-1.5 w-full">
      {options.map(label => {
        const isSelected = value.toUpperCase() === label.toUpperCase();
        return (
          <button
            key={label}
            type="button"
            onClick={() => onChange(label)}
            className={`flex-1 py-1.5 px-3 flex justify-center items-center gap-1 rounded-lg border text-xs font-bold transition ${isSelected
              ? 'bg-blue-50 border-blue-400 text-blue-700 shadow-2xs'
              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
          >
            {label} {isSelected && <Check className="w-3.5 h-3.5 text-blue-600" />}
          </button>
        );
      })}
    </div>
  );

  return (
    <SellerWizard step={7} title="Commercial, Service Area & Documents">
      <div className="mb-6 -mt-2 text-slate-500 text-sm">
        Provide details of your commercial terms, service geography, and capability documents to support smart buyer matching.
      </div>

      <div className="rounded-xl border border-slate-200 bg-white mb-6 shadow-sm overflow-hidden">
        <div className="p-5 md:p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base mb-1">Commercial, Service Area & Documents</h3>
            <p className="text-sm text-slate-500">Provide details of where you operate, how you support buyers, and the evidence of your capability.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">Status (System Controlled)</span>
            <span className="px-3 py-1 rounded bg-slate-100 text-slate-600 text-xs font-bold tracking-wide">DRAFT</span>
          </div>
        </div>

        {/* Section 1 & 2 */}
        <div className="flex flex-col md:flex-row border-b border-slate-100">
          {/* Section 1: Service Geography */}
          <section className="p-5 md:p-6 md:w-1/2 md:border-r border-slate-100">
            <div className="flex items-start gap-3 mb-5">
              <div className="mt-0.5"><Globe className="w-5 h-5 text-blue-600" /></div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-0.5">Service Geography / Areas Served</h4>
                <p className="text-xs text-slate-500">Where do you deliver your products / services?</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  States / UTs Served (India) <Info className="w-3.5 h-3.5 text-slate-400" />
                </label>
                {renderMultiSelect(
                  states,
                  (st) => removeArrayItem(setStates, st),
                  ['Tamil Nadu', 'Karnataka', 'Maharashtra', 'Gujarat', 'Delhi NCR', 'Telangana', 'Andhra Pradesh', 'Uttar Pradesh'],
                  (st) => toggleArrayItem(setStates, st)
                )}
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    placeholder="Add other state..."
                    value={newStateInput}
                    onChange={e => setNewStateInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addArrayItem(setStates, newStateInput, () => setNewStateInput('')); } }}
                    className={`${inputClass} text-xs py-1`}
                  />
                  <button
                    type="button"
                    onClick={() => addArrayItem(setStates, newStateInput, () => setNewStateInput(''))}
                    className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg shrink-0"
                  >
                    Add
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  Countries Served (International) <Info className="w-3.5 h-3.5 text-slate-400" />
                </label>
                {renderMultiSelect(
                  countries,
                  (co) => removeArrayItem(setCountries, co),
                  ['India', 'UAE', 'Saudi Arabia', 'Singapore', 'USA', 'Germany', 'United Kingdom'],
                  (co) => toggleArrayItem(setCountries, co)
                )}
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    placeholder="Add other country..."
                    value={newCountryInput}
                    onChange={e => setNewCountryInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addArrayItem(setCountries, newCountryInput, () => setNewCountryInput('')); } }}
                    className={`${inputClass} text-xs py-1`}
                  />
                  <button
                    type="button"
                    onClick={() => addArrayItem(setCountries, newCountryInput, () => setNewCountryInput(''))}
                    className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg shrink-0"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
            <div className="mt-4 text-[11px] text-slate-500">These areas are dynamically matched with buyer delivery locations.</div>
          </section>

          {/* Section 2: Delivery Support */}
          <section className="p-5 md:p-6 md:w-1/2">
            <div className="flex items-start gap-3 mb-5">
              <div className="mt-0.5"><Truck className="w-5 h-5 text-blue-600" /></div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-0.5">Delivery Support</h4>
                <p className="text-xs text-slate-500">How do you deliver and support your solutions?</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-[140px_1fr] gap-4 items-center">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">Installation Support</label>
                {renderToggle(installation, setInstallation, ['Yes', 'No', 'Optional'])}
              </div>
              <div className="grid grid-cols-[140px_1fr] gap-4 items-center">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">On-site Service</label>
                {renderToggle(onsiteService, setOnsiteService, ['Yes', 'No', 'Optional'])}
              </div>
              <div className="grid grid-cols-[140px_1fr] gap-4 items-center">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">Packaging / Logistics</label>
                <select className={inputClass} value={packaging} onChange={e => setPackaging(e.target.value)}>
                  <option>Standard Packaging & Logistics</option>
                  <option>Export Grade Wooden Crating</option>
                  <option>Anti-Rust VCI Packaging</option>
                  <option>Buyer Specified Packaging</option>
                </select>
              </div>
              <div className="grid grid-cols-[140px_1fr] gap-4 items-center">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">Lead Time (Typical)</label>
                <select className={inputClass} value={leadTime} onChange={e => setLeadTime(e.target.value)}>
                  <option>7 - 14 Days</option>
                  <option>15 - 30 Days</option>
                  <option>30 - 45 Days</option>
                  <option>45 - 60 Days</option>
                  <option>60+ Days</option>
                </select>
              </div>
            </div>
            <div className="mt-4 text-[11px] text-slate-500">Supports buyer planning and logistics fit assessment.</div>
          </section>
        </div>

        {/* Section 3 & 4 */}
        <div className="flex flex-col md:flex-row border-b border-slate-100">
          {/* Section 3: Export Capability */}
          <section className="p-5 md:p-6 md:w-1/2 md:border-r border-slate-100">
            <div className="flex items-start gap-3 mb-5">
              <div className="mt-0.5"><Plane className="w-5 h-5 text-blue-600" /></div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-0.5">Export / Domestic Capability</h4>
                <p className="text-xs text-slate-500">What markets and trade capabilities do you support?</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-[140px_1fr] gap-4 items-center">
                <label className="text-xs font-bold text-slate-700">Type of Sales</label>
                <div className="flex flex-wrap gap-1.5">
                  {['Domestic', 'Export', 'SEZ / EOU'].map(item => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleArrayItem(setTypeOfSales, item)}
                      className={`text-xs px-3 py-1.5 rounded-lg border font-semibold transition ${typeOfSales.includes(item)
                        ? 'bg-blue-50 border-blue-400 text-blue-700'
                        : 'bg-white border-slate-200 text-slate-600'
                        }`}
                    >
                      {item} {typeOfSales.includes(item) && '✓'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-[140px_1fr] gap-4 items-center">
                <label className="text-xs font-bold text-slate-700">Export Experience</label>
                <select className={inputClass} value={exportExperience} onChange={e => setExportExperience(e.target.value)}>
                  <option>None (Domestic only)</option>
                  <option>&lt; 1 Year</option>
                  <option>1 - 3 Years</option>
                  <option>3 - 5 Years</option>
                  <option>5 - 10 Years</option>
                  <option>10+ Years</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Export Documentation Available</label>
                <div className="flex flex-wrap gap-1.5">
                  {['IEC', 'GST / LUT', 'RoDTEP', 'COO (Certificate of Origin)', 'AD Code', 'Bank Realization'].map(doc => (
                    <button
                      key={doc}
                      type="button"
                      onClick={() => toggleArrayItem(setExportDocumentation, doc)}
                      className={`text-xs px-2.5 py-1 rounded-md border transition ${exportDocumentation.includes(doc)
                        ? 'bg-blue-50 border-blue-400 text-blue-700 font-bold'
                        : 'bg-white border-slate-200 text-slate-600'
                        }`}
                    >
                      {doc} {exportDocumentation.includes(doc) && '✓'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-[140px_1fr] gap-4 items-center">
                <label className="text-xs font-bold text-slate-700">Customs Support</label>
                {renderToggle(customsSupport, setCustomsSupport, ['Yes', 'No', 'Partner'])}
              </div>
            </div>
            <div className="mt-4 text-[11px] text-slate-500">Helps buyers validate your export-readiness and market reach.</div>
          </section>

          {/* Section 4: Commercial Terms */}
          <section className="p-5 md:p-6 md:w-1/2">
            <div className="flex items-start gap-3 mb-5">
              <div className="mt-0.5">
                <div className="w-5 h-5 rounded-full border border-blue-600 text-blue-600 flex items-center justify-center font-bold text-xs"><IndianRupee className="w-3 h-3" /></div>
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-0.5">Commercial Terms</h4>
                <p className="text-xs text-slate-500">Define your key commercial and delivery terms.</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-[140px_1fr] gap-4 items-center">
                <label className="text-xs font-bold text-slate-700">Incoterm / Terms</label>
                <select className={inputClass} value={incoterm} onChange={e => setIncoterm(e.target.value)}>
                  <option>EXW - Ex Works</option>
                  <option>FOB - Free On Board</option>
                  <option>CIF - Cost, Insurance & Freight</option>
                  <option>DDP - Delivered Duty Paid</option>
                  <option>FCA - Free Carrier</option>
                </select>
              </div>
              <div className="grid grid-cols-[140px_1fr] gap-4 items-center">
                <label className="text-xs font-bold text-slate-700">Minimum Order (MOQ)</label>
                <div className="flex">
                  <input type="text" className={`${inputClass} rounded-r-none border-r-0 w-24`} value={moq} onChange={e => setMoq(e.target.value)} placeholder="10" />
                  <select className={`${inputClass} rounded-l-none bg-slate-50`} value={moqUom} onChange={e => setMoqUom(e.target.value)}>
                    <option>Nos</option>
                    <option>Kg</option>
                    <option>Tonnes</option>
                    <option>Meters</option>
                    <option>Sets</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Payment Preferences</label>
                <div className="flex flex-wrap gap-1.5">
                  {['Advance 100%', '30% Advance + 70% Before Dispatch', '30 Days Net', '60 Days Net', 'LC - Letter of Credit', 'PDC'].map(term => (
                    <button
                      key={term}
                      type="button"
                      onClick={() => toggleArrayItem(setPaymentPreferences, term)}
                      className={`text-xs px-2.5 py-1 rounded-md border transition ${paymentPreferences.includes(term)
                        ? 'bg-blue-50 border-blue-400 text-blue-700 font-bold'
                        : 'bg-white border-slate-200 text-slate-600'
                        }`}
                    >
                      {term} {paymentPreferences.includes(term) && '✓'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-[140px_1fr] gap-4 items-center">
                <label className="text-xs font-bold text-slate-700">Price Validity</label>
                <select className={inputClass} value={priceValidity} onChange={e => setPriceValidity(e.target.value)}>
                  <option>15 Days</option>
                  <option>30 Days</option>
                  <option>60 Days</option>
                  <option>90 Days</option>
                </select>
              </div>
            </div>
            <div className="mt-4 text-[11px] text-slate-500">Used for commercial fit scoring during smart matching.</div>
          </section>
        </div>

        {/* Section 5 & 6 */}
        <div className="flex flex-col md:flex-row border-b border-slate-100">
          {/* Section 5: SLA */}
          <section className="p-5 md:p-6 md:w-1/2 md:border-r border-slate-100">
            <div className="flex items-start gap-3 mb-5">
              <div className="mt-0.5"><Headphones className="w-5 h-5 text-blue-600" /></div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-0.5">Contact / Response SLA</h4>
                <p className="text-xs text-slate-500">How quickly can buyers connect and get support?</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-[140px_1fr] gap-4 items-center">
                <label className="text-xs font-bold text-slate-700">Sales Response</label>
                <select className={inputClass} value={salesResponse} onChange={e => setSalesResponse(e.target.value)}>
                  <option>Within 2 Hours</option>
                  <option>Within 4 Hours</option>
                  <option>Within 12 Hours</option>
                  <option>Within 24 Hours</option>
                </select>
              </div>
              <div className="grid grid-cols-[140px_1fr] gap-4 items-center">
                <label className="text-xs font-bold text-slate-700">RFQ Turnaround</label>
                <select className={inputClass} value={quoteTurnaround} onChange={e => setQuoteTurnaround(e.target.value)}>
                  <option>Same Day</option>
                  <option>1 - 2 Days</option>
                  <option>3 - 5 Days</option>
                  <option>Within 1 Week</option>
                </select>
              </div>
              <div className="grid grid-cols-[140px_1fr] gap-4 items-center">
                <label className="text-xs font-bold text-slate-700">Support Response</label>
                <select className={inputClass} value={supportResponse} onChange={e => setSupportResponse(e.target.value)}>
                  <option>Within 4 Hours</option>
                  <option>Within 12 Hours</option>
                  <option>Within 24 Hours</option>
                  <option>Within 48 Hours</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Preferred Communication</label>
                <div className="flex flex-wrap gap-1.5">
                  {['Email', 'Phone', 'WhatsApp', 'Video Call', 'In-Person Visit'].map(ch => (
                    <button
                      key={ch}
                      type="button"
                      onClick={() => toggleArrayItem(setCommunication, ch)}
                      className={`text-xs px-2.5 py-1 rounded-md border transition ${communication.includes(ch)
                        ? 'bg-blue-50 border-blue-400 text-blue-700 font-bold'
                        : 'bg-white border-slate-200 text-slate-600'
                        }`}
                    >
                      {ch} {communication.includes(ch) && '✓'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-4 text-[11px] text-slate-500">Improves buyer confidence and enquiry conversion.</div>
          </section>

          {/* Section 6: Warranty */}
          <section className="p-5 md:p-6 md:w-1/2">
            <div className="flex items-start gap-3 mb-5">
              <div className="mt-0.5"><ShieldCheck className="w-5 h-5 text-blue-600" /></div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-0.5">Warranty / Service Support</h4>
                <p className="text-xs text-slate-500">What after-sales support and warranty do you provide?</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-[140px_1fr] gap-4 items-center">
                <label className="text-xs font-bold text-slate-700">Warranty Offered</label>
                <select className={inputClass} value={warrantyOffered} onChange={e => setWarrantyOffered(e.target.value)}>
                  <option>None</option>
                  <option>6 Months</option>
                  <option>12 Months</option>
                  <option>18 Months</option>
                  <option>24 Months</option>
                  <option>36 Months</option>
                </select>
              </div>
              <div className="grid grid-cols-[140px_1fr] gap-4 items-center">
                <label className="text-xs font-bold text-slate-700">Service Coverage</label>
                <select className={inputClass} value={serviceCoverage} onChange={e => setServiceCoverage(e.target.value)}>
                  <option>On-site & Remote Support</option>
                  <option>Remote Support Only</option>
                  <option>Return to Factory</option>
                  <option>Comprehensive 24/7 Support</option>
                </select>
              </div>
              <div className="grid grid-cols-[140px_1fr] gap-4 items-center">
                <label className="text-xs font-bold text-slate-700">Spare Parts Support</label>
                <select className={inputClass} value={spareParts} onChange={e => setSpareParts(e.target.value)}>
                  <option>1 - 3 Years</option>
                  <option>3 - 5 Years</option>
                  <option>7 - 10 Years</option>
                  <option>10+ Years</option>
                </select>
              </div>
              <div className="grid grid-cols-[140px_1fr] gap-4 items-center">
                <label className="text-xs font-bold text-slate-700">AMC Contracts</label>
                {renderToggle(amc, setAmc, ['Yes', 'No', 'Optional'])}
              </div>
            </div>
            <div className="mt-4 text-[11px] text-slate-500">Builds buyer trust and supports long-term relationships.</div>
          </section>
        </div>

        {/* Section 7: Documents */}
        <section className="p-5 md:p-6">
          <div className="flex items-start gap-3 mb-5">
            <div className="mt-0.5"><FileText className="w-5 h-5 text-blue-600" /></div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm mb-0.5">Capability Documents</h4>
              <p className="text-xs text-slate-500">Upload documents that validate your capability. These are stored and used for buyer trust-building.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { title: 'Company Brochure', desc: 'PDF, up to 10MB' },
              { title: 'Machine / Equipment List', desc: 'PDF / Excel, up to 10MB' },
              { title: 'Capability Statement', desc: 'PDF, up to 10MB' },
              { title: 'Sample Certificates', desc: 'PDF / Image, up to 10MB' }
            ].map(doc => (
              <div key={doc.title} className="p-4 rounded-xl border border-slate-200 text-center relative bg-white">
                <div className="font-bold text-slate-900 text-xs mb-1">{doc.title}</div>
                <div className="text-[10px] text-slate-500 mb-3">{doc.desc}</div>

                {uploadedDocs[doc.title] ? (
                  <div className="border border-green-200 bg-green-50/70 rounded-xl p-3 flex flex-col items-center shadow-2xs">
                    {uploadedDocs[doc.title]!.dataBase64?.startsWith('data:image/') ? (
                      <img
                        src={uploadedDocs[doc.title]!.dataBase64}
                        alt={uploadedDocs[doc.title]!.name}
                        className="w-12 h-12 rounded-lg object-cover border border-green-300 mb-2"
                      />
                    ) : (
                      <FileText className="w-7 h-7 text-green-600 mb-1.5" />
                    )}
                    <div className="text-[11px] font-bold text-green-900 truncate w-full" title={uploadedDocs[doc.title]!.name}>
                      {uploadedDocs[doc.title]!.name}
                    </div>
                    <div className="flex items-center gap-1.5 my-1">
                      <span className="text-[10px] text-green-700 font-medium">{uploadedDocs[doc.title]!.size}</span>
                      {uploadedDocs[doc.title]!.dataBase64 && (
                        <span className="inline-block rounded bg-emerald-100 px-1 text-[8px] font-bold text-emerald-800">
                          Base64 Stored
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1.5">
                      {uploadedDocs[doc.title]!.dataBase64 && (
                        <a
                          href={uploadedDocs[doc.title]!.dataBase64}
                          download={uploadedDocs[doc.title]!.name}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] font-bold text-blue-600 hover:text-blue-800 inline-flex items-center gap-0.5"
                          title="Download Document"
                        >
                          <Download className="w-3 h-3" />
                          <span>View</span>
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => setUploadedDocs(prev => ({ ...prev, [doc.title]: null }))}
                        className="text-[10px] font-bold text-red-500 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="border border-dashed border-slate-300 bg-slate-50 rounded-xl p-4 block cursor-pointer hover:bg-slate-100 transition">
                    <input
                      type="file"
                      className="hidden"
                      onChange={async (e) => {
                        if (e.target.files && e.target.files[0]) {
                          const f = e.target.files[0];
                          const base64 = await readFileAsBase64(f);
                          setUploadedDocs(prev => ({
                            ...prev,
                            [doc.title]: {
                              name: f.name,
                              size: (f.size / 1024 / 1024).toFixed(2) + ' MB',
                              type: f.name.split('.').pop()?.toUpperCase() || 'FILE',
                              dataBase64: base64,
                            }
                          }));
                          e.target.value = '';
                        }
                      }}
                    />
                    <UploadCloud className="w-5 h-5 text-slate-400 mx-auto mb-2" />
                    <div className="text-[10px] text-slate-500 mb-1">Click to browse or drop file</div>
                    <span className="text-[11px] font-bold text-blue-600 border border-blue-200 px-2.5 py-1 rounded bg-white inline-block">
                      Browse Files
                    </span>
                  </label>
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 text-[11px] text-slate-500">Accepted formats: PDF, JPG, PNG, Excel (XLS, XLSX). Maximum file size 10MB per file.</div>
        </section>
      </div>

      <Footer
        back={() => nav(`/seller/capabilities/${id}/operations`)}
        onSave={go}
        onContinue={go}
      />
    </SellerWizard>
  );
}

// ----------------------------------------------------------------------
// 8. Review & Publish Step (Fully Dynamic)
// ----------------------------------------------------------------------
export function CapabilityReviewPage() {
  const { id = '' } = useParams();
  const nav = useNavigate();
  const q = useSellerCapability(id);
  const publish = usePublishCapability();
  const tagsQuery = useCapabilitySuggestedTags(id);

  const row = q.data;
  const technical = useMemo(() => parseTechnicalJson(row?.technicalJson), [row?.technicalJson]);
  const commercial = useMemo(() => parseCommercialJson(row?.commercialJson), [row?.commercialJson]);

  // Selected tags from Step 03
  const selectedTags = useMemo(() => {
    if (!tagsQuery.data?.groups) return [];
    return tagsQuery.data.groups.flatMap(g => g.tags).filter(t => t.selected);
  }, [tagsQuery.data]);

  // Documents attached from Step 07
  const sellerDocs = useMemo(() => {
    const docs = commercial?.documents;
    if (!docs) return [];
    const list: Array<{ category: string; name: string; size?: string; dataBase64?: string }> = [];
    if (docs.companyBrochureDoc) list.push({ category: 'Company Brochure', ...docs.companyBrochureDoc });
    else if (docs.companyBrochure) list.push({ category: 'Company Brochure', name: docs.companyBrochure, size: 'Attached' });
    if (docs.machineListDoc) list.push({ category: 'Machine / Equipment List', ...docs.machineListDoc });
    else if (docs.machineList) list.push({ category: 'Machine / Equipment List', name: docs.machineList, size: 'Attached' });
    if (docs.capabilityStatementDoc) list.push({ category: 'Capability Statement', ...docs.capabilityStatementDoc });
    else if (docs.capabilityStatement) list.push({ category: 'Capability Statement', name: docs.capabilityStatement, size: 'Attached' });
    if (docs.sampleCertificatesDoc) list.push({ category: 'Sample Certificates', ...docs.sampleCertificatesDoc });
    else if (docs.sampleCertificates) list.push({ category: 'Sample Certificates', name: docs.sampleCertificates, size: 'Attached' });
    if (Array.isArray(docs.files)) {
      docs.files.forEach(f => {
        if (!list.some(x => x.name === f.name)) list.push(f);
      });
    }
    return list;
  }, [commercial?.documents]);

  // Dynamic Readiness Checklist Items
  const checklist = useMemo(() => {
    const hasBasic = Boolean(row?.title && row?.plantLocation);
    const hasClassification = Boolean(row?.classificationCode);
    const hasTags = selectedTags.length > 0;
    const hasProcesses = (technical?.processes?.length ?? 0) > 0;
    const hasMaterials = (technical?.materials?.length ?? 0) > 0;
    const hasMachines = (technical?.machines?.length ?? 0) > 0;
    const hasQuality = ((technical?.certifications?.length ?? 0) + (technical?.inspectionMethods?.length ?? 0)) > 0;
    const hasOperations = Boolean(commercial?.operations?.monthlyCapacity || commercial?.primaryRouteId);
    const hasCommercial = Boolean(commercial?.commercialTerms?.incoterm && commercial?.serviceGeography?.states?.length);
    const hasDocs = Object.values(commercial?.documents || {}).some(Boolean);

    return [
      { label: 'Basic information completed', done: hasBasic },
      { label: 'Classification & HSN/SAC added', done: hasClassification },
      { label: `Suggestion tags confirmed (${selectedTags.length} tags)`, done: hasTags },
      { label: `Processes selected (${technical?.processes?.length || 0})`, done: hasProcesses },
      { label: `Materials configured (${technical?.materials?.length || 0})`, done: hasMaterials },
      { label: `Machines & equipment added (${technical?.machines?.length || 0})`, done: hasMachines },
      { label: 'Quality & Compliance defined', done: hasQuality },
      { label: 'Operations & capacity specified', done: hasOperations },
      { label: 'Commercial & geography terms provided', done: hasCommercial },
      { label: 'Attachments uploaded', done: hasDocs },
    ];
  }, [row, technical, commercial, selectedTags]);

  // Dynamic Matchability Potential calculation
  const matchPotential = useMemo(() => {
    let techScore = 0;
    if ((technical?.processes?.length ?? 0) > 0) techScore += 40;
    if ((technical?.materials?.length ?? 0) > 0) techScore += 30;
    if ((technical?.machines?.length ?? 0) > 0) techScore += 30;
    techScore = Math.min(100, Math.max(20, techScore));

    let qualScore = 0;
    if ((technical?.certifications?.length ?? 0) > 0) qualScore += 50;
    if ((technical?.inspectionMethods?.length ?? 0) > 0) qualScore += 50;
    qualScore = Math.min(100, Math.max(15, qualScore));

    let opScore = 0;
    if (commercial?.operations?.monthlyCapacity) opScore += 50;
    if (commercial?.primaryRouteId) opScore += 30;
    if (commercial?.operations?.setupTime) opScore += 20;
    opScore = Math.min(100, Math.max(25, opScore));

    let commScore = 0;
    if (commercial?.commercialTerms?.incoterm) commScore += 30;
    if (commercial?.serviceGeography?.states?.length) commScore += 30;
    if (commercial?.slas?.salesResponse) commScore += 20;
    if (commercial?.warranty?.warrantyOffered) commScore += 20;
    commScore = Math.min(100, Math.max(20, commScore));

    const overall = Math.round(techScore * 0.35 + qualScore * 0.25 + opScore * 0.2 + commScore * 0.2);

    return {
      technical: `${techScore}%`,
      quality: `${qualScore}%`,
      operational: `${opScore}%`,
      commercial: `${commScore}%`,
      overall,
    };
  }, [technical, commercial]);

  const submit = async () => {
    if (!row) return;
    await publish.mutateAsync({ id, version: row.version });
    nav('/seller/capabilities');
  };

  const renderSection = (title: string, subtitle: React.ReactNode, Icon: React.ElementType, iconColorClass: string, stepId: string) => (
    <div className="flex items-center gap-4 p-5 border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition">
      <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center shrink-0 bg-white ${iconColorClass}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1">
        <h4 className="font-bold text-slate-900 text-sm mb-1">{title}</h4>
        <div className="text-xs text-slate-500 leading-relaxed">{subtitle}</div>
      </div>
      <button
        type="button"
        className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 transition font-bold text-xs shrink-0"
        onClick={() => nav(`/seller/capabilities/${id}/${stepId}`)}
      >
        <Edit2 className="w-3.5 h-3.5" /> Edit <ChevronDown className="w-3.5 h-3.5" />
      </button>
    </div>
  );

  const allReady = checklist.filter((c) => c.done).length >= 7;

  return (
    <SellerWizard
      step={8}
      title="Review & Submit Capability"
      actions={
        <button
          type="button"
          onClick={() => nav(`/seller/capabilities/${id}/basic`)}
          className="btn btn-secondary text-xs inline-flex items-center gap-1.5"
        >
          <Edit2 className="w-3.5 h-3.5" /> Edit Capability
        </button>
      }
    >
      <div className="mb-6 -mt-2 text-slate-500 text-sm">
        Review all details of your capability before publishing for buyer discovery.
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Column */}
        <div className="lg:w-[65%] xl:w-[70%] space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="p-5 md:p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base mb-1">Review Your Capability</h3>
                <p className="text-sm text-slate-500">Please verify all information below. You can edit any section if needed.</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium hidden sm:inline">Overall Status</span>
                <span className={`px-3 py-1 rounded text-xs font-bold tracking-wide flex items-center gap-1 ${allReady
                  ? 'bg-green-50 border border-green-200 text-green-700'
                  : 'bg-amber-50 border border-amber-200 text-amber-700'
                  }`}>
                  {allReady ? <Check className="w-3.5 h-3.5" /> : null}
                  {allReady ? 'READY TO PUBLISH' : 'PARTIALLY COMPLETE'}
                </span>
              </div>
            </div>

            <div>
              {renderSection(
                'Basic Information',
                `${row?.title || 'No Title'} • ${row?.businessType || 'General Business'} • ${row?.plantLocation || 'Location not specified'} • Contact: ${row?.contactPerson || 'Not provided'} (${row?.contactEmail || ''})`,
                User,
                'border-green-200 text-green-600',
                'basic'
              )}

              {renderSection(
                'Classification & HSN/SAC',
                <>
                  <span className="block font-medium text-slate-700">Segment: {row?.segmentCode || 'Industrial Manufacturing'} | Category: {row?.mainCategoryCode || 'N/A'}</span>
                  <span className="block text-slate-500 mt-0.5">Classification Code: {row?.classificationCode || 'N/A'} • UOM: {row?.uomCode || 'NOS'}</span>
                </>,
                Tag,
                'border-green-200 text-green-600',
                'classification'
              )}

              {renderSection(
                'Intelligent Suggestions Confirmed',
                selectedTags.length > 0 ? (
                  <span className="text-slate-700">
                    <strong className="text-blue-700">{selectedTags.length} tags picked</strong>: {selectedTags.slice(0, 5).map(t => t.tagName).join(', ')}{selectedTags.length > 5 ? ` (+${selectedTags.length - 5} more)` : ''}
                  </span>
                ) : (
                  <span className="text-amber-600">No specific suggestion tags confirmed yet</span>
                ),
                Star,
                'border-blue-200 text-blue-600',
                'suggestions'
              )}

              {renderSection(
                'Technical Capabilities & Machines',
                `Processes (${technical?.processes?.length || 0}): ${technical?.processes?.slice(0, 3).join(', ') || 'None'}${(technical?.processes?.length || 0) > 3 ? '...' : ''} • Machines (${technical?.machines?.length || 0})`,
                Settings,
                'border-blue-200 text-blue-600',
                'technical'
              )}

              {renderSection(
                'Materials',
                `${technical?.materials?.join(', ') || 'No materials specified'}`,
                Boxes,
                'border-purple-200 text-purple-600',
                'technical'
              )}

              {renderSection(
                'Quality & Compliance',
                `Certifications: ${technical?.certifications?.join(', ') || 'None'} • Inspections: ${technical?.inspectionMethods?.join(', ') || 'None'}`,
                ShieldCheck,
                'border-teal-200 text-teal-600',
                'quality'
              )}

              {renderSection(
                'Operations & Capacity',
                `Primary Route ${commercial?.primaryRouteId || 1} • Monthly: ${commercial?.operations?.monthlyCapacity || 'N/A'} ${commercial?.operations?.uom || ''} • Annual: ${commercial?.operations?.annualCapacity || 'N/A'} • MOQ: ${commercial?.operations?.moq || 'N/A'}`,
                BarChart3,
                'border-orange-200 text-orange-600',
                'operations'
              )}

              {renderSection(
                'Commercial & Service Terms',
                <>
                  <span className="block font-medium text-slate-700">
                    States: {commercial?.serviceGeography?.states?.slice(0, 3).join(', ') || 'None specified'}{(commercial?.serviceGeography?.states?.length || 0) > 3 ? '...' : ''} | Incoterm: {commercial?.commercialTerms?.incoterm || 'EXW'} | MOQ: {commercial?.commercialTerms?.moq || '10'} {commercial?.commercialTerms?.moqUom || 'Nos'}
                  </span>
                  <span className="block text-slate-500 mt-0.5">
                    Warranty: {commercial?.warranty?.warrantyOffered || '12 Months'} • Sales Response: {commercial?.slas?.salesResponse || 'Within 24 Hours'}
                  </span>
                </>,
                FileText,
                'border-red-200 text-red-600',
                'commercial'
              )}

              {renderSection(
                'Attached Capability Documents',
                sellerDocs.length === 0 ? (
                  <span className="text-slate-400 italic">No capability documents attached yet</span>
                ) : (
                  <div className="space-y-2 mt-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {sellerDocs.map((doc, idx) => {
                        const isImg = doc.dataBase64?.startsWith('data:image/') || /\.(png|jpe?g|webp|gif|svg)$/i.test(doc.name);
                        return (
                          <div key={idx} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/60 p-2 text-xs">
                            <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                              {isImg && doc.dataBase64 ? (
                                <img src={doc.dataBase64} alt={doc.name} className="h-8 w-8 rounded object-cover border border-slate-200 shrink-0" />
                              ) : (
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-blue-100 text-blue-700 font-bold text-[9px]">
                                  DOC
                                </div>
                              )}
                              <div className="min-w-0 flex-1 truncate">
                                <span className="block font-semibold text-slate-900 truncate text-[11px]" title={doc.name}>
                                  {doc.name}
                                </span>
                                <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                                  <span>{doc.category}</span>
                                  {doc.dataBase64 && (
                                    <span className="inline-flex items-center rounded bg-emerald-100 px-1 text-[8px] font-bold text-emerald-800">
                                      Base64 Stored
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            {doc.dataBase64 && (
                              <a
                                href={doc.dataBase64}
                                download={doc.name}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded p-1 text-slate-500 hover:bg-white hover:text-blue-600 transition shrink-0"
                                title="Download Document"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ),
                Paperclip,
                'border-emerald-200 text-emerald-600',
                'commercial'
              )}
            </div>
          </div>

          <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 flex items-start gap-3">
            <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
              <span className="text-xs font-bold font-serif italic">i</span>
            </div>
            <div className="text-sm text-blue-900">
              <strong className="block mb-0.5">Once published, your capability will be active for buyer discovery and intelligent matching.</strong>
              You can still update your capability at any time after publishing.
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-slate-200 pt-6">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => nav(`/seller/capabilities/${id}/basic`)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 transition font-bold text-sm"
              >
                <Edit2 className="w-4 h-4" /> Edit Capability
              </button>
              <button
                type="button"
                onClick={() => nav('/seller/capabilities')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 transition font-bold text-sm"
              >
                <FileText className="w-4 h-4" /> Save Draft & Exit
              </button>
              <button
                type="button"
                onClick={() => nav(`/seller/capabilities/${id}/commercial`)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 transition font-bold text-sm"
              >
                &larr; Back
              </button>
            </div>
            <button
              type="button"
              onClick={submit}
              disabled={publish.isPending}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-green-600 hover:bg-green-700 text-white transition font-bold text-sm shadow-sm disabled:opacity-50"
            >
              <Send className="w-4 h-4" /> {publish.isPending ? 'Publishing...' : 'Publish Capability'}
            </button>
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:w-[35%] xl:w-[30%] space-y-6">
          {/* Dynamic Readiness Checklist */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden p-6">
            <h3 className="font-bold text-slate-900 text-sm mb-5">Readiness Checklist</h3>
            <div className="space-y-3.5">
              {checklist.map(item => (
                <div key={item.label} className="flex items-start gap-3">
                  {item.done ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" fill="#22c55e" stroke="white" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-amber-400 bg-amber-50 text-amber-600 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      !
                    </div>
                  )}
                  <span className={`text-xs font-medium leading-tight ${item.done ? 'text-slate-700' : 'text-slate-500'}`}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
            <div className={`mt-6 rounded-lg p-4 flex items-start gap-3 border ${allReady
              ? 'bg-green-50 border-green-100'
              : 'bg-amber-50 border-amber-100'
              }`}>
              <CheckCircle2 className={`w-5 h-5 shrink-0 ${allReady ? 'text-green-600' : 'text-amber-600'}`} fill={allReady ? '#16a34a' : '#d97706'} stroke="white" />
              <div className={`text-xs font-medium ${allReady ? 'text-green-800' : 'text-amber-800'}`}>
                {allReady
                  ? 'Your capability is complete and ready to be published for matching.'
                  : 'You can publish now, but adding more details improves your match rank.'}
              </div>
            </div>
          </div>

          {/* Dynamic Preview Matchability */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden p-6 text-center">
            <h3 className="font-bold text-slate-900 text-sm mb-6 text-left">Preview Matchability</h3>

            <div className="relative w-40 h-20 mx-auto overflow-hidden mb-3">
              <div
                className="absolute top-0 left-0 w-40 h-40 rounded-full border-[16px] border-slate-100 border-t-green-600 border-l-green-600"
                style={{ transform: `rotate(${Math.round(matchPotential.overall * 1.8 - 45)}deg)` }}
              />
              <div className="absolute top-6 left-0 w-full text-center">
                <div className="text-4xl font-extrabold text-slate-900">{matchPotential.overall}%</div>
              </div>
            </div>

            <div className="font-bold text-green-600 text-sm mb-2">
              {matchPotential.overall >= 80 ? 'High Match Potential' : matchPotential.overall >= 50 ? 'Good Match Potential' : 'Developing Potential'}
            </div>
            <p className="text-xs text-slate-500 text-left mb-6">
              Calculated from confirmed technical tags, capacity, quality credentials, and delivery parameters.
            </p>

            <div className="space-y-3">
              {[
                { label: 'Technical Alignment', val: matchPotential.technical },
                { label: 'Quality & Compliance', val: matchPotential.quality },
                { label: 'Operational Readiness', val: matchPotential.operational },
                { label: 'Commercial Completeness', val: matchPotential.commercial },
              ].map(stat => (
                <div key={stat.label} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-slate-600 font-medium">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div> {stat.label}
                  </div>
                  <div className="font-bold text-slate-900">{stat.val}</div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => nav(`/seller/capabilities`)}
              className="w-full mt-6 py-2.5 rounded-lg border border-blue-200 text-blue-600 font-bold text-xs flex items-center justify-center gap-2 hover:bg-blue-50 transition"
            >
              <Eye className="w-4 h-4" /> View All Capabilities
            </button>
          </div>
        </div>
      </div>
    </SellerWizard>
  );
}