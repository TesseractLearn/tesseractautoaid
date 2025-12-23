import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Search, MapPin, Clock, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  icon: React.ReactNode;
  label: string;
  path: string;
}

const userNavItems: NavItem[] = [
  { icon: <Home className="w-5 h-5" />, label: 'Home', path: '/user' },
  { icon: <Search className="w-5 h-5" />, label: 'Services', path: '/user/services' },
  { icon: <MapPin className="w-5 h-5" />, label: 'Track', path: '/user/track' },
  { icon: <Clock className="w-5 h-5" />, label: 'History', path: '/user/history' },
  { icon: <User className="w-5 h-5" />, label: 'Profile', path: '/user/profile' },
];

const UserBottomNav: React.FC = () => {
  const location = useLocation();

  return (
    <nav className="bottom-nav">
      <div className="flex items-center justify-around">
        {userNavItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                'bottom-nav-item flex-1',
                isActive && 'active'
              )}
            >
              <div className={cn(
                'transition-all duration-200',
                isActive && 'text-primary scale-110'
              )}>
                {item.icon}
              </div>
              <span className={cn(
                'text-[10px] mt-1 font-medium',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}>
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default UserBottomNav;
