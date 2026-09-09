import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "../../../../components/ui/Button";
import {
  SelectInput,
  TextInput,
} from "../../../../components/forms/FormFields";
import { useSaveDraft } from "../../../../services/buyer/hooks";
import { useRequirementWizard } from "./wizard/requirementWizardStore";
import { RequirementStepper } from "./wizard/RequirementStepper";

export default function CommercialReviewPage() {
  const { id = "req-001" } = useParams();
  const nav = useNavigate();
  // 1. Ensure the route matches the controller step route
  const save = useSaveDraft(`requirements/${id}/steps/commercial`);
  const wizard = useRequirementWizard();

  const [needByDate, setNeedByDate] = useState(wizard.needByDate || "");
  const [deliveryLocation, setDeliveryLocation] = useState(
    wizard.deliveryLocation || "",
  );
  const [deliveryTerms, setDeliveryTerms] = useState(
    wizard.deliveryTerms || "EXW",
  );
  const [maxLeadTimeDays, setMaxLeadTimeDays] = useState<number | undefined>(
    wizard.maxLeadTimeDays || 45,
  );
  const [preferredStates, setPreferredStates] = useState(
    wizard.preferredStates || "",
  );
  const [considerOtherStates, setConsiderOtherStates] = useState<"Yes" | "No">(
    wizard.considerOtherStates || "Yes",
  );
  const [budgetRange, setBudgetRange] = useState(
    wizard.budgetRange || "₹ 10 - 20 Lakhs",
  );
  const [moqQuantity, setMoqQuantity] = useState<number | undefined>(
    wizard.moqQuantity || 1,
  );
  const [moqUom, setMoqUom] = useState(wizard.moqUom || "NOS");
  const [error, setError] = useState("");

  const handleSave = async (isDraftOnly = false) => {
    if (!isDraftOnly) {
      if (!needByDate) {
        setError("Need by date is required.");
        return false;
      }
      if (!deliveryLocation.trim()) {
        setError("Delivery location is required.");
        return false;
      }
      if (!maxLeadTimeDays || maxLeadTimeDays <= 0) {
        setError("Enter a valid max lead time.");
        return false;
      }
    }
    setError("");

    const patch = {
      needByDate,
      deliveryLocation,
      deliveryTerms,
      maxLeadTimeDays,
      preferredStates,
      considerOtherStates,
      budgetRange,
      moqQuantity,
      moqUom,
    };

    wizard.set(patch);

    // 2. Explicitly send version: 0 to avoid CONCURRENCY_CONFLICT
    const res: any = await save.mutateAsync({
      payload: patch,
      version: 0,
    });

    if (res?.version) {
      //@ts-ignore
      wizard.set({ version: res.version });
    }

    return true;
  };

  const next = async () => {
    const ok = await handleSave(false);
    if (ok) {
      nav(`/buyer/requirements/${id}/review-publish`);
    }
  };

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-4 text-2xl font-extrabold text-slate-900">
        4. Commercial & Delivery
      </h1>
      <div className="card rounded-xl border border-blue-100 bg-white p-6 shadow-sm">
        <RequirementStepper step={4} status={wizard.status} />

        <section>
          <h2 className="border-b border-slate-100 pb-2 text-sm font-extrabold text-blue-900">
            A. Delivery Expectations
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <TextInput
              label="Need By Date"
              type="date"
              required
              min={new Date().toISOString().slice(0, 10)}
              value={needByDate}
              onChange={(e) => setNeedByDate(e.target.value)}
            />
            <TextInput
              label="Delivery Location"
              required
              value={deliveryLocation}
              onChange={(e) => setDeliveryLocation(e.target.value)}
            />
            <SelectInput
              label="Preferred Delivery Terms"
              value={deliveryTerms}
              onChange={(e) => setDeliveryTerms(e.target.value)}
            >
              <option>EXW</option>
              <option>FOB</option>
              <option>CIF</option>
              <option>DAP</option>
              <option>DDP</option>
            </SelectInput>
            <TextInput
              label="Max Lead Time (Days)"
              type="number"
              required
              value={maxLeadTimeDays ?? ""}
              onChange={(e) => setMaxLeadTimeDays(Number(e.target.value))}
            />
          </div>
        </section>

        <section className="mt-6">
          <h2 className="border-b border-slate-100 pb-2 text-sm font-extrabold text-blue-900">
            B. Preferred Seller Location
          </h2>
          <div className="mt-4 grid items-end gap-4 md:grid-cols-2">
            <TextInput
              label="Preferred States / Region"
              value={preferredStates}
              onChange={(e) => setPreferredStates(e.target.value)}
            />
            <div>
              <p className="mb-2 text-xs font-bold text-slate-700">
                Willing to consider other states?
              </p>
              <div className="flex items-center gap-5">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="considerOtherStates"
                    checked={considerOtherStates === "Yes"}
                    onChange={() => setConsiderOtherStates("Yes")}
                  />{" "}
                  Yes
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="considerOtherStates"
                    checked={considerOtherStates === "No"}
                    onChange={() => setConsiderOtherStates("No")}
                  />{" "}
                  No
                </label>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6">
          <h2 className="border-b border-slate-100 pb-2 text-sm font-extrabold text-blue-900">
            C. Commercial Expectations
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <SelectInput
              label="Budget Range (Optional)"
              value={budgetRange}
              onChange={(e) => setBudgetRange(e.target.value)}
            >
              <option>₹ 5 - 10 Lakhs</option>
              <option>₹ 10 - 20 Lakhs</option>
              <option>₹ 20 - 50 Lakhs</option>
              <option>₹ 50 Lakhs +</option>
            </SelectInput>
            <div className="grid grid-cols-[1fr_8rem] gap-2">
              <TextInput
                label="MOQ Expectation"
                type="number"
                value={moqQuantity ?? ""}
                onChange={(e) => setMoqQuantity(Number(e.target.value))}
              />
              <SelectInput
                label="UOM"
                value={moqUom}
                onChange={(e) => setMoqUom(e.target.value)}
              >
                <option>NOS</option>
                <option>Sets</option>
                <option>KG</option>
              </SelectInput>
            </div>
          </div>
        </section>

        {error && (
          <p className="mt-4 text-xs font-semibold text-red-600">{error}</p>
        )}

        <div className="mt-6 flex justify-between gap-2 border-t border-slate-100 pt-5">
          <Button
            variant="secondary"
            type="button"
            onClick={() => nav(`/buyer/requirements/${id}/technical-quality`)}
          >
            ← Back
          </Button>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              type="button"
              loading={save.isPending}
              onClick={() => handleSave(true)}
            >
              Save as Draft
            </Button>
            <Button type="button" loading={save.isPending} onClick={next}>
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
