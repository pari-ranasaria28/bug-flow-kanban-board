
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
  const [isCreateTicketOpen, setIsCreateTicketOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (projectId) {
      fetchProject();
    }
  }, [user, projectId]);

  const fetchProject = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (error) throw error;
      setProject(data);
    } catch (error) {
      console.error('Error fetching project:', error);
      toast({
        title: "Error",
        description: "Failed to fetch project details",
        variant: "destructive"
      });
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleTicketCreated = () => {
    setRefreshTrigger(prev => prev + 1);
    setIsCreateTicketOpen(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
            <Button onClick={() => setIsCreateTicketOpen(true)}>
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

      <CreateTicketDialog
        projectId={projectId!}
        isOpen={isCreateTicketOpen}
        onClose={() => setIsCreateTicketOpen(false)}
        onTicketCreated={handleTicketCreated}
      />
    </div>
  );
};

export default Project;
