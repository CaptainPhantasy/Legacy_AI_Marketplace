import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  new URL(
    "../../supabase/migrations/20240104000000_harden_admin_authorization.sql",
    import.meta.url,
  ),
  "utf8",
);
const initialSchema = readFileSync(
  new URL(
    "../../supabase/migrations/20240101000000_init_schema.sql",
    import.meta.url,
  ),
  "utf8",
);
const adminActions = readFileSync(
  new URL("../app/actions/admin.ts", import.meta.url),
  "utf8",
);

describe("admin migration contract", () => {
  it("removes email-derived authority and preserves prior grants by user ID", () => {
    expect(initialSchema).not.toContain("GENERATED ALWAYS AS (email");
    expect(migration).toContain("INSERT INTO public.platform_admins (user_id)");
    expect(migration).toContain(
      "ALTER TABLE public.profiles DROP COLUMN IF EXISTS is_admin",
    );
    expect(
      migration.indexOf('DROP POLICY IF EXISTS "Admin can manage all apps"'),
    ).toBeLessThan(
      migration.indexOf(
        "ALTER TABLE public.profiles DROP COLUMN IF EXISTS is_admin",
      ),
    );
  });

  it("uses a fixed-path security boundary and trusted application metadata", () => {
    expect(migration).toContain("SECURITY DEFINER");
    expect(migration).toContain("SET search_path = ''");
    expect(migration).toContain("'platform_role'");
  });

  it("publishes only a version belonging to the selected app in one RPC", () => {
    expect(migration).toContain(
      "WHERE id = target_version_id AND app_id = target_app_id",
    );
    expect(migration).toContain(
      "CREATE OR REPLACE FUNCTION public.publish_app_version",
    );
    expect(adminActions).toContain('supabase.rpc("publish_app_version"');
  });

  it("archives records instead of deleting application data", () => {
    expect(adminActions).toContain('status: "archived"');
    expect(adminActions).not.toContain(".delete()");
  });
});
