import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import Sidebar from "@/components/ui/sidebar";
import MobileNav from "@/components/ui/mobile-nav";
import CalendarView from "@/components/ui/calendar-view";
import { Bell, Search, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, addDays, addMonths } from "date-fns";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import EventFormModal from "@/components/ui/event-form-modal";

export default function CalendarPage() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("day");
  const [showAddEvent, setShowAddEvent] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const handlePrevious = () => {
    setCurrentDate(prev => {
      if (viewMode === 'day') return addDays(prev, -1);
      if (viewMode === 'week') return addDays(prev, -7);
      return addMonths(prev, -1);
    });
  };

  const handleNext = () => {
    setCurrentDate(prev => {
      if (viewMode === 'day') return addDays(prev, 1);
      if (viewMode === 'week') return addDays(prev, 7);
      return addMonths(prev, 1);
    });
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

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
                onClick={handlePrevious}
              >
                <ChevronLeft className="text-xl text-neutral-500" size={20} />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="p-1.5 h-auto w-auto hover:bg-neutral-100 rounded-full"
                onClick={handleNext}
              >
                <ChevronRight className="text-xl text-neutral-500" size={20} />
              </Button>
            </div>
            <h2 className="text-lg font-medium text-neutral-900">
              {viewMode === 'month' 
                ? format(currentDate, 'MMMM yyyy')
                : format(currentDate, 'MMMM d, yyyy')}
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
            <Button 
              variant="ghost" 
              size="icon" 
              className="w-8 h-8 rounded-full"
              onClick={() => setShowAddEvent(true)}
            >
              <Plus className="text-neutral-500" size={18} />
            </Button>
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

        {/* Calendar View Toggle & Content */}
        <div className="flex-1 overflow-auto">
          {/* Calendar View Toggle */}
          <div className="sticky top-0 bg-white z-10 px-4 py-2 border-b border-neutral-200 flex justify-between items-center">
            <div className="flex space-x-2">
              <Button 
                variant={viewMode === 'day' ? 'default' : 'ghost'} 
                className="px-3 py-1.5 text-sm rounded-md h-auto"
                onClick={() => setViewMode('day')}
              >
                Day
              </Button>
              <Button 
                variant={viewMode === 'week' ? 'default' : 'ghost'} 
                className="px-3 py-1.5 text-sm rounded-md h-auto"
                onClick={() => setViewMode('week')}
              >
                Week
              </Button>
              <Button 
                variant={viewMode === 'month' ? 'default' : 'ghost'} 
                className="px-3 py-1.5 text-sm rounded-md h-auto"
                onClick={() => setViewMode('month')}
              >
                Month
              </Button>
            </div>
            
            <div className="flex items-center space-x-2 md:hidden">
              <Button 
                variant="ghost" 
                size="icon" 
                className="p-1.5 h-auto w-auto hover:bg-neutral-100 rounded-full"
                onClick={handlePrevious}
              >
                <ChevronLeft className="text-neutral-500" size={16} />
              </Button>
              <span className="text-sm font-medium">
                {format(currentDate, viewMode === 'month' ? 'MMM yyyy' : 'MMM d')}
              </span>
              <Button 
                variant="ghost" 
                size="icon" 
                className="p-1.5 h-auto w-auto hover:bg-neutral-100 rounded-full"
                onClick={handleNext}
              >
                <ChevronRight className="text-neutral-500" size={16} />
              </Button>
            </div>
          </div>

          {/* Calendar View Content */}
          <CalendarView />
        </div>
        
        {/* Mobile Bottom Navigation */}
        <MobileNav />
        
        {/* Event Form Modal */}
        <EventFormModal 
          isOpen={showAddEvent} 
          onClose={() => setShowAddEvent(false)} 
        />
      </div>
    </div>
  );
}
