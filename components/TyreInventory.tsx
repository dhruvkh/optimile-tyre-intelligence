
import React, { useState, useMemo } from 'react';
import { Tyre, TyreStatus, UserRole, Vehicle, Inspection, Location, StockPolicy } from '../types';
import { MOCK_STOCK_POLICIES } from '../mockData';

interface TyreInventoryProps {
  tyres: Tyre[];
  locations: Location[];
  onViewDetails: (id: string) => void;
  onReceiveRequest: () => void;
  onTransferRequest: (currentLocationId: string) => void;
  onSellScrapRequest?: (selectedTyreIds: string[]) => void;
  userRole: UserRole;
  vehicles: Vehicle[];
  inspections: Inspection[];
}

export const TyreInventory: React.FC<TyreInventoryProps> = ({ 
  tyres, 
  locations,
  onViewDetails, 
  onReceiveRequest, 
  onTransferRequest,
  onSellScrapRequest,
  userRole, 
  vehicles,
  inspections
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'All' | 'New' | 'Retreaded' | 'Sent for Retread' | 'Awaiting Decision' | 'Scrapped' | 'Sold'>('All');
  const [selectedLocationId, setSelectedLocationId] = useState<string>('All');
  
  // Selection State
  const [selectedTyreIds, setSelectedTyreIds] = useState<Set<string>>(new Set());

  const filteredTyres = tyres.filter(t => {
    const matchesSearch = t.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         (t.currentVehicleId || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesTab = true;
    if (activeTab === 'New') matchesTab = t.status === TyreStatus.IN_STORE && t.currentLifeNo === 0;
    else if (activeTab === 'Retreaded') matchesTab = t.status === TyreStatus.IN_STORE && t.currentLifeNo > 0;
    else if (activeTab === 'Sent for Retread') matchesTab = t.status === TyreStatus.RETREAD_IN_PROGRESS;
    else if (activeTab === 'Awaiting Decision') matchesTab = t.status === TyreStatus.AWAITING_DECISION;
    else if (activeTab === 'Scrapped') matchesTab = t.status === TyreStatus.SCRAPPED;
    else if (activeTab === 'Sold') matchesTab = t.status === TyreStatus.SOLD;
    else if (activeTab === 'All') matchesTab = true;

    const matchesLocation = selectedLocationId === 'All' || t.locationId === selectedLocationId;

    return matchesSearch && matchesTab && matchesLocation;
  });

  const alerts = useMemo(() => {
    if (selectedLocationId === 'All') return [];
    
    const locationStock = tyres.filter(t => t.locationId === selectedLocationId && t.status === TyreStatus.IN_STORE);
    const alerts: string[] = [];

    MOCK_STOCK_POLICIES.forEach(policy => {
      const count = locationStock.filter(t => t.size === policy.size).length;
      if (count < policy.minLevel) {
        alerts.push(`Low Stock: ${policy.size} (${count} avail / Min ${policy.minLevel})`);
      }
    });
    return alerts;
  }, [tyres, selectedLocationId]);

  const stockValue = useMemo(() => {
    return filteredTyres.reduce((sum, t) => sum + (t.status === TyreStatus.IN_STORE ? t.purchaseCost : 0), 0);
  }, [filteredTyres]);

  const toggleSelect = (id: string, e: React.SyntheticEvent) => {
      e.stopPropagation();
      const newSet = new Set(selectedTyreIds);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      setSelectedTyreIds(newSet);
  };

  const getStatusColor = (status: TyreStatus) => {
    switch (status) {
      case TyreStatus.IN_STORE: return 'bg-blue-100 text-blue-700 border-blue-200';
      case TyreStatus.FITTED: return 'bg-green-100 text-green-700 border-green-200';
      case TyreStatus.RETREAD_IN_PROGRESS: return 'bg-orange-100 text-orange-700 border-orange-200';
      case TyreStatus.AWAITING_DECISION: return 'bg-purple-100 text-purple-700 border-purple-200';
      case TyreStatus.SCRAPPED: return 'bg-red-100 text-red-700 border-red-200';
      case TyreStatus.SOLD: return 'bg-slate-200 text-slate-600 border-slate-300 decoration-line-through';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar -mx-6 px-6">
      <div className="max-w-7xl mx-auto py-4 pb-20">
        
        {/* Header & Location Selector */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-slate-800">Inventory Hub</h1>
            <p className="text-sm text-slate-500 mt-1">Multi-location asset tracking & stock control.</p>
          </div>
          
          <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Viewing Location:</span>
             <select 
               value={selectedLocationId}
               onChange={e => setSelectedLocationId(e.target.value)}
               className="bg-slate-50 text-sm font-bold text-slate-800 py-2 px-4 rounded-xl outline-none focus:ring-2 ring-indigo-500/20"
             >
               <option value="All">All Network Locations</option>
               {locations.map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
             </select>
          </div>
        </div>

        {/* Dashboard Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
           <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Stock Value</p>
              <p className="text-2xl font-black text-slate-900">₹{stockValue.toLocaleString()}</p>
              <p className="text-[10px] text-slate-400 mt-1 font-bold">In selected view</p>
           </div>
           <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Active Alerts</p>
              {alerts.length > 0 ? (
                <div className="space-y-1">
                  {alerts.map((alert, i) => (
                    <p key={i} className="text-xs font-bold text-red-600 flex items-center gap-2">
                      <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span> {alert}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="text-xs font-bold text-green-600 flex items-center gap-2">
                   <span className="text-lg">✓</span> Stock Levels Healthy
                </p>
              )}
           </div>
           <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-center gap-3">
              {activeTab === 'Scrapped' && selectedTyreIds.size > 0 ? (
                <button 
                  onClick={() => onSellScrapRequest && onSellScrapRequest(Array.from(selectedTyreIds))}
                  className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow transition-all active:scale-95 animate-pulse"
                >
                  Sell {selectedTyreIds.size} Scrapped Units
                </button>
              ) : (
                 userRole === UserRole.FLEET_ADMIN && (
                    <>
                    <button 
                        onClick={onReceiveRequest}
                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow transition-all active:scale-95"
                    >
                        + Goods Receipt (GRN)
                    </button>
                    {selectedLocationId !== 'All' && (
                        <button 
                        onClick={() => onTransferRequest(selectedLocationId)}
                        className="w-full py-2 bg-white border-2 border-indigo-100 text-indigo-600 hover:bg-indigo-50 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
                        >
                        ⇄ Transfer Stock Out
                        </button>
                    )}
                    </>
                 )
              )}
           </div>
        </div>

        {/* Tabs and Search */}
        <div className="bg-white border border-slate-200 rounded-[32px] overflow-hidden mb-6 shadow-sm">
          <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              {['All', 'New', 'Retreaded', 'Sent for Retread', 'Awaiting Decision', 'Scrapped', 'Sold'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => { setActiveTab(tab as any); setSelectedTyreIds(new Set()); }}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    activeTab === tab 
                      ? 'bg-slate-900 text-white shadow-md' 
                      : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="relative w-full md:w-80">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
              <input 
                type="text" 
                placeholder="Tyre ID / Vehicle..."
                className="w-full pl-10 pr-6 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:ring-4 ring-indigo-500/10 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {activeTab === 'Scrapped' && <th className="px-8 py-5 w-10"></th>}
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Asset Details</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Location</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Lifecycle</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Usage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTyres.length > 0 ? filteredTyres.map((tyre) => {
                const locName = locations.find(l => l.id === tyre.locationId)?.name || tyre.locationId;
                const isSelected = selectedTyreIds.has(tyre.id);
                
                return (
                  <tr 
                    key={tyre.id} 
                    onClick={() => onViewDetails(tyre.id)}
                    className={`hover:bg-slate-50 cursor-pointer transition-colors group ${isSelected ? 'bg-indigo-50' : ''}`}
                  >
                    {activeTab === 'Scrapped' && (
                        <td className="px-8 py-5">
                            <input 
                                type="checkbox" 
                                checked={isSelected} 
                                onChange={(e) => toggleSelect(tyre.id, e)}
                                onClick={(e) => e.stopPropagation()}
                                className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" 
                            />
                        </td>
                    )}
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="font-black text-slate-900 group-hover:text-indigo-600 transition-colors text-sm">{tyre.id}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{tyre.brand} {tyre.model}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="text-xs font-black text-slate-700 uppercase">{locName}</div>
                      {tyre.currentVehicleId && <div className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">Mounted on {tyre.currentVehicleId}</div>}
                    </td>
                    <td className="px-8 py-5">
                      <span className={`px-2 py-0.5 text-[9px] font-black rounded border inline-block whitespace-nowrap ${getStatusColor(tyre.status)}`}>
                        {tyre.status.toUpperCase()}
                      </span>
                      {tyre.status === TyreStatus.SOLD && tyre.salePrice && (
                         <div className="text-[9px] font-bold text-green-600 mt-1">₹{tyre.salePrice.toLocaleString()}</div>
                      )}
                    </td>
                    <td className="px-8 py-5">
                      <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                        {tyre.currentLifeNo === 0 ? 'Original' : `RT-${tyre.currentLifeNo}`}
                      </div>
                    </td>
                    <td className="px-8 py-5 text-xs font-black text-slate-600">
                      {tyre.totalKm.toLocaleString()} KM
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={activeTab === 'Scrapped' ? 6 : 5} className="px-8 py-20 text-center opacity-40">
                    <p className="text-sm font-black text-slate-500 uppercase tracking-[0.2em] italic">No assets found in current filter view.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
