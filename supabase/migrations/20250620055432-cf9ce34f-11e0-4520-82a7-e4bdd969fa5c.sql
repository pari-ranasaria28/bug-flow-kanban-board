
-- Create enum types for tickets
CREATE TYPE ticket_type AS ENUM ('bug', 'feature', 'task');
CREATE TYPE ticket_priority AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE ticket_status AS ENUM ('todo', 'in_progress', 'done');
CREATE TYPE user_role AS ENUM ('admin', 'developer', 'viewer');

-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Create projects table
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Create project members table
CREATE TABLE public.project_members (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role DEFAULT 'developer',
  invited_by UUID REFERENCES auth.users(id),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id),
  UNIQUE(project_id, user_id)
);

-- Create tickets table
CREATE TABLE public.tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  type ticket_type DEFAULT 'task',
  priority ticket_priority DEFAULT 'medium',
  status ticket_status DEFAULT 'todo',
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES auth.users(id),
  assignee_id UUID REFERENCES auth.users(id),
  attachment_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Create comments table
CREATE TABLE public.comments (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id),
  parent_id UUID REFERENCES public.comments(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Create RLS policies for projects
CREATE POLICY "Users can view projects they're members of" ON public.projects FOR SELECT USING (
  id IN (
    SELECT project_id FROM public.project_members WHERE user_id = auth.uid()
  ) OR owner_id = auth.uid()
);
CREATE POLICY "Users can create projects" ON public.projects FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Project owners can update projects" ON public.projects FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Project owners can delete projects" ON public.projects FOR DELETE USING (auth.uid() = owner_id);

-- Create RLS policies for project members
CREATE POLICY "Users can view project members of projects they're in" ON public.project_members FOR SELECT USING (
  project_id IN (
    SELECT project_id FROM public.project_members WHERE user_id = auth.uid()
  )
);
CREATE POLICY "Project owners can manage members" ON public.project_members FOR ALL USING (
  project_id IN (
    SELECT id FROM public.projects WHERE owner_id = auth.uid()
  )
);
CREATE POLICY "Users can join projects they're invited to" ON public.project_members FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for tickets
CREATE POLICY "Users can view tickets in their projects" ON public.tickets FOR SELECT USING (
  project_id IN (
    SELECT project_id FROM public.project_members WHERE user_id = auth.uid()
  )
);
CREATE POLICY "Project members can create tickets" ON public.tickets FOR INSERT WITH CHECK (
  project_id IN (
    SELECT project_id FROM public.project_members WHERE user_id = auth.uid()
  ) AND auth.uid() = reporter_id
);
CREATE POLICY "Assignees and project owners can update tickets" ON public.tickets FOR UPDATE USING (
  auth.uid() = assignee_id OR 
  project_id IN (
    SELECT id FROM public.projects WHERE owner_id = auth.uid()
  )
);
CREATE POLICY "Project owners can delete tickets" ON public.tickets FOR DELETE USING (
  project_id IN (
    SELECT id FROM public.projects WHERE owner_id = auth.uid()
  )
);

-- Create RLS policies for comments
CREATE POLICY "Users can view comments on tickets they can see" ON public.comments FOR SELECT USING (
  ticket_id IN (
    SELECT id FROM public.tickets WHERE project_id IN (
      SELECT project_id FROM public.project_members WHERE user_id = auth.uid()
    )
  )
);
CREATE POLICY "Project members can create comments" ON public.comments FOR INSERT WITH CHECK (
  ticket_id IN (
    SELECT id FROM public.tickets WHERE project_id IN (
      SELECT project_id FROM public.project_members WHERE user_id = auth.uid()
    )
  ) AND auth.uid() = author_id
);
CREATE POLICY "Comment authors can update their comments" ON public.comments FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Comment authors can delete their comments" ON public.comments FOR DELETE USING (auth.uid() = author_id);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name)
  VALUES (new.id, new.raw_user_meta_data->>'username', new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create storage bucket for attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('attachments', 'attachments', true);

-- Create storage policy for attachments
CREATE POLICY "Authenticated users can upload attachments" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'attachments' AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can view attachments" ON storage.objects FOR SELECT USING (
  bucket_id = 'attachments'
);

-- Enable realtime for real-time updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_members;
