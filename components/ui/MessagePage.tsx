// Centred page-level message: "Page not found", "Something went wrong", …
// `children` is the way forward (a link or a "Try again" button).
export function MessagePage({
  title,
  text,
  children,
}: {
  title: string;
  text: string;
  children: React.ReactNode;
}) {
  return (
    <div className="py-12 text-center">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="mt-2 text-stone-600">{text}</p>
      <div className="mt-6">{children}</div>
    </div>
  );
}
