"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, Check } from "lucide-react";
import { publishAppVersion } from "@/app/actions/admin";
import type { Database } from "@/types/database";
import Link from "next/link";

type AppVersion = Database["public"]["Tables"]["app_versions"]["Row"];

interface VersionListProps {
  appId: string;
  versions: AppVersion[];
}

export function VersionList({ appId, versions }: VersionListProps) {
  const router = useRouter();
  const [publishing, setPublishing] = useState<string | null>(null);

  const handlePublish = async (versionId: string) => {
    setPublishing(versionId);
    const result = await publishAppVersion(appId, versionId);

    if (result.success) {
      router.refresh();
    } else {
      alert(result.error || "Failed to publish version");
    }
    setPublishing(null);
  };

  if (versions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground mb-4">No versions yet</p>
        <Link href={`/admin/apps/${appId}/versions/new`}>
          <Button>Create First Version</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Link href={`/admin/apps/${appId}/versions/new`}>
          <Button size="sm">New Version</Button>
        </Link>
      </div>

      <div className="space-y-2">
        {versions.map((version) => (
          <div
            key={version.id}
            className="flex items-center justify-between rounded-lg border p-3"
          >
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium">v{version.version}</p>
                {version.is_active && (
                  <span className="rounded bg-green-100 px-1.5 py-0.5 text-xs font-medium text-green-800">
                    Current
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {version.is_active ? "Active" : "Draft"} •{" "}
                {version.created_at
                  ? new Date(version.created_at).toLocaleDateString()
                  : "Unknown"}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {version.is_active ? (
                <span className="flex items-center gap-1 text-sm text-green-600">
                  <Check className="h-4 w-4" />
                  Live
                </span>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handlePublish(version.id)}
                  disabled={publishing === version.id}
                >
                  {publishing === version.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Upload className="mr-1 h-4 w-4" />
                      Publish
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
