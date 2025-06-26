
-- Create a security definer function to get user's project IDs without triggering RLS
CREATE OR REPLACE FUNCTION public.get_user_project_ids(user_uuid UUID DEFAULT auth.uid())
RETURNS TABLE(project_id UUID) 
LANGUAGE SQL 
SECURITY DEFINER 
STABLE
AS $$
  SELECT pm.project_id 
  FROM public.project_members pm 
  WHERE pm.user_id = user_uuid
  UNION
  SELECT p.id 
  FROM public.projects p 
  WHERE p.owner_id = user_uuid;
$$;

-- Drop the existing problematic policy
DROP POLICY IF EXISTS "Users can view project members of projects they're in" ON public.project_members;

-- Create a new policy that uses the security definer function to avoid recursion
CREATE POLICY "Users can view project members of projects they're in" 
ON public.project_members 
FOR SELECT 
USING (
  project_id IN (SELECT get_user_project_ids())
);

-- Also update the project owners policy to use the same pattern for consistency
DROP POLICY IF EXISTS "Project owners can manage members" ON public.project_members;

CREATE POLICY "Project owners can manage members" 
ON public.project_members 
FOR ALL 
USING (
  project_id IN (
    SELECT id FROM public.projects WHERE owner_id = auth.uid()
  )
);
