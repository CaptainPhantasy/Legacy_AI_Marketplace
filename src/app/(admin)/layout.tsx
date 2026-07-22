import { requireAdmin } from "@/lib/admin";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Shield, Home } from "lucide-react";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This will redirect if not admin
  await requireAdmin();

  return (
    <div className="min-h-screen bg-background">
      {/* Admin Header */}
      <header className="border-b bg-yellow-50 dark:bg-yellow-950">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-yellow-600" />
            <span className="font-semibold text-yellow-800 dark:text-yellow-200">
              Admin Panel
            </span>
          </div>
          <Link href="/marketplace">
            <Button variant="outline" size="sm" className="gap-2">
              <Home className="h-4 w-4" />
              Back to App
            </Button>
          </Link>
        </div>
      </header>

      {children}
    </div>
  );
}
