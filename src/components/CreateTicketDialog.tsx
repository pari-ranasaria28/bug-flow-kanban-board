
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface CreateTicketDialogProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  onTicketCreated: () => void;
}

interface ProjectMember {
  user_id: string;
  profiles: {
    full_name: string;
    username: string;
  };
}

const CreateTicketDialog: React.FC<CreateTicketDialogProps> = ({
  projectId,
  isOpen,
  onClose,
  onTicketCreated
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);
  const [ticketData, setTicketData] = useState({
    title: '',
    description: '',
    type: 'task',
    priority: 'medium',
    assignee_id: ''
  });

  useEffect(() => {
    if (isOpen) {
      fetchProjectMembers();
      // Reset form when dialog opens
      setTicketData({
        title: '',
        description: '',
        type: 'task',
        priority: 'medium',
        assignee_id: ''
      });
    }
  }, [isOpen, projectId]);

  const fetchProjectMembers = async () => {
    try {
      // const { data, error } = await supabase
      //   .from('project_members')
      //   .select(`
      //     user_id,
      //     profiles!fk_project_members_user_id(full_name, username)
      //   `)
      //   .eq('project_id', projectId);
      const { data, error } = await supabase
        .from('project_members')
        .select(`
          user_id,
          profiles(full_name, username)
        `)
        .eq('project_id', projectId);


      if (error) throw error;
      setProjectMembers(data || []);
    } catch (error) {
      console.error('Error fetching project members:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create a ticket",
        variant: "destructive"
      });
      return;
    }

    if (!ticketData.title.trim()) {
      toast({
        title: "Error",
        description: "Please enter a ticket title",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      console.log('Creating ticket with data:', {
        ...ticketData,
        project_id: projectId,
        reporter_id: user.id,
        assignee_id: ticketData.assignee_id === 'unassigned' ? null : ticketData.assignee_id,
      });

      const { error } = await supabase
        .from('tickets')
        .insert({
          title: ticketData.title,
          description: ticketData.description,
          type: ticketData.type as 'bug' | 'feature' | 'task',
          priority: ticketData.priority as 'low' | 'medium' | 'high' | 'critical',
          status: 'todo',
          project_id: projectId,
          reporter_id: user.id,
          assignee_id: ticketData.assignee_id === 'unassigned' ? null : ticketData.assignee_id,

        });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      toast({
        title: "Success",
        description: "Ticket created successfully!"
      });

      onTicketCreated();
      onClose();
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast({
        title: "Error",
        description: "Failed to create ticket. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setTicketData({
      title: '',
      description: '',
      type: 'task',
      priority: 'medium',
      assignee_id: ''
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) handleClose();
      }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Ticket</DialogTitle>
          <DialogDescription>
            Create a new ticket to track bugs, features, or tasks.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="Enter ticket title"
              value={ticketData.title}
              onChange={(e) => setTicketData(prev => ({ ...prev, title: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe the issue or feature"
              value={ticketData.description}
              onChange={(e) => setTicketData(prev => ({ ...prev, description: e.target.value }))}
              rows={4}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={ticketData.type}
                onValueChange={(value) => setTicketData(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bug">Bug</SelectItem>
                  <SelectItem value="feature">Feature</SelectItem>
                  <SelectItem value="task">Task</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                value={ticketData.priority}
                onValueChange={(value) => setTicketData(prev => ({ ...prev, priority: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Assignee</Label>
              <Select
                value={ticketData.assignee_id}
                onValueChange={(value) => setTicketData(prev => ({ ...prev, assignee_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select assignee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {projectMembers.map((member) => (
                    <SelectItem key={member.user_id} value={member.user_id}>
                      {member.profiles?.full_name || member.profiles?.username || 'Unknown User'}

                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Ticket'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTicketDialog;
