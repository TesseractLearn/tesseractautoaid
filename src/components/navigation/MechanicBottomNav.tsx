import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Briefcase, Wallet, BarChart3, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  icon: React.ReactNode;
  label: string;
  path: string;
}

const mechanicNavItems: NavItem[] = [
  { icon: <Home className="w-5 h-5" />, label: 'Home', path: '/mechanic' },
  { icon: <Briefcase className="w-5 h-5" />, label: 'Jobs', path: '/mechanic/jobs' },
  { icon: <Wallet className="w-5 h-5" />, label: 'Earnings', path: '/mechanic/earnings' },
  { icon: <BarChart3 className="w-5 h-5" />, label: 'Stats', path: '/mechanic/stats' },
  { icon: <User className="w-5 h-5" />, label: 'Profile', path: '/mechanic/profile' },
];

const MechanicBottomNav: React.FC = () => {
  const location = useLocation();

  return (
    <nav className="bottom-nav">
      <div className="flex items-center justify-around">
        {mechanicNavItems.map((item) => {
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

export default MechanicBottomNav;
