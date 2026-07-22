-- Replace personal-email authorization with a durable role boundary.
-- Existing generated administrators are migrated by user ID before the legacy column is removed.

CREATE TABLE IF NOT EXISTS public.platform_admins (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  granted_by UUID REFERENCES public.profiles(id)
);

ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;

INSERT INTO public.platform_admins (user_id)
SELECT id
FROM public.profiles
WHERE is_admin = TRUE
ON CONFLICT (user_id) DO NOTHING;

-- Remove dependent policies before dropping the legacy authorization column.
-- The migration is transactional, so there is no externally visible policy gap.
DROP POLICY IF EXISTS "Admin can manage all apps" ON public.apps;
DROP POLICY IF EXISTS "Admin can manage all versions" ON public.app_versions;
DROP POLICY IF EXISTS "Admin can view all runs" ON public.runs;
DROP POLICY IF EXISTS "Admin can update all runs" ON public.runs;
DROP POLICY IF EXISTS "Admin can view all artifacts" ON public.run_artifacts;

ALTER TABLE public.profiles DROP COLUMN IF EXISTS is_admin;

CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    COALESCE((SELECT auth.jwt() -> 'app_metadata' ->> 'platform_role'), '') = 'admin'
    OR EXISTS (
      SELECT 1
      FROM public.platform_admins
      WHERE user_id = (SELECT auth.uid())
    );
$$;

REVOKE ALL ON FUNCTION public.is_platform_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_platform_admin() TO authenticated;

DROP POLICY IF EXISTS "Admin can view all profiles" ON public.profiles;
CREATE POLICY "Admin can view all profiles" ON public.profiles
  FOR SELECT USING ((SELECT public.is_platform_admin()));

CREATE POLICY "Admin can manage all apps" ON public.apps
  FOR ALL
  USING ((SELECT public.is_platform_admin()))
  WITH CHECK ((SELECT public.is_platform_admin()));

CREATE POLICY "Admin can manage all versions" ON public.app_versions
  FOR ALL
  USING ((SELECT public.is_platform_admin()))
  WITH CHECK ((SELECT public.is_platform_admin()));

DROP POLICY IF EXISTS "Admin can view all installed apps" ON public.installed_apps;
CREATE POLICY "Admin can view all installed apps" ON public.installed_apps
  FOR SELECT USING ((SELECT public.is_platform_admin()));

CREATE POLICY "Admin can view all runs" ON public.runs
  FOR SELECT USING ((SELECT public.is_platform_admin()));

CREATE POLICY "Admin can update all runs" ON public.runs
  FOR UPDATE
  USING ((SELECT public.is_platform_admin()))
  WITH CHECK ((SELECT public.is_platform_admin()));

CREATE POLICY "Admin can view all artifacts" ON public.run_artifacts
  FOR SELECT USING ((SELECT public.is_platform_admin()));

CREATE OR REPLACE FUNCTION public.publish_app_version(
  target_app_id UUID,
  target_version_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  IF NOT (SELECT public.is_platform_admin()) THEN
    RAISE EXCEPTION 'administrator role required' USING ERRCODE = '42501';
  END IF;

  PERFORM 1 FROM public.apps WHERE id = target_app_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'app not found' USING ERRCODE = 'P0002';
  END IF;

  PERFORM 1
  FROM public.app_versions
  WHERE id = target_version_id AND app_id = target_app_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'version does not belong to app' USING ERRCODE = '22023';
  END IF;

  UPDATE public.app_versions
  SET is_active = FALSE
  WHERE app_id = target_app_id AND is_active = TRUE;

  UPDATE public.app_versions
  SET is_active = TRUE
  WHERE id = target_version_id AND app_id = target_app_id;

  UPDATE public.apps
  SET
    status = 'published',
    published_at = NOW(),
    published_by = (SELECT auth.uid()),
    updated_at = NOW()
  WHERE id = target_app_id;
END;
$$;

REVOKE ALL ON FUNCTION public.publish_app_version(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.publish_app_version(UUID, UUID) TO authenticated;
