
import React from 'react';
import { JobCard, JobStatus, TyrePosition, formatPosition, UserRole } from '../types';

interface JobCardBoardProps {
  jobCards: JobCard[];
  onIssueStock: (jobId: string) => void;
  onCompleteJob: (jobId: string) => void;
  userRole: UserRole;
}

export const JobCardBoard: React.FC<JobCardBoardProps> = ({ jobCards, onIssueStock, onCompleteJob, userRole }) => {
  
  const getStatusColor = (status: JobStatus) => {
    switch(status) {
      case JobStatus.OPEN: return 'bg-blue-50 border-blue-200 text-blue-700';
      case JobStatus.IN_PROGRESS: return 'bg-amber-50 border-amber-200 text-amber-700';
      case JobStatus.COMPLETED: return 'bg-green-50 border-green-200 text-green-700';
      default: return 'bg-slate-50 border-slate-200 text-slate-700';
    }
  };

  const columns = [
    { id: JobStatus.OPEN, label: 'Open Jobs', description: 'Waiting for Stock Issue / Plan' },
    { id: JobStatus.IN_PROGRESS, label: 'In Progress', description: 'Stock Issued / Fitment Pending' },
    { id: JobStatus.COMPLETED, label: 'History (24h)', description: 'Recently Completed' }
  ];

  const canIssue = userRole === UserRole.FLEET_ADMIN || userRole === UserRole.MAINTENANCE_MANAGER;
  const canComplete = userRole === UserRole.FLEET_ADMIN || userRole === UserRole.MAINTENANCE_MANAGER; // In real app, Mechanic role

  return (
    <div className="flex-1 overflow-x-auto overflow-y-hidden -mx-6 px-6 h-full flex flex-col">
      <div className="py-4">
        <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Work Orders</h1>
        <p className="text-xs text-slate-400 mt-1 font-bold uppercase tracking-[0.2em]">Live Job Floor • Role Based Workflow</p>
      </div>

      <div className="flex-1 grid grid-cols-3 gap-6 min-w-[1000px] pb-10">
        {columns.map(col => (
          <div key={col.id} className="flex flex-col h-full bg-slate-100/50 rounded-[32px] border border-slate-200/60 p-4">
            <div className="px-4 py-3 mb-2">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">{col.label}</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{col.description}</p>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 px-2">
              {jobCards.filter(jc => jc.status === col.id).map(card => (
                <div key={card.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{card.id}</span>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded border uppercase ${card.priority === 'High' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>{card.priority}</span>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-xs font-black text-slate-800 uppercase flex items-center gap-2">
                        {card.vehicleId} 
                        {card.type === 'ROTATION' && <span className="text-[9px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded border border-indigo-100">ROTATION</span>}
                        {card.type === 'ALIGNMENT' && <span className="text-[9px] bg-purple-50 text-purple-600 px-2 py-0.5 rounded border border-purple-100">ALIGNMENT</span>}
                    </p>
                    
                    {card.type === 'ALIGNMENT' && (
                        <div className="mt-2 p-2 bg-purple-50/50 rounded-lg border border-purple-100">
                           <p className="text-[9px] font-bold text-purple-800 uppercase">Corrective Maintenance</p>
                           <p className="text-[10px] text-slate-600 mt-0.5">Check toe/camber/caster settings.</p>
                           <p className="text-[9px] text-slate-400 mt-1 italic">Triggered by: {card.targetTyreId}</p>
                        </div>
                    )}

                    {card.type === 'ROTATION' && card.rotationList ? (
                        <div className="mt-2 space-y-1">
                            {card.rotationList.slice(0, 2).map((m, idx) => (
                                <p key={idx} className="text-[9px] text-slate-500 uppercase font-medium">
                                    Move <span className="font-bold text-slate-700">{m.tyreId}</span> to {formatPosition(m.to)}
                                </p>
                            ))}
                            {card.rotationList.length > 2 && <p className="text-[9px] text-slate-400 italic">...and {card.rotationList.length - 2} more moves</p>}
                        </div>
                    ) : null}

                    {(card.type === 'REPLACEMENT' || card.type === 'INSPECTION') && (
                        <>
                            <p className="text-[10px] text-slate-500 mt-1 uppercase font-medium">Remove: <span className="font-bold text-slate-700">{card.targetTyreId}</span> <span className="text-slate-300">•</span> {formatPosition(card.position)}</p>
                            {card.replacementTyreId && (
                            <p className="text-[10px] text-slate-500 mt-0.5 uppercase font-medium">Install: <span className="font-bold text-indigo-600">{card.replacementTyreId}</span></p>
                            )}
                        </>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                    <div className="text-[9px] text-slate-400 font-bold uppercase">
                      {new Date(card.createdAt).toLocaleDateString()}
                    </div>
                    
                    {col.id === JobStatus.OPEN && (
                      <button 
                        onClick={() => onIssueStock(card.id)}
                        disabled={!canIssue}
                        className="px-3 py-1.5 bg-slate-900 text-white text-[9px] font-black uppercase rounded-lg hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {card.type === 'ROTATION' || card.type === 'ALIGNMENT' ? 'Approve Plan' : 'Issue Stock'}
                      </button>
                    )}

                    {col.id === JobStatus.IN_PROGRESS && (
                      <button 
                        onClick={() => onCompleteJob(card.id)}
                        disabled={!canComplete}
                        className="px-3 py-1.5 bg-green-600 text-white text-[9px] font-black uppercase rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Complete
                      </button>
                    )}
                    
                    {col.id === JobStatus.COMPLETED && (
                      <span className="text-[9px] font-black text-green-600 uppercase">Done</span>
                    )}
                  </div>
                </div>
              ))}
              {jobCards.filter(jc => jc.status === col.id).length === 0 && (
                <div className="p-10 text-center opacity-30">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">No jobs in this stage</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
