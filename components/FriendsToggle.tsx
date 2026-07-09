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
          ? "border-accent/40 bg-accent/10 text-ink"
          : "border-line-2 bg-surface text-ink-2 hover:bg-raised"
      }`}
    >
      <span
        className={`relative h-4 w-7 shrink-0 rounded-full transition ${
          value ? "bg-accent" : "bg-line-2"
        }`}
      >
        <span
          className={`absolute top-0.5 h-3 w-3 rounded-full shadow transition-all ${
            value ? "left-3.5 bg-accent-ink" : "left-0.5 bg-surface"
          }`}
        />
      </span>
      Friends&apos; concerts
    </button>
  );
}
