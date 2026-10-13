// Red (error) or green (success) message box.
// Errors use role="alert" (read out immediately by screen readers);
// successes use role="status" (read out politely).
export function Alert({
  kind,
  children,
  id,
  className = "",
}: {
  kind: "error" | "success";
  children: React.ReactNode;
  id?: string;
  className?: string;
}) {
  const colours =
    kind === "error" ? "border-red-300 bg-red-50 text-red-800" : "border-green-300 bg-green-50 text-green-900";
  return (
    <div
      id={id}
      role={kind === "error" ? "alert" : "status"}
      className={`rounded-md border px-4 py-3 text-sm ${colours} ${className}`}
    >
      {children}
    </div>
  );
}
