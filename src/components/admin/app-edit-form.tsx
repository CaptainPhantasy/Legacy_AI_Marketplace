"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Archive, Loader2, Save } from "lucide-react";
import { archiveApp, updateApp } from "@/app/actions/admin";
import type { Database } from "@/types/database";

type App = Database["public"]["Tables"]["apps"]["Row"];

interface AppEditFormProps {
  app: App;
}

export function AppEditForm({ app }: AppEditFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await updateApp(app.id, formData);

    if (result.success) {
      router.refresh();
    } else {
      setError(result.error || "Failed to update app");
    }
    setLoading(false);
  };

  const handleArchive = async () => {
    if (
      !confirm(
        "Archive this app? It will be hidden from the marketplace but its data will be preserved.",
      )
    ) {
      return;
    }

    setArchiving(true);
    const result = await archiveApp(app.id);

    if (result.success) {
      router.refresh();
    } else {
      setError(result.error || "Failed to archive app");
    }
    setArchiving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">App Name</Label>
        <Input id="name" name="name" defaultValue={app.name} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="slug">Slug</Label>
        <Input
          id="slug"
          name="slug"
          defaultValue={app.slug}
          pattern="[a-z0-9-]+"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description"
          name="description"
          defaultValue={app.description || ""}
          rows={3}
          required
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="icon">Icon (emoji)</Label>
        <Input
          id="icon"
          name="icon"
          defaultValue={app.icon || ""}
          maxLength={4}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <select
          id="category"
          name="category"
          defaultValue={app.category || "other"}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="productivity">Productivity</option>
          <option value="analysis">Analysis</option>
          <option value="automation">Automation</option>
          <option value="communication">Communication</option>
          <option value="other">Other</option>
        </select>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex justify-between">
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={handleArchive}
          disabled={archiving || app.status === "archived"}
        >
          {archiving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Archive className="mr-2 h-4 w-4" />
              {app.status === "archived" ? "Archived" : "Archive"}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
