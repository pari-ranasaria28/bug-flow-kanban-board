
-- Drop all existing policies on projects table first
DROP POLICY IF EXISTS "Users can view projects they're members of" ON public.projects;
DROP POLICY IF EXISTS "Users can view their projects" ON public.projects;
DROP POLICY IF EXISTS "Users can create projects" ON public.projects;
DROP POLICY IF EXISTS "Project owners can update projects" ON public.projects;
DROP POLICY IF EXISTS "Project owners can delete projects" ON public.projects;

-- Now recreate all policies
CREATE POLICY "Users can view their projects" 
ON public.projects 
FOR SELECT 
USING (
  id IN (SELECT project_id FROM get_user_project_ids()) OR owner_id = auth.uid()
);

CREATE POLICY "Users can create projects" 
ON public.projects 
FOR INSERT 
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Project owners can update projects" 
ON public.projects 
FOR UPDATE 
USING (owner_id = auth.uid());

CREATE POLICY "Project owners can delete projects" 
ON public.projects 
FOR DELETE 
USING (owner_id = auth.uid());

-- Enable RLS on all tables
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- Drop and recreate ticket policy
DROP POLICY IF EXISTS "Users can view tickets in their projects" ON public.tickets;

CREATE POLICY "Users can view tickets in their projects" 
ON public.tickets 
FOR SELECT 
USING (
  project_id IN (SELECT project_id FROM get_user_project_ids())
);
