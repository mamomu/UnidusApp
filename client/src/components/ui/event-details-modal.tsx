import { useState } from "react";
import { 
  Dialog, 
  DialogContent 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Event, Comment } from "@/lib/types";
import { 
  Edit, 
  X, 
  Clock, 
  MapPin, 
  Repeat, 
  UserCheck, 
  Heart, 
  MessageSquare 
} from "lucide-react";
import { format } from "date-fns";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import EventFormModal from "./event-form-modal";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";

interface EventDetailsModalProps {
  event: Event;
  isOpen: boolean;
  onClose: () => void;
}

export default function EventDetailsModal({ event, isOpen, onClose }: EventDetailsModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showEditModal, setShowEditModal] = useState(false);
  const [commentText, setCommentText] = useState("");

  // Fetch event participants
  const { data: participants } = useQuery({
    queryKey: ['/api/events', event.id, 'participants'],
    queryFn: async () => {
      const res = await fetch(`/api/events/${event.id}/participants`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch participants');
      return res.json();
    },
    enabled: isOpen,
  });

  // Fetch event comments
  const { data: comments, isLoading: isLoadingComments } = useQuery({
    queryKey: ['/api/events', event.id, 'comments'],
    queryFn: async () => {
      const res = await fetch(`/api/events/${event.id}/comments`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch comments');
      return res.json();
    },
    enabled: isOpen,
  });

  // Fetch event reactions
  const { data: reactions } = useQuery({
    queryKey: ['/api/events', event.id, 'reactions'],
    queryFn: async () => {
      const res = await fetch(`/api/events/${event.id}/reactions`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch reactions');
      return res.json();
    },
    enabled: isOpen,
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiRequest("POST", `/api/events/${event.id}/comments`, { content });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events', event.id, 'comments'] });
      setCommentText("");
    },
    onError: (error) => {
      toast({
        title: "Error adding comment",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Toggle reaction mutation
  const toggleReactionMutation = useMutation({
    mutationFn: async (type: string) => {
      // Check if user already has this reaction
      const existingReaction = reactions?.find(
        (r: any) => r.userId === user?.id && r.type === type
      );
      
      if (existingReaction) {
        // Remove reaction
        await apiRequest("DELETE", `/api/events/${event.id}/reactions`);
      } else {
        // Add reaction
        await apiRequest("POST", `/api/events/${event.id}/reactions`, { type });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events', event.id, 'reactions'] });
    },
    onError: (error) => {
      toast({
        title: "Error toggling reaction",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Group comments by parent
  const organizeComments = (comments: Comment[]) => {
    if (!comments) return { topLevel: [], replies: {} };
    
    const topLevel: Comment[] = [];
    const replies: Record<number, Comment[]> = {};
    
    comments.forEach(comment => {
      if (!comment.parentId) {
        topLevel.push(comment);
      } else {
        if (!replies[comment.parentId]) {
          replies[comment.parentId] = [];
        }
        replies[comment.parentId].push(comment);
      }
    });
    
    return { topLevel, replies };
  };
  
  const { topLevel: topLevelComments, replies } = organizeComments(comments as Comment[] || []);

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (commentText.trim()) {
      addCommentMutation.mutate(commentText);
    }
  };

  const hasLiked = reactions?.some(
    (r: any) => r.userId === user?.id && r.type === "heart"
  );

  // Handle background color based on period
  const getPeriodBgColor = (period: string) => {
    switch (period) {
      case 'morning': return 'bg-yellow-50';
      case 'afternoon': return 'bg-blue-50';
      case 'night': return 'bg-indigo-50';
      default: return 'bg-neutral-50';
    }
  };

  return (
    <>
      <Dialog open={isOpen && !showEditModal} onOpenChange={onClose}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-auto p-0">
          <div className="relative">
            <div className="absolute top-4 right-4 flex space-x-2 z-10">
              {user?.id === event.ownerId && (
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="p-2 bg-white/90 hover:bg-white rounded-full h-auto w-auto"
                  onClick={() => setShowEditModal(true)}
                >
                  <Edit className="text-neutral-700" size={18} />
                </Button>
              )}
              <Button 
                size="icon" 
                variant="ghost" 
                className="p-2 bg-white/90 hover:bg-white rounded-full h-auto w-auto"
                onClick={onClose}
              >
                <X className="text-neutral-700" size={18} />
              </Button>
            </div>
            
            <div className={`${getPeriodBgColor(event.period)} p-6 flex items-start`}>
              <div className="text-4xl mr-4">{event.emoji || '📅'}</div>
              <div className="flex-1">
                <h3 className="text-xl font-medium mb-1">{event.title}</h3>
                <div className="flex items-center text-neutral-600 mb-4">
                  <Clock className="mr-1" size={16} />
                  <span>
                    {format(new Date(event.date), 'EEEE, MMM d')} • {' '}
                    {format(new Date(`2000-01-01T${event.startTime}`), 'h:mm a')}
                    {event.endTime ? ` - ${format(new Date(`2000-01-01T${event.endTime}`), 'h:mm a')}` : ''}
                  </span>
                </div>
                {event.location && (
                  <div className="flex items-center text-neutral-600">
                    <MapPin className="mr-1" size={16} />
                    <span>{event.location}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-4 border-b border-neutral-200">
              <div className="flex items-center">
                {event.recurrence !== 'none' && (
                  <span className="flex items-center mr-6">
                    <Repeat className="mr-1 text-neutral-500" size={16} />
                    <span className="text-sm text-neutral-700 capitalize">{event.recurrence}</span>
                  </span>
                )}
                
                <span className="flex items-center mr-6">
                  <UserCheck className="mr-1 text-neutral-500" size={16} />
                  <span className="text-sm text-neutral-700">
                    {event.privacy === 'private' ? 'Private' : 
                     event.privacy === 'partner' ? 'Shared with partner' : 'Public'}
                  </span>
                </span>
                
                <div className="flex items-center ml-auto">
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`p-1 ${hasLiked ? 'text-pink-500' : 'text-neutral-500 hover:text-neutral-700'}`}
                    onClick={() => toggleReactionMutation.mutate("heart")}
                    disabled={toggleReactionMutation.isPending}
                  >
                    <Heart size={18} fill={hasLiked ? 'currentColor' : 'none'} />
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="p-4 border-b border-neutral-200">
              <h4 className="font-medium mb-3">Participants</h4>
              
              {/* Owner */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Avatar className="w-8 h-8 bg-primary text-white">
                    <AvatarFallback>{event.owner?.fullName?.substring(0, 2) || user?.fullName?.substring(0, 2) || 'U'}</AvatarFallback>
                  </Avatar>
                  <span className="ml-2 font-medium">{event.owner?.fullName || user?.fullName || 'You'}</span>
                  <span className="ml-2 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">Owner</span>
                </div>
              </div>
              
              {/* Participants */}
              {participants && participants.length > 0 && participants.map((participant: any) => (
                <div key={participant.id} className="flex items-center justify-between mt-2">
                  <div className="flex items-center">
                    <Avatar className="w-8 h-8 bg-secondary text-white">
                      <AvatarFallback>{participant.user.fullName.substring(0, 2)}</AvatarFallback>
                    </Avatar>
                    <span className="ml-2 font-medium">{participant.user.fullName}</span>
                    <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">
                      {participant.permission === 'edit' ? 'Can edit' : 'Viewer'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Comments Section */}
            <div className="p-4">
              <h4 className="font-medium mb-3">Comments</h4>
              
              {isLoadingComments ? (
                <div className="py-4 text-center text-neutral-500">Loading comments...</div>
              ) : (
                <div className="space-y-4 mb-4">
                  {topLevelComments.length > 0 ? (
                    topLevelComments.map((comment: Comment) => (
                      <div key={comment.id} className="flex">
                        <Avatar className="w-8 h-8 bg-primary text-white flex-shrink-0">
                          <AvatarFallback>{comment.user?.fullName?.substring(0, 2) || 'U'}</AvatarFallback>
                        </Avatar>
                        <div className="ml-3 bg-neutral-100 p-3 rounded-lg rounded-tl-none flex-1">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-medium">{comment.user?.fullName}</span>
                            <span className="text-xs text-neutral-500">
                              {format(new Date(comment.createdAt), 'h:mm a')}
                            </span>
                          </div>
                          <p className="text-sm text-neutral-700">{comment.content}</p>
                          
                          <div className="flex items-center mt-2 text-xs text-neutral-500">
                            <Button variant="ghost" size="sm" className="p-0 h-auto text-xs text-neutral-500 hover:text-neutral-700">
                              Reply
                            </Button>
                            <span className="mx-2">•</span>
                            <Button variant="ghost" size="sm" className="p-0 h-auto text-xs text-neutral-500 hover:text-neutral-700">
                              React
                            </Button>
                          </div>
                          
                          {/* Replies */}
                          {replies[comment.id] && replies[comment.id].map((reply: Comment) => (
                            <div key={reply.id} className="flex mt-2 pl-2">
                              <Avatar className="w-6 h-6 bg-secondary text-white flex-shrink-0">
                                <AvatarFallback>{reply.user?.fullName?.substring(0, 2) || 'U'}</AvatarFallback>
                              </Avatar>
                              <div className="ml-2 bg-white p-2 rounded-lg rounded-tl-none flex-1">
                                <div className="flex justify-between items-center mb-1">
                                  <span className="font-medium text-xs">{reply.user?.fullName}</span>
                                  <span className="text-xs text-neutral-500">
                                    {format(new Date(reply.createdAt), 'h:mm a')}
                                  </span>
                                </div>
                                <p className="text-xs text-neutral-700">{reply.content}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-neutral-500 py-2">No comments yet</div>
                  )}
                </div>
              )}
              
              <form onSubmit={handleAddComment} className="flex">
                <Avatar className="w-8 h-8 bg-primary text-white flex-shrink-0">
                  <AvatarFallback>{user?.fullName?.substring(0, 2) || 'U'}</AvatarFallback>
                </Avatar>
                <div className="ml-3 flex-1">
                  <div className="border border-neutral-200 rounded-lg overflow-hidden">
                    <Input
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Add a comment..."
                      className="w-full p-3 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                    <div className="flex justify-between items-center p-2 bg-neutral-50 border-t border-neutral-200">
                      <div className="flex items-center space-x-3">
                        <Button type="button" variant="ghost" size="icon" className="p-1.5 h-auto w-auto text-neutral-500">
                          <MessageSquare size={18} />
                        </Button>
                        <Button type="button" variant="ghost" size="icon" className="p-1.5 h-auto w-auto text-neutral-500">
                          <span className="text-xl">😊</span>
                        </Button>
                      </div>
                      <Button 
                        type="submit" 
                        className="px-3 py-1 h-auto text-sm"
                        disabled={!commentText.trim() || addCommentMutation.isPending}
                      >
                        {addCommentMutation.isPending ? 'Sending...' : 'Send'}
                      </Button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {showEditModal && (
        <EventFormModal 
          isOpen={showEditModal} 
          onClose={() => {
            setShowEditModal(false);
            onClose();
          }} 
          editEvent={event}
        />
      )}
    </>
  );
}
