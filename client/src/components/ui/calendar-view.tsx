import { useState } from "react";
import {
  format,
  addDays,
  startOfWeek,
  endOfWeek,
  addWeeks,
  addMonths,
} from "date-fns";
import { Sun, Cloud, Moon } from "lucide-react";

import { useQuery } from "@tanstack/react-query";
import { Event } from "@/lib/types";
import { Skeleton } from "./skeleton";
import EventCard from "./event-card";
import EventFormModal from "./event-form-modal";
import CalendarControls from "./calendar-controls";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";

type ViewMode = "day" | "week" | "month";

export interface EventFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultPeriod: "morning" | "afternoon" | "night";
  defaultDate?: string; // Made defaultDate optional
}

export default function CalendarView() {
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState<ViewMode>("day");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<
    "morning" | "afternoon" | "night"
  >("morning");

  const { user } = useAuth(); // Import and use the user context
  const userId = user?.id; // Extract userId from the user context

  // Calculate the start and end dates based on the view mode
  const getDateRange = () => {
    if (viewMode === "day") {
      return { start: currentDate, end: currentDate };
    } else if (viewMode === "week") {
      return {
        start: startOfWeek(currentDate, { weekStartsOn: 0 }),
        end: endOfWeek(currentDate, { weekStartsOn: 0 }),
      };
    } else {
      const startDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1
      );
      const endDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        0
      );
      return { start: startDate, end: endDate };
    }
  };

  const { start: startDate, end: endDate } = getDateRange();

  // Query for user's events
  const { data: events, isLoading: isLoadingEvents } = useQuery<Event[]>({
    queryKey: ["/api/events", startDate.toISOString(), endDate.toISOString()],
    queryFn: async ({ queryKey }) => {
      const [, start, end] = queryKey;
      const url = `/api/events?startDate=${start}&endDate=${end}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch events");
      return res.json();
    },
  });

  // Query for shared events
  const { data: sharedEvents, isLoading: isLoadingShared } = useQuery<Event[]>({
    queryKey: [
      "/api/events/shared",
      startDate.toISOString(),
      endDate.toISOString(),
    ],
    queryFn: async ({ queryKey }) => {
      const [, start, end] = queryKey;
      const url = `/api/events/shared?startDate=${start}&endDate=${end}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch shared events");
      return res.json();
    },
  });

  // Combine events without expanding recurring events in the frontend
  const organizeEventsByPeriod = () => {
    const allEvents = [...(events || []), ...(sharedEvents || [])];

    const filteredEvents = allEvents.filter((event) => {
      // Ensure only authorized events are displayed
      if (event.privacy === "private" && event.ownerId !== userId) {
        return false;
      }
      return true;
    });

    if (viewMode !== "day") {
      return {
        morning: filteredEvents.filter((e) => e.period === "morning"),
        afternoon: filteredEvents.filter((e) => e.period === "afternoon"),
        night: filteredEvents.filter((e) => e.period === "night"),
      };
    }

    const currentDateString = format(currentDate, "yyyy-MM-dd");
    const filteredDayEvents = filteredEvents.filter(
      (event) => event.date === currentDateString
    );

    return {
      morning: filteredDayEvents.filter((e) => e.period === "morning"),
      afternoon: filteredDayEvents.filter((e) => e.period === "afternoon"),
      night: filteredDayEvents.filter((e) => e.period === "night"),
    };
  };

  const { morning, afternoon, night } = organizeEventsByPeriod();

  const handleNavigation = (direction: "previous" | "next") => {
    setCurrentDate((prev) => {
      if (viewMode === "day")
        return direction === "previous" ? addDays(prev, -1) : addDays(prev, 1);
      if (viewMode === "week")
        return direction === "previous"
          ? addWeeks(prev, -1)
          : addWeeks(prev, 1);
      return direction === "previous"
        ? addMonths(prev, -1)
        : addMonths(prev, 1);
    });
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const isLoading = isLoadingEvents || isLoadingShared;

  return (
    <div className="flex-1 overflow-auto">
      {/* Event Form Modal */}
      <EventFormModal
        isOpen={showAddEvent}
        onClose={() => setShowAddEvent(false)}
        defaultPeriod={selectedPeriod}
        defaultDate={format(currentDate, "yyyy-MM-dd")}
      />

      <CalendarControls
        currentDate={currentDate}
        viewMode={viewMode}
        onNavigate={handleNavigation}
        onToday={handleToday}
        onViewModeChange={setViewMode}
      />

      {/* Day View Calendar */}
      <div className="p-4">
        <div className="text-center mb-6 md:hidden">
          <h2 className="text-xl font-medium text-neutral-900">
            {format(currentDate, "EEEE, MMMM d")}
          </h2>
          {format(currentDate, "yyyy-MM-dd") ===
            format(new Date(), "yyyy-MM-dd") && (
            <p className="text-neutral-500">{t("calendar.today")}</p>
          )}
        </div>

        {/* Period-based view */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Morning Period */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-4 py-3 bg-[#FFCF86]/20 border-b border-[#FFCF86]/30 flex items-center">
              <Sun className="text-yellow-600 mr-2" size={16} />
              <h3 className="font-medium">{t("calendar.periods.morning")}</h3>
            </div>

            {isLoading ? (
              <div className="p-2 space-y-2">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : morning && morning.length > 0 ? (
              morning.map((event) => <EventCard key={event.id} event={event} />)
            ) : (
              <div
                className="p-6 text-center text-neutral-400 text-sm cursor-pointer hover:bg-neutral-50"
                onClick={() => {
                  setSelectedPeriod("morning");
                  setShowAddEvent(true);
                }}
              >
                <span className="ri-add-circle-line text-2xl mb-1 block"></span>
                {t("calendar.addEvent")}
              </div>
            )}
          </div>

          {/* Afternoon Period */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-4 py-3 bg-[#84B6F9]/20 border-b border-[#84B6F9]/30 flex items-center">
              <Cloud className="text-blue-600 mr-2" size={16} />
              <h3 className="font-medium">{t("calendar.periods.afternoon")}</h3>
            </div>

            {isLoading ? (
              <div className="p-2 space-y-2">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : afternoon && afternoon.length > 0 ? (
              afternoon.map((event) => (
                <EventCard key={event.id} event={event} />
              ))
            ) : (
              <div
                className="p-6 text-center text-neutral-400 text-sm cursor-pointer hover:bg-neutral-50"
                onClick={() => {
                  setSelectedPeriod("afternoon");
                  setShowAddEvent(true);
                }}
              >
                <span className="ri-add-circle-line text-2xl mb-1 block"></span>
                {t("calendar.addEvent")}
              </div>
            )}
          </div>

          {/* Night Period */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-4 py-3 bg-[#7E83DE]/20 border-b border-[#7E83DE]/30 flex items-center">
              <Moon className="text-indigo-600 mr-2" size={16} />
              <h3 className="font-medium">{t("calendar.periods.night")}</h3>
            </div>

            {isLoading ? (
              <div className="p-2 space-y-2">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : night && night.length > 0 ? (
              night.map((event) => <EventCard key={event.id} event={event} />)
            ) : (
              <div
                className="p-6 text-center text-neutral-400 text-sm cursor-pointer hover:bg-neutral-50"
                onClick={() => {
                  setSelectedPeriod("night");
                  setShowAddEvent(true);
                }}
              >
                <span className="ri-add-circle-line text-2xl mb-1 block"></span>
                {t("calendar.addEvent")}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
