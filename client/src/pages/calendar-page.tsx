import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import Sidebar from "@/components/ui/sidebar";
import MobileNav from "@/components/ui/mobile-nav";
import CalendarView from "@/components/ui/calendar-view";
import { Bell, Search, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, addDays, addMonths } from "date-fns";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import EventFormModal from "@/components/ui/event-form-modal";
import OnboardingModal from "@/components/ui/onboarding-modal";
import { useTranslation } from "react-i18next";
import Header from "@/components/ui/header";

export default function UnifiedCalendarPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("day");
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  // Show onboarding for new users
  useEffect(() => {
    // If user exists and has no events, show onboarding
    if (user) {
      // Simulate checking for user events
      setShowOnboarding(false); // Set to true if no events exist
    }
  }, [user]);

  return (
    <div className="flex flex-col md:flex-row h-screen">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header Bar */}
        <Header setShowAddEvent={setShowAddEvent} />
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
