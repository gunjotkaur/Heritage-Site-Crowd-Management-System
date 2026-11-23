export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <header className="border-b p-4 font-semibold">
        Admin Area (sidebar comes later)
      </header>
      <main className="p-6">{children}</main>
    </div>
  );
}