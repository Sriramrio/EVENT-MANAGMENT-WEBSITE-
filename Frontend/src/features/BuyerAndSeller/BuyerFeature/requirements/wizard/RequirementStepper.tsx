import { Check } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { StatusBadge } from "../../../../../components/ui/StatusBadge";

export interface RequirementStepperProps {
  step: 1 | 2 | 3 | 4 | 5;
  subStep?: 1 | 2 | 3 | 4; // For step 4 sub-pages: 1: Processes, 2: Materials & Quality, 3: Operations & Qty, 4: Delivery & Commercial
  status?: string;
  trail?: string;
  className?: string;
}

const STEPS = [
  { num: 1, label: "Basic Info", route: "basic" },
  { num: 2, label: "Classification", route: "classification" },
  { num: 3, label: "Suggestions", route: "suggestions" },
  { num: 4, label: "Requirements", route: "processes" },
  { num: 5, label: "Review", route: "review" },
];

export function RequirementStepper({ step, subStep, status = "DRAFT", className = "" }: RequirementStepperProps) {
  const nav = useNavigate();
  const { id = "new" } = useParams();
  const hasExistingId = Boolean(id && id !== "new" && id !== "undefined");

  const getStepRoute = (s: number) => {
    if (s === 1) return hasExistingId ? `/buyer/requirements/${id}/basic` : "/buyer/requirements/new/basic";
    if (s === 2) return `/buyer/requirements/${id}/classification`;
    if (s === 3) return `/buyer/requirements/${id}/suggestions`;
    if (s === 4) return `/buyer/requirements/${id}/processes`;
    if (s === 5) return `/buyer/requirements/${id}/review`;
    return "/buyer/requirements/new/basic";
  };

  return (
    <div className={`mb-6 border-b border-slate-100 pb-5 ${className}`}>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-[11px] font-bold text-blue-600">
            Buyer / Requirements / {hasExistingId ? "Edit Requirement" : "New Requirement"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={status || "DRAFT"} />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-3 sm:gap-x-4">
        {STEPS.map((s, index) => {
          const isDone = s.num < step;
          const isActive = s.num === step;
          const isClickable = isDone || (hasExistingId && s.num !== step);
          const isUpcoming = !isClickable && !isActive;

          return (
            <div key={s.num} className="flex items-center">
              <button
                type="button"
                onClick={() => {
                  if (isClickable) {
                    nav(getStepRoute(s.num));
                  }
                }}
                disabled={isUpcoming}
                className={`flex items-center gap-2 rounded-full py-1 text-xs font-bold transition ${
                  isClickable
                    ? "cursor-pointer text-emerald-600 hover:opacity-80"
                    : isActive
                    ? "cursor-default text-blue-600 font-extrabold"
                    : "cursor-not-allowed text-slate-400"
                }`}
              >
                {isDone ? (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm">
                    <Check className="h-3 w-3 stroke-[3]" />
                  </span>
                ) : isActive ? (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm">
                    <span className="text-[11px] font-black">{s.num}</span>
                  </span>
                ) : (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-400">
                    <span className="text-[11px] font-bold">{s.num}</span>
                  </span>
                )}
                <span className={isActive ? "text-blue-600 font-bold" : isDone ? "text-emerald-700" : "text-slate-400"}>
                  {s.label}
                </span>
              </button>

              {index < STEPS.length - 1 && (
                <span className="mx-2 text-slate-300 text-sm select-none">→</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Sub-step indicator for Step 4 (Specify Requirements) */}
      {step === 4 && subStep && (
        <div className="mt-3 flex items-center gap-2 pt-2 border-t border-slate-100 text-[11px] font-medium text-slate-500">
          <span className="text-slate-400">Section:</span>
          {[
            { num: 1, label: "A & B. Processes & Technical Attributes", route: "processes" },
            { num: 2, label: "C & D. Materials & Quality", route: "materials-quality" },
            { num: 3, label: "E & F. Operations & Quantity", route: "operations-quantity" },
            { num: 4, label: "G & H. Delivery & Commercial", route: "delivery-commercial" },
          ].map((sub) => (
            <button
              key={sub.num}
              type="button"
              onClick={() => nav(`/buyer/requirements/${id}/${sub.route}`)}
              className={`rounded px-2 py-0.5 transition ${
                subStep === sub.num
                  ? "bg-blue-50 font-bold text-blue-600 border border-blue-200"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              }`}
            >
              Part {sub.num}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
