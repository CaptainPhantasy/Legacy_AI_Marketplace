import type { User } from "@supabase/supabase-js";

type AdminIdentity = Pick<User, "app_metadata">;

export function hasPlatformAdminRole(
  user: AdminIdentity | null | undefined,
): boolean {
  return user?.app_metadata?.platform_role === "admin";
}
