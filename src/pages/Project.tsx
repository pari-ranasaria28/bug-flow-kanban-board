
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Plus } from 'lucide-react';
import KanbanBoard from '@/components/KanbanBoard';
import TicketList from '@/components/TicketList';
import CreateTicketDialog from '@/components/CreateTicketDialog';
import ProjectSettings from '@/components/ProjectSettings';
import { useToast } from '@/hooks/use-toast';

interface ProjectData {
  id: string;
  name: string;
  description: string;
  owner_id: string;
}

const Project = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [project, setProject] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateTicketOpen, setIsCreateTicketOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    if (!user) {
      console.log('No user found, redirecting to auth');
      navigate('/auth');
      return;
    }
    if (projectId) {
      fetchProject();
    } else {
      setError('No project ID provided');
      setLoading(false);
    }
  }, [user, projectId, navigate]);

  const fetchProject = async () => {
    console.log('Fetching project:', projectId);
    setLoading(true);
    setError(null);
    
    try {
      // First check if user has access to this project
      const { data: projectIds, error: accessError } = await supabase
        .rpc('get_user_project_ids');

      if (accessError) {
        console.error('Error checking project access:', accessError);
        throw new Error('Failed to verify project access');
      }

      const hasAccess = projectIds?.some((p: any) => p.project_id === projectId);
      if (!hasAccess) {
        console.log('User does not have access to this project');
        setError('You do not have access to this project');
        setLoading(false);
        return;
      }

      // Fetch project details
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (error) {
        console.error('Error fetching project:', error);
        throw error;
      }

      console.log('Project fetched successfully:', data);
      setProject(data);
    } catch (error) {
      console.error('Error in fetchProject:', error);
      setError('Failed to load project');
      toast({
        title: "Error",
        description: "Failed to fetch project details",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTicketCreated = () => {
    console.log('Ticket created, refreshing data');
    setRefreshTrigger(prev => prev + 1);
    setIsCreateTicketOpen(false);
  };

  const handleCreateTicketClick = () => {
    console.log('Create ticket button clicked');
    setIsCreateTicketOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Project not found</h2>
          <Button onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="mr-2">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{project.name}</h1>
                <p className="text-sm text-gray-600">{project.description}</p>
              </div>
            </div>
            <Button onClick={handleCreateTicketClick}>
              <Plus className="h-4 w-4 mr-2" />
              New Ticket
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs defaultValue="kanban" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="kanban">Kanban Board</TabsTrigger>
            <TabsTrigger value="list">Ticket List</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="kanban">
            <KanbanBoard projectId={projectId!} refreshTrigger={refreshTrigger} />
          </TabsContent>
          
          <TabsContent value="list">
            <TicketList projectId={projectId!} refreshTrigger={refreshTrigger} />
          </TabsContent>
          
          <TabsContent value="settings">
            <ProjectSettings project={project} />
          </TabsContent>
        </Tabs>
      </main>

      {projectId && (
        <CreateTicketDialog
          projectId={projectId}
          isOpen={isCreateTicketOpen}
          onClose={() => setIsCreateTicketOpen(false)}
          onTicketCreated={handleTicketCreated}
        />
      )}
    </div>
  );
};

export default Project;
