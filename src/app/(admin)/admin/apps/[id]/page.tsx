import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AppEditForm } from "@/components/admin/app-edit-form";
import { VersionList } from "@/components/admin/version-list";

export default async function EditAppPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: app } = await supabase
    .from("apps")
    .select("*")
    .eq("id", id)
    .single();

  if (!app) notFound();

  const { data: versions } = await supabase
    .from("app_versions")
    .select("*")
    .eq("app_id", id)
    .order("created_at", { ascending: false });

  return (
    <div className="container mx-auto max-w-4xl space-y-6 p-8">
      <div className="flex items-center gap-4">
        <Link href="/admin/apps">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Apps
          </Button>
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-4xl">{app.icon || "📱"}</span>
        <div>
          <h1 className="text-3xl font-bold">{app.name}</h1>
          <p className="text-muted-foreground">/{app.slug}</p>
        </div>
        <span
          className={`ml-auto rounded-full px-3 py-1 text-sm font-medium ${
            app.status === "published"
              ? "bg-green-100 text-green-800"
              : "bg-yellow-100 text-yellow-800"
          }`}
        >
          {app.status}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* App Details */}
        <Card>
          <CardHeader>
            <CardTitle>App Details</CardTitle>
            <CardDescription>Edit basic app information</CardDescription>
          </CardHeader>
          <CardContent>
            <AppEditForm app={app} />
          </CardContent>
        </Card>

        {/* Versions */}
        <Card>
          <CardHeader>
            <CardTitle>Versions</CardTitle>
            <CardDescription>Manage app versions and publish</CardDescription>
          </CardHeader>
          <CardContent>
            <VersionList appId={id} versions={versions || []} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
