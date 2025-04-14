import { useState, useEffect } from "react";
import { Redirect } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/ui/sidebar";
import MobileNav from "@/components/ui/mobile-nav";
import CalendarView from "@/components/ui/calendar-view";
import { Bell, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { format, addDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import OnboardingModal from "@/components/ui/onboarding-modal";
import EventFormModal from "@/components/ui/event-form-modal";

export default function HomePage() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showAddEvent, setShowAddEvent] = useState(false);
  
  // Fetch user's special events to check for countdowns
  const { data: specialEvents } = useQuery({
    queryKey: ['/api/events', 'special'],
    queryFn: async () => {
      const res = await fetch('/api/events?isSpecial=true', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch special events');
      return res.json();
    },
  });

  // Calculate the next special event for countdown
  const nextSpecialEvent = specialEvents?.length > 0 ? 
    specialEvents.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())[0] : null;

  // Check if user is new (no events yet)
  const { data: userEvents } = useQuery({
    queryKey: ['/api/events', 'count'],
    queryFn: async () => {
      const res = await fetch('/api/events', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch events');
      return res.json();
    },
  });

  // Show onboarding for new users
  useEffect(() => {
    // If user exists and has no events, show onboarding
    if (user && userEvents && userEvents.length === 0) {
      setShowOnboarding(true);
    }
  }, [user, userEvents]);

  const handlePreviousDay = () => {
    setCurrentDate(prev => addDays(prev, -1));
  };

  const handleNextDay = () => {
    setCurrentDate(prev => addDays(prev, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // If user is not logged in, redirect to auth page
  if (!user) {
    return <Redirect to="/auth" />;
  }

  return (
    <div className="flex flex-col md:flex-row h-screen">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header Bar */}
        <header className="bg-white border-b border-neutral-200 py-3 px-4 flex items-center justify-between">
          <div className="md:hidden">
            <h1 className="text-xl font-heading font-bold text-primary flex items-center">
              <i className="ri-calendar-line mr-2"></i> Raft
            </h1>
          </div>
          
          <div className="hidden md:flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <Button 
                variant="ghost" 
                size="icon" 
                className="p-1.5 h-auto w-auto hover:bg-neutral-100 rounded-full"
                onClick={handlePreviousDay}
              >
                <ChevronLeft className="text-xl text-neutral-500" size={20} />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="p-1.5 h-auto w-auto hover:bg-neutral-100 rounded-full"
                onClick={handleNextDay}
              >
                <ChevronRight className="text-xl text-neutral-500" size={20} />
              </Button>
            </div>
            <h2 className="text-lg font-medium text-neutral-900">
              {format(currentDate, 'MMMM yyyy')}
            </h2>
            <Button 
              variant="outline" 
              className="px-3 py-1.5 text-sm text-primary hover:bg-blue-50"
              onClick={handleToday}
            >
              Today
            </Button>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full">
              <Bell className="text-neutral-500" size={18} />
            </Button>
            <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full">
              <Search className="text-neutral-500" size={18} />
            </Button>
            <div className="hidden md:flex">
              <Avatar className="w-8 h-8 bg-primary text-white">
                <AvatarFallback>{user?.fullName ? getInitials(user.fullName) : 'U'}</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        {/* Countdown Banner */}
        {nextSpecialEvent && (
          <div className="bg-accent/20 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center">
              <i className="ri-timer-line text-accent mr-2"></i>
              <span className="text-sm font-medium">
                {nextSpecialEvent.title} in {Math.ceil((new Date(nextSpecialEvent.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days
              </span>
            </div>
            <Button variant="ghost" size="icon" className="p-0 h-auto w-auto text-neutral-500 hover:text-neutral-700">
              <i className="ri-close-line"></i>
            </Button>
          </div>
        )}

        {/* Calendar View Component */}
        <CalendarView />
        
        {/* Mobile Bottom Navigation */}
        <MobileNav />
        
        {/* Modals */}
        <OnboardingModal 
          isOpen={showOnboarding} 
          onClose={() => setShowOnboarding(false)} 
        />
        
        <EventFormModal 
          isOpen={showAddEvent} 
          onClose={() => setShowAddEvent(false)} 
        />
      </div>
    </div>
  );
}
