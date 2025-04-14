import { useState } from "react";
import { 
  Dialog, 
  DialogContent 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function OnboardingModal({ isOpen, onClose }: OnboardingModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const totalSteps = 3;

  // Mock function for connecting to external calendars
  // In a real implementation, this would make API calls to Google/Apple OAuth endpoints
  const connectCalendarMutation = useMutation({
    mutationFn: async (provider: string) => {
      // This would typically redirect to OAuth flow
      const mockData = {
        userId: user?.id,
        provider,
        externalId: `${provider}_${Date.now()}`,
        name: `${provider} Calendar`,
        color: provider === 'google' ? '#4285F4' : '#000000',
        syncEnabled: true
      };
      
      const res = await apiRequest("POST", "/api/external-calendars", mockData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/external-calendars'] });
      toast({
        title: "Calendar connected",
        description: "Your calendar has been connected successfully.",
      });
      
      // Move to next step after connecting calendar
      if (step < totalSteps) {
        setStep(step + 1);
      }
    },
    onError: (error) => {
      toast({
        title: "Error connecting calendar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      onClose();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0">
        {/* Progress indicator */}
        <div className="flex border-b">
          {Array.from({ length: totalSteps }).map((_, index) => (
            <div 
              key={index}
              className={`flex-1 border-b-2 ${index + 1 <= step ? 'border-primary' : 'border-neutral-200'} py-3`}
            ></div>
          ))}
        </div>
        
        <div className="p-6">
          {step === 1 && (
            <>
              <h2 className="text-xl font-heading font-bold mb-4 text-center">Welcome to Raft!</h2>
              <p className="text-neutral-600 mb-6 text-center">Let's connect your calendars to get started.</p>
              
              <div className="space-y-4 mb-6">
                <Button 
                  variant="outline" 
                  className="w-full flex items-center justify-between p-3 h-auto"
                  onClick={() => connectCalendarMutation.mutate('google')}
                  disabled={connectCalendarMutation.isPending}
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                      <i className="ri-google-fill text-white"></i>
                    </div>
                    <span className="ml-3 font-medium">Google Calendar</span>
                  </div>
                  <i className="ri-arrow-right-line text-neutral-400"></i>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full flex items-center justify-between p-3 h-auto"
                  onClick={() => connectCalendarMutation.mutate('apple')}
                  disabled={connectCalendarMutation.isPending}
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-blue-400 flex items-center justify-center">
                      <i className="ri-apple-fill text-white"></i>
                    </div>
                    <span className="ml-3 font-medium">Apple Calendar</span>
                  </div>
                  <i className="ri-arrow-right-line text-neutral-400"></i>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full flex items-center justify-between p-3 h-auto"
                  onClick={() => connectCalendarMutation.mutate('microsoft')}
                  disabled={connectCalendarMutation.isPending}
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                      <i className="ri-microsoft-fill text-white"></i>
                    </div>
                    <span className="ml-3 font-medium">Outlook</span>
                  </div>
                  <i className="ri-arrow-right-line text-neutral-400"></i>
                </Button>
              </div>
              
              <Button 
                variant="link" 
                className="w-full text-sm text-neutral-500"
                onClick={handleNext}
              >
                Skip for now
              </Button>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="text-xl font-heading font-bold mb-4 text-center">Invite Your Partner</h2>
              <p className="text-neutral-600 mb-6 text-center">Share your calendar with someone close to collaborate.</p>
              
              <div className="space-y-4 mb-6">
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium mb-2">What can partners do?</h3>
                  <ul className="space-y-2 text-sm text-neutral-600">
                    <li className="flex items-center">
                      <i className="ri-check-line text-green-500 mr-2"></i>
                      See your shared events
                    </li>
                    <li className="flex items-center">
                      <i className="ri-check-line text-green-500 mr-2"></i>
                      Add comments and reactions
                    </li>
                    <li className="flex items-center">
                      <i className="ri-check-line text-green-500 mr-2"></i>
                      Create shared events with you
                    </li>
                  </ul>
                </div>
                
                <div className="flex space-x-3">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={handleNext}
                  >
                    Do this later
                  </Button>
                  <Button className="flex-1" onClick={handleNext}>
                    Invite now
                  </Button>
                </div>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="text-xl font-heading font-bold mb-4 text-center">You're all set!</h2>
              <p className="text-neutral-600 mb-6 text-center">Your calendar is ready to use. Start by creating your first event.</p>
              
              <div className="bg-neutral-50 p-4 rounded-lg mb-6">
                <h3 className="font-medium mb-2">Quick tips:</h3>
                <ul className="space-y-2 text-sm text-neutral-600">
                  <li className="flex items-start">
                    <i className="ri-time-line text-primary mr-2 mt-0.5"></i>
                    <span>Events are organized by time periods: Morning, Afternoon, and Night</span>
                  </li>
                  <li className="flex items-start">
                    <i className="ri-share-line text-primary mr-2 mt-0.5"></i>
                    <span>Set privacy levels for each event you create</span>
                  </li>
                  <li className="flex items-start">
                    <i className="ri-chat-1-line text-primary mr-2 mt-0.5"></i>
                    <span>Comment and react to events for better collaboration</span>
                  </li>
                </ul>
              </div>
              
              <Button 
                className="w-full"
                onClick={handleSkip}
              >
                Get Started
              </Button>
            </>
          )}
        </div>
        
        {step !== 3 && (
          <div className="bg-neutral-50 p-4 rounded-b-xl flex justify-between">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={step === 1}
              className="px-4 py-2 text-neutral-500 hover:text-neutral-700"
            >
              Back
            </Button>
            <Button
              onClick={handleNext}
              className="px-4 py-2"
            >
              Continue
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
