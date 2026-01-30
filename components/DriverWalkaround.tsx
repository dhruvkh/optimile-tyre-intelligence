
import React, { useState, useMemo } from 'react';
import { Vehicle, Tyre, VehicleType, TPIBand, Inspection } from '../types';
import { TruckVisualization } from './TruckVisualization';

interface DriverWalkaroundProps {
  vehicles: Vehicle[];
  vehicleTypes: VehicleType[];
  tyres: Tyre[];
  onSaveInspection: (inspections: Inspection[]) => void;
}

type CheckStatus = 'PENDING' | 'GOOD' | 'ISSUE';

interface CheckState {
  status: CheckStatus;
  issueType?: string;
  notes?: string;
}

export const DriverWalkaround: React.FC<DriverWalkaroundProps> = ({ 
  vehicles, 
  vehicleTypes, 
  tyres, 
  onSaveInspection 
}) => {
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(vehicles[0]?.id || '');
  const [checks, setChecks] = useState<Record<string, CheckState>>({});
  const [activeTyre, setActiveTyre] = useState<Tyre | null>(null);

  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);
  const selectedVehicleType = vehicleTypes.find(vt => vt.id === selectedVehicle?.typeId);
  const vehicleTyres = tyres.filter(t => t.currentVehicleId === selectedVehicleId);

  const pendingCount = vehicleTyres.filter(t => !checks[t.id]).length;
  const issueCount = Object.values(checks).filter((c: CheckState) => c.status === 'ISSUE').length;

  const colorOverride = useMemo(() => {
    const map: Record<string, string> = {};
    vehicleTyres.forEach(t => {
      const check = checks[t.id];
      if (!check) map[t.id] = '#94a3b8'; // PENDING (Slate-400)
      else if (check.status === 'GOOD') map[t.id] = '#22c55e'; // GOOD (Green-500)
      else if (check.status === 'ISSUE') map[t.id] = '#ef4444'; // ISSUE (Red-500)
    });
    return map;
  }, [vehicleTyres, checks]);

  const handleTyreClick = (tyre: Tyre) => {
    setActiveTyre(tyre);
  };

  const commitCheck = (status: CheckStatus, issueType?: string) => {
    if (activeTyre) {
      setChecks(prev => ({
        ...prev,
        [activeTyre.id]: { status, issueType }
      }));
      setActiveTyre(null);
    }
  };

  const handleSubmit = () => {
    const inspections: Inspection[] = [];
    const timestamp = new Date().toISOString();
    
    vehicleTyres.forEach(t => {
      const check = checks[t.id];
      if (check) {
        inspections.push({
          id: `INSP-D-${Date.now()}-${t.id}`,
          tyreId: t.id,
          condition: check.status === 'GOOD' ? 'OK' : (check.issueType as any) || 'Damaged',
          timestamp,
          user: 'Driver',
          remarks: check.notes || 'Pre-trip Walkaround Check'
        });
      }
    });

    onSaveInspection(inspections);
    // Reset
    setChecks({});
    alert('Inspection Logged Successfully');
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      {/* Driver Header */}
      <div className="bg-slate-900 px-6 py-6 pb-12 shrink-0">
         <h1 className="text-xl font-black text-white uppercase tracking-tight mb-4">Pre-Trip Check</h1>
         
         <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Select Vehicle</label>
            <select 
               value={selectedVehicleId}
               onChange={e => { setSelectedVehicleId(e.target.value); setChecks({}); }}
               className="w-full bg-slate-800 text-white border border-slate-700 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 ring-indigo-500"
            >
               {vehicles.map(v => <option key={v.id} value={v.id}>{v.plateNumber}</option>)}
            </select>
         </div>
      </div>

      <div className="flex-1 overflow-y-auto -mt-6 rounded-t-[32px] bg-slate-50 relative z-10 flex flex-col">
         <div className="p-6 flex justify-between items-center border-b border-slate-200 bg-white rounded-t-[32px] shadow-sm shrink-0 sticky top-0 z-20">
            <div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Remaining</p>
               <p className="text-xl font-black text-slate-900">{pendingCount} <span className="text-sm text-slate-400 font-bold">Tyres</span></p>
            </div>
            {issueCount > 0 && (
               <div className="text-right">
                  <p className="text-[10px] font-black text-red-400 uppercase tracking-widest">Issues Found</p>
                  <p className="text-xl font-black text-red-600">{issueCount}</p>
               </div>
            )}
         </div>

         {/* Visualizer Container */}
         <div className="flex-1 p-6 flex items-center justify-center bg-slate-100/50">
            {selectedVehicleType ? (
               <div className="scale-100 sm:scale-110 origin-top">
                  <TruckVisualization 
                     vehicleType={selectedVehicleType}
                     tyres={vehicleTyres}
                     onTyreClick={handleTyreClick}
                     calculateTPI={() => ({ band: TPIBand.EXCELLENT, score: 100 })}
                     selectedTyreId={activeTyre?.id || null}
                     inspections={[]}
                     colorOverride={colorOverride}
                  />
               </div>
            ) : (
               <p className="text-xs font-bold text-slate-400">Select a vehicle to start check</p>
            )}
         </div>

         {/* Footer Action */}
         <div className="p-6 bg-white border-t border-slate-200 shrink-0">
            <button 
               onClick={handleSubmit}
               disabled={pendingCount > 0}
               className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all ${
                  pendingCount === 0 ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
               }`}
            >
               {pendingCount > 0 ? `Complete ${pendingCount} More Checks` : 'Submit Inspection Log'}
            </button>
         </div>
      </div>

      {/* Check Modal */}
      {activeTyre && (
         <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-10 duration-300">
               <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                  <div>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Inspecting Asset</p>
                     <p className="text-lg font-black text-slate-900">{activeTyre.id}</p>
                  </div>
                  <button onClick={() => setActiveTyre(null)} className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-500">✕</button>
               </div>
               
               <div className="p-8 space-y-4">
                  <button 
                     onClick={() => commitCheck('GOOD')}
                     className="w-full py-5 bg-green-50 text-green-700 border-2 border-green-100 hover:bg-green-100 hover:border-green-200 rounded-2xl text-sm font-black uppercase tracking-widest transition-all"
                  >
                     Looks Good 👍
                  </button>
                  
                  <div className="relative flex py-2 items-center">
                     <div className="flex-grow border-t border-slate-100"></div>
                     <span className="flex-shrink-0 mx-4 text-[9px] font-black text-slate-300 uppercase tracking-widest">Or Report Issue</span>
                     <div className="flex-grow border-t border-slate-100"></div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                     <button onClick={() => commitCheck('ISSUE', 'Cut')} className="p-4 bg-red-50 text-red-600 border border-red-100 rounded-xl text-[10px] font-black uppercase hover:bg-red-100">Cut / Bulge</button>
                     <button onClick={() => commitCheck('ISSUE', 'Damaged')} className="p-4 bg-red-50 text-red-600 border border-red-100 rounded-xl text-[10px] font-black uppercase hover:bg-red-100">Puncture</button>
                     <button onClick={() => commitCheck('ISSUE', 'Uneven')} className="p-4 bg-red-50 text-red-600 border border-red-100 rounded-xl text-[10px] font-black uppercase hover:bg-red-100">Low Pressure</button>
                     <button onClick={() => commitCheck('ISSUE', 'Uneven')} className="p-4 bg-red-50 text-red-600 border border-red-100 rounded-xl text-[10px] font-black uppercase hover:bg-red-100">Bald / Worn</button>
                  </div>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};
