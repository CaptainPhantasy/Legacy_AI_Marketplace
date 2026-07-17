"use server";

import { revalidatePath } from "next/cache";
import { requireAdminAction } from "@/lib/admin";
import {
  appVersionSchema,
  parseAppForm,
  parseIdentifier,
} from "@/lib/admin-validation";
import type { Json } from "@/types/database";

type ActionResult =
  | { success: true; appId?: string; versionId?: string }
  | { success: false; error: string };

function validationError(message: string | undefined): ActionResult {
  return { success: false, error: message || "Invalid request" };
}

function operationError(operation: string, error: unknown): ActionResult {
  console.error(`Admin ${operation} failed`, error);
  return { success: false, error: `Failed to ${operation}` };
}

export async function createApp(formData: FormData): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireAdminAction();
    const parsed = parseAppForm(formData);
    if (!parsed.success)
      return validationError(parsed.error.issues[0]?.message);

    const { data, error } = await supabase
      .from("apps")
      .insert({ ...parsed.data, status: "draft", created_by: user.id })
      .select("id")
      .single();

    if (error) return operationError("create app", error);

    revalidatePath("/admin/apps");
    revalidatePath("/marketplace");
    return { success: true, appId: data.id };
  } catch (error) {
    return operationError("create app", error);
  }
}

export async function updateApp(
  appId: string,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const id = parseIdentifier(appId);
    if (!id.success) return validationError("Invalid app identifier");

    const parsed = parseAppForm(formData);
    if (!parsed.success)
      return validationError(parsed.error.issues[0]?.message);

    const { supabase } = await requireAdminAction();
    const { error } = await supabase
      .from("apps")
      .update(parsed.data)
      .eq("id", id.data);
    if (error) return operationError("update app", error);

    revalidatePath("/admin/apps");
    revalidatePath(`/admin/apps/${id.data}`);
    revalidatePath("/marketplace");
    revalidatePath(`/marketplace/${parsed.data.slug}`);
    return { success: true };
  } catch (error) {
    return operationError("update app", error);
  }
}

export async function archiveApp(appId: string): Promise<ActionResult> {
  try {
    const id = parseIdentifier(appId);
    if (!id.success) return validationError("Invalid app identifier");

    const { supabase } = await requireAdminAction();
    const { error } = await supabase
      .from("apps")
      .update({ status: "archived", published_at: null, published_by: null })
      .eq("id", id.data);

    if (error) return operationError("archive app", error);

    revalidatePath("/admin/apps");
    revalidatePath(`/admin/apps/${id.data}`);
    revalidatePath("/marketplace");
    return { success: true };
  } catch (error) {
    return operationError("archive app", error);
  }
}

export async function createAppVersion(
  appId: string,
  versionData: {
    versionNumber: string;
    manifestJson: object;
    configSchemaJson: object;
    outputSchemaJson: object;
    runTemplate: string;
  },
): Promise<ActionResult> {
  try {
    const id = parseIdentifier(appId);
    if (!id.success) return validationError("Invalid app identifier");

    const parsed = appVersionSchema.safeParse(versionData);
    if (!parsed.success)
      return validationError(parsed.error.issues[0]?.message);

    const { supabase, user } = await requireAdminAction();
    const { data, error } = await supabase
      .from("app_versions")
      .insert({
        app_id: id.data,
        version: parsed.data.versionNumber,
        manifest_json: parsed.data.manifestJson as Json,
        config_schema_json: parsed.data.configSchemaJson as Json,
        output_schema_json: parsed.data.outputSchemaJson as Json,
        run_template: parsed.data.runTemplate,
        created_by: user.id,
      })
      .select("id")
      .single();

    if (error) return operationError("create version", error);

    revalidatePath(`/admin/apps/${id.data}`);
    return { success: true, versionId: data.id };
  } catch (error) {
    return operationError("create version", error);
  }
}

export async function publishAppVersion(
  appId: string,
  versionId: string,
): Promise<ActionResult> {
  try {
    const app = parseIdentifier(appId);
    const version = parseIdentifier(versionId);
    if (!app.success || !version.success)
      return validationError("Invalid app or version identifier");

    const { supabase } = await requireAdminAction();
    const { error } = await supabase.rpc("publish_app_version", {
      target_app_id: app.data,
      target_version_id: version.data,
    });

    if (error) return operationError("publish version", error);

    revalidatePath(`/admin/apps/${app.data}`);
    revalidatePath("/marketplace");
    return { success: true };
  } catch (error) {
    return operationError("publish version", error);
  }
}
