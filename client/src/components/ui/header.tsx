import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Bell, Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useTranslation } from "react-i18next";
export default function Header({
  setShowAddEvent,
}: {
  setShowAddEvent?: void | undefined;
}) {
  const { t } = useTranslation();
  const { user } = useAuth();

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <>
      <header className="bg-white border-b border-neutral-200 py-3 px-4 flex items-center justify-between">
        <div className="md:hidden">
          <h1 className="text-xl font-heading font-bold text-primary flex items-center">
            <i className="ri-calendar-line mr-2"></i> Unidus
          </h1>
        </div>

        <div className="flex items-center space-x-2">
          {setShowAddEvent !== undefined ? (
            <Button
              size="sm"
              className="bg-primary hover:bg-primary/60 text-white hover:text-white"
              onClick={() => setShowAddEvent(true)}
            >
              {t("calendar.addEvent")}{" "}
              <Plus className="text-white" enableBackground={10} size={18} />
            </Button>
          ) : null}
          <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full">
            <Bell className="text-neutral-500" size={18} />
          </Button>
          <div className="hidden md:flex">
            <Avatar className="w-8 h-8 bg-secondary text-white">
              <AvatarFallback className="bg-primary">
                {user?.fullName ? getInitials(user.fullName) : "U"}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>
    </>
  );
}
