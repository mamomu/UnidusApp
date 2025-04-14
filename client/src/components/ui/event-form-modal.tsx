import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Event } from "@/lib/types";
import { MapPin, Users, Plus } from "lucide-react";

// Define validation schema
const eventSchema = z.object({
  title: z.string().min(1, "Title is required"),
  date: z.string().min(1, "Date is required"),
  period: z.enum(["morning", "afternoon", "night"]),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().optional(),
  location: z.string().optional(),
  emoji: z.string().optional(),
  privacy: z.enum(["private", "partner", "public"]),
  recurrence: z.enum(["none", "daily", "weekly", "monthly", "custom"]),
  recurrenceEndDate: z.string().optional(),
  isSpecial: z.boolean().default(false),
});

type EventFormValues = z.infer<typeof eventSchema>;

interface EventFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editEvent?: Event;
}

export default function EventFormModal({ isOpen, onClose, editEvent }: EventFormModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedEmoji, setSelectedEmoji] = useState(editEvent?.emoji || "📅");

  // Common emojis for events
  const commonEmojis = ["📅", "🎯", "🎉", "👥", "🍽️", "💼", "💬", "🛒", "🏋️", "📚", "🎮", "🧘"];

  // Form setup
  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: editEvent ? {
      title: editEvent.title,
      date: editEvent.date,
      period: editEvent.period as "morning" | "afternoon" | "night",
      startTime: editEvent.startTime,
      endTime: editEvent.endTime || "",
      location: editEvent.location || "",
      emoji: editEvent.emoji || "📅",
      privacy: editEvent.privacy as "private" | "partner" | "public",
      recurrence: editEvent.recurrence as "none" | "daily" | "weekly" | "monthly" | "custom",
      recurrenceEndDate: editEvent.recurrenceEndDate || "",
      isSpecial: editEvent.isSpecial || false,
    } : {
      title: "",
      date: new Date().toISOString().split('T')[0],
      period: "morning",
      startTime: "09:00",
      endTime: "10:00",
      location: "",
      emoji: "📅",
      privacy: "private",
      recurrence: "none",
      recurrenceEndDate: "",
      isSpecial: false,
    }
  });

  // Fetch partners for sharing
  const { data: partners } = useQuery({
    queryKey: ['/api/partners'],
    queryFn: async () => {
      const res = await fetch('/api/partners', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch partners');
      return res.json();
    },
    enabled: isOpen, // Only fetch when modal is open
  });

  // Create event mutation
  const createEventMutation = useMutation({
    mutationFn: async (data: EventFormValues) => {
      const res = await apiRequest("POST", "/api/events", {
        ...data,
        emoji: selectedEmoji,
        ownerId: user?.id,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      toast({
        title: "Event created",
        description: "Your event has been created successfully.",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error creating event",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update event mutation
  const updateEventMutation = useMutation({
    mutationFn: async (data: EventFormValues) => {
      if (!editEvent) throw new Error("No event to update");
      const res = await apiRequest("PUT", `/api/events/${editEvent.id}`, {
        ...data,
        emoji: selectedEmoji,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      toast({
        title: "Event updated",
        description: "Your event has been updated successfully.",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error updating event",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: EventFormValues) => {
    // Ensure date is in YYYY-MM-DD format
    const formattedValues = {
      ...values,
      date: new Date(values.date).toISOString().split('T')[0]
    };
    
    if (editEvent) {
      updateEventMutation.mutate(formattedValues);
    } else {
      createEventMutation.mutate(formattedValues);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>
            {editEvent ? "Edit Event" : "Create Event"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event name</FormLabel>
                  <FormControl>
                    <Input placeholder="Add title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="period"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time period</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select period" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="morning">Morning (6:00 - 12:00)</SelectItem>
                        <SelectItem value="afternoon">Afternoon (12:00 - 18:00)</SelectItem>
                        <SelectItem value="night">Night (18:00 - 00:00)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
                      <Input placeholder="Add location" className="pl-9" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="recurrence"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recurrence</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select recurrence" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Does not repeat</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="custom">Custom...</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div>
              <FormLabel>Emoji</FormLabel>
              <div className="grid grid-cols-6 gap-2 mt-1">
                {commonEmojis.map((emoji) => (
                  <Button
                    key={emoji}
                    type="button"
                    variant="outline"
                    className={`p-2 text-xl ${selectedEmoji === emoji ? 'border-primary bg-primary/10' : ''}`}
                    onClick={() => setSelectedEmoji(emoji)}
                  >
                    {emoji}
                  </Button>
                ))}
              </div>
            </div>
            
            <FormField
              control={form.control}
              name="privacy"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Privacy</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex space-x-3"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="private" id="private" />
                        <label htmlFor="private" className="text-sm text-neutral-700 cursor-pointer">
                          Private
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="partner" id="partner" />
                        <label htmlFor="partner" className="text-sm text-neutral-700 cursor-pointer">
                          With partner
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="public" id="public" />
                        <label htmlFor="public" className="text-sm text-neutral-700 cursor-pointer">
                          Public
                        </label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {(field => field.value === "partner" || field.value === "public")(form.watch("privacy")) && (
              <div className="border-t border-neutral-200 pt-4">
                <FormLabel className="block mb-3">Share with</FormLabel>
                
                {partners && partners.length > 0 ? (
                  partners.map((partner: any) => (
                    <div key={partner.id} className="flex items-center justify-between p-2 bg-neutral-50 rounded-lg mb-2">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-secondary text-white flex items-center justify-center">
                          <span className="text-sm">{partner.partner.fullName.substring(0, 2)}</span>
                        </div>
                        <span className="ml-3 font-medium">{partner.partner.fullName}</span>
                        <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">Partner</span>
                      </div>
                      
                      <Select defaultValue="view">
                        <SelectTrigger className="text-sm border border-neutral-200 rounded p-1 h-auto min-h-0 w-28">
                          <SelectValue placeholder="Permission" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="view">Can view</SelectItem>
                          <SelectItem value="edit">Can edit</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ))
                ) : (
                  <div className="text-neutral-500 text-sm mb-2">No partners to share with</div>
                )}
                
                <Button 
                  type="button" 
                  variant="link" 
                  className="flex items-center text-primary p-0 h-auto text-sm"
                >
                  <Plus className="mr-1" size={16} /> Add people
                </Button>
              </div>
            )}

            <DialogFooter className="flex justify-between gap-2 pt-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createEventMutation.isPending || updateEventMutation.isPending}
              >
                {createEventMutation.isPending || updateEventMutation.isPending ? 
                  'Saving...' : editEvent ? 'Update' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
