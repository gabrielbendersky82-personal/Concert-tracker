"use client";

/**
 * Switch to include (or hide) friends' concerts in a view. On by default.
 * Render only when there's at least one friend to toggle.
 */
export default function FriendsToggle({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition ${
        value
          ? "border-indigo-200 bg-indigo-50 text-indigo-700"
          : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
      }`}
    >
      <span
        className={`relative h-4 w-7 shrink-0 rounded-full transition ${
          value ? "bg-indigo-600" : "bg-slate-300"
        }`}
      >
        <span
          className={`absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition-all ${
            value ? "left-3.5" : "left-0.5"
          }`}
        />
      </span>
      Friends&apos; concerts
    </button>
  );
}
