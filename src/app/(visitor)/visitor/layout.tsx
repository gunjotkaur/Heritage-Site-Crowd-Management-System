export default function VisitorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <header className="border-b p-4 font-semibold">
        Visitor Area (navbar comes later)
      </header>
      <main className="p-6">{children}</main>
    </div>
  );
}