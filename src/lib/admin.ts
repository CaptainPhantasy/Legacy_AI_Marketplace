import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { hasPlatformAdminRole } from "@/lib/admin-auth";

async function getAdminSession() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { supabase, user: null, authorized: false };

  const { data: databaseGrant, error } =
    await supabase.rpc("is_platform_admin");
  return {
    supabase,
    user,
    authorized:
      hasPlatformAdminRole(user) || (!error && databaseGrant === true),
  };
}

/**
 * Check if the current user is an admin
 * @returns true if user is admin, false otherwise
 */
export async function isAdmin(): Promise<boolean> {
  const { authorized } = await getAdminSession();
  return authorized;
}

/**
 * Require admin access - redirects to marketplace if not admin
 * @returns The authenticated admin user
 * @throws Redirects if not admin
 */
export async function requireAdmin() {
  const { user, authorized } = await getAdminSession();

  if (!user) {
    redirect("/login");
  }

  if (!authorized) {
    redirect("/marketplace");
  }

  return user;
}

export async function requireAdminAction() {
  const { supabase, user, authorized } = await getAdminSession();

  if (!user || !authorized) {
    throw new Error("Unauthorized");
  }

  return { supabase, user };
}
