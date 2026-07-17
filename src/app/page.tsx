import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { Sparkles, Plug, Store, Play } from "lucide-react";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If user is logged in, redirect to dashboard
  // Note: (platform) is a route group, so the actual URL is just /
  // We redirect to /marketplace as the main authenticated experience
  if (user) {
    redirect("/marketplace");
  }

  // Show landing page for unauthenticated users
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b bg-background">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">Legacy AI</span>
          </div>
          <Link href="/login">
            <Button>Sign In</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="container mx-auto px-4 py-24 text-center">
          <h1 className="mb-6 text-5xl font-bold tracking-tight">
            AI-Powered Apps for Your Data
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-xl text-muted-foreground">
            Connect your services, install powerful AI apps, and automate your
            workflows. Legacy AI brings the power of AI to your everyday tools.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/login">
              <Button size="lg" className="gap-2">
                <Sparkles className="h-5 w-5" />
                Get Started
              </Button>
            </Link>
            <Link href="/marketplace">
              <Button size="lg" variant="outline" className="gap-2">
                <Store className="h-5 w-5" />
                Browse Apps
              </Button>
            </Link>
          </div>
        </section>

        {/* Features */}
        <section className="border-t bg-muted/50 py-24">
          <div className="container mx-auto px-4">
            <h2 className="mb-12 text-center text-3xl font-bold">
              How It Works
            </h2>
            <div className="grid gap-8 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <Plug className="mb-2 h-10 w-10 text-primary" />
                  <CardTitle>1. Connect Services</CardTitle>
                  <CardDescription>
                    Link your Google Drive, Gmail, and other services securely
                    with OAuth.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <Store className="mb-2 h-10 w-10 text-primary" />
                  <CardTitle>2. Install Apps</CardTitle>
                  <CardDescription>
                    Browse the marketplace and install AI-powered apps that work
                    with your data.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <Play className="mb-2 h-10 w-10 text-primary" />
                  <CardTitle>3. Run & Automate</CardTitle>
                  <CardDescription>
                    Execute apps to analyze, summarize, and transform your data
                    with AI.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>
            &copy; {new Date().getFullYear()} Legacy AI Platform. All rights
            reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
