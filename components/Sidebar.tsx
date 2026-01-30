
import React from 'react';

interface SidebarProps {
  currentView: string;
  setView: (view: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, setView }) => {
  const items = [
    { id: 'job_cards', label: 'Job Cards (WO)', icon: '🔧' },
    { id: 'analytics', label: 'Fleet Analytics', icon: '📊' },
    { id: 'vehicle_master', label: 'Vehicle Master', icon: '🛠️' },
    { id: 'inventory', label: 'Tyre Inventory', icon: '📦' },
    { id: 'on_vehicles', label: 'Visual Tracker', icon: '🚛' },
    { id: 'inspections', label: 'Inspections', icon: '📝' },
    { id: 'history', label: 'Master History', icon: '📜' }
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800">
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center font-bold text-white">TI</div>
          <h1 className="text-lg font-bold text-white tracking-tight">Tyre Intelligence</h1>
        </div>
        <p className="text-[10px] uppercase tracking-widest text-slate-500 mt-1">Optimile Tyre Management</p>
      </div>
      
      <nav className="flex-1 mt-4">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={`w-full flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors hover:bg-slate-800 hover:text-white ${
              currentView === item.id ? 'bg-slate-800 text-indigo-400 border-r-2 border-indigo-400' : ''
            }`}
          >
            <span>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      <div className="p-6 border-t border-slate-800">
        <div className="bg-slate-800 rounded-lg p-4">
          <p className="text-xs text-slate-400">System Status</p>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-xs text-white">Operational</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
