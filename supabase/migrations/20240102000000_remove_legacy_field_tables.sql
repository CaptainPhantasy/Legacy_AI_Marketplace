-- Remove Legacy Field Project Tables
-- This migration drops all tables that are not part of the Legacy AI Platform

-- Drop all Legacy Field tables (using CASCADE to handle dependencies)
DROP TABLE IF EXISTS account_settings CASCADE;
DROP TABLE IF EXISTS accounts CASCADE;
DROP TABLE IF EXISTS agent_memory CASCADE;
DROP TABLE IF EXISTS ai_job_estimates CASCADE;
DROP TABLE IF EXISTS ar_models CASCADE;
DROP TABLE IF EXISTS ar_previews CASCADE;
DROP TABLE IF EXISTS automation_rules CASCADE;
DROP TABLE IF EXISTS blockchain_transactions CASCADE;
DROP TABLE IF EXISTS calendar_events CASCADE;
DROP TABLE IF EXISTS calendar_providers CASCADE;
DROP TABLE IF EXISTS call_logs CASCADE;
DROP TABLE IF EXISTS campaign_recipients CASCADE;
DROP TABLE IF EXISTS campaigns CASCADE;
DROP TABLE IF EXISTS candidate_evaluations CASCADE;
DROP TABLE IF EXISTS candidate_profiles CASCADE;
DROP TABLE IF EXISTS churn_predictions CASCADE;
DROP TABLE IF EXISTS compliance_checks CASCADE;
DROP TABLE IF EXISTS compliance_rules CASCADE;
DROP TABLE IF EXISTS contact_notes CASCADE;
DROP TABLE IF EXISTS contact_tag_assignments CASCADE;
DROP TABLE IF EXISTS contact_tags CASCADE;
DROP TABLE IF EXISTS contacts CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS crmai_audit CASCADE;
DROP TABLE IF EXISTS direct_messages CASCADE;
DROP TABLE IF EXISTS document_scans CASCADE;
DROP TABLE IF EXISTS dynamic_pricing_rules CASCADE;
DROP TABLE IF EXISTS email_analytics CASCADE;
DROP TABLE IF EXISTS email_providers CASCADE;
DROP TABLE IF EXISTS email_queue CASCADE;
DROP TABLE IF EXISTS email_templates CASCADE;
DROP TABLE IF EXISTS equipment_maintenance CASCADE;
DROP TABLE IF EXISTS equipment_predictions CASCADE;
DROP TABLE IF EXISTS equipment_registry CASCADE;
DROP TABLE IF EXISTS estimates CASCADE;
DROP TABLE IF EXISTS geofences CASCADE;
DROP TABLE IF EXISTS gps_logs CASCADE;
DROP TABLE IF EXISTS inventory_locations CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS iot_device_monitoring CASCADE;
DROP TABLE IF EXISTS iot_devices CASCADE;
DROP TABLE IF EXISTS job_checklist_items CASCADE;
DROP TABLE IF EXISTS job_checklist_templates CASCADE;
DROP TABLE IF EXISTS job_gates CASCADE;
DROP TABLE IF EXISTS job_materials CASCADE;
DROP TABLE IF EXISTS job_notes CASCADE;
DROP TABLE IF EXISTS job_parts CASCADE;
DROP TABLE IF EXISTS job_photos CASCADE;
DROP TABLE IF EXISTS jobs CASCADE;
DROP TABLE IF EXISTS knowledge_docs CASCADE;
DROP TABLE IF EXISTS llm_providers CASCADE;
DROP TABLE IF EXISTS llm_usage_logs CASCADE;
DROP TABLE IF EXISTS marketing_automations CASCADE;
DROP TABLE IF EXISTS meetings CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS notes CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS on_call_shifts CASCADE;
DROP TABLE IF EXISTS part_bundle_items CASCADE;
DROP TABLE IF EXISTS part_bundles CASCADE;
DROP TABLE IF EXISTS part_usage_history CASCADE;
DROP TABLE IF EXISTS parts CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS photo_analyses CASCADE;
DROP TABLE IF EXISTS resource_assignments CASCADE;
DROP TABLE IF EXISTS resources CASCADE;
DROP TABLE IF EXISTS risk_assessments CASCADE;
DROP TABLE IF EXISTS route_plan_jobs CASCADE;
DROP TABLE IF EXISTS route_plans CASCADE;
DROP TABLE IF EXISTS route_waypoints CASCADE;
DROP TABLE IF EXISTS sales_coaching_sessions CASCADE;
DROP TABLE IF EXISTS sales_interactions CASCADE;
DROP TABLE IF EXISTS sentiment_analyses CASCADE;
DROP TABLE IF EXISTS signature_verifications CASCADE;
DROP TABLE IF EXISTS signatures CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;
DROP TABLE IF EXISTS tags CASCADE;
DROP TABLE IF EXISTS time_entries CASCADE;
DROP TABLE IF EXISTS user_profile_photos CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS video_support_sessions CASCADE;
DROP TABLE IF EXISTS voice_clones CASCADE;
DROP TABLE IF EXISTS voice_navigation_commands CASCADE;
DROP TABLE IF EXISTS working_hours CASCADE;

-- Note: The following tables are KEPT for Legacy AI Platform:
-- - profiles
-- - connector_accounts
-- - apps
-- - app_versions
-- - installed_apps
-- - installed_app_grants
-- - runs
-- - run_artifacts
