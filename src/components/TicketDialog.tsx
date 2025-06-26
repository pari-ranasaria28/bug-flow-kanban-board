
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Bug, Lightbulb, CheckSquare, MessageSquare, Send, Edit2, Save, X } from 'lucide-react';

interface Ticket {
  id: string;
  title: string;
  description: string;
  type: 'bug' | 'feature' | 'task';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'todo' | 'in_progress' | 'done';
  assignee_id: string | null;
  created_at: string;
  assignee?: {
    full_name: string;
    username: string;
  };
  reporter?: {
    full_name: string;
    username: string;
  };
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  author_id: string;
  profiles: {
    full_name: string;
    username: string;
  };
}

interface ProjectMember {
  user_id: string;
  profiles: {
    full_name: string;
    username: string;
  };
}

interface TicketDialogProps {
  ticket: Ticket;
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

const typeIcons = {
  bug: Bug,
  feature: Lightbulb,
  task: CheckSquare
};

const TicketDialog: React.FC<TicketDialogProps> = ({
  ticket,
  projectId,
  isOpen,
  onClose,
  onUpdate
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);
  const [editedTicket, setEditedTicket] = useState({
    title: ticket.title,
    description: ticket.description,
    type: ticket.type,
    priority: ticket.priority,
    status: ticket.status,
    assignee_id: ticket.assignee_id || ''
  });

  const TypeIcon = typeIcons[ticket.type];

  useEffect(() => {
    if (isOpen) {
      fetchComments();
      fetchProjectMembers();
    }
  }, [isOpen, ticket.id]);

  useEffect(() => {
    setEditedTicket({
      title: ticket.title,
      description: ticket.description,
      type: ticket.type,
      priority: ticket.priority,
      status: ticket.status,
      assignee_id: ticket.assignee_id || ''
    });
  }, [ticket]);

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          profiles!fk_comments_author_id(full_name, username)
        `)
        .eq('ticket_id', ticket.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const fetchProjectMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('project_members')
        .select(`
          user_id,
          profiles!fk_project_members_user_id(full_name, username)
        `)
        .eq('project_id', projectId);

      if (error) throw error;
      setProjectMembers(data || []);
    } catch (error) {
      console.error('Error fetching project members:', error);
    }
  };

  const handleUpdateTicket = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('tickets')
        .update({
          title: editedTicket.title,
          description: editedTicket.description,
          type: editedTicket.type,
          priority: editedTicket.priority,
          status: editedTicket.status,
          assignee_id: editedTicket.assignee_id || null
        })
        .eq('id', ticket.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Ticket updated successfully!"
      });

      setIsEditing(false);
      onUpdate();
    } catch (error) {
      console.error('Error updating ticket:', error);
      toast({
        title: "Error",
        description: "Failed to update ticket",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;

    try {
      const { error } = await supabase
        .from('comments')
        .insert([
          {
            content: newComment,
            ticket_id: ticket.id,
            author_id: user.id
          }
        ]);

      if (error) throw error;

      setNewComment('');
      fetchComments();
      
      toast({
        title: "Success",
        description: "Comment added successfully!"
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <TypeIcon className="h-5 w-5 mr-2" />
              <DialogTitle className="text-lg">
                {isEditing ? (
                  <Input
                    value={editedTicket.title}
                    onChange={(e) => setEditedTicket(prev => ({ ...prev, title: e.target.value }))}
                    className="text-lg font-semibold"
                  />
                ) : (
                  ticket.title
                )}
              </DialogTitle>
            </div>
            <div className="flex items-center space-x-2">
              {isEditing ? (
                <>
                  <Button size="sm" onClick={handleUpdateTicket} disabled={loading}>
                    <Save className="h-4 w-4 mr-1" />
                    Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                </>
              ) : (
                <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                  <Edit2 className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <div>
              <Label className="text-sm font-medium">Description</Label>
              {isEditing ? (
                <Textarea
                  value={editedTicket.description}
                  onChange={(e) => setEditedTicket(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  className="mt-1"
                />
              ) : (
                <p className="mt-1 text-sm text-gray-600">
                  {ticket.description || 'No description provided'}
                </p>
              )}
            </div>

            {/* Comments */}
            <div>
              <h3 className="text-sm font-medium mb-3 flex items-center">
                <MessageSquare className="h-4 w-4 mr-2" />
                Comments ({comments.length})
              </h3>
              
              <div className="space-y-3 mb-4">
                {comments.map((comment) => (
                  <Card key={comment.id}>
                    <CardContent className="p-3">
                      <div className="flex items-start space-x-3">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">
                            {comment.profiles.full_name?.charAt(0) || comment.profiles.username?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-xs font-medium">
                              {comment.profiles.full_name || comment.profiles.username}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(comment.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700">{comment.content}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Add Comment */}
              <form onSubmit={handleAddComment} className="flex space-x-2">
                <Input
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" size="sm">
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Status */}
            <div>
              <Label className="text-sm font-medium">Status</Label>
              {isEditing ? (
                <Select
                  value={editedTicket.status}
                  onValueChange={(value) => setEditedTicket(prev => ({ ...prev, status: value as any }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Badge variant="secondary" className="mt-1">
                  {ticket.status.replace('_', ' ')}
                </Badge>
              )}
            </div>

            {/* Priority */}
            <div>
              <Label className="text-sm font-medium">Priority</Label>
              {isEditing ? (
                <Select
                  value={editedTicket.priority}
                  onValueChange={(value) => setEditedTicket(prev => ({ ...prev, priority: value as any }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Badge variant="secondary" className="mt-1">
                  {ticket.priority}
                </Badge>
              )}
            </div>

            {/* Type */}
            <div>
              <Label className="text-sm font-medium">Type</Label>
              {isEditing ? (
                <Select
                  value={editedTicket.type}
                  onValueChange={(value) => setEditedTicket(prev => ({ ...prev, type: value as any }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bug">Bug</SelectItem>
                    <SelectItem value="feature">Feature</SelectItem>
                    <SelectItem value="task">Task</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Badge variant="outline" className="mt-1">
                  {ticket.type}
                </Badge>
              )}
            </div>

            {/* Assignee */}
            <div>
              <Label className="text-sm font-medium">Assignee</Label>
              {isEditing ? (
                <Select
                  value={editedTicket.assignee_id}
                  onValueChange={(value) => setEditedTicket(prev => ({ ...prev, assignee_id: value }))}
                >
                  <SelectTrigger className="mt-1">
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
              ) : (
                <div className="mt-1">
                  {ticket.assignee ? (
                    <div className="flex items-center">
                      <Avatar className="h-6 w-6 mr-2">
                        <AvatarFallback className="text-xs">
                          {ticket.assignee.full_name?.charAt(0) || ticket.assignee.username?.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">
                        {ticket.assignee.full_name || ticket.assignee.username}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500">Unassigned</span>
                  )}
                </div>
              )}
            </div>

            {/* Reporter */}
            <div>
              <Label className="text-sm font-medium">Reporter</Label>
              <div className="mt-1">
                {ticket.reporter ? (
                  <div className="flex items-center">
                    <Avatar className="h-6 w-6 mr-2">
                      <AvatarFallback className="text-xs">
                        {ticket.reporter.full_name?.charAt(0) || ticket.reporter.username?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">
                      {ticket.reporter.full_name || ticket.reporter.username}
                    </span>
                  </div>
                ) : (
                  <span className="text-sm text-gray-500">Unknown</span>
                )}
              </div>
            </div>

            {/* Created */}
            <div>
              <Label className="text-sm font-medium">Created</Label>
              <p className="text-sm text-gray-600 mt-1">
                {new Date(ticket.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TicketDialog;
