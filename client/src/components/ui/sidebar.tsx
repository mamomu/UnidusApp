import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { CalendarDays, CheckSquare, Users, Settings, LogOut } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export default function Sidebar() {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="hidden md:flex md:w-64 bg-white border-r border-neutral-200 flex-col h-screen">
      <div className="p-4 border-b border-neutral-200">
        <h1 className="text-2xl font-heading font-bold text-primary flex items-center">
          <i className="ri-calendar-line mr-2"></i> Raft
        </h1>
      </div>
      
      <nav className="p-4 flex-1">
        <ul className="space-y-2">
          <li>
            <Link href="/calendar">
              <a className={`flex items-center p-2 rounded-lg ${location === '/calendar' ? 'text-primary bg-blue-50' : 'text-neutral-500 hover:bg-neutral-100'} font-medium`}>
                <CalendarDays className="mr-3 text-lg" size={20} />
                Calendar
              </a>
            </Link>
          </li>
          <li>
            <Link href="/tasks">
              <a className={`flex items-center p-2 rounded-lg ${location === '/tasks' ? 'text-primary bg-blue-50' : 'text-neutral-500 hover:bg-neutral-100'} font-medium`}>
                <CheckSquare className="mr-3 text-lg" size={20} />
                Tasks
              </a>
            </Link>
          </li>
          <li>
            <Link href="/partners">
              <a className={`flex items-center p-2 rounded-lg ${location === '/partners' ? 'text-primary bg-blue-50' : 'text-neutral-500 hover:bg-neutral-100'} font-medium`}>
                <Users className="mr-3 text-lg" size={20} />
                Partners
              </a>
            </Link>
          </li>
          <li>
            <Link href="/settings">
              <a className={`flex items-center p-2 rounded-lg ${location === '/settings' ? 'text-primary bg-blue-50' : 'text-neutral-500 hover:bg-neutral-100'} font-medium`}>
                <Settings className="mr-3 text-lg" size={20} />
                Settings
              </a>
            </Link>
          </li>
        </ul>
      </nav>
      
      <div className="p-4 border-t border-neutral-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Avatar className="w-10 h-10 bg-primary text-white">
              <AvatarFallback>{user?.fullName ? getInitials(user.fullName) : 'U'}</AvatarFallback>
            </Avatar>
            <div className="ml-3 overflow-hidden">
              <p className="text-neutral-900 font-medium truncate">{user?.fullName}</p>
              <p className="text-neutral-500 text-sm truncate">{user?.email}</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
            className="text-neutral-500 hover:text-neutral-700"
          >
            <LogOut size={18} />
          </Button>
        </div>
      </div>
    </div>
  );
}
