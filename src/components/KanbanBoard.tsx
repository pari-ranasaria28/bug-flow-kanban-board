
import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Bug, Lightbulb, CheckSquare, AlertCircle, Circle, Clock } from 'lucide-react';

interface Ticket {
  id: string;
  title: string;
  description: string;
  type: 'bug' | 'feature' | 'task';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'todo' | 'in_progress' | 'done';
  assignee_id: string | null;
  assignee?: {
    full_name: string;
    username: string;
  };
}

interface KanbanBoardProps {
  projectId: string;
  refreshTrigger: number;
}

const statusColumns = {
  todo: { title: 'To Do', color: 'bg-gray-100' },
  in_progress: { title: 'In Progress', color: 'bg-blue-100' },
  done: { title: 'Done', color: 'bg-green-100' }
};

const typeIcons = {
  bug: Bug,
  feature: Lightbulb,
  task: CheckSquare
};

const priorityColors = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800'
};

const priorityIcons = {
  low: Circle,
  medium: Circle,
  high: AlertCircle,
  critical: AlertCircle
};

const KanbanBoard: React.FC<KanbanBoardProps> = ({ projectId, refreshTrigger }) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchTickets();
  }, [projectId, refreshTrigger]);

  const fetchTickets = async () => {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select(`
          *,
          assignee:profiles!fk_tickets_assignee_id(full_name, username)
        `)
        .eq('project_id', projectId);

      if (error) throw error;
      setTickets(data || []);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      toast({
        title: "Error",
        description: "Failed to fetch tickets",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const newStatus = destination.droppableId as 'todo' | 'in_progress' | 'done';

    try {
      const { error } = await supabase
        .from('tickets')
        .update({ status: newStatus })
        .eq('id', draggableId);

      if (error) throw error;

      // Update local state
      setTickets(prev => prev.map(ticket => 
        ticket.id === draggableId 
          ? { ...ticket, status: newStatus }
          : ticket
      ));

      toast({
        title: "Success",
        description: "Ticket status updated successfully"
      });
    } catch (error) {
      console.error('Error updating ticket:', error);
      toast({
        title: "Error",
        description: "Failed to update ticket status",
        variant: "destructive"
      });
    }
  };

  const getTicketsByStatus = (status: string) => {
    return tickets.filter(ticket => ticket.status === status);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.entries(statusColumns).map(([status, config]) => (
          <div key={status} className={`rounded-lg p-4 ${config.color}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">{config.title}</h3>
              <Badge variant="secondary">{getTicketsByStatus(status).length}</Badge>
            </div>
            
            <Droppable droppableId={status}>
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-3 min-h-[200px]"
                >
                  {getTicketsByStatus(status).map((ticket, index) => {
                    const TypeIcon = typeIcons[ticket.type];
                    const PriorityIcon = priorityIcons[ticket.priority];
                    
                    return (
                      <Draggable key={ticket.id} draggableId={ticket.id} index={index}>
                        {(provided, snapshot) => (
                          <Card
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`cursor-grab active:cursor-grabbing ${
                              snapshot.isDragging ? 'shadow-lg' : ''
                            }`}
                          >
                            <CardHeader className="pb-2">
                              <div className="flex items-start justify-between">
                                <CardTitle className="text-sm font-medium line-clamp-2">
                                  {ticket.title}
                                </CardTitle>
                                <TypeIcon className="h-4 w-4 text-gray-500 flex-shrink-0 ml-2" />
                              </div>
                            </CardHeader>
                            <CardContent className="pt-0">
                              {ticket.description && (
                                <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                                  {ticket.description}
                                </p>
                              )}
                              <div className="flex items-center justify-between">
                                <Badge 
                                  variant="secondary" 
                                  className={`text-xs ${priorityColors[ticket.priority]}`}
                                >
                                  <PriorityIcon className="h-3 w-3 mr-1" />
                                  {ticket.priority}
                                </Badge>
                                {ticket.assignee && (
                                  <Avatar className="h-6 w-6">
                                    <AvatarFallback className="text-xs">
                                      {ticket.assignee.full_name?.charAt(0) || ticket.assignee.username?.charAt(0) || '?'}
                                    </AvatarFallback>
                                  </Avatar>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
};

export default KanbanBoard;
