"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { createAppVersion } from "@/app/actions/admin";

const DEFAULT_MANIFEST = {
  name: "App Name",
  version: "1.0.0",
  description: "App description",
  connectors: [],
  execution: {
    model: "gemini-2.5-flash",
    modelConfig: {
      temperature: 0.3,
      maxOutputTokens: 4096,
    },
  },
  ui: {
    outputRenderer: "json",
  },
};

const DEFAULT_CONFIG_SCHEMA = {
  type: "object",
  properties: {},
  required: [],
};

const DEFAULT_OUTPUT_SCHEMA = {
  type: "object",
  properties: {
    result: {
      type: "string",
      description: "The result of the operation",
    },
  },
  required: ["result"],
};

const DEFAULT_RUN_TEMPLATE = `You are a helpful assistant.

{{#if config.instructions}}
User instructions: {{config.instructions}}
{{/if}}

Current date: {{currentDate}}

Please provide a helpful response.`;

export default function NewVersionPage() {
  const router = useRouter();
  const params = useParams();
  const appId = params.id as string;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [versionNumber, setVersionNumber] = useState("1.0.0");
  const [manifestJson, setManifestJson] = useState(
    JSON.stringify(DEFAULT_MANIFEST, null, 2),
  );
  const [configSchemaJson, setConfigSchemaJson] = useState(
    JSON.stringify(DEFAULT_CONFIG_SCHEMA, null, 2),
  );
  const [outputSchemaJson, setOutputSchemaJson] = useState(
    JSON.stringify(DEFAULT_OUTPUT_SCHEMA, null, 2),
  );
  const [runTemplate, setRunTemplate] = useState(DEFAULT_RUN_TEMPLATE);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await createAppVersion(appId, {
        versionNumber,
        manifestJson: JSON.parse(manifestJson),
        configSchemaJson: JSON.parse(configSchemaJson),
        outputSchemaJson: JSON.parse(outputSchemaJson),
        runTemplate,
      });

      if (result.success) {
        router.push(`/admin/apps/${appId}`);
      } else {
        setError(result.error || "Failed to create version");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid JSON");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-4xl space-y-6 p-8">
      <div className="flex items-center gap-4">
        <Link href={`/admin/apps/${appId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to App
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create New Version</CardTitle>
          <CardDescription>
            Add a new version with manifest, schemas, and prompt template
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="versionNumber">Version Number *</Label>
              <Input
                id="versionNumber"
                value={versionNumber}
                onChange={(e) => setVersionNumber(e.target.value)}
                placeholder="1.0.0"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="manifestJson">Manifest JSON *</Label>
              <textarea
                id="manifestJson"
                value={manifestJson}
                onChange={(e) => setManifestJson(e.target.value)}
                rows={12}
                className="w-full font-mono text-sm rounded-md border border-input bg-background px-3 py-2"
                required
              />
              <p className="text-xs text-muted-foreground">
                Defines connectors, execution config, and UI settings
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="configSchemaJson">Config Schema JSON *</Label>
              <textarea
                id="configSchemaJson"
                value={configSchemaJson}
                onChange={(e) => setConfigSchemaJson(e.target.value)}
                rows={8}
                className="w-full font-mono text-sm rounded-md border border-input bg-background px-3 py-2"
                required
              />
              <p className="text-xs text-muted-foreground">
                JSON Schema for user-configurable options
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="outputSchemaJson">Output Schema JSON *</Label>
              <textarea
                id="outputSchemaJson"
                value={outputSchemaJson}
                onChange={(e) => setOutputSchemaJson(e.target.value)}
                rows={8}
                className="w-full font-mono text-sm rounded-md border border-input bg-background px-3 py-2"
                required
              />
              <p className="text-xs text-muted-foreground">
                JSON Schema for validating AI output
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="runTemplate">Run Template (Prompt) *</Label>
              <textarea
                id="runTemplate"
                value={runTemplate}
                onChange={(e) => setRunTemplate(e.target.value)}
                rows={12}
                className="w-full font-mono text-sm rounded-md border border-input bg-background px-3 py-2"
                required
              />
              <p className="text-xs text-muted-foreground">
                Handlebars-style template. Use {"{{config.field}}"},{" "}
                {"{{connectors.type.data}}"}, {"{{currentDate}}"}
              </p>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Version"
                )}
              </Button>
              <Link href={`/admin/apps/${appId}`}>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
