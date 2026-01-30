
import React, { useState, useMemo } from 'react';
import { VehicleType, AxleDefinition, TPIBand, TyrePosition, formatPosition } from '../types';
import { TruckVisualization } from './TruckVisualization';

interface VehicleMasterProps {
  vehicleTypes: VehicleType[];
  onAddType: (type: VehicleType) => void;
  onDeleteType: (id: string) => void;
}

export const VehicleMaster: React.FC<VehicleMasterProps> = ({ vehicleTypes, onAddType, onDeleteType }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [viewingType, setViewingType] = useState<VehicleType | null>(null);
  const [newName, setNewName] = useState('');
  const [newAxles, setNewAxles] = useState<AxleDefinition[]>([]);

  const handleAddAxle = () => {
    const axleNo = newAxles.length + 1;
    const newAxle: AxleDefinition = {
      id: `Axle ${axleNo}`,
      isSteer: axleNo === 1,
      isDual: axleNo !== 1
    };
    setNewAxles([...newAxles, newAxle]);
  };

  const handleSave = () => {
    if (!newName || newAxles.length === 0) return;
    onAddType({
      id: `TYPE-${Date.now()}`,
      name: newName,
      axles: newAxles
    });
    setNewName('');
    setNewAxles([]);
    setIsAdding(false);
  };

  const previewType: VehicleType = useMemo(() => ({
    id: 'PREVIEW',
    name: newName || 'Blueprint Preview',
    axles: newAxles
  }), [newName, newAxles]);

  const getPositionsForType = (type: VehicleType): string[] => {
    const labels: string[] = [];
    type.axles.forEach((axle, idx) => {
      const axleIndex = idx + 1;
      const positions: TyrePosition[] = [];
      if (axle.isDual) {
        positions.push(
          { axleIndex, side: 'Left', position: 'Outer' },
          { axleIndex, side: 'Left', position: 'Inner' },
          { axleIndex, side: 'Right', position: 'Inner' },
          { axleIndex, side: 'Right', position: 'Outer' }
        );
      } else {
        positions.push(
          { axleIndex, side: 'Left', position: 'Single' },
          { axleIndex, side: 'Right', position: 'Single' }
        );
      }
      positions.forEach(p => labels.push(formatPosition(p)));
    });
    return labels;
  };

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar -mx-6 px-6">
      <div className="max-w-7xl mx-auto py-10 animate-in fade-in duration-300">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Vehicle Master</h1>
            <p className="text-sm text-slate-500 mt-1 font-medium">Define your fleet's unique wheel configurations and axle layouts.</p>
          </div>
          {!isAdding && (
            <button 
              onClick={() => setIsAdding(true)}
              className="px-6 py-3 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-xl hover:bg-indigo-700 transition-all"
            >
              + New Configuration
            </button>
          )}
        </div>

        {isAdding ? (
          <div className="bg-white rounded-[40px] border border-slate-200 shadow-2xl p-10 animate-in zoom-in-95">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              <div className="lg:col-span-5 space-y-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Configuration Name</label>
                  <input 
                    type="text" 
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:ring-4 ring-indigo-500/10"
                    placeholder="e.g. 5-Axle Heavy Hauler"
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Axle Stack</h3>
                    <button onClick={handleAddAxle} className="text-[10px] font-black text-indigo-600 uppercase">Add Axle +</button>
                  </div>
                  
                  <div className="space-y-3">
                    {newAxles.map((axle, idx) => (
                      <div key={idx} className="p-6 bg-slate-50 border border-slate-100 rounded-[24px] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                          <p className="text-xs font-black text-slate-900 uppercase">Axle {idx + 1}</p>
                          <p className="text-[9px] text-slate-400 font-black uppercase tracking-tighter">{axle.isDual ? 'Dual (4 Tyres)' : 'Single (2 Tyres)'}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button 
                            onClick={() => {
                              const updated = [...newAxles];
                              updated[idx].isDual = !updated[idx].isDual;
                              setNewAxles(updated);
                            }}
                            className={`px-4 py-2 text-[8px] font-black uppercase rounded-lg border transition-all ${axle.isDual ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-600'}`}
                          >
                            Dual
                          </button>
                          <button 
                            onClick={() => {
                              const updated = [...newAxles];
                              updated[idx].isSteer = !updated[idx].isSteer;
                              setNewAxles(updated);
                            }}
                            className={`px-4 py-2 text-[8px] font-black uppercase rounded-lg border transition-all ${axle.isSteer ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-600'}`}
                          >
                            Steer
                          </button>
                          <button 
                            onClick={() => setNewAxles(newAxles.filter((_, i) => i !== idx))}
                            className="px-4 py-2 text-[8px] font-black uppercase text-red-600 rounded-lg border border-red-100 hover:bg-red-50"
                          >
                            Rem
                          </button>
                        </div>
                      </div>
                    ))}
                    {newAxles.length === 0 && (
                      <div className="p-10 border-2 border-dashed border-slate-200 rounded-[32px] text-center">
                        <p className="text-xs text-slate-400 font-medium italic">No axles defined yet.</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 flex gap-4">
                  <button onClick={() => setIsAdding(false)} className="flex-1 py-5 border-2 border-slate-100 rounded-2xl text-[10px] font-black uppercase text-slate-500 hover:bg-slate-50 transition-colors">Cancel</button>
                  <button onClick={handleSave} className="flex-[2] py-5 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase shadow-2xl hover:bg-indigo-700 transition-all">Save Blueprint</button>
                </div>
              </div>

              <div className="lg:col-span-7 lg:sticky lg:top-10 h-[calc(100vh-200px)] min-h-[600px] bg-slate-50 border border-slate-200 rounded-[40px] overflow-hidden flex flex-col relative group">
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                
                <div className="p-8 border-b border-slate-200 bg-white/50 backdrop-blur-sm flex justify-between items-center shrink-0">
                  <div>
                    <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Live Blueprint Engine</h3>
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-tighter mt-1">Real-time Procedural Rendering</p>
                  </div>
                  <div className="flex gap-4">
                    <div className="text-right">
                      <p className="text-xs font-black text-slate-900">{newAxles.length}</p>
                      <p className="text-[8px] font-black text-slate-400 uppercase">Axles</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black text-slate-900">{newAxles.reduce((acc, a) => acc + (a.isDual ? 4 : 2), 0)}</p>
                      <p className="text-[8px] font-black text-slate-400 uppercase">Tyres</p>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-10 flex flex-col items-center">
                   {newAxles.length > 0 ? (
                      <div className="scale-75 origin-top">
                        <TruckVisualization 
                          vehicleType={previewType}
                          tyres={[]} 
                          onTyreClick={() => {}}
                          calculateTPI={() => ({ band: TPIBand.EXCELLENT, score: 100 })}
                          selectedTyreId={null}
                          inspections={[]}
                        />
                      </div>
                   ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 opacity-30">
                        <div className="w-24 h-24 bg-slate-200 rounded-full flex items-center justify-center text-4xl">🏗️</div>
                        <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Waiting for configuration...</p>
                      </div>
                   )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-10">
            {vehicleTypes.map(type => (
              <div 
                key={type.id} 
                onClick={() => setViewingType(type)}
                className="bg-white border border-slate-200 rounded-[32px] p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group flex flex-col justify-between"
              >
                 <div>
                   <div className="flex justify-between items-start mb-6">
                     <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-xl group-hover:bg-indigo-100 transition-colors">🚛</div>
                     <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteType(type.id);
                        }} 
                        className="text-slate-200 hover:text-red-500 transition-colors p-2"
                      >
                       <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                     </button>
                   </div>
                   <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight leading-tight mb-2">{type.name}</h3>
                   <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">View Blueprint →</p>
                 </div>
                 <div className="flex gap-6 border-t border-slate-100 pt-6 mt-4">
                   <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Axle Stack</p>
                      <p className="text-sm font-black text-slate-700">{type.axles.length} Units</p>
                   </div>
                   <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Wheel Map</p>
                      <p className="text-sm font-black text-slate-700">{type.axles.reduce((acc, a) => acc + (a.isDual ? 4 : 2), 0)} Tyres</p>
                   </div>
                 </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {viewingType && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl flex items-center justify-center p-6 z-[100] animate-in fade-in duration-300">
           <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-5xl h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
              <div className="bg-slate-950 px-10 py-8 text-white flex justify-between items-center shrink-0">
                <div>
                  <h2 className="text-2xl font-black uppercase tracking-tight">{viewingType.name}</h2>
                  <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Technical specification & Position map</p>
                </div>
                <button onClick={() => setViewingType(null)} className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center font-bold text-lg hover:bg-white/20 transition-all">✕</button>
              </div>

              <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
                 <div className="flex-[1.5] bg-slate-50 flex flex-col items-center justify-center overflow-y-auto p-10 relative">
                    <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
                    <div className="scale-90 origin-center relative z-10">
                      <TruckVisualization 
                        vehicleType={viewingType}
                        tyres={[]} 
                        onTyreClick={() => {}}
                        calculateTPI={() => ({ band: TPIBand.EXCELLENT, score: 100 })}
                        selectedTyreId={null}
                        inspections={[]}
                      />
                    </div>
                 </div>

                 <div className="flex-1 border-l border-slate-100 bg-white flex flex-col h-full overflow-hidden">
                    <div className="p-8 border-b border-slate-100 shrink-0">
                      <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-2">Wheel Map Anatomy</h3>
                      <p className="text-[10px] text-slate-400 font-medium">Following standard fleet identification protocols for this layout.</p>
                    </div>
                    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8">
                       {viewingType.axles.map((axle, idx) => {
                         const axleIndex = idx + 1;
                         const positions: TyrePosition[] = [];
                         if (axle.isDual) {
                            positions.push(
                              { axleIndex, side: 'Left', position: 'Outer' },
                              { axleIndex, side: 'Left', position: 'Inner' },
                              { axleIndex, side: 'Right', position: 'Inner' },
                              { axleIndex, side: 'Right', position: 'Outer' }
                            );
                         } else {
                            positions.push(
                              { axleIndex, side: 'Left', position: 'Single' },
                              { axleIndex, side: 'Right', position: 'Single' }
                            );
                         }

                         return (
                           <div key={idx} className="space-y-4">
                              <div className="flex items-center gap-3">
                                 <span className="w-6 h-6 bg-slate-900 text-white rounded-full flex items-center justify-center text-[9px] font-black">{axleIndex}</span>
                                 <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{axle.id} {axle.isSteer ? '(Steerable)' : '(Drive)'}</h4>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                 {positions.map(pos => (
                                    <div key={formatPosition(pos)} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                                      <p className="text-[9px] font-black text-indigo-600 uppercase tracking-tight">
                                        {pos.side} {pos.position}
                                      </p>
                                      <p className="text-xs font-black text-slate-700 mt-1 uppercase tracking-tighter">
                                        {formatPosition(pos)}
                                      </p>
                                    </div>
                                 ))}
                              </div>
                           </div>
                         );
                       })}
                    </div>
                    <div className="p-8 bg-slate-50 border-t border-slate-100 shrink-0">
                       <div className="flex justify-between items-end">
                          <div>
                             <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Total Assets Required</p>
                             <p className="text-2xl font-black text-slate-900">{getPositionsForType(viewingType).length} Tyres</p>
                          </div>
                          <button 
                            onClick={() => setViewingType(null)}
                            className="px-6 py-3 bg-slate-900 text-white text-[10px] font-black uppercase rounded-xl"
                          >
                            Close Explorer
                          </button>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
