import { useState } from "react";
import { Event } from "@/lib/types";
import { MapPin, Video, Heart, Lock, Users } from "lucide-react";
import { format } from "date-fns";
import EventDetailsModal from "./event-details-modal";

interface EventCardProps {
  event: Event;
}

export default function EventCard({ event }: EventCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  // Calculate the border color based on the event period
  const getBorderColor = (period: string) => {
    switch (period) {
      case 'morning': return 'border-[#FFCF86]';
      case 'afternoon': return 'border-[#84B6F9]';
      case 'night': return 'border-[#7E83DE]';
      default: return 'border-primary';
    }
  };

  // Calculate the background color based on the event period
  const getBackgroundColor = (period: string) => {
    switch (period) {
      case 'morning': return 'bg-yellow-50 hover:bg-yellow-100';
      case 'afternoon': return 'bg-blue-50 hover:bg-blue-100';
      case 'night': return 'bg-indigo-50 hover:bg-indigo-100';
      default: return 'bg-neutral-50 hover:bg-neutral-100';
    }
  };

  const getTimeBadgeColor = (period: string) => {
    switch (period) {
      case 'morning': return 'bg-[#FFCF86]/10 text-amber-700';
      case 'afternoon': return 'bg-[#84B6F9]/10 text-blue-700';
      case 'night': return 'bg-[#7E83DE]/10 text-indigo-700';
      default: return 'bg-primary/10 text-primary';
    }
  };

  const getPrivacyBadge = (privacy: string) => {
    switch (privacy) {
      case 'private':
        return (
          <div className="flex items-center">
            <Lock className="ml-2 text-neutral-400" size={14} title="Private" />
          </div>
        );
      case 'partner':
        return (
          <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">
            Shared
          </span>
        );
      case 'public':
        return (
          <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full">
            Public
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <div 
        className={`border-l-4 ${getBorderColor(event.period)} m-2 p-3 rounded ${getBackgroundColor(event.period)} cursor-pointer`}
        onClick={() => setShowDetails(true)}
      >
        <div className="flex justify-between items-start mb-1">
          <span className="font-medium">{event.title}</span>
          <span className={`text-sm ${getTimeBadgeColor(event.period)} px-1.5 rounded`}>
            {format(new Date(`2000-01-01T${event.startTime}`), 'hh:mm a')}
          </span>
        </div>
        
        {event.location && (
          <div className="flex items-center text-sm text-neutral-500 mb-2">
            <MapPin className="mr-1" size={14} />
            <span>{event.location}</span>
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex">
            <span className="text-xl">{event.emoji || '📅'}</span>
          </div>
          <div className="flex items-center">
            <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs">
              {event.owner?.fullName?.substring(0, 2) || 'U'}
            </div>
            {event.participants && event.participants.length > 0 && (
              <div className="w-6 h-6 -ml-1 rounded-full bg-secondary text-white flex items-center justify-center text-xs">
                {event.participants[0].user?.fullName?.substring(0, 2) || 'P'}
              </div>
            )}
            {getPrivacyBadge(event.privacy)}
          </div>
        </div>
      </div>

      {showDetails && (
        <EventDetailsModal 
          event={event} 
          isOpen={showDetails} 
          onClose={() => setShowDetails(false)} 
        />
      )}
    </>
  );
}
