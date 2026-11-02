export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <header className="border-b p-4 font-semibold">
        Public Area (navbar comes later)
      </header>
      {children}
    </div>
  );
}