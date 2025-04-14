import { useLocation, Link } from "wouter";
import { CalendarDays, CheckSquare, Users, Settings, Plus } from "lucide-react";
import { useState } from "react";
import EventFormModal from "./event-form-modal";
import { useTranslation } from "react-i18next";

export default function MobileNav() {
  const [location] = useLocation();
  const [showAddEvent, setShowAddEvent] = useState(false);

  return (
    <>
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 flex justify-around py-2 z-10">
        <Link href="/calendar">
          <a className={`flex flex-col items-center pt-1 pb-0.5 ${location === '/calendar' ? 'text-primary' : 'text-neutral-500'}`}>
            <CalendarDays className="text-xl" size={20} />
            <span className="text-xs mt-0.5">Calendar</span>
          </a>
        </Link>
        
        <Link href="/tasks">
          <a className={`flex flex-col items-center pt-1 pb-0.5 ${location === '/tasks' ? 'text-primary' : 'text-neutral-500'}`}>
            <CheckSquare className="text-xl" size={20} />
            <span className="text-xs mt-0.5">Tasks</span>
          </a>
        </Link>
        
        <div className="flex flex-col items-center">
          <button 
            className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center shadow-lg -mt-5"
            onClick={() => setShowAddEvent(true)}
          >
            <Plus className="text-xl" size={24} />
          </button>
          <span className="text-xs mt-0.5 text-neutral-500">Add</span>
        </div>
        
        <Link href="/partners">
          <a className={`flex flex-col items-center pt-1 pb-0.5 ${location === '/partners' ? 'text-primary' : 'text-neutral-500'}`}>
            <Users className="text-xl" size={20} />
            <span className="text-xs mt-0.5">Partners</span>
          </a>
        </Link>
        
        <Link href="/settings">
          <a className={`flex flex-col items-center pt-1 pb-0.5 ${location === '/settings' ? 'text-primary' : 'text-neutral-500'}`}>
            <Settings className="text-xl" size={20} />
            <span className="text-xs mt-0.5">Settings</span>
          </a>
        </Link>
      </div>

      <EventFormModal isOpen={showAddEvent} onClose={() => setShowAddEvent(false)} />
    </>
  );
}
