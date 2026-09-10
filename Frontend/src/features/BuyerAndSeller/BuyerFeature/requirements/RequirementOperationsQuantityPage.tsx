import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Plus, Trash2, FileText, Check, Info } from "lucide-react";
import { toast } from "react-hot-toast";
import { RequirementStepper } from "./wizard/RequirementStepper";
import { useRequirementWizard, OperationItem } from "./wizard/requirementWizardStore";
import { useSaveDraft } from "../../../../services/buyer/hooks";
import { ModalPortal } from "../../../../shared/components/ModalPortal";

export default function RequirementOperationsQuantityPage() {
  const nav = useNavigate();
  const { id = "req-001" } = useParams();
  const wizard = useRequirementWizard();
  const saveDraftMutation = useSaveDraft(`requirements/${id}/operations-quantity`);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  const [quantity, setQuantity] = useState(wizard.quantity || 100);
  const [uom, setUom] = useState(wizard.uom || "NOS");

  // Add Operation Modal
  const [showAddOpModal, setShowAddOpModal] = useState(false);
  const [newOpSeq, setNewOpSeq] = useState<number>(
    (wizard.operations.length + 1) * 10
  );
  const [newOpName, setNewOpName] = useState("");
  const [newOpMandatory, setNewOpMandatory] = useState<"Yes" | "Preferred" | "Optional">("Yes");
  const [newOpNotes, setNewOpNotes] = useState("");

  // Edit Note Modal
  const [editingNoteItem, setEditingNoteItem] = useState<{ id: string; operation: string; notes: string } | null>(null);

  const handleAddOperation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOpName.trim()) return;
    wizard.addOperation({
      seq: newOpSeq,
      operation: newOpName.trim(),
      mandatory: newOpMandatory,
      notes: newOpNotes.trim(),
    });
    setNewOpName("");
    setNewOpNotes("");
    setNewOpSeq((prev) => prev + 10);
    setShowAddOpModal(false);
  };

  const handleSaveDraft = async () => {
    const numQty = Number(quantity) || 1;
    wizard.set({ quantity: numQty, uom });
    try {
      setIsSavingDraft(true);
      if (id && !id.startsWith("req-")) {
        await saveDraftMutation.mutateAsync({
          payload: {
            operations: wizard.operations,
            quantity: numQty,
            uomCode: uom,
            uom: uom,
          },
        });
      }
      toast.success("Operations & quantity saved as draft");
    } catch (err) {
      console.warn("Could not save operations-quantity draft directly to backend", err);
      toast.success("Draft saved locally");
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleNext = async () => {
    const numQty = Number(quantity) || 1;
    wizard.set({ quantity: numQty, uom });
    try {
      if (id && !id.startsWith("req-")) {
        await saveDraftMutation.mutateAsync({
          payload: {
            operations: wizard.operations,
            quantity: numQty,
            uomCode: uom,
            uom: uom,
          },
        });
      }
    } catch (err) {
      console.warn("Could not save operations-quantity draft directly to backend", err);
    }
    nav(`/buyer/requirements/${id}/delivery-commercial`);
  };

  const handleBack = () => {
    wizard.set({ quantity: Number(quantity) || 1, uom });
    nav(`/buyer/requirements/${id}/materials-quality`);
  };

  return (
    <div className="mx-auto max-w-5xl">
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm md:p-8">
        {/* Stepper */}
        <RequirementStepper step={4} subStep={3} status={wizard.status || "DRAFT"} />

        {/* Section E: Operations */}
        <div className="mb-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">
              E. Operations <span className="font-normal text-slate-400">(If you expect specific route)</span>
            </h2>
            <button
              type="button"
              onClick={() => {
                setNewOpSeq((wizard.operations.length + 1) * 10);
                setShowAddOpModal(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-600 transition hover:bg-blue-100"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Operation
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 font-bold text-slate-700">
                <tr>
                  <th className="py-3 pl-4 pr-3 w-16">Seq.</th>
                  <th className="px-3 py-3">Operation</th>
                  <th className="px-3 py-3 w-40">Mandatory</th>
                  <th className="px-3 py-3 text-center w-24">Notes</th>
                  <th className="py-3 pl-2 pr-4 text-right w-14">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {wizard.operations.map((op: OperationItem) => (
                  <tr key={op.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 pl-4 pr-3 font-bold text-slate-500">
                      {op.seq}
                    </td>
                    <td className="px-3 py-3 font-semibold text-slate-900">
                      {op.operation}
                    </td>
                    <td className="px-3 py-3">
                      <select
                        value={op.mandatory}
                        onChange={(e) =>
                          wizard.updateOperation(op.id, {
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
                    <td className="px-3 py-3 text-center">
                      <button
                        type="button"
                        onClick={() =>
                          setEditingNoteItem({
                            id: op.id,
                            operation: op.operation,
                            notes: op.notes || "",
                          })
                        }
                        className={`inline-flex h-7 w-7 items-center justify-center rounded-lg border transition ${
                          op.notes
                            ? "border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100"
                            : "border-slate-200 bg-white text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                        }`}
                        title={op.notes || "Add note"}
                      >
                        <FileText className="h-3.5 w-3.5" />
                      </button>
                    </td>
                    <td className="py-3 pl-2 pr-4 text-right">
                      <button
                        type="button"
                        onClick={() => wizard.removeOperation(op.id)}
                        className="text-slate-400 hover:text-red-500 transition p-1"
                        title="Remove operation"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {wizard.operations.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-xs font-medium text-slate-400">
                      No operations sequence steps added yet. Click &quot;+ Add Operation&quot; above to add operation steps.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section F: Quantity & UOM */}
        <div className="border-t border-slate-100 pt-6">
          <h2 className="mb-4 text-sm font-bold text-slate-900">
            F. Quantity & UOM
          </h2>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700">
                Quantity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700">
                Unit of Measure <span className="text-red-500">*</span>
              </label>
              <select
                value={uom}
                onChange={(e) => setUom(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="NOS">NOS</option>
                <option value="SET">SET</option>
                <option value="LOT">LOT</option>
                <option value="PAIR">PAIR</option>
                <option value="KG">KG</option>
                <option value="MTR">MTR</option>
                <option value="PCS">PCS</option>
              </select>
            </div>
          </div>

          {/* UOM Hint */}
          <div className="mt-3 flex items-start gap-2 text-xs text-slate-500">
            <Info className="h-4 w-4 shrink-0 text-blue-500 mt-0.5" />
            <div>
              <p className="font-medium">
                Default UOM suggested based on classification.
              </p>
              <p className="text-[11px] text-slate-400">
                Alternative UOMs: SET, LOT, PAIR, PCS, KG
              </p>
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
              type="button"
              onClick={handleNext}
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-7 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 transition hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/30"
            >
              Save & Next
            </button>
          </div>
        </div>
      </div>

      {/* Add Operation Modal */}
      {showAddOpModal && (
        <ModalPortal>
          <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
              <h3 className="text-base font-extrabold text-slate-900">Add Route Operation</h3>
              <form onSubmit={handleAddOperation} className="mt-4 space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-700">Sequence</label>
                    <input
                      type="number"
                      step="10"
                      value={newOpSeq}
                      onChange={(e) => setNewOpSeq(Number(e.target.value))}
                      className="w-full rounded-lg border border-slate-300 px-2.5 py-2 text-xs font-medium text-slate-800"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="mb-1 block text-xs font-bold text-slate-700">Operation Name *</label>
                    <input
                      type="text"
                      required
                      value={newOpName}
                      onChange={(e) => setNewOpName(e.target.value)}
                      placeholder="e.g. Ultrasonic Cleaning"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">Mandatory</label>
                  <select
                    value={newOpMandatory}
                    onChange={(e) => setNewOpMandatory(e.target.value as any)}
                    className="w-full rounded-lg border border-slate-300 px-2.5 py-2 text-xs font-medium text-slate-800"
                  >
                    <option value="Yes">Yes</option>
                    <option value="Preferred">Preferred</option>
                    <option value="Optional">Optional</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">Notes (Optional)</label>
                  <input
                    type="text"
                    value={newOpNotes}
                    onChange={(e) => setNewOpNotes(e.target.value)}
                    placeholder="e.g. As per standard operating procedure"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-blue-500"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowAddOpModal(false)}
                    className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-700"
                  >
                    Add Operation
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
                Notes for {editingNoteItem.operation}
              </h3>
              <textarea
                rows={3}
                value={editingNoteItem.notes}
                onChange={(e) =>
                  setEditingNoteItem({ ...editingNoteItem, notes: e.target.value })
                }
                placeholder="Enter special process notes or inspection parameters..."
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
                    wizard.updateOperation(editingNoteItem.id, { notes: editingNoteItem.notes });
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
