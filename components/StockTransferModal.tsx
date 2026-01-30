
import React, { useState } from 'react';
import { Location, Tyre, TyreStatus } from '../types';

interface StockTransferModalProps {
  onClose: () => void;
  onTransfer: (tyreIds: string[], targetLocationId: string) => void;
  locations: Location[];
  availableTyres: Tyre[];
  currentLocationId: string;
}

export const StockTransferModal: React.FC<StockTransferModalProps> = ({ onClose, onTransfer, locations, availableTyres, currentLocationId }) => {
  const [targetLocationId, setTargetLocationId] = useState(locations.find(l => l.id !== currentLocationId)?.id || '');
  const [selectedTyreIds, setSelectedTyreIds] = useState<Set<string>>(new Set());

  const toggleTyre = (id: string) => {
    const newSet = new Set(selectedTyreIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedTyreIds(newSet);
  };

  const handleTransfer = () => {
    if (selectedTyreIds.size > 0 && targetLocationId) {
      onTransfer(Array.from(selectedTyreIds), targetLocationId);
    }
  };

  const currentLocationName = locations.find(l => l.id === currentLocationId)?.name || currentLocationId;

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-6 z-[100] animate-in fade-in duration-200">
      <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 flex flex-col h-[80vh]">
        <div className="bg-slate-950 px-10 py-8 text-white flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight">Stock Transfer</h2>
            <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Inter-Hub Asset Movement</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-bold hover:bg-white/20 transition-all">✕</button>
        </div>

        <div className="p-8 border-b border-slate-100 bg-slate-50 flex items-center justify-between gap-8 shrink-0">
           <div className="flex-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Source</p>
              <p className="text-sm font-black text-slate-900">{currentLocationName}</p>
           </div>
           <div className="text-2xl text-slate-300">➔</div>
           <div className="flex-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Destination</p>
              <select 
                value={targetLocationId}
                onChange={e => setTargetLocationId(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:ring-2 ring-indigo-500/20"
              >
                {locations.filter(l => l.id !== currentLocationId).map(loc => (
                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                ))}
              </select>
           </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
           <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-4">Select Assets to Move ({selectedTyreIds.size})</h3>
           {availableTyres.length > 0 ? (
             <div className="space-y-2">
               {availableTyres.map(tyre => (
                 <div 
                   key={tyre.id} 
                   onClick={() => toggleTyre(tyre.id)}
                   className={`p-4 rounded-2xl border-2 flex justify-between items-center cursor-pointer transition-all ${
                     selectedTyreIds.has(tyre.id) ? 'border-indigo-600 bg-indigo-50' : 'border-slate-100 hover:border-slate-200'
                   }`}
                 >
                    <div>
                       <p className="text-xs font-black text-slate-900">{tyre.id}</p>
                       <p className="text-[10px] text-slate-500 font-bold uppercase">{tyre.brand} {tyre.model}</p>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedTyreIds.has(tyre.id) ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300'}`}>
                       {selectedTyreIds.has(tyre.id) && '✓'}
                    </div>
                 </div>
               ))}
             </div>
           ) : (
             <div className="text-center py-20 opacity-40">
               <p className="text-sm font-black text-slate-500 uppercase tracking-widest">No available stock at source.</p>
             </div>
           )}
        </div>

        <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4 shrink-0">
          <button onClick={onClose} className="flex-1 py-4 border-2 border-slate-200 rounded-2xl text-[10px] font-black uppercase text-slate-500 hover:bg-slate-100 transition-colors">Cancel</button>
          <button 
            onClick={handleTransfer}
            disabled={selectedTyreIds.size === 0}
            className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase shadow-xl hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Transfer {selectedTyreIds.size} Units
          </button>
        </div>
      </div>
    </div>
  );
};
