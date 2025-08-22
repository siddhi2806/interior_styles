-- Create admin stats view for efficient querying
-- Run this in your Supabase SQL Editor

CREATE OR REPLACE VIEW admin_user_stats AS
SELECT 
  u.id,
  u.display_name,
  u.credits,
  u.blocked,
  u.is_admin,
  u.created_at,
  COALESCE(p.project_count, 0) as project_count,
  COALESCE(r.render_count, 0) as render_count,
  COALESCE(ABS(cr.total_credits_used), 0) as total_credits_used
FROM users u
LEFT JOIN (
  SELECT user_id, COUNT(*) as project_count
  FROM projects 
  GROUP BY user_id
) p ON u.id = p.user_id
LEFT JOIN (
  SELECT user_id, COUNT(*) as render_count
  FROM project_images 
  GROUP BY user_id
) r ON u.id = r.user_id
LEFT JOIN (
  SELECT user_id, SUM(amount) as total_credits_used
  FROM usage_logs 
  WHERE type = 'render'
  GROUP BY user_id
) cr ON u.id = cr.user_id;
