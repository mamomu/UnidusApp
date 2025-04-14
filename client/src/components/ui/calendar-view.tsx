import { useState } from "react";
import { 
  ChevronLeft, 
  ChevronRight, 
  Sun, 
  Cloud, 
  Moon 
} from "lucide-react";
import { format, addDays, startOfWeek, endOfWeek } from "date-fns";
import EventCard from "./event-card";
import { useQuery } from "@tanstack/react-query";
import { Event } from "@/lib/types";
import { Skeleton } from "./skeleton";

type ViewMode = "day" | "week" | "month";

export default function CalendarView() {
  const [viewMode, setViewMode] = useState<ViewMode>("day");
  const [currentDate, setCurrentDate] = useState(new Date());

  // Calculate the start and end dates based on the view mode
  const getDateRange = () => {
    if (viewMode === 'day') {
      return { start: currentDate, end: currentDate };
    } else if (viewMode === 'week') {
      return {
        start: startOfWeek(currentDate, { weekStartsOn: 0 }),
        end: endOfWeek(currentDate, { weekStartsOn: 0 })
      };
    } else {
      // For month view, we'd need a more complex calculation
      // For now, let's return a range that covers the current month
      const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      return { start: startDate, end: endDate };
    }
  };

  const { start: startDate, end: endDate } = getDateRange();

  // Query for user's events
  const { data: events, isLoading: isLoadingEvents } = useQuery<Event[]>({
    queryKey: ['/api/events', startDate.toISOString(), endDate.toISOString()], 
    queryFn: async ({ queryKey }) => {
      const [, start, end] = queryKey;
      const url = `/api/events?startDate=${start}&endDate=${end}`;
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch events');
      return res.json();
    }
  });

  // Query for shared events
  const { data: sharedEvents, isLoading: isLoadingShared } = useQuery<Event[]>({
    queryKey: ['/api/events/shared', startDate.toISOString(), endDate.toISOString()], 
    queryFn: async ({ queryKey }) => {
      const [, start, end] = queryKey;
      const url = `/api/events/shared?startDate=${start}&endDate=${end}`;
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch shared events');
      return res.json();
    }
  });

  // Combine and organize events by period
  const organizeEventsByPeriod = () => {
    const allEvents = [...(events || []), ...(sharedEvents || [])];
    if (viewMode !== 'day') {
      // For week/month views, we'd need a more complex organization
      // This is a simplified version that just returns all events
      return {
        morning: allEvents.filter(e => e.period === 'morning'),
        afternoon: allEvents.filter(e => e.period === 'afternoon'),
        night: allEvents.filter(e => e.period === 'night')
      };
    }

    // For day view, filter events for the current date
    const currentDateString = format(currentDate, 'yyyy-MM-dd');
    const filteredEvents = allEvents.filter(
      event => event.date === currentDateString
    );

    return {
      morning: filteredEvents.filter(e => e.period === 'morning'),
      afternoon: filteredEvents.filter(e => e.period === 'afternoon'),
      night: filteredEvents.filter(e => e.period === 'night')
    };
  };

  const { morning, afternoon, night } = organizeEventsByPeriod();

  const handlePreviousDay = () => {
    setCurrentDate(prev => {
      if (viewMode === 'day') return addDays(prev, -1);
      if (viewMode === 'week') return addDays(prev, -7);
      // For month, subtract 1 month
      return new Date(prev.getFullYear(), prev.getMonth() - 1, prev.getDate());
    });
  };

  const handleNextDay = () => {
    setCurrentDate(prev => {
      if (viewMode === 'day') return addDays(prev, 1);
      if (viewMode === 'week') return addDays(prev, 7);
      // For month, add 1 month
      return new Date(prev.getFullYear(), prev.getMonth() + 1, prev.getDate());
    });
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const isLoading = isLoadingEvents || isLoadingShared;

  return (
    <div className="flex-1 overflow-auto">
      {/* Calendar View Toggle */}
      <div className="sticky top-0 bg-white z-10 px-4 py-2 border-b border-neutral-200 flex justify-between items-center">
        <div className="flex space-x-2">
          <button 
            className={`px-3 py-1.5 text-sm ${viewMode === 'day' ? 'bg-primary text-white' : 'text-neutral-500 hover:bg-neutral-100'} rounded-md font-medium`}
            onClick={() => setViewMode('day')}
          >
            Day
          </button>
          <button 
            className={`px-3 py-1.5 text-sm ${viewMode === 'week' ? 'bg-primary text-white' : 'text-neutral-500 hover:bg-neutral-100'} rounded-md font-medium`}
            onClick={() => setViewMode('week')}
          >
            Week
          </button>
          <button 
            className={`px-3 py-1.5 text-sm ${viewMode === 'month' ? 'bg-primary text-white' : 'text-neutral-500 hover:bg-neutral-100'} rounded-md font-medium`}
            onClick={() => setViewMode('month')}
          >
            Month
          </button>
        </div>
        
        <div className="flex items-center space-x-2 md:hidden">
          <button 
            className="p-1.5 hover:bg-neutral-100 rounded-full"
            onClick={handlePreviousDay}
          >
            <ChevronLeft className="text-neutral-500" size={16} />
          </button>
          <span className="text-sm font-medium">
            {format(currentDate, viewMode === 'month' ? 'MMM yyyy' : 'MMM d')}
          </span>
          <button 
            className="p-1.5 hover:bg-neutral-100 rounded-full"
            onClick={handleNextDay}
          >
            <ChevronRight className="text-neutral-500" size={16} />
          </button>
        </div>
      </div>

      {/* Day View Calendar */}
      <div className="p-4">
        <div className="text-center mb-6 md:hidden">
          <h2 className="text-xl font-medium text-neutral-900">
            {format(currentDate, 'EEEE, MMMM d')}
          </h2>
          {format(currentDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') && (
            <p className="text-neutral-500">Today</p>
          )}
        </div>
        
        {/* Period-based view */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Morning Period */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-4 py-3 bg-[#FFCF86]/20 border-b border-[#FFCF86]/30 flex items-center">
              <Sun className="text-yellow-600 mr-2" size={16} />
              <h3 className="font-medium">Morning (6:00 - 12:00)</h3>
            </div>
            
            {isLoading ? (
              <div className="p-2 space-y-2">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : morning && morning.length > 0 ? (
              morning.map(event => (
                <EventCard key={event.id} event={event} />
              ))
            ) : (
              <div className="p-6 text-center text-neutral-400 text-sm">
                <span className="ri-add-circle-line text-2xl mb-1 block"></span>
                Click to add event
              </div>
            )}
          </div>
          
          {/* Afternoon Period */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-4 py-3 bg-[#84B6F9]/20 border-b border-[#84B6F9]/30 flex items-center">
              <Cloud className="text-blue-600 mr-2" size={16} />
              <h3 className="font-medium">Afternoon (12:00 - 18:00)</h3>
            </div>
            
            {isLoading ? (
              <div className="p-2 space-y-2">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : afternoon && afternoon.length > 0 ? (
              afternoon.map(event => (
                <EventCard key={event.id} event={event} />
              ))
            ) : (
              <div className="p-6 text-center text-neutral-400 text-sm">
                <span className="ri-add-circle-line text-2xl mb-1 block"></span>
                Click to add event
              </div>
            )}
          </div>
          
          {/* Night Period */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-4 py-3 bg-[#7E83DE]/20 border-b border-[#7E83DE]/30 flex items-center">
              <Moon className="text-indigo-600 mr-2" size={16} />
              <h3 className="font-medium">Night (18:00 - 00:00)</h3>
            </div>
            
            {isLoading ? (
              <div className="p-2 space-y-2">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : night && night.length > 0 ? (
              night.map(event => (
                <EventCard key={event.id} event={event} />
              ))
            ) : (
              <div className="p-6 text-center text-neutral-400 text-sm">
                <span className="ri-add-circle-line text-2xl mb-1 block"></span>
                Click to add event
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
