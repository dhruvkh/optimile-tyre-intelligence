
import React from 'react';
import { UserRole } from '../types';

interface TopBarProps {
  user: { name: string; role: UserRole };
  setUserRole: (role: UserRole) => void;
}

export const TopBar: React.FC<TopBarProps> = ({ user, setUserRole }) => {
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-4">
        <div className="h-8 w-[1px] bg-slate-200"></div>
        <nav className="text-sm text-slate-500 flex gap-2">
          <span>Assets</span>
          <span>/</span>
          <span className="font-semibold text-slate-900">Tyre Management</span>
        </nav>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Viewing as:</span>
          <select 
            value={user.role}
            onChange={(e) => setUserRole(e.target.value as UserRole)}
            className="text-sm font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded px-2 py-1 outline-none focus:ring-1 ring-indigo-500"
          >
            <option value={UserRole.FLEET_ADMIN}>{UserRole.FLEET_ADMIN}</option>
            <option value={UserRole.MAINTENANCE_MANAGER}>{UserRole.MAINTENANCE_MANAGER}</option>
            <option value={UserRole.OPS_VIEWER}>{UserRole.OPS_VIEWER}</option>
            <option value={UserRole.DRIVER}>{UserRole.DRIVER}</option>
          </select>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-semibold text-slate-900">{user.name}</p>
            <p className="text-xs text-slate-500">{user.role}</p>
          </div>
          <div className="w-10 h-10 bg-slate-200 rounded-full overflow-hidden">
            <img src={`https://picsum.photos/seed/${user.name}/40/40`} alt="Avatar" />
          </div>
        </div>
      </div>
    </header>
  );
};
