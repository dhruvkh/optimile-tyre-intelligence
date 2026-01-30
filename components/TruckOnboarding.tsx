
import React, { useState } from 'react';
import { VehicleType, Tyre, TyreStatus, Vehicle, TyrePosition, formatPosition } from '../types';

interface TruckOnboardingProps {
  onCancel: () => void;
  onComplete: (vehicle: Vehicle, tyres: Tyre[]) => void;
  availableInventory: Tyre[];
  vehicleTypes: VehicleType[];
}

interface PartialTyreData {
  id?: string;
  brand?: string;
  model?: string;
  treadDepth?: string;
  purchaseCost?: number;
}

export const TruckOnboarding: React.FC<TruckOnboardingProps> = ({ onCancel, onComplete, availableInventory, vehicleTypes }) => {
  const [step, setStep] = useState(1);
  const [vehicleData, setVehicleData] = useState<{
    plateNumber: string;
    typeId: string;
    odometer: string;
  }>({
    plateNumber: '',
    typeId: vehicleTypes[0]?.id,
    odometer: ''
  });
  
  // Spare Tyre Count
  const [spareCount, setSpareCount] = useState(1);
  
  // Bulk settings state
  const [bulkConfig, setBulkConfig] = useState({
    brand: '',
    model: '',
    cost: '35000'
  });

  // Map string representation (for input keys) to partial tyre data
  const [tyreAssignments, setTyreAssignments] = useState<Record<string, PartialTyreData>>({});

  const selectedType = vehicleTypes.find(t => t.id === vehicleData.typeId) || vehicleTypes[0];

  const getRequiredPositions = (): TyrePosition[] => {
    const pos: TyrePosition[] = [];
    selectedType.axles.forEach((axle, idx) => {
      const axleIndex = idx + 1;
      if (axle.isDual) {
        pos.push(
          { axleIndex, side: 'Left', position: 'Outer' },
          { axleIndex, side: 'Left', position: 'Inner' },
          { axleIndex, side: 'Right', position: 'Inner' },
          { axleIndex, side: 'Right', position: 'Outer' }
        );
      } else {
        pos.push(
          { axleIndex, side: 'Left', position: 'Single' },
          { axleIndex, side: 'Right', position: 'Single' }
        );
      }
    });

    if (spareCount > 0) {
      for (let i = 1; i <= spareCount; i++) {
        pos.push({ axleIndex: i, side: 'Right', position: 'Spare' });
      }
    }

    return pos;
  };

  const handleTyreInput = (posKey: string, field: keyof PartialTyreData, value: string) => {
    setTyreAssignments(prev => ({
      ...prev,
      [posKey]: { 
        ...(prev[posKey] || {}), 
        [field]: value 
      } as PartialTyreData
    }));
  };

  const applyBulkSettings = () => {
    const positions = getRequiredPositions();
    const newAssignments = { ...tyreAssignments };
    
    positions.forEach(pos => {
      const key = formatPosition(pos);
      if (!newAssignments[key]) newAssignments[key] = {};
      
      if (bulkConfig.brand) newAssignments[key].brand = bulkConfig.brand;
      if (bulkConfig.model) newAssignments[key].model = bulkConfig.model;
      if (bulkConfig.cost) newAssignments[key].purchaseCost = Number(bulkConfig.cost);
    });
    
    setTyreAssignments(newAssignments);
  };

  const handleSubmit = () => {
    const newVehicle: Vehicle = {
      id: `V-${Date.now()}`,
      plateNumber: vehicleData.plateNumber || 'NEW-TRUCK',
      typeId: vehicleData.typeId || selectedType.id,
      odometer: Number(vehicleData.odometer) || 0
    };

    const positions = getRequiredPositions();
    
    // Create tyres with specific data
    const newTyres: Tyre[] = positions.map(pos => {
      const key = formatPosition(pos);
      const assignment = tyreAssignments[key] || {};
      const currentTread = Number(assignment.treadDepth) || 15;
      const startTread = 15; // Assuming standard new tread
      
      // Rough estimation of life based on tread
      // If tread is < 8mm, assume it might be a retread or life 0 worn down. 
      // For brownfield, we default to Life 0 unless specified otherwise (could add input for life later)
      
      return {
        id: assignment.id || `T-${key}-${Date.now()}`,
        brand: assignment.brand || 'Generic',
        model: assignment.model || 'Road',
        size: '295/80 R22.5',
        purchaseDate: new Date().toISOString().split('T')[0],
        purchaseCost: assignment.purchaseCost || 35000,
        status: TyreStatus.FITTED,
        locationId: newVehicle.id,
        currentVehicleId: newVehicle.id,
        position: pos,
        lastActionDate: new Date().toISOString().split('T')[0],
        currentLifeNo: 0, 
        totalKm: 0, // Reset for new tracking, or could estimate based on wear if we had formula
        expectedLifeKm: 45000,
        initialTreadDepthMm: startTread,
        // We'll immediately log an inspection for the current tread in the backend logic usually
        // but for now we set the tyre's state to match
      };
    });

    onComplete(newVehicle, newTyres);
  };

  const positions = getRequiredPositions();
  const allFilled = positions.every(p => {
    const k = formatPosition(p);
    return tyreAssignments[k]?.id && tyreAssignments[k]?.brand && tyreAssignments[k]?.treadDepth;
  });

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar -mx-6 px-6">
      <div className="max-w-6xl mx-auto py-10 animate-in fade-in zoom-in-95 duration-300">
        <div className="bg-white rounded-[40px] shadow-2xl border border-slate-200 overflow-hidden min-h-[600px] flex flex-col">
          <div className="bg-slate-950 p-10 text-white flex justify-between items-center sticky top-0 z-10">
            <div>
              <h1 className="text-3xl font-black uppercase tracking-tight">Onboard Truck</h1>
              <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Brownfield Deployment & Asset Digitization</p>
            </div>
            <button onClick={onCancel} className="text-slate-500 hover:text-white transition-colors uppercase text-[10px] font-black tracking-widest">Discard</button>
          </div>

          <div className="p-10 flex-1">
            {step === 1 ? (
              <div className="space-y-10 animate-in slide-in-from-right-4">
                <div className="max-w-md mx-auto space-y-8">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">🚛</div>
                    <h2 className="text-lg font-black text-slate-900 uppercase">Vehicle Identification</h2>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Plate Number</label>
                      <input 
                        type="text" 
                        value={vehicleData.plateNumber}
                        onChange={e => setVehicleData({...vehicleData, plateNumber: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold focus:ring-4 ring-indigo-500/10 outline-none transition-all"
                        placeholder="e.g. MH-43-AW-9901"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Configuration Blueprint</label>
                      <select 
                        value={vehicleData.typeId}
                        onChange={e => setVehicleData({...vehicleData, typeId: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold outline-none"
                      >
                        {vehicleTypes.map(vt => <option key={vt.id} value={vt.id}>{vt.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Odometer (KM)</label>
                      <input 
                        type="number" 
                        value={vehicleData.odometer}
                        onChange={e => setVehicleData({...vehicleData, odometer: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold focus:ring-4 ring-indigo-500/10 outline-none transition-all"
                        placeholder="e.g. 154000"
                      />
                    </div>
                    
                    {/* Spare Tyre Toggle */}
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-black text-slate-700 uppercase">Spare Tyres Carried</p>
                            <p className="text-[10px] text-slate-400">Inventory mounted on chassis</p>
                        </div>
                        <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
                            <button 
                                onClick={() => setSpareCount(Math.max(0, spareCount - 1))}
                                className="w-8 h-8 flex items-center justify-center font-bold text-slate-500 hover:bg-slate-50 rounded-lg transition-colors"
                            >-</button>
                            <span className="text-sm font-black w-6 text-center text-slate-900">{spareCount}</span>
                            <button 
                                onClick={() => setSpareCount(Math.min(2, spareCount + 1))}
                                className="w-8 h-8 flex items-center justify-center font-bold text-slate-500 hover:bg-slate-50 rounded-lg transition-colors"
                            >+</button>
                        </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => setStep(2)}
                    disabled={!vehicleData.plateNumber || !vehicleData.odometer}
                    className="w-full py-5 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl disabled:bg-slate-200"
                  >
                    Map Tyres ({positions.length} Units) →
                  </button>
                </div>
              </div>
            ) : (
              <div className="animate-in slide-in-from-right-4">
                <div className="mb-8 bg-slate-50 border border-slate-100 rounded-3xl p-6">
                  <div className="flex justify-between items-center mb-4">
                     <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Bulk Settings</h3>
                     <button onClick={applyBulkSettings} className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline">Apply to Empty Slots</button>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <input 
                      placeholder="Default Brand (e.g. Michelin)" 
                      value={bulkConfig.brand} 
                      onChange={e => setBulkConfig({...bulkConfig, brand: e.target.value})}
                      className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold outline-none"
                    />
                    <input 
                      placeholder="Default Model (e.g. X Multi)" 
                      value={bulkConfig.model} 
                      onChange={e => setBulkConfig({...bulkConfig, model: e.target.value})}
                      className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold outline-none"
                    />
                    <input 
                      type="number"
                      placeholder="Est. Cost (₹)" 
                      value={bulkConfig.cost} 
                      onChange={e => setBulkConfig({...bulkConfig, cost: e.target.value})}
                      className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pb-10">
                  {positions.map(pos => {
                    const label = formatPosition(pos);
                    const data = tyreAssignments[label] || {};
                    const isSpare = pos.position === 'Spare';
                    
                    return (
                      <div key={label} className={`p-5 bg-white border rounded-[24px] shadow-sm hover:shadow-md transition-shadow ${isSpare ? 'border-indigo-100 bg-indigo-50/20' : 'border-slate-200'}`}>
                        <div className="flex justify-between items-center mb-3">
                          <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${isSpare ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-600'}`}>
                            {label}
                          </span>
                          {data.id && data.brand && data.treadDepth ? <span className="text-green-500 text-[10px]">✓ Ready</span> : <span className="text-slate-300 text-[10px]">Incomplete</span>}
                        </div>
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <input 
                            type="text" 
                            placeholder="Serial Number *"
                            value={data.id || ''}
                            onChange={e => handleTyreInput(label, 'id', e.target.value)}
                            className="col-span-2 w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:bg-white focus:border-indigo-300 transition-colors"
                          />
                          <input 
                            type="text" 
                            placeholder="Brand"
                            value={data.brand || ''}
                            onChange={e => handleTyreInput(label, 'brand', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-medium outline-none focus:bg-white focus:border-indigo-300 transition-colors"
                          />
                          <input 
                            type="text" 
                            placeholder="Model"
                            value={data.model || ''}
                            onChange={e => handleTyreInput(label, 'model', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-medium outline-none focus:bg-white focus:border-indigo-300 transition-colors"
                          />
                        </div>
                        <div className="flex items-center gap-3">
                           <div className="flex-1 relative">
                             <input 
                               type="number" 
                               step="0.1"
                               placeholder="Current Tread (mm) *"
                               value={data.treadDepth || ''}
                               onChange={e => handleTyreInput(label, 'treadDepth', e.target.value)}
                               className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:bg-white focus:border-indigo-300 transition-colors"
                             />
                           </div>
                           <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                              {Number(data.treadDepth) > 12 ? 'NEW' : Number(data.treadDepth) < 3 ? 'SCRAP' : 'USED'}
                           </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 flex gap-4 sticky bottom-0 bg-white py-6 border-t border-slate-100 z-20">
                  <button onClick={() => setStep(1)} className="flex-1 py-5 border-2 border-slate-100 rounded-2xl text-[10px] font-black uppercase text-slate-500">Back</button>
                  <button 
                    onClick={handleSubmit}
                    disabled={!allFilled}
                    className={`flex-[2] py-5 rounded-2xl text-[10px] font-black uppercase shadow-2xl transition-all ${
                      allFilled ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                    }`}
                  >
                    Commit & Finalize Fitment
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
