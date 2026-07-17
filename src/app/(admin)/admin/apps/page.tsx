import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus, ArrowLeft } from "lucide-react";

export default async function AdminAppsPage() {
  const supabase = await createClient();

  const { data: apps } = await supabase
    .from("apps")
    .select(
      `
      *,
      versions:app_versions(count),
      installs:installed_apps(count)
    `,
    )
    .order("created_at", { ascending: false });

  return (
    <div className="container mx-auto max-w-6xl space-y-6 p-8">
      <div className="flex items-center gap-4">
        <Link href="/admin">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Apps</h1>
          <p className="text-muted-foreground">Manage marketplace apps</p>
        </div>
        <Link href="/admin/apps/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Create App
          </Button>
        </Link>
      </div>

      {apps && apps.length > 0 ? (
        <div className="grid gap-4">
          {apps.map((app) => (
            <Card key={app.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <span className="text-3xl">{app.icon || "📱"}</span>
                  <div>
                    <h3 className="font-semibold">{app.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {app.description}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Slug: /{app.slug} • Category:{" "}
                      {app.category || "uncategorized"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right text-sm">
                    <p className="text-muted-foreground">
                      {Array.isArray(app.versions) ? app.versions.length : 0}{" "}
                      versions
                    </p>
                    <p className="text-muted-foreground">
                      {Array.isArray(app.installs) ? app.installs.length : 0}{" "}
                      installs
                    </p>
                  </div>
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
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">No apps yet</p>
            <Link href="/admin/apps/new">
              <Button>Create Your First App</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
