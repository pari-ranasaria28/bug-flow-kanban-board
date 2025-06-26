
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Settings, Users, UserPlus, Trash2, Crown } from 'lucide-react';

interface ProjectData {
  id: string;
  name: string;
  description: string;
  owner_id: string;
}

interface ProjectMember {
  id: string;
  user_id: string;
  role: string;
  joined_at: string;
  profiles: {
    full_name: string;
    username: string;
  };
}

interface ProjectSettingsProps {
  project: ProjectData;
}

const ProjectSettings: React.FC<ProjectSettingsProps> = ({ project }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('developer');
  const [projectData, setProjectData] = useState({
    name: project.name,
    description: project.description
  });

  const isOwner = user?.id === project.owner_id;

  useEffect(() => {
    fetchMembers();
  }, [project.id]);

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('project_members')
        .select(`
          *,
          profiles!fk_project_members_user_id(full_name, username)
        `)
        .eq('project_id', project.id);

      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error('Error fetching members:', error);
      toast({
        title: "Error",
        description: "Failed to fetch project members",
        variant: "destructive"
      });
    }
  };

  const updateProject = async () => {
    if (!isOwner) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('projects')
        .update({
          name: projectData.name,
          description: projectData.description
        })
        .eq('id', project.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Project updated successfully!"
      });
    } catch (error) {
      console.error('Error updating project:', error);
      toast({
        title: "Error",
        description: "Failed to update project",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const inviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwner || !inviteEmail) return;

    try {
      // First, find the user by email
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', inviteEmail)
        .single();

      if (userError) {
        toast({
          title: "Error",
          description: "User not found with that email/username",
          variant: "destructive"
        });
        return;
      }

      // Check if user is already a member
      const { data: existingMember } = await supabase
        .from('project_members')
        .select('id')
        .eq('project_id', project.id)
        .eq('user_id', userData.id)
        .single();

      if (existingMember) {
        toast({
          title: "Error",
          description: "User is already a member of this project",
          variant: "destructive"
        });
        return;
      }

      // Add the member
      const { error } = await supabase
        .from('project_members')
        .insert({
          project_id: project.id,
          user_id: userData.id,
          role: inviteRole as 'admin' | 'developer' | 'viewer',
          invited_by: user?.id
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Member invited successfully!"
      });

      setInviteEmail('');
      setInviteRole('developer');
      setIsInviteDialogOpen(false);
      fetchMembers();
    } catch (error) {
      console.error('Error inviting member:', error);
      toast({
        title: "Error",
        description: "Failed to invite member",
        variant: "destructive"
      });
    }
  };

  const removeMember = async (memberId: string) => {
    if (!isOwner) return;

    try {
      const { error } = await supabase
        .from('project_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Member removed successfully!"
      });

      fetchMembers();
    } catch (error) {
      console.error('Error removing member:', error);
      toast({
        title: "Error",
        description: "Failed to remove member",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Project Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            Project Details
          </CardTitle>
          <CardDescription>
            Manage your project information and settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="project-name">Project Name</Label>
            <Input
              id="project-name"
              value={projectData.name}
              onChange={(e) => setProjectData(prev => ({ ...prev, name: e.target.value }))}
              disabled={!isOwner}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="project-description">Description</Label>
            <Textarea
              id="project-description"
              value={projectData.description}
              onChange={(e) => setProjectData(prev => ({ ...prev, description: e.target.value }))}
              disabled={!isOwner}
            />
          </div>
          {isOwner && (
            <Button onClick={updateProject} disabled={loading}>
              {loading ? 'Updating...' : 'Update Project'}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Project Members */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Project Members ({members.length})
              </CardTitle>
              <CardDescription>
                Manage who has access to this project
              </CardDescription>
            </div>
            {isOwner && (
              <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Invite Member
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Invite Team Member</DialogTitle>
                    <DialogDescription>
                      Add a new member to your project by their username.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={inviteMember} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="invite-email">Username</Label>
                      <Input
                        id="invite-email"
                        placeholder="Enter username"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Role</Label>
                      <Select value={inviteRole} onValueChange={setInviteRole}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="viewer">Viewer</SelectItem>
                          <SelectItem value="developer">Developer</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button type="submit" className="w-full">
                      Send Invitation
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {members.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {member.profiles.full_name?.charAt(0) || member.profiles.username?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">
                      {member.profiles?.full_name || member.profiles?.username || 'Unknown User'}

                      {member.user_id === project.owner_id && (
                        <Crown className="h-4 w-4 inline-block ml-2 text-yellow-500" />
                      )}
                    </p>
                    <p className="text-xs text-gray-600">
                      Joined {new Date(member.joined_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary">{member.role}</Badge>
                  {isOwner && member.user_id !== project.owner_id && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeMember(member.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectSettings;
