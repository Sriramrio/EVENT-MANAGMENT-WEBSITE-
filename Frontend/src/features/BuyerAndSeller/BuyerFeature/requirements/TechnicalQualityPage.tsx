import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Upload } from "lucide-react";
import { Button } from "../../../../components/ui/Button";
import {
  SelectInput,
  TextInput,
} from "../../../../components/forms/FormFields";
import { useSaveDraft } from "../../../../services/buyer/hooks";
import { useRequirementWizard } from "./wizard/requirementWizardStore";
import { RequirementStepper } from "./wizard/RequirementStepper";
import { ChipInput } from "./wizard/ChipInput";

export default function TechnicalQualityPage() {
  const { id = "req-001" } = useParams();
  const nav = useNavigate();
  const wizard = useRequirementWizard();

  // Resolve valid requirement GUID matching productDetails logic
  const targetId = id && id !== "req-001" ? id : wizard.requirementId || id;
  const save = useSaveDraft(`requirements/${targetId}/steps/technical`);

  const [materialGrade, setMaterialGrade] = useState(
    wizard.materialGrade || "",
  );
  const [maxComponentSize, setMaxComponentSize] = useState(
    wizard.maxComponentSize || "",
  );
  const [surfaceFinish, setSurfaceFinish] = useState(
    wizard.surfaceFinish || "",
  );
  const [requiredProcesses, setRequiredProcesses] = useState<string[]>(
    wizard.requiredProcesses || ["CNC Programming", "VMC Machining"],
  );
  const [drawingAvailable, setDrawingAvailable] = useState<"Yes" | "No">(
    wizard.drawingAvailable || "Yes",
  );
  //@ts-ignore
  const [files, setFiles] = useState<string[]>(wizard.files || []);
  const [certifications, setCertifications] = useState<string[]>(
    wizard.certifications || ["ISO 9001", "IATF 16949"],
  );
  const [minMachineCapacity, setMinMachineCapacity] = useState<
    number | undefined
  >(wizard.minMachineCapacity || 2);
  const [minExperience, setMinExperience] = useState(
    wizard.minExperience || "3-5 Years",
  );
  const [error, setError] = useState("");

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedNames = Array.from(e.target.files ?? []).map((f) => f.name);
    setFiles((prev) => [...prev, ...uploadedNames]);
  };

  const handleSave = async (isDraftOnly = false) => {
    if (!isDraftOnly) {
      if (requiredProcesses.length === 0) {
        setError("Add at least one required process / capability.");
        return false;
      }
    }
    setError("");

    const payload = {
      materialGrade,
      maxComponentSize,
      surfaceFinish,
      requiredProcesses,
      drawingAvailable,
      files,
      certifications,
      minMachineCapacity,
      minExperience,
    };

    // Update frontend wizard store
    wizard.set({
      materialGrade,
      maxComponentSize,
      surfaceFinish,
      requiredProcesses,
      drawingAvailable,
      //@ts-ignore

      files,
      certifications,
      minMachineCapacity,
      minExperience,
    });

    // Send payload matching the exact shape used in productDetails
    const res: any = await save.mutateAsync({
      payload,
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
      nav(`/buyer/requirements/${targetId}/commercial-review`);
    }
  };

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-4 text-2xl font-extrabold text-slate-900">
        3. Technical / Mandatory Criteria
      </h1>
      <div className="card rounded-xl border border-blue-100 bg-white p-6 shadow-sm">
        <RequirementStepper step={3} status={wizard.status} />

        {/* Section A: Technical Specifications */}
        <section>
          <h2 className="border-b border-slate-100 pb-2 text-sm font-extrabold text-blue-900">
            A. Technical Specifications
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <TextInput
              label="Material / Grade"
              placeholder="e.g. EN8, SS304"
              value={materialGrade}
              onChange={(e) => setMaterialGrade(e.target.value)}
            />
            <TextInput
              label="Max Component Size (mm)"
              placeholder="e.g. +/- 0.01 mm"
              value={maxComponentSize}
              onChange={(e) => setMaxComponentSize(e.target.value)}
            />
            <TextInput
              label="Surface Finish"
              placeholder="e.g. Ra 0.8"
              value={surfaceFinish}
              onChange={(e) => setSurfaceFinish(e.target.value)}
            />
          </div>
        </section>

        {/* Section B: Required Processes */}
        <section className="mt-6">
          <h2 className="border-b border-slate-100 pb-2 text-sm font-extrabold text-blue-900">
            B. Required Processes / Capabilities (Mandatory)
          </h2>
          <div className="mt-4">
            <ChipInput
              values={requiredProcesses}
              onChange={setRequiredProcesses}
              placeholder="e.g. 5-Axis Machining"
            />
          </div>
        </section>

        {/* Section C: Drawings / Documents */}
        <section className="mt-6">
          <h2 className="border-b border-slate-100 pb-2 text-sm font-extrabold text-blue-900">
            C. Drawings / Documents
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-bold text-slate-700">
                Drawing Available?
              </p>
              <div className="flex items-center gap-5">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="drawingAvailable"
                    checked={drawingAvailable === "Yes"}
                    onChange={() => setDrawingAvailable("Yes")}
                  />{" "}
                  Yes
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="drawingAvailable"
                    checked={drawingAvailable === "No"}
                    onChange={() => setDrawingAvailable("No")}
                  />{" "}
                  No
                </label>
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-bold text-slate-700">
                Uploaded Drawings / Specification
              </p>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-blue-300 px-4 py-2 text-sm font-bold text-blue-600 hover:bg-blue-50">
                <Upload className="h-4 w-4" /> Upload Files
                <input
                  type="file"
                  multiple
                  accept=".pdf,.dwg,.jpg,.jpeg"
                  className="sr-only"
                  onChange={handleFileUpload}
                />
              </label>
              <p className="mt-1 text-[11px] text-slate-400">
                PDF, DWG, JPG up to 10MB each
              </p>
              {files.length > 0 && (
                <ul className="mt-2 space-y-1 text-xs text-emerald-700">
                  {files.map((f, idx) => (
                    <li key={idx}>{f} · attached</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>

        {/* Section D: Mandatory Certifications */}
        <section className="mt-6">
          <h2 className="border-b border-slate-100 pb-2 text-sm font-extrabold text-blue-900">
            D. Mandatory Certifications
          </h2>
          <div className="mt-4">
            <ChipInput
              values={certifications}
              onChange={setCertifications}
              placeholder="e.g. ISO 9001"
            />
          </div>
        </section>

        {/* Section E: Minimum Seller Capability */}
        <section className="mt-6">
          <h2 className="border-b border-slate-100 pb-2 text-sm font-extrabold text-blue-900">
            E. Minimum Seller Capability (Mandatory)
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <TextInput
              label="Minimum Machines Capacity (Per Month)"
              type="number"
              value={minMachineCapacity ?? ""}
              onChange={(e) => setMinMachineCapacity(Number(e.target.value))}
            />
            <SelectInput
              label="Minimum Experience"
              value={minExperience}
              onChange={(e) => setMinExperience(e.target.value)}
            >
              <option>0-1 Years</option>
              <option>1-3 Years</option>
              <option>3-5 Years</option>
              <option>5+ Years</option>
            </SelectInput>
          </div>
        </section>

        {error && (
          <p className="mt-4 text-xs font-semibold text-red-600">{error}</p>
        )}

        <div className="mt-6 flex justify-between gap-2 border-t border-slate-100 pt-5">
          <Button
            variant="secondary"
            type="button"
            onClick={() => nav(`/buyer/requirements/${targetId}/product`)}
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
