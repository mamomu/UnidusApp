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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle, Link as LinkIcon, QrCode } from "lucide-react";

// Define validation schema
const inviteSchema = z.object({
  partnerEmail: z.string().email("Must be a valid email address"),
  shareAll: z.boolean().default(true),
  shareRaftOnly: z.boolean().default(false),
});

type InviteValues = z.infer<typeof inviteSchema>;

interface InvitePartnerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function InvitePartnerModal({ isOpen, onClose }: InvitePartnerModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [inviteMethod, setInviteMethod] = useState<'email' | 'sms' | 'link' | 'qrcode'>('email');

  // Form setup
  const form = useForm<InviteValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      partnerEmail: "",
      shareAll: true,
      shareRaftOnly: false,
    }
  });

  // Invite partner mutation
  const invitePartnerMutation = useMutation({
    mutationFn: async (data: InviteValues) => {
      const res = await apiRequest("POST", "/api/partners/invite", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/partners'] });
      toast({
        title: "Invitation sent",
        description: "Your partner invitation has been sent successfully.",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error sending invitation",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: InviteValues) => {
    invitePartnerMutation.mutate(values);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Invite Partner</DialogTitle>
        </DialogHeader>

        <p className="text-neutral-600 mb-6">Share your calendar with a partner to collaborate on events and tasks.</p>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {inviteMethod === 'email' && (
              <FormField
                control={form.control}
                name="partnerEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter email address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <FormLabel>Or share via</FormLabel>
            <div className="grid grid-cols-3 gap-3">
              <Button
                type="button"
                variant={inviteMethod === 'sms' ? 'default' : 'outline'}
                className="p-2 flex flex-col items-center h-auto"
                onClick={() => setInviteMethod('sms')}
              >
                <MessageCircle className="text-xl mb-1" size={24} />
                <span className="text-xs">SMS</span>
              </Button>
              <Button
                type="button"
                variant={inviteMethod === 'link' ? 'default' : 'outline'}
                className="p-2 flex flex-col items-center h-auto"
                onClick={() => setInviteMethod('link')}
              >
                <LinkIcon className="text-xl mb-1" size={24} />
                <span className="text-xs">Link</span>
              </Button>
              <Button
                type="button"
                variant={inviteMethod === 'qrcode' ? 'default' : 'outline'}
                className="p-2 flex flex-col items-center h-auto"
                onClick={() => setInviteMethod('qrcode')}
              >
                <QrCode className="text-xl mb-1" size={24} />
                <span className="text-xs">QR Code</span>
              </Button>
            </div>
            
            {inviteMethod === 'sms' && (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input placeholder="Enter phone number" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
            
            {inviteMethod === 'link' && (
              <FormItem>
                <FormLabel>Invitation Link</FormLabel>
                <div className="flex">
                  <Input 
                    value="https://raft-calendar.app/invite/abc123" 
                    readOnly 
                    className="rounded-r-none"
                  />
                  <Button className="rounded-l-none">Copy</Button>
                </div>
              </FormItem>
            )}
            
            {inviteMethod === 'qrcode' && (
              <div className="flex justify-center p-4">
                <div className="w-40 h-40 border-2 border-dashed border-neutral-300 rounded-lg flex items-center justify-center text-neutral-400">
                  QR Code Placeholder
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <FormLabel>Permission level</FormLabel>
              
              <RadioGroup 
                defaultValue="all" 
                className="space-y-2"
                onValueChange={(value) => {
                  form.setValue('shareAll', value === 'all');
                  form.setValue('shareRaftOnly', value === 'raft');
                }}
              >
                <div className="flex items-center p-2 border rounded-lg hover:bg-neutral-50 cursor-pointer">
                  <RadioGroupItem value="all" id="all" className="mr-3" />
                  <div>
                    <label htmlFor="all" className="block font-medium text-sm">All events</label>
                    <span className="text-xs text-neutral-500">Partner can see all your calendar events</span>
                  </div>
                </div>
                
                <div className="flex items-center p-2 border rounded-lg hover:bg-neutral-50 cursor-pointer">
                  <RadioGroupItem value="raft" id="raft" className="mr-3" />
                  <div>
                    <label htmlFor="raft" className="block font-medium text-sm">Only Raft events</label>
                    <span className="text-xs text-neutral-500">Only events created in Raft will be shared</span>
                  </div>
                </div>
                
                <div className="flex items-center p-2 border rounded-lg hover:bg-neutral-50 cursor-pointer">
                  <RadioGroupItem value="selected" id="selected" className="mr-3" />
                  <div>
                    <label htmlFor="selected" className="block font-medium text-sm">Selected calendars</label>
                    <span className="text-xs text-neutral-500">Choose specific calendars to share</span>
                  </div>
                </div>
              </RadioGroup>
            </div>
            
            <DialogFooter className="mt-6">
              <Button 
                type="submit" 
                disabled={invitePartnerMutation.isPending || (inviteMethod === 'email' && !form.watch('partnerEmail'))}
              >
                {invitePartnerMutation.isPending ? 'Sending...' : 'Send Invitation'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
