import React, { useState } from 'react';
import { Location, Tyre, TyreStatus, Vendor } from '../types';

interface GoodsReceiptModalProps {
  onClose: () => void;
  onReceive: (tyres: Tyre[], poRef: string, vendorId: string, locationId: string) => void;
  locations: Location[];
  vendors: Vendor[];
}

export const GoodsReceiptModal: React.FC<GoodsReceiptModalProps> = ({ onClose, onReceive, locations, vendors }) => {
  const [poRef, setPoRef] = useState('');
  const [vendorId, setVendorId] = useState(vendors[0]?.id || '');
  const [locationId, setLocationId] = useState(locations[0]?.id || '');
  
  // Bulk settings
  const [bulkQty, setBulkQty] = useState(1);
  const [baseSerial, setBaseSerial] = useState('');
  const [brand, setBrand] = useState('Michelin');
  const [model, setModel] = useState('X Multi Z');
  const [size, setSize] = useState('295/80 R22.5');
  const [cost, setCost] = useState(35000);

  // Stock Classification
  const [stockType, setStockType] = useState<'NEW' | 'RETREAD'>('NEW');
  const [retreadLife, setRetreadLife] = useState(1);

  const handleProcess = () => {
    if (!poRef || !baseSerial) return;

    const newTyres: Tyre[] = [];
    const timestamp = new Date().toISOString();
    
    // Adjust logic based on classification
    const lifeNo = stockType === 'NEW' ? 0 : retreadLife;
    const estimatedLife = stockType === 'NEW' ? 45000 : 35000; // Lower expectancy for retreads
    const startTread = stockType === 'NEW' ? 15 : 12; // Slightly lower tread for retreads often

    for (let i = 0; i < bulkQty; i++) {
      const serial = bulkQty > 1 ? `${baseSerial}-${i+1}` : baseSerial;
      newTyres.push({
        id: serial,
        brand,
        model,
        size,
        purchaseDate: timestamp.split('T')[0],
        purchaseCost: cost,
        status: TyreStatus.IN_STORE,
        locationId,
        lastActionDate: timestamp.split('T')[0],
        currentLifeNo: lifeNo,
        totalKm: 0,
        expectedLifeKm: estimatedLife,
        oemPsi: 110,
        initialTreadDepthMm: startTread
      });
    }

    onReceive(newTyres, poRef, vendorId, locationId);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-6 z-[100] animate-in fade-in duration-200">
      <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 flex flex-col">
        <div className="bg-slate-950 px-10 py-8 text-white flex justify-between items-center">
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight">Goods Receipt Note (GRN)</h2>
            <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Inward Stock Processing</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-bold hover:bg-white/20 transition-all">✕</button>
        </div>

        <div className="p-10 space-y-8 overflow-y-auto max-h-[70vh] custom-scrollbar">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Receiving Location</label>
              <select 
                value={locationId}
                onChange={e => setLocationId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-bold outline-none focus:ring-4 ring-indigo-500/10"
              >
                {locations.map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vendor</label>
              <select 
                value={vendorId}
                onChange={e => setVendorId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-bold outline-none focus:ring-4 ring-indigo-500/10"
              >
                {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">PO / Invoice Reference</label>
            <input 
              type="text" 
              value={poRef}
              onChange={e => setPoRef(e.target.value)}
              placeholder="e.g. PO-2024-8891"
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-4 ring-indigo-500/10"
            />
          </div>

          {/* New Classification Section */}
          <div className="bg-slate-50 p-1 rounded-2xl flex border border-slate-200">
             <button 
                onClick={() => { setStockType('NEW'); setCost(35000); }}
                className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${stockType === 'NEW' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
             >
                New Stock (Life 0)
             </button>
             <button 
                onClick={() => { setStockType('RETREAD'); setCost(12000); }}
                className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${stockType === 'RETREAD' ? 'bg-white shadow-sm text-orange-600' : 'text-slate-400 hover:text-slate-600'}`}
             >
                Retreaded Stock
             </button>
          </div>

          <div className="p-6 bg-slate-50 border border-slate-100 rounded-[24px] space-y-6">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest border-b border-slate-200 pb-2">Line Item Details</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-500 uppercase">Quantity</label>
                <input 
                  type="number" 
                  value={bulkQty}
                  min={1}
                  onChange={e => setBulkQty(Number(e.target.value))}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-500 uppercase">Base Serial No.</label>
                <input 
                  type="text" 
                  value={baseSerial}
                  onChange={e => setBaseSerial(e.target.value)}
                  placeholder="e.g. MIC-8000"
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-500 uppercase">Brand</label>
                <input type="text" value={brand} onChange={e => setBrand(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold outline-none"/>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-500 uppercase">Model</label>
                <input type="text" value={model} onChange={e => setModel(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold outline-none"/>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-500 uppercase">Size</label>
                <input type="text" value={size} onChange={e => setSize(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold outline-none"/>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase">Unit Cost (₹)</label>
                    <input type="number" value={cost} onChange={e => setCost(Number(e.target.value))} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold outline-none"/>
                </div>
                {stockType === 'RETREAD' && (
                    <div className="space-y-1 animate-in fade-in slide-in-from-left-2">
                        <label className="text-[9px] font-black text-orange-600 uppercase">Life Cycle No.</label>
                        <input 
                           type="number" 
                           value={retreadLife} 
                           min={1} 
                           max={5}
                           onChange={e => setRetreadLife(Number(e.target.value))} 
                           className="w-full bg-orange-50 border border-orange-200 text-orange-800 rounded-xl px-4 py-2 text-xs font-bold outline-none"
                        />
                    </div>
                )}
            </div>
          </div>

          <div className="p-4 bg-indigo-50 rounded-2xl flex items-center justify-between">
             <div className="text-xs font-black text-indigo-900 uppercase">Total GRN Value</div>
             <div className="text-xl font-black text-indigo-700">₹{(cost * bulkQty).toLocaleString()}</div>
          </div>
        </div>

        <div className="p-10 bg-slate-50 border-t border-slate-100 flex gap-4">
          <button onClick={onClose} className="flex-1 py-4 border-2 border-slate-200 rounded-2xl text-[10px] font-black uppercase text-slate-500 hover:bg-slate-100 transition-colors">Cancel</button>
          <button 
            onClick={handleProcess}
            disabled={!poRef || !baseSerial}
            className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase shadow-xl hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Confirm {stockType} Receipt
          </button>
        </div>
      </div>
    </div>
  );
};
