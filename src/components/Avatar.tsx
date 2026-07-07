export default function Avatar({
  name,
  color,
  size = 56,
}: {
  name: string;
  color: string;
  size?: number;
}) {
  return (
    <span
      className="rounded-full grid place-items-center text-white font-bold shrink-0"
      style={{
        backgroundColor: color,
        width: size,
        height: size,
        fontSize: size * 0.42,
      }}
      aria-hidden
    >
      {name
        .split(" ")
        .slice(0, 2)
        .map((p) => p.charAt(0).toUpperCase())
        .join("")}
    </span>
  );
}
