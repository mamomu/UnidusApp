import { ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

type ViewMode = "day" | "week" | "month";

interface CalendarControlsProps {
  currentDate: Date;
  viewMode: ViewMode;
  onNavigate: (direction: "previous" | "next") => void;
  onToday: () => void;
  onViewModeChange: (mode: ViewMode) => void;
}

export default function CalendarControls({
  currentDate,
  viewMode,
  onNavigate,
  onToday,
  onViewModeChange,
}: CalendarControlsProps) {
  const { t } = useTranslation();

  return (
    <div className="sticky top-0 bg-white z-10 px-4 py-2 border-b border-neutral-200 flex justify-between items-center">
      <div className="flex space-x-2">
        <Button
          variant={viewMode === "day" ? "default" : "ghost"}
          className="px-3 py-1.5 text-sm rounded-md h-auto"
          onClick={() => onViewModeChange("day")}
        >
          {t("calendar.viewModes.day", { defaultValue: "Day" })}
        </Button>
        <Button
          variant={viewMode === "week" ? "default" : "ghost"}
          className="px-3 py-1.5 text-sm rounded-md h-auto"
          onClick={() => onViewModeChange("week")}
        >
          {t("calendar.viewModes.week", { defaultValue: "Week" })}
        </Button>
        <Button
          variant={viewMode === "month" ? "default" : "ghost"}
          className="px-3 py-1.5 text-sm rounded-md h-auto"
          onClick={() => onViewModeChange("month")}
        >
          {t("calendar.viewModes.month", { defaultValue: "Month" })}
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <Button
          variant="ghost"
          size="icon"
          className="p-1.5 h-auto w-auto hover:bg-neutral-100 rounded-full"
          onClick={() => onNavigate("previous")}
        >
          <ChevronLeft className="text-neutral-500" size={16} />
        </Button>
        <span className="text-sm font-medium">
          {format(
            currentDate,
            viewMode === "month"
              ? t("calendar.dateFormats.month", { defaultValue: "MMM yyyy" })
              : t("calendar.dateFormats.day", { defaultValue: "MMM d" })
          )}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="p-1.5 h-auto w-auto hover:bg-neutral-100 rounded-full"
          onClick={() => onNavigate("next")}
        >
          <ChevronRight className="text-neutral-500" size={16} />
        </Button>
        <Button
          variant="outline"
          className="px-3 py-1.5 text-sm text-primary hover:bg-blue-50"
          onClick={onToday}
        >
          {t("calendar.today", { defaultValue: "Today" })}
        </Button>
      </div>
    </div>
  );
}
