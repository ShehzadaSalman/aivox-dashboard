import { Link } from "react-router-dom";

function OnboardingChecklist({ steps, onDismiss }) {
  const doneCount = steps.filter((s) => s.done).length;
  const total = steps.length;
  const pct = total ? Math.round((doneCount / total) * 100) : 0;

  return (
    <div className="card-surface rounded-xl p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-navy-900">
            Finish setting up
          </h2>
          <p className="mt-0.5 text-sm text-ink-600">
            {doneCount} of {total} done — a couple of quick steps to get the most
            out of Candibly.
          </p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 text-sm font-medium text-ink-500 hover:text-ink-700"
        >
          Dismiss
        </button>
      </div>

      <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-navy-50">
        <div
          className="h-full bg-accent-600 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>

      <ul className="mt-4 space-y-2">
        {steps.map((step) => (
          <li
            key={step.label}
            className="flex items-center gap-3 rounded-lg border border-navy-100 px-4 py-3"
          >
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                step.done
                  ? "bg-emerald-500 text-white"
                  : "border border-navy-200 bg-navy-50 text-ink-400"
              }`}
            >
              {step.done ? "✓" : ""}
            </span>
            <div className="min-w-0 flex-1">
              <p
                className={`text-sm font-medium ${
                  step.done ? "text-ink-500 line-through" : "text-navy-900"
                }`}
              >
                {step.label}
              </p>
              {step.hint && !step.done && (
                <p className="text-xs text-ink-500">{step.hint}</p>
              )}
            </div>
            {!step.done && step.to && (
              <Link
                to={step.to}
                className="shrink-0 rounded-lg bg-accent-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-700"
              >
                {step.cta || "Set up"}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default OnboardingChecklist;
