import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { RequirementStepper } from "./wizard/RequirementStepper";
import {
  useRequirementWizard,
  MaterialItem,
  QualityComplianceItem,
} from "./wizard/requirementWizardStore";
import { useSaveDraft } from "../../../../services/buyer/hooks";
import { ModalPortal } from "../../../../shared/components/ModalPortal";

export default function RequirementMaterialsQualityPage() {
  const nav = useNavigate();
  const { id = "req-001" } = useParams();
  const wizard = useRequirementWizard();
  const saveDraftMutation = useSaveDraft(`requirements/${id}/materials-quality`);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  // Add Material Modal
  const [showAddMatModal, setShowAddMatModal] = useState(false);
  const [newMatName, setNewMatName] = useState("");
  const [newMatGrade, setNewMatGrade] = useState("");
  const [newMatMandatory, setNewMatMandatory] = useState<"Yes" | "Preferred" | "Optional">("Yes");

  // Add Quality Modal
  const [showAddQualModal, setShowAddQualModal] = useState(false);
  const [newQualStandard, setNewQualStandard] = useState("");
  const [newQualMandatory, setNewQualMandatory] = useState<"Yes" | "Preferred" | "Conditional">("Yes");
  const [newQualType, setNewQualType] = useState<"Certification" | "Document" | "Report">("Certification");

  const handleAddMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMatName.trim()) return;
    wizard.addMaterial({
      material: newMatName.trim(),
      grade: newMatGrade.trim() || "Standard Grade",
      mandatory: newMatMandatory,
    });
    setNewMatName("");
    setNewMatGrade("");
    setShowAddMatModal(false);
  };

  const handleAddQuality = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQualStandard.trim()) return;
    wizard.addQuality({
      standard: newQualStandard.trim(),
      mandatory: newQualMandatory,
      notes: newQualType,
    });
    setNewQualStandard("");
    setShowAddQualModal(false);
  };

  const handleSaveDraft = async () => {
    try {
      setIsSavingDraft(true);
      if (id && !id.startsWith("req-")) {
        await saveDraftMutation.mutateAsync({
          payload: {
            materials: wizard.materials,
            qualityCompliance: wizard.qualityCompliance,
            certifications: wizard.qualityCompliance.map((q) => q.standard),
            materialGrade: wizard.materials.map((m) => `${m.material} (${m.grade})`).join(", "),
          },
        });
      }
      toast.success("Materials & quality saved as draft");
    } catch (err) {
      console.warn("Could not save materials-quality draft directly to backend", err);
      toast.success("Draft saved locally");
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleNext = async () => {
    try {
      if (id && !id.startsWith("req-")) {
        await saveDraftMutation.mutateAsync({
          payload: {
            materials: wizard.materials,
            qualityCompliance: wizard.qualityCompliance,
            certifications: wizard.qualityCompliance.map((q) => q.standard),
            materialGrade: wizard.materials.map((m) => `${m.material} (${m.grade})`).join(", "),
          },
        });
      }
    } catch (err) {
      console.warn("Could not save materials-quality draft directly to backend", err);
    }
    nav(`/buyer/requirements/${id}/operations-quantity`);
  };

  const handleBack = () => {
    nav(`/buyer/requirements/${id}/processes`);
  };

  return (
    <div className="mx-auto max-w-5xl">
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm md:p-8">
        {/* Stepper */}
        <RequirementStepper step={4} subStep={2} status={wizard.status || "DRAFT"} />

        {/* Section C: Materials */}
        <div className="mb-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">
              C. Materials
            </h2>
            <button
              type="button"
              onClick={() => setShowAddMatModal(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-600 transition hover:bg-blue-100"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Material
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 font-bold text-slate-700">
                <tr>
                  <th className="py-3 pl-4 pr-3">Material</th>
                  <th className="px-3 py-3">Grade / Specification</th>
                  <th className="px-3 py-3 w-40">Mandatory</th>
                  <th className="py-3 pl-2 pr-4 text-right w-14">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {wizard.materials.map((mat: MaterialItem) => (
                  <tr key={mat.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 pl-4 pr-3 font-semibold text-slate-900">
                      {mat.material}
                    </td>
                    <td className="px-3 py-3">
                      <input
                        type="text"
                        value={mat.grade}
                        onChange={(e) =>
                          wizard.updateMaterial(mat.id, { grade: e.target.value })
                        }
                        className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-800 focus:border-blue-500 focus:outline-none"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <select
                        value={mat.mandatory}
                        onChange={(e) =>
                          wizard.updateMaterial(mat.id, {
                            mandatory: e.target.value as "Yes" | "Preferred" | "Optional",
                          })
                        }
                        className="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 focus:border-blue-500 focus:outline-none"
                      >
                        <option value="Yes">Yes</option>
                        <option value="Preferred">Preferred</option>
                        <option value="Optional">Optional</option>
                      </select>
                    </td>
                    <td className="py-3 pl-2 pr-4 text-right">
                      <button
                        type="button"
                        onClick={() => wizard.removeMaterial(mat.id)}
                        className="text-slate-400 hover:text-red-500 transition p-1"
                        title="Remove material"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {wizard.materials.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-xs font-medium text-slate-400">
                      No materials added yet. Click &quot;+ Add Material&quot; above to specify required raw materials or grades.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section D: Quality & Compliance */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">
              D. Quality & Compliance
            </h2>
            <button
              type="button"
              onClick={() => setShowAddQualModal(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-600 transition hover:bg-blue-100"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Quality / Compliance
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 font-bold text-slate-700">
                <tr>
                  <th className="py-3 pl-4 pr-3">Operations / Standard</th>
                  <th className="px-3 py-3 w-40">Mandatory</th>
                  <th className="px-3 py-3 w-48">Notes / Type</th>
                  <th className="py-3 pl-2 pr-4 text-right w-14">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {wizard.qualityCompliance.map((qual: QualityComplianceItem) => (
                  <tr key={qual.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 pl-4 pr-3 font-semibold text-slate-900">
                      {qual.standard}
                    </td>
                    <td className="px-3 py-3">
                      <select
                        value={qual.mandatory}
                        onChange={(e) =>
                          wizard.updateQuality(qual.id, {
                            mandatory: e.target.value as "Yes" | "Preferred" | "Conditional",
                          })
                        }
                        className="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 focus:border-blue-500 focus:outline-none"
                      >
                        <option value="Yes">Yes</option>
                        <option value="Preferred">Preferred</option>
                        <option value="Conditional">Conditional</option>
                      </select>
                    </td>
                    <td className="px-3 py-3">
                      <select
                        value={qual.notes}
                        onChange={(e) =>
                          wizard.updateQuality(qual.id, { notes: e.target.value })
                        }
                        className="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 focus:border-blue-500 focus:outline-none"
                      >
                        <option value="Certification">Certification</option>
                        <option value="Document">Document</option>
                        <option value="Report">Report</option>
                      </select>
                    </td>
                    <td className="py-3 pl-2 pr-4 text-right">
                      <button
                        type="button"
                        onClick={() => wizard.removeQuality(qual.id)}
                        className="text-slate-400 hover:text-red-500 transition p-1"
                        title="Remove requirement"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {wizard.qualityCompliance.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-xs font-medium text-slate-400">
                      No quality standards or certifications added yet. Click &quot;+ Add Quality / Compliance&quot; above.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
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
              type="button"
              onClick={handleNext}
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-7 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 transition hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/30"
            >
              Save & Next
            </button>
          </div>
        </div>
      </div>

      {/* Add Material Modal */}
      {showAddMatModal && (
        <ModalPortal>
          <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
              <h3 className="text-base font-extrabold text-slate-900">Add Material</h3>
              <form onSubmit={handleAddMaterial} className="mt-4 space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">Material Name *</label>
                  <input
                    type="text"
                    required
                    value={newMatName}
                    onChange={(e) => setNewMatName(e.target.value)}
                    placeholder="e.g. Copper Alloy / Brass / Titanium"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">Grade / Specification</label>
                  <input
                    type="text"
                    value={newMatGrade}
                    onChange={(e) => setNewMatGrade(e.target.value)}
                    placeholder="e.g. C36000 / IS 319"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">Mandatory</label>
                  <select
                    value={newMatMandatory}
                    onChange={(e) => setNewMatMandatory(e.target.value as any)}
                    className="w-full rounded-lg border border-slate-300 px-2.5 py-2 text-xs font-medium text-slate-800"
                  >
                    <option value="Yes">Yes</option>
                    <option value="Preferred">Preferred</option>
                    <option value="Optional">Optional</option>
                  </select>
                </div>
                <div className="flex justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowAddMatModal(false)}
                    className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-700"
                  >
                    Add Material
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Add Quality Modal */}
      {showAddQualModal && (
        <ModalPortal>
          <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
              <h3 className="text-base font-extrabold text-slate-900">Add Quality & Compliance</h3>
              <form onSubmit={handleAddQuality} className="mt-4 space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">Standard / Document Name *</label>
                  <input
                    type="text"
                    required
                    value={newQualStandard}
                    onChange={(e) => setNewQualStandard(e.target.value)}
                    placeholder="e.g. PPAP Level 3 / AS9100D"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-blue-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-700">Mandatory</label>
                    <select
                      value={newQualMandatory}
                      onChange={(e) => setNewQualMandatory(e.target.value as any)}
                      className="w-full rounded-lg border border-slate-300 px-2.5 py-2 text-xs font-medium text-slate-800"
                    >
                      <option value="Yes">Yes</option>
                      <option value="Preferred">Preferred</option>
                      <option value="Conditional">Conditional</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-700">Type</label>
                    <select
                      value={newQualType}
                      onChange={(e) => setNewQualType(e.target.value as any)}
                      className="w-full rounded-lg border border-slate-300 px-2.5 py-2 text-xs font-medium text-slate-800"
                    >
                      <option value="Certification">Certification</option>
                      <option value="Document">Document</option>
                      <option value="Report">Report</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowAddQualModal(false)}
                    className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-700"
                  >
                    Add Quality
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}
