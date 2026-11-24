
import VisitorShell from "@/components/visitor/visitor-shell";

export default function VisitorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <VisitorShell>{children}</VisitorShell>;
}
