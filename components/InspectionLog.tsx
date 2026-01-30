
import React from 'react';
import { Inspection, Tyre } from '../types';

interface InspectionLogProps {
  inspections: Inspection[];
  tyres: Tyre[];
  onViewTyre: (id: string) => void;
}

export const InspectionLog: React.FC<InspectionLogProps> = ({ inspections, tyres, onViewTyre }) => {
  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar -mx-6 px-6">
      <div className="max-w-7xl mx-auto py-4">
        <div className="mb-8">
          <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Inspection Log</h1>
          <p className="text-xs text-slate-400 mt-1 font-bold uppercase tracking-[0.2em]">Historical record of all yard checks and technical audits.</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date & Time</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Asset ID</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Condition</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Pressure (PSI)</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tread (MM)</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Inspector</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {inspections.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map(insp => {
                const tyre = tyres.find(t => t.id === insp.tyreId);
                return (
                  <tr key={insp.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-xs font-black text-slate-900">{new Date(insp.timestamp).toLocaleDateString()}</p>
                      <p className="text-[9px] text-slate-400 font-bold">{new Date(insp.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs font-black text-indigo-600 uppercase">{insp.tyreId}</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase">{tyre?.brand} {tyre?.model}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 text-[9px] font-black rounded border uppercase ${
                        insp.condition === 'OK' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {insp.condition}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-black text-slate-700">
                      {insp.pressurePsi ? `${insp.pressurePsi} PSI` : '--'}
                    </td>
                    <td className="px-6 py-4 text-xs font-black text-slate-700">
                      {insp.treadDepthMm ? `${insp.treadDepthMm} MM` : '--'}
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-500 italic">
                      {insp.user}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => onViewTyre(insp.tyreId)}
                        className="text-[10px] font-black text-indigo-600 hover:text-indigo-800 uppercase tracking-widest"
                      >
                        View Asset
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {inspections.length === 0 && (
            <div className="p-20 text-center opacity-30">
              <p className="text-sm font-black text-slate-500 uppercase tracking-widest italic">No inspection history recorded.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
