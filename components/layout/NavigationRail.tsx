import React from 'react';
import { NavLink } from '../../vendor/react-router-dom';

export type NavigationItem = {
  to: string;
  label: string;
  icon?: React.ReactNode;
};

type NavigationRailProps = {
  items: NavigationItem[];
  collapsed?: boolean;
  footer?: React.ReactNode;
};

const NavigationRail: React.FC<NavigationRailProps> = ({ items, collapsed = false, footer }) => {
  return (
    <nav className={`bg-white border-r border-slate-200 ${collapsed ? 'w-16' : 'w-56'} flex flex-col`}
      aria-label="Primary navigation"
    >
      <div className="flex-1 py-4 space-y-1">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center px-4 py-2 text-sm font-medium transition-colors ${
                isActive ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`
            }
          >
            {item.icon && <span className="mr-3 text-lg" aria-hidden>{item.icon}</span>}
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </div>
      {footer && <div className="p-4 border-t border-slate-200">{footer}</div>}
    </nav>
  );
};

export default NavigationRail;
