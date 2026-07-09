// Concert Map brand icon: a clean solid map-pin on the signature indigo→pink
// gradient tile. Replaces the old 📍 emoji so the logo renders identically across
// platforms. `className` controls the tile size; the pin scales to half of it.
export default function BrandMark({
  className = "h-8 w-8",
  rounded = "rounded-lg",
}: {
  className?: string;
  rounded?: string;
}) {
  return (
    <span
      className={`grid place-items-center ${rounded} ${className}`}
      style={{ background: "linear-gradient(150deg,#818cf8,#ec4899)" }}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" fill="white" className="h-1/2 w-1/2">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" />
      </svg>
    </span>
  );
}
