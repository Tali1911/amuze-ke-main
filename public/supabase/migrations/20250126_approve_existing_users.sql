-- Approve all existing users who were created before the approval system
-- This fixes login issues for users who existed before the approval system was implemented

-- Update all existing profiles to approved status
UPDATE public.profiles
SET 
  approval_status = 'approved',
  approved_at = COALESCE(created_at, NOW())
WHERE approval_status = 'pending';

-- Verify the update
SELECT 
  p.id,
  au.email,
  p.full_name,
  p.department,
  p.approval_status,
  ur.role
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
LEFT JOIN public.user_roles ur ON au.id = ur.user_id
ORDER BY au.created_at;
