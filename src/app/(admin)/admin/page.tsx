import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Package, Users, Play, Plus } from "lucide-react";

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  // Get counts
  const { count: appsCount } = await supabase
    .from("apps")
    .select("*", { count: "exact", head: true });

  const { count: usersCount } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true });

  const { count: runsCount } = await supabase
    .from("runs")
    .select("*", { count: "exact", head: true });

  const { count: installsCount } = await supabase
    .from("installed_apps")
    .select("*", { count: "exact", head: true });

  // Get recent apps
  const { data: recentApps } = await supabase
    .from("apps")
    .select("id, name, slug, status, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <div className="container mx-auto max-w-6xl space-y-8 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage apps, users, and platform settings
          </p>
        </div>
        <Link href="/admin/apps/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Create App
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Apps</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{appsCount || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usersCount || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Runs</CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{runsCount || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">App Installs</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{installsCount || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Apps */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Apps</CardTitle>
          <CardDescription>Latest apps in the marketplace</CardDescription>
        </CardHeader>
        <CardContent>
          {recentApps && recentApps.length > 0 ? (
            <div className="space-y-2">
              {recentApps.map((app) => (
                <div
                  key={app.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="font-medium">{app.name}</p>
                    <p className="text-sm text-muted-foreground">/{app.slug}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${
                        app.status === "published"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {app.status}
                    </span>
                    <Link href={`/admin/apps/${app.id}`}>
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">
              No apps yet. Create your first app!
            </p>
          )}
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="grid gap-4 md:grid-cols-2">
        <Link href="/admin/apps">
          <Card className="cursor-pointer transition-colors hover:bg-muted/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Manage Apps
              </CardTitle>
              <CardDescription>Create, edit, and publish apps</CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/marketplace">
          <Card className="cursor-pointer transition-colors hover:bg-muted/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                View Marketplace
              </CardTitle>
              <CardDescription>See how apps appear to users</CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  );
}
