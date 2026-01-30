
import React, { useState } from 'react';
import { Tyre } from '../types';

interface ScrapDisposalModalProps {
  selectedTyres: Tyre[];
  onClose: () => void;
  onSell: (buyerName: string, totalAmount: number, invoiceRef: string) => void;
}

export const ScrapDisposalModal: React.FC<ScrapDisposalModalProps> = ({ selectedTyres, onClose, onSell }) => {
  const [buyerName, setBuyerName] = useState('');
  const [totalAmount, setTotalAmount] = useState<string>('');
  const [invoiceRef, setInvoiceRef] = useState('');
  
  const estimatedWeight = selectedTyres.length * 55; // Approx 55kg per truck tyre

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-6 z-[100] animate-in fade-in duration-200">
      <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 flex flex-col">
        <div className="bg-slate-950 px-10 py-8 text-white flex justify-between items-center">
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight">Scrap Disposal</h2>
            <p className="text-amber-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Revenue Recovery Module</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-bold hover:bg-white/20 transition-all">✕</button>
        </div>

        <div className="p-10 space-y-6">
          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6">
             <div className="flex justify-between items-center mb-4">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Manifest Summary</span>
               <span className="text-xs font-black text-slate-900">{selectedTyres.length} Assets Selected</span>
             </div>
             <div className="space-y-1">
               <div className="flex justify-between text-xs">
                 <span className="text-slate-500 font-medium">Est. Total Weight</span>
                 <span className="font-bold text-slate-800">{estimatedWeight.toLocaleString()} kg</span>
               </div>
               <div className="flex justify-between text-xs">
                 <span className="text-slate-500 font-medium">Original Value</span>
                 <span className="font-bold text-slate-800">₹{selectedTyres.reduce((s,t) => s + t.purchaseCost, 0).toLocaleString()}</span>
               </div>
             </div>
          </div>

          <div className="space-y-4">
             <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Scrap Dealer / Buyer</label>
                <input 
                  type="text" 
                  value={buyerName}
                  onChange={e => setBuyerName(e.target.value)}
                  placeholder="e.g. City Scrap Traders"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold outline-none"
                />
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Sale Revenue (₹)</label>
                <input 
                  type="number" 
                  value={totalAmount}
                  onChange={e => setTotalAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-xl font-black text-green-700 outline-none"
                />
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Invoice / Receipt Ref</label>
                <input 
                  type="text" 
                  value={invoiceRef}
                  onChange={e => setInvoiceRef(e.target.value)}
                  placeholder="e.g. INV-SCR-2024-001"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold outline-none"
                />
             </div>
          </div>
          
          <div className="pt-4">
             <p className="text-[10px] text-center text-slate-400 mb-4 font-medium italic">Revenue will be amortized across selected units (₹{Math.round(Number(totalAmount) / (selectedTyres.length || 1))} / unit)</p>
             <button 
               disabled={!buyerName || !totalAmount}
               onClick={() => onSell(buyerName, Number(totalAmount), invoiceRef)}
               className="w-full py-5 bg-green-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
             >
               Confirm Sale
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};
