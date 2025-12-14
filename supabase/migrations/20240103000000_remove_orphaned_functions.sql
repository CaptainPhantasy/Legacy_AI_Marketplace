-- Remove Orphaned Legacy Field Functions
-- This migration drops all functions that are not part of the Legacy AI Platform
-- KEEP: handle_new_user, update_updated_at_column, and all vector functions (pgvector extension)

-- Drop Route/Geo functions
DROP FUNCTION IF EXISTS haversine_distance CASCADE;
DROP FUNCTION IF EXISTS calculate_route_distance CASCADE;
DROP FUNCTION IF EXISTS get_route_waypoints_for_gmaps CASCADE;
DROP FUNCTION IF EXISTS calculate_waypoint_duration CASCADE;
DROP FUNCTION IF EXISTS get_next_route_sequence CASCADE;

-- Drop Job/Invoice functions
DROP FUNCTION IF EXISTS calculate_job_total CASCADE;
DROP FUNCTION IF EXISTS generate_invoice_number CASCADE;
DROP FUNCTION IF EXISTS calculate_sla_status CASCADE;
DROP FUNCTION IF EXISTS create_estimate_version CASCADE;
DROP FUNCTION IF EXISTS generate_part_sku CASCADE;
DROP FUNCTION IF EXISTS trigger_sla_update CASCADE;

-- Drop User/Role functions
DROP FUNCTION IF EXISTS is_super_admin CASCADE;
DROP FUNCTION IF EXISTS is_admin_or_owner CASCADE;
DROP FUNCTION IF EXISTS can_manage_users CASCADE;
DROP FUNCTION IF EXISTS get_user_role CASCADE;
DROP FUNCTION IF EXISTS is_admin CASCADE;
DROP FUNCTION IF EXISTS is_current_user_admin CASCADE;
DROP FUNCTION IF EXISTS is_owner_or_manager CASCADE;
DROP FUNCTION IF EXISTS is_super_admin_or_admin CASCADE;
DROP FUNCTION IF EXISTS user_has_role CASCADE;
DROP FUNCTION IF EXISTS current_account_id CASCADE;
DROP FUNCTION IF EXISTS get_user_account_id CASCADE;

-- Drop orphaned trigger functions (for tables that no longer exist)
DROP FUNCTION IF EXISTS update_direct_messages_updated_at CASCADE;
DROP FUNCTION IF EXISTS update_email_providers_updated_at CASCADE;
DROP FUNCTION IF EXISTS update_geofences_updated_at CASCADE;
DROP FUNCTION IF EXISTS update_job_checklist_items_updated_at CASCADE;
DROP FUNCTION IF EXISTS update_marketing_automations_updated_at CASCADE;
DROP FUNCTION IF EXISTS update_meetings_updated_at CASCADE;
DROP FUNCTION IF EXISTS update_resources_updated_at CASCADE;
DROP FUNCTION IF EXISTS update_suppliers_updated_at CASCADE;
DROP FUNCTION IF EXISTS update_user_profile_photos_updated_at CASCADE;

-- Drop other orphaned functions
DROP FUNCTION IF EXISTS check_max_profile_photos CASCADE;
DROP FUNCTION IF EXISTS check_scheduling_conflicts CASCADE;
DROP FUNCTION IF EXISTS cleanup_expired_voice_commands CASCADE;
DROP FUNCTION IF EXISTS cleanup_old_subscriptions CASCADE;
DROP FUNCTION IF EXISTS ensure_single_primary_photo CASCADE;
DROP FUNCTION IF EXISTS ensure_user_complete CASCADE;
DROP FUNCTION IF EXISTS get_contact_notes CASCADE;
DROP FUNCTION IF EXISTS get_contact_tags CASCADE;
DROP FUNCTION IF EXISTS get_job_notes CASCADE;
DROP FUNCTION IF EXISTS mark_messages_as_read CASCADE;
DROP FUNCTION IF EXISTS refresh_analytics_views CASCADE;
DROP FUNCTION IF EXISTS set_voice_command_executed_at CASCADE;
DROP FUNCTION IF EXISTS update_first_response CASCADE;

-- Note: The following functions are KEPT:
-- - handle_new_user (Legacy AI profile creation)
-- - update_updated_at_column (used by Legacy AI Platform tables)
-- - All vector_*, halfvec_*, sparsevec_* functions (pgvector extension)
-- - All distance/norm functions (cosine_distance, l1_distance, l2_distance, etc.) - part of pgvector
