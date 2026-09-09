import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { UploadCloud, Trash2, File, Eye, Download, FileText, Image as ImageIcon, X } from "lucide-react";
import { toast } from "react-hot-toast";
import { RequirementStepper } from "./wizard/RequirementStepper";
import { useRequirementWizard } from "./wizard/requirementWizardStore";
import { useSaveDraft } from "../../../../services/buyer/hooks";

export default function RequirementDeliveryCommercialPage() {
  const nav = useNavigate();
  const { id = "req-001" } = useParams();
  const wizard = useRequirementWizard();
  const saveDraftMutation = useSaveDraft(`requirements/${id}/delivery-commercial`);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  const [deliveryLocation, setDeliveryLocation] = useState(
    wizard.deliveryLocation || "Chennai, Tamil Nadu, India"
  );
  const [needByDate, setNeedByDate] = useState(
    wizard.needByDate || "2025-07-15"
  );
  const [deliveryTerms, setDeliveryTerms] = useState(
    wizard.deliveryTerms || "EXW"
  );
  const [paymentTerms, setPaymentTerms] = useState(
    wizard.paymentTerms || "30 Days"
  );
  const [closeDays, setCloseDays] = useState(wizard.closeDays || "5 Days");
  const [expectedRates, setExpectedRates] = useState(
    wizard.expectedRates || "Delivering Commercial"
  );
  const [incoterms, setIncoterms] = useState(wizard.incoterms || "EXW");

  const [attachments, setAttachments] = useState<any[]>(wizard.attachments || []);
  const [specialInstructions, setSpecialInstructions] = useState(wizard.specialInstructions || "");

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      const newFiles = await Promise.all(
        files.map(async (f, i) => {
          const base64 = await readFileAsBase64(f);
          return {
            id: `att-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 7)}`,
            name: f.name,
            size: `${(f.size / (1024 * 1024)).toFixed(2)} MB`,
            type: f.name.split(".").pop()?.toUpperCase() || "FILE",
            dataBase64: base64,
          };
        })
      );
      setAttachments((prev) => {
        const updated = [...prev, ...newFiles];
        wizard.setAttachments(updated);
        return updated;
      });
      e.target.value = "";
    }
  };

  const handleRemoveFile = (fileId: string) => {
    setAttachments((prev) => {
      const updated = prev.filter((a) => a.id !== fileId);
      wizard.setAttachments(updated);
      return updated;
    });
  };

  const handleSaveDraft = async () => {
    wizard.setAttachments(attachments);
    const payload = {
      deliveryLocation,
      needByDate,
      deliveryTerms,
      paymentTerms,
      closeDays,
      expectedRates,
      incoterms,
      attachments,
      specialInstructions,
    };
    wizard.set(payload);
    try {
      setIsSavingDraft(true);
      if (id && !id.startsWith("req-")) {
        await saveDraftMutation.mutateAsync({ payload });
      }
      toast.success("Delivery & commercial saved as draft");
    } catch (err) {
      console.warn("Could not save delivery-commercial draft directly to backend", err);
      toast.success("Draft saved locally");
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    wizard.setAttachments(attachments);
    const payload = {
      deliveryLocation,
      needByDate,
      deliveryTerms,
      paymentTerms,
      closeDays,
      expectedRates,
      incoterms,
      attachments,
      specialInstructions,
    };
    wizard.set(payload);
    try {
      if (id && !id.startsWith("req-")) {
        await saveDraftMutation.mutateAsync({ payload });
      }
    } catch (err) {
      console.warn("Could not save delivery-commercial draft directly to backend", err);
    }
    nav(`/buyer/requirements/${id}/review`);
  };

  const handleBack = () => {
    wizard.setAttachments(attachments);
    wizard.set({
      deliveryLocation,
      needByDate,
      deliveryTerms,
      paymentTerms,
      closeDays,
      expectedRates,
      incoterms,
      attachments,
      specialInstructions,
    });
    nav(`/buyer/requirements/${id}/operations-quantity`);
  };

  return (
    <div className="mx-auto max-w-5xl">
      <form onSubmit={handleNext} className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm md:p-8">
        {/* Stepper */}
        <RequirementStepper step={4} subStep={4} status={wizard.status || "DRAFT"} />

        {/* Section G: Delivery & Commercial */}
        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">
              G. Delivery & Commercial
            </h2>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {/* Delivery Location */}
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-bold text-slate-700">
                Delivery Location <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={deliveryLocation}
                  onChange={(e) => setDeliveryLocation(e.target.value)}
                  placeholder="e.g. Chennai, Tamil Nadu, India"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-800 pr-10 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
                {deliveryLocation && (
                  <button
                    type="button"
                    onClick={() => setDeliveryLocation("")}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Need By Date */}
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700">
                Need By Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={needByDate}
                onChange={(e) => setNeedByDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Delivery Terms */}
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700">
                Delivery Terms
              </label>
              <select
                value={deliveryTerms}
                onChange={(e) => setDeliveryTerms(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="EXW">EXW (Ex Works)</option>
                <option value="FOB">FOB (Free On Board)</option>
                <option value="CIF">CIF (Cost, Insurance, Freight)</option>
                <option value="DAP">DAP (Delivered At Place)</option>
                <option value="Door Delivery">Door Delivery / DAP</option>
                <option value="FOR Destination">FOR Destination</option>
              </select>
            </div>

            {/* Payment Terms */}
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700">
                Payment Terms
              </label>
              <select
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="30 Days">30 Days Credit</option>
                <option value="15 Days">15 Days Credit</option>
                <option value="45 Days">45 Days Credit</option>
                <option value="60 Days">60 Days Credit</option>
                <option value="Advance + Balance">Advance + Balance on Delivery</option>
                <option value="Immediate">Immediate / Against Invoice</option>
                <option value="LC">Letter of Credit (LC)</option>
              </select>
            </div>

            {/* Close Date / Days */}
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700">
                Target Closing Period
              </label>
              <select
                value={closeDays}
                onChange={(e) => setCloseDays(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="5 Days">5 Days</option>
                <option value="7 Days">7 Days</option>
                <option value="15 Days">15 Days</option>
                <option value="30 Days">30 Days</option>
              </select>
            </div>

            {/* Expected Rates / Budget */}
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700">
                Expected Rates / Commercial Model
              </label>
              <input
                type="text"
                value={expectedRates}
                onChange={(e) => setExpectedRates(e.target.value)}
                placeholder="e.g. Delivering Commercial / Target Price"
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Incoterms */}
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700">
                Incoterms <span className="text-red-500">*</span>
              </label>
              <select
                value={incoterms}
                onChange={(e) => setIncoterms(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="EXW">EXW</option>
                <option value="FOB">FOB</option>
                <option value="CIF">CIF</option>
                <option value="DAP">DAP</option>
                <option value="DDP">DDP</option>
                <option value="FCA">FCA</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section H: Additional Requirements */}
        <div className="border-t border-slate-100 pt-6">
          <h2 className="mb-4 text-sm font-bold text-slate-900">
            H. Additional Requirements
          </h2>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Attachments */}
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700">
                Attachments
              </label>
              <label className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/50 p-6 text-center transition hover:border-blue-400 hover:bg-blue-50/30 cursor-pointer">
                <UploadCloud className="h-8 w-8 text-blue-600 mb-2" />
                <span className="text-xs font-bold text-slate-700">
                  Drag & drop files here or <span className="text-blue-600 underline">Browse Files</span>
                </span>
                <span className="mt-1 text-[10px] text-slate-400">
                  Supported formats: PDF, STEP, DWG, DXF, PNG, JPG (Max file size 25MB)
                </span>
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {/* Uploaded files preview list */}
              {attachments.length > 0 && (
                <div className="mt-3 space-y-2">
                  {attachments.map((file) => {
                    const isImg = file.dataBase64?.startsWith("data:image/") || /\.(png|jpe?g|webp|gif|svg)$/i.test(file.name);
                    return (
                      <div
                        key={file.id}
                        className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-2.5 text-xs shadow-2xs transition hover:border-slate-300"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
                          {isImg && file.dataBase64 ? (
                            <img
                              src={file.dataBase64}
                              alt={file.name}
                              className="h-9 w-9 rounded-lg object-cover border border-slate-200 shrink-0"
                            />
                          ) : (
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 font-bold text-[10px]">
                              {file.type || "FILE"}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <span className="block font-semibold text-slate-800 truncate" title={file.name}>
                              {file.name}
                            </span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-slate-400">{file.size}</span>
                              {file.dataBase64 && (
                                <span className="inline-flex items-center rounded bg-emerald-50 px-1.5 py-0.2 text-[9px] font-semibold text-emerald-700">
                                  Base64 Stored
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {file.dataBase64 && (
                            <a
                              href={file.dataBase64}
                              download={file.name}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-blue-600 transition"
                              title="Download / View Attachment"
                            >
                              <Download className="h-4 w-4" />
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveFile(file.id)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 transition"
                            title="Remove file"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Special Instructions */}
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700">
                Special Instructions
              </label>
              <textarea
                rows={5}
                maxLength={500}
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                placeholder="Any specific instruction for sellers..."
                className="w-full rounded-lg border border-slate-300 bg-white p-3 text-xs font-medium text-slate-800 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
              <div className="mt-1 flex justify-end">
                <span className="text-[11px] font-medium text-slate-400">
                  {specialInstructions.length}/500
                </span>
              </div>
            </div>
          </div>
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
              disabled={isSavingDraft}
              className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
            >
              {isSavingDraft ? "Saving..." : "Save as Draft"}
            </button>

            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-7 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 transition hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/30"
            >
              Save & Next
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
