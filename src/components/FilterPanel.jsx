/**
 * Collapsible filter panel.
 * Controlled by the parent (open / onToggle) so the parent can lazily fetch
 * filter-supporting data only when the panel is opened.
 */
function FilterPanel({ open, onToggle, activeCount = 0, onClear, children }) {
  return (
    <div className="card-surface rounded-lg overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          className="inline-flex items-center gap-2 text-sm font-semibold text-navy-900"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-4 w-4 text-ink-500"
          >
            <path
              fillRule="evenodd"
              d="M2.628 3.5A.75.75 0 0 1 3.25 3h13.5a.75.75 0 0 1 .578 1.228l-4.828 5.855V16a.75.75 0 0 1-1.09.668l-2.5-1.25A.75.75 0 0 1 8 14.75v-4.667L3.05 4.228A.75.75 0 0 1 2.628 3.5Z"
              clipRule="evenodd"
            />
          </svg>
          Filters
          {activeCount > 0 && (
            <span className="ml-0.5 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-accent-600 px-1.5 text-xs font-semibold text-white">
              {activeCount}
            </span>
          )}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className={`h-4 w-4 text-ink-500 transition-transform ${
              open ? "rotate-180" : ""
            }`}
          >
            <path
              fillRule="evenodd"
              d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
              clipRule="evenodd"
            />
          </svg>
        </button>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="text-sm font-medium text-ink-500 hover:text-accent-700"
          >
            Clear all
          </button>
        )}
      </div>
      {open && <div className="border-t border-navy-100 p-4">{children}</div>}
    </div>
  );
}

export default FilterPanel;
