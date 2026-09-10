import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Plus, Trash2, FileText, Check } from "lucide-react";
import { toast } from "react-hot-toast";
import { RequirementStepper } from "./wizard/RequirementStepper";
import { useRequirementWizard, ProcessItem, TechnicalAttributeItem } from "./wizard/requirementWizardStore";
import { useSaveDraft } from "../../../../services/buyer/hooks";
import { ModalPortal } from "../../../../shared/components/ModalPortal";

export default function RequirementProcessesPage() {
  const nav = useNavigate();
  const { id = "req-001" } = useParams();
  const wizard = useRequirementWizard();
  const saveDraftMutation = useSaveDraft(`requirements/${id}/processes`);

  // New process modal / inline state
  const [showAddProcessModal, setShowAddProcessModal] = useState(false);
  const [newProcessName, setNewProcessName] = useState("");
  const [newProcessMandatory, setNewProcessMandatory] = useState<"Yes" | "No">("Yes");
  const [newProcessPreference, setNewProcessPreference] = useState<"—" | "Preferred" | "Optional">("—");
  const [newProcessNotes, setNewProcessNotes] = useState("");

  // New attribute modal state
  const [showAddAttrModal, setShowAddAttrModal] = useState(false);
  const [newAttrName, setNewAttrName] = useState("");
  const [newAttrOperator, setNewAttrOperator] = useState<"=" | ">=" | "<=" | "Between" | ">">("=");
  const [newAttrValue, setNewAttrValue] = useState("");
  const [newAttrUnit, setNewAttrUnit] = useState("—");
  const [newAttrMandatory, setNewAttrMandatory] = useState<"Yes" | "Preferred" | "No">("Yes");

  // Note popover modal
  const [editingNoteItem, setEditingNoteItem] = useState<{ id: string; name: string; notes: string } | null>(null);

  const handleAddProcess = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProcessName.trim()) return;
    wizard.addProcess({
      name: newProcessName.trim(),
      mandatory: newProcessMandatory,
      preference: newProcessPreference,
      notes: newProcessNotes.trim(),
      selected: true,
    });
    setNewProcessName("");
    setNewProcessNotes("");
    setShowAddProcessModal(false);
  };

  const handleAddAttribute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAttrName.trim()) return;
    wizard.addAttribute({
      name: newAttrName.trim(),
      operator: newAttrOperator,
      value: newAttrValue.trim(),
      unit: newAttrUnit.trim(),
      mandatory: newAttrMandatory,
    });
    setNewAttrName("");
    setNewAttrValue("");
    setShowAddAttrModal(false);
  };

  const handleNext = async () => {
    try {
      if (id && !id.startsWith("req-")) {
        await saveDraftMutation.mutateAsync({
          payload: {
            processes: wizard.processes,
            technicalAttributes: wizard.technicalAttributes,
            requiredProcesses: wizard.processes.filter((p) => p.selected).map((p) => p.name),
          },
        });
      }
    } catch (err) {
      console.warn("Could not save processes draft directly to backend", err);
    }
    nav(`/buyer/requirements/${id}/materials-quality`);
  };

  const handleSaveDraft = async () => {
    try {
      if (id && !id.startsWith("req-")) {
        await saveDraftMutation.mutateAsync({
          payload: {
            processes: wizard.processes,
            technicalAttributes: wizard.technicalAttributes,
            requiredProcesses: wizard.processes.filter((p) => p.selected).map((p) => p.name),
          },
        });
        toast.success("Draft saved successfully!");
      } else {
        toast.success("Draft saved locally!");
      }
    } catch (err) {
      toast.error("Failed to save draft.");
    }
  };

  const handleBack = () => {
    nav(`/buyer/requirements/${id}/suggestions`);
  };

  return (
    <div className="mx-auto max-w-5xl">
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm md:p-8">
        {/* Stepper */}
        <RequirementStepper step={4} subStep={1} status={wizard.status || "DRAFT"} />

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-extrabold text-slate-900">
            Specify Your Requirements
          </h1>
          <p className="mt-1 text-xs font-medium text-slate-500">
            Confirm and specify your exact requirements
          </p>
        </div>

        <div className="space-y-8">
          {/* Section A: Processes (Required) */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">
                A. Processes <span className="font-normal text-slate-400">(Required)</span>
              </h2>
              <button
                type="button"
                onClick={() => setShowAddProcessModal(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-600 transition hover:bg-blue-100"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Process
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 font-bold text-slate-700">
                  <tr>
                    <th className="py-3 pl-4 pr-3">Process</th>
                    <th className="px-3 py-3 w-36">Mandatory</th>
                    <th className="px-3 py-3 w-36">Preference</th>
                    <th className="px-3 py-3 text-center w-24">Notes</th>
                    <th className="py-3 pl-2 pr-4 text-right w-14">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {wizard.processes.map((proc: ProcessItem) => (
                    <tr key={proc.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 pl-4 pr-3">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={proc.selected}
                            onChange={(e) =>
                              wizard.updateProcess(proc.id, { selected: e.target.checked })
                            }
                            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="font-semibold">{proc.name}</span>
                        </label>
                      </td>
                      <td className="px-3 py-3">
                        <select
                          value={proc.mandatory}
                          onChange={(e) =>
                            wizard.updateProcess(proc.id, {
                              mandatory: e.target.value as "Yes" | "No",
                              preference: e.target.value === "Yes" ? "—" : proc.preference === "—" ? "Preferred" : proc.preference,
                            })
                          }
                          className="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 focus:border-blue-500 focus:outline-none"
                        >
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                      </td>
                      <td className="px-3 py-3">
                        <select
                          value={proc.preference}
                          disabled={proc.mandatory === "Yes"}
                          onChange={(e) =>
                            wizard.updateProcess(proc.id, {
                              preference: e.target.value as "—" | "Preferred" | "Optional",
                            })
                          }
                          className={`w-full rounded-md border bg-white px-2 py-1 text-xs font-semibold focus:border-blue-500 focus:outline-none ${
                            proc.mandatory === "Yes"
                              ? "border-slate-100 text-slate-400 bg-slate-50 cursor-not-allowed"
                              : "border-slate-200 text-slate-700"
                          }`}
                        >
                          <option value="—">—</option>
                          <option value="Preferred">Preferred</option>
                          <option value="Optional">Optional</option>
                        </select>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <button
                          type="button"
                          onClick={() =>
                            setEditingNoteItem({
                              id: proc.id,
                              name: proc.name,
                              notes: proc.notes || "",
                            })
                          }
                          className={`inline-flex h-7 w-7 items-center justify-center rounded-lg border transition ${
                            proc.notes
                              ? "border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100"
                              : "border-slate-200 bg-white text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                          }`}
                          title={proc.notes || "Add note"}
                        >
                          <FileText className="h-3.5 w-3.5" />
                        </button>
                      </td>
                      <td className="py-3 pl-2 pr-4 text-right">
                        <button
                          type="button"
                          onClick={() => wizard.removeProcess(proc.id)}
                          className="text-slate-400 hover:text-red-500 transition p-1"
                          title="Remove process"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {wizard.processes.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-xs font-medium text-slate-400">
                        No processes specified yet. Click &quot;+ Add Process&quot; above to add required manufacturing processes.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section B: Technical Attributes */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">
                B. Technical Attributes
              </h2>
              <button
                type="button"
                onClick={() => setShowAddAttrModal(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-600 transition hover:bg-blue-100"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Attribute
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 font-bold text-slate-700">
                  <tr>
                    <th className="py-3 pl-4 pr-3">Attribute</th>
                    <th className="px-3 py-3 w-28">Operator</th>
                    <th className="px-3 py-3 w-40">Value</th>
                    <th className="px-3 py-3 w-24">Unit</th>
                    <th className="px-3 py-3 w-32">Mandatory</th>
                    <th className="py-3 pl-2 pr-4 text-right w-14">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {wizard.technicalAttributes.map((attr: TechnicalAttributeItem) => (
                    <tr key={attr.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 pl-4 pr-3 font-semibold text-slate-900">
                        {attr.name}
                      </td>
                      <td className="px-3 py-3">
                        <select
                          value={attr.operator}
                          onChange={(e) =>
                            wizard.updateAttribute(attr.id, {
                              operator: e.target.value as "=" | ">=" | "<=" | "Between" | ">",
                            })
                          }
                          className="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 focus:border-blue-500 focus:outline-none"
                        >
                          <option value="=">=</option>
                          <option value=">=">&gt;=</option>
                          <option value="<=">&lt;=</option>
                          <option value=">">&gt;</option>
                          <option value="Between">Between</option>
                        </select>
                      </td>
                      <td className="px-3 py-3">
                        <input
                          type="text"
                          value={attr.value}
                          onChange={(e) =>
                            wizard.updateAttribute(attr.id, { value: e.target.value })
                          }
                          className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-800 focus:border-blue-500 focus:outline-none"
                        />
                      </td>
                      <td className="px-3 py-3">
                        <input
                          type="text"
                          value={attr.unit}
                          onChange={(e) =>
                            wizard.updateAttribute(attr.id, { unit: e.target.value })
                          }
                          className="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 focus:border-blue-500 focus:outline-none"
                        />
                      </td>
                      <td className="px-3 py-3">
                        <select
                          value={attr.mandatory}
                          onChange={(e) =>
                            wizard.updateAttribute(attr.id, {
                              mandatory: e.target.value as "Yes" | "Preferred" | "No",
                            })
                          }
                          className="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 focus:border-blue-500 focus:outline-none"
                        >
                          <option value="Yes">Yes</option>
                          <option value="Preferred">Preferred</option>
                          <option value="No">No</option>
                        </select>
                      </td>
                      <td className="py-3 pl-2 pr-4 text-right">
                        <button
                          type="button"
                          onClick={() => wizard.removeAttribute(attr.id)}
                          className="text-slate-400 hover:text-red-500 transition p-1"
                          title="Remove attribute"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {wizard.technicalAttributes.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-xs font-medium text-slate-400">
                        No technical attributes specified yet. Click &quot;+ Add Attribute&quot; above to add dimensions, travel, or speed limits.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
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
            ← Back
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={saveDraftMutation.isPending}
              onClick={handleSaveDraft}
              className="rounded-xl border border-slate-300 bg-white px-6 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              {saveDraftMutation.isPending ? "Saving…" : "Save as Draft"}
            </button>

            <button
              type="button"
              onClick={handleNext}
              disabled={saveDraftMutation.isPending}
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-7 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 transition hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/30 disabled:opacity-50"
            >
              {saveDraftMutation.isPending ? "Saving…" : "Save & Next →"}
            </button>
          </div>
        </div>
      </div>

      {/* Add Process Modal */}
      {showAddProcessModal && (
        <ModalPortal>
          <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
              <h3 className="text-base font-extrabold text-slate-900">Add Process</h3>
              <form onSubmit={handleAddProcess} className="mt-4 space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">Process Name *</label>
                  <input
                    type="text"
                    required
                    value={newProcessName}
                    onChange={(e) => setNewProcessName(e.target.value)}
                    placeholder="e.g. Wire EDM / Surface Coating"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-700">Mandatory</label>
                    <select
                      value={newProcessMandatory}
                      onChange={(e) => setNewProcessMandatory(e.target.value as "Yes" | "No")}
                      className="w-full rounded-lg border border-slate-300 px-2.5 py-2 text-xs font-medium text-slate-800"
                    >
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-700">Preference</label>
                    <select
                      value={newProcessPreference}
                      onChange={(e) => setNewProcessPreference(e.target.value as "—" | "Preferred" | "Optional")}
                      className="w-full rounded-lg border border-slate-300 px-2.5 py-2 text-xs font-medium text-slate-800"
                    >
                      <option value="—">—</option>
                      <option value="Preferred">Preferred</option>
                      <option value="Optional">Optional</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">Notes (Optional)</label>
                  <input
                    type="text"
                    value={newProcessNotes}
                    onChange={(e) => setNewProcessNotes(e.target.value)}
                    placeholder="e.g. Tolerance ±0.01mm"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowAddProcessModal(false)}
                    className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-700"
                  >
                    Add Process
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Add Attribute Modal */}
      {showAddAttrModal && (
        <ModalPortal>
          <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
              <h3 className="text-base font-extrabold text-slate-900">Add Technical Attribute</h3>
              <form onSubmit={handleAddAttribute} className="mt-4 space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">Attribute Name *</label>
                  <input
                    type="text"
                    required
                    value={newAttrName}
                    onChange={(e) => setNewAttrName(e.target.value)}
                    placeholder="e.g. Maximum Workpiece Weight"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-blue-500"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-700">Operator</label>
                    <select
                      value={newAttrOperator}
                      onChange={(e) => setNewAttrOperator(e.target.value as any)}
                      className="w-full rounded-lg border border-slate-300 px-2 py-2 text-xs font-medium text-slate-800"
                    >
                      <option value="=">=</option>
                      <option value=">=">&gt;=</option>
                      <option value="<=">&lt;=</option>
                      <option value=">">&gt;</option>
                      <option value="Between">Between</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-700">Value</label>
                    <input
                      type="text"
                      value={newAttrValue}
                      onChange={(e) => setNewAttrValue(e.target.value)}
                      placeholder="e.g. 1500"
                      className="w-full rounded-lg border border-slate-300 px-2 py-2 text-xs font-medium text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-700">Unit</label>
                    <input
                      type="text"
                      value={newAttrUnit}
                      onChange={(e) => setNewAttrUnit(e.target.value)}
                      placeholder="e.g. kg / mm"
                      className="w-full rounded-lg border border-slate-300 px-2 py-2 text-xs font-medium text-slate-800"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">Mandatory</label>
                  <select
                    value={newAttrMandatory}
                    onChange={(e) => setNewAttrMandatory(e.target.value as any)}
                    className="w-full rounded-lg border border-slate-300 px-2.5 py-2 text-xs font-medium text-slate-800"
                  >
                    <option value="Yes">Yes</option>
                    <option value="Preferred">Preferred</option>
                    <option value="No">No</option>
                  </select>
                </div>
                <div className="flex justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowAddAttrModal(false)}
                    className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-700"
                  >
                    Add Attribute
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Edit Notes Modal */}
      {editingNoteItem && (
        <ModalPortal>
          <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
              <h3 className="text-base font-extrabold text-slate-900">
                Notes for {editingNoteItem.name}
              </h3>
              <textarea
                rows={3}
                value={editingNoteItem.notes}
                onChange={(e) =>
                  setEditingNoteItem({ ...editingNoteItem, notes: e.target.value })
                }
                placeholder="Enter special notes, tolerance requirements or guidelines..."
                className="mt-3 w-full rounded-lg border border-slate-300 p-3 text-xs font-medium text-slate-800 outline-none focus:border-blue-500"
              />
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingNoteItem(null)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    wizard.updateProcess(editingNoteItem.id, { notes: editingNoteItem.notes });
                    setEditingNoteItem(null);
                  }}
                  className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-700"
                >
                  <Check className="h-3.5 w-3.5" />
                  Save Note
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}
