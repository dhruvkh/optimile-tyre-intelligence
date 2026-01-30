
import React, { useState, useEffect } from 'react';
import { VehicleType, Tyre, Vehicle, TyrePosition, formatPosition, TPIBand } from '../types';
import { TruckVisualization } from './TruckVisualization';

interface RotationWizardProps {
  vehicle: Vehicle;
  vehicleType: VehicleType;
  currentTyres: Tyre[];
  onClose: () => void;
  onCreateJob: (moves: { tyreId: string, from: TyrePosition, to: TyrePosition }[]) => void;
  inspections: any[];
}

export const RotationWizard: React.FC<RotationWizardProps> = ({ 
  vehicle, 
  vehicleType, 
  currentTyres, 
  onClose, 
  onCreateJob,
  inspections
}) => {
  const [plannedTyres, setPlannedTyres] = useState<Tyre[]>([]);
  const [selectedTyreIds, setSelectedTyreIds] = useState<string[]>([]);
  const [moves, setMoves] = useState<{ tyreId: string, from: TyrePosition, to: TyrePosition }[]>([]);

  // Initialize planner with deep copy of current state
  useEffect(() => {
    setPlannedTyres(JSON.parse(JSON.stringify(currentTyres)));
  }, [currentTyres]);

  const handleTyreClick = (tyre: Tyre) => {
    if (selectedTyreIds.includes(tyre.id)) {
      setSelectedTyreIds([]); // Deselect if clicked again
      return;
    }

    if (selectedTyreIds.length === 0) {
      setSelectedTyreIds([tyre.id]); // Select first
    } else {
      // Select second and swap
      const firstId = selectedTyreIds[0];
      const secondId = tyre.id;
      performSwap(firstId, secondId);
      setSelectedTyreIds([]);
    }
  };

  const performSwap = (id1: string, id2: string) => {
    const t1Index = plannedTyres.findIndex(t => t.id === id1);
    const t2Index = plannedTyres.findIndex(t => t.id === id2);
    
    if (t1Index === -1 || t2Index === -1) return;

    const t1 = plannedTyres[t1Index];
    const t2 = plannedTyres[t2Index];

    if (!t1.position || !t2.position) return;

    // Record the move logic
    const newTyres = [...plannedTyres];
    
    // Swap positions in the local state object
    const pos1 = { ...t1.position };
    const pos2 = { ...t2.position };

    newTyres[t1Index] = { ...t1, position: pos2 };
    newTyres[t2Index] = { ...t2, position: pos1 };

    setPlannedTyres(newTyres);

    // Track the logical move for the Job Card
    // We strictly track from INITIAL state to FINAL state for job card, 
    // but for the UI history list, we show the step.
    setMoves(prev => [
      ...prev,
      { tyreId: id1, from: pos1, to: pos2 },
      { tyreId: id2, from: pos2, to: pos1 }
    ]);
  };

  const applyPattern = (type: 'cross_steer' | 'cross_drive' | 'rotate_drive') => {
    // Simple predefined logic for demo
    // Reset first
    const resetTyres = JSON.parse(JSON.stringify(currentTyres));
    setPlannedTyres(resetTyres);
    setMoves([]); // Clear manual moves logic, we will build new ones

    // This is a simplified pattern applicator. 
    // Real logic would strictly find L1/R1 and swap them.
    if (type === 'cross_steer') {
        const tL = resetTyres.find((t: Tyre) => t.position?.axleIndex === 1 && t.position?.side === 'Left');
        const tR = resetTyres.find((t: Tyre) => t.position?.axleIndex === 1 && t.position?.side === 'Right');
        if (tL && tR) {
            const pL = { ...tL.position };
            const pR = { ...tR.position };
            tL.position = pR;
            tR.position = pL;
            setPlannedTyres([...resetTyres]);
            setMoves([
                { tyreId: tL.id, from: pL, to: pR },
                { tyreId: tR.id, from: pR, to: pL }
            ]);
        }
    }
  };

  // Compile final diff for the job card
  const getFinalDiff = () => {
    const finalMoves: { tyreId: string, from: TyrePosition, to: TyrePosition }[] = [];
    plannedTyres.forEach(finalT => {
        const originalT = currentTyres.find(t => t.id === finalT.id);
        if (originalT && JSON.stringify(originalT.position) !== JSON.stringify(finalT.position)) {
            finalMoves.push({
                tyreId: finalT.id,
                from: originalT.position!,
                to: finalT.position!
            });
        }
    });
    return finalMoves;
  };

  const finalDiff = getFinalDiff();

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl flex items-center justify-center p-6 z-[100] animate-in fade-in duration-200">
      <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-6xl h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-slate-950 px-10 py-8 text-white flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight">Rotation Planner</h2>
            <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Interactive Layout Manager • {vehicle.plateNumber}</p>
          </div>
          <div className="flex gap-4">
             <button onClick={() => { setPlannedTyres(JSON.parse(JSON.stringify(currentTyres))); setMoves([]); }} className="text-xs font-bold text-slate-400 hover:text-white uppercase transition-colors">Reset Plan</button>
             <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-bold hover:bg-white/20 transition-all">✕</button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
           {/* Visualizer */}
           <div className="flex-[2] bg-slate-50 flex flex-col items-center justify-center relative p-10 overflow-y-auto">
              <div className="absolute top-6 left-6 z-10 bg-white/80 backdrop-blur p-4 rounded-2xl border border-slate-200 shadow-sm">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Controls</p>
                 <div className="space-y-2">
                    <button onClick={() => applyPattern('cross_steer')} className="block w-full text-left text-xs font-bold text-slate-700 hover:text-indigo-600">⇄ Cross Steer</button>
                    {/* Add more patterns as needed */}
                 </div>
              </div>
              
              <div className="scale-90 origin-center">
                <TruckVisualization 
                    vehicleType={vehicleType}
                    tyres={plannedTyres}
                    onTyreClick={handleTyreClick}
                    calculateTPI={() => ({ band: TPIBand.EXCELLENT, score: 100 })} // Dummy for visuals
                    selectedTyreId={null}
                    inspections={inspections}
                    isSelectionMode={true}
                    selectedTyreIds={selectedTyreIds}
                />
              </div>
              <p className="mt-6 text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Select two tyres to swap positions</p>
           </div>

           {/* Plan Sidebar */}
           <div className="flex-1 border-l border-slate-100 bg-white flex flex-col">
              <div className="p-8 border-b border-slate-100">
                 <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-1">Proposed Changes</h3>
                 <p className="text-[10px] text-slate-400 font-bold">Review moves before creating job card</p>
              </div>
              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-3">
                 {finalDiff.length > 0 ? finalDiff.map((move, idx) => (
                    <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between gap-4">
                       <div className="flex-1">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Asset</p>
                          <p className="text-xs font-black text-slate-900">{move.tyreId}</p>
                       </div>
                       <div className="text-slate-300">➔</div>
                       <div className="flex-1 text-right">
                          <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-1">New Pos</p>
                          <p className="text-xs font-black text-slate-900">{formatPosition(move.to)}</p>
                       </div>
                    </div>
                 )) : (
                    <div className="text-center py-20 opacity-30">
                       <p className="text-sm font-black text-slate-500 uppercase tracking-widest italic">No changes planned.</p>
                    </div>
                 )}
              </div>
              <div className="p-8 border-t border-slate-100 bg-slate-50">
                 <button 
                    disabled={finalDiff.length === 0}
                    onClick={() => onCreateJob(finalDiff)}
                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-indigo-700 disabled:bg-slate-200 disabled:shadow-none transition-all"
                 >
                    Create Rotation Job ({finalDiff.length / 2} Swaps)
                 </button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
