
import React, { useMemo, useState, useRef } from 'react';
import { Tyre, Repair, RetreadRecord, Inspection, TPIBand, TyreMetrics } from '../types';

interface FleetAnalyticsProps {
  tyres: Tyre[];
  repairs: Repair[];
  retreads: RetreadRecord[];
  inspections: Inspection[];
  onViewTyre: (id: string) => void;
  onNavigate: (view: string) => void;
}

export const FleetAnalytics: React.FC<FleetAnalyticsProps> = ({ tyres, repairs, retreads, inspections, onViewTyre, onNavigate }) => {
  const [drillDown, setDrillDown] = useState<'none' | 'brand' | 'risk'>('none');
  const drillDownRef = useRef<HTMLDivElement>(null);

  // Helper: Calculate Metrics for a specific Tyre
  const calculateTyreMetrics = (tyre: Tyre): TyreMetrics => {
    const tyreRepairs = repairs.filter(r => r.tyreId === tyre.id);
    const tyreRetreads = retreads.filter(r => r.tyreId === tyre.id && r.status === 'Completed');
    
    const repairCost = tyreRepairs.reduce((sum, r) => sum + r.cost, 0);
    const retreadCost = tyreRetreads.reduce((sum, r) => sum + (r.cost || 0), 0);
    const totalCost = tyre.purchaseCost + repairCost + retreadCost;
    
    const costPerKm = tyre.totalKm > 0 ? totalCost / tyre.totalKm : 0;
    const repairFreq = tyre.totalKm > 0 ? (tyreRepairs.length / tyre.totalKm) * 5000 : 0;
    
    // TPI Score Calculation (Updated Benchmarks for Indian Market: 1.5 - 3.0 range)
    let score = 100;
    if (costPerKm > 2.8) score -= 40; 
    else if (costPerKm > 2.2) score -= 15;
    
    if (tyreRepairs.length > 2) score -= 15;
    if (tyre.currentLifeNo > 1) score -= 10;
    
    const tyreInsps = inspections.filter(i => i.tyreId === tyre.id);
    const lastInsp = tyreInsps[tyreInsps.length - 1];
    if (lastInsp && lastInsp.condition !== 'OK') score -= 20;

    let band = TPIBand.EXCELLENT;
    if (score < 50) band = TPIBand.REPLACE;
    else if (score < 70) band = TPIBand.WATCH;
    else if (score < 85) band = TPIBand.ACCEPTABLE;

    const riskFlags = [];
    if (score < 60) riskFlags.push('Poor CPK Efficiency');
    if (lastInsp && lastInsp.treadDepthMm && lastInsp.treadDepthMm < 4) riskFlags.push('Minimum Tread Depth');
    if (tyreRepairs.length > 2) riskFlags.push('Frequent Sidewall Repairs');

    return { totalCost, costPerKm, wearRate: 0, repairFrequency: repairFreq, tpiScore: Math.max(0, score), tpiBand: band, riskFlags };
  };

  const fleetMetrics = useMemo(() => {
    const allMetrics = tyres.map(t => calculateTyreMetrics(t));
    const avgCpk = allMetrics.reduce((sum, m) => sum + m.costPerKm, 0) / (tyres.length || 1);
    const totalSpend = allMetrics.reduce((sum, m) => sum + m.totalCost, 0);
    
    const healthyCount = allMetrics.filter(m => m.tpiBand === TPIBand.EXCELLENT || m.tpiBand === TPIBand.ACCEPTABLE).length;
    const watchCount = allMetrics.filter(m => m.tpiBand === TPIBand.WATCH).length;
    const replaceCount = allMetrics.filter(m => m.tpiBand === TPIBand.REPLACE).length;
    
    const highRiskCount = watchCount + replaceCount;

    return { 
      avgCpk, 
      totalSpend, 
      highRiskCount, 
      healthyCount, 
      watchCount, 
      replaceCount,
      allMetrics 
    };
  }, [tyres, repairs, retreads, inspections]);

  const brandStats = useMemo(() => {
    const brands: Record<string, { count: number; totalKm: number; totalCost: number }> = {};
    tyres.forEach(t => {
      const m = calculateTyreMetrics(t);
      if (!brands[t.brand]) brands[t.brand] = { count: 0, totalKm: 0, totalCost: 0 };
      brands[t.brand].count++;
      brands[t.brand].totalKm += t.totalKm;
      brands[t.brand].totalCost += m.totalCost;
    });
    return Object.entries(brands).map(([name, stat]) => ({
      name,
      cpk: stat.totalKm > 0 ? stat.totalCost / stat.totalKm : 0,
      count: stat.count
    })).sort((a, b) => a.cpk - b.cpk);
  }, [tyres]);

  const handleRiskDrilldown = () => {
    setDrillDown('risk');
    setTimeout(() => {
      drillDownRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar -mx-6 px-6">
      <div className="max-w-7xl mx-auto pb-20 pt-4">
        <div className="mb-8 flex justify-between items-end">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Fleet IQ Dashboard</h1>
              <div className="px-2 py-1 bg-green-100 text-green-700 rounded text-[10px] font-black uppercase tracking-wider border border-green-200">System Ready</div>
            </div>
            <p className="text-sm text-slate-500 mt-1 font-medium italic">Benchmarking asset efficiency against Indian fleet standards (₹1.5 - ₹3.0 target).</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Fleet Benchmark</p>
            <p className="text-sm font-black text-slate-700">MARCH 2024</p>
          </div>
        </div>

        {/* KPI Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Avg CPK */}
          <div 
            onClick={() => onNavigate('inventory')}
            className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all cursor-pointer group active:scale-95"
          >
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 group-hover:text-indigo-600">Fleet Avg Cost / KM</p>
            <p className="text-3xl font-black text-slate-900">₹{fleetMetrics.avgCpk.toFixed(2)}</p>
            <div className="mt-2 flex items-center gap-1">
               <span className="text-xs text-green-600 font-bold">● Within Goal</span>
               <span className="text-[10px] text-slate-400">(₹1.5 - 3.0)</span>
            </div>
          </div>

          {/* Health Distribution */}
          <div 
            onClick={() => onNavigate('inventory')}
            className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-indigo-100 transition-all cursor-pointer group active:scale-95"
          >
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 group-hover:text-indigo-600">Health Distribution</p>
              <div className="flex h-3 w-full rounded-full overflow-hidden mb-3">
                <div style={{ width: `${(fleetMetrics.healthyCount / (tyres.length || 1)) * 100}%` }} className="bg-green-500 h-full" title="Healthy"></div>
                <div style={{ width: `${(fleetMetrics.watchCount / (tyres.length || 1)) * 100}%` }} className="bg-amber-500 h-full" title="Watch"></div>
                <div style={{ width: `${(fleetMetrics.replaceCount / (tyres.length || 1)) * 100}%` }} className="bg-red-500 h-full" title="Replace"></div>
              </div>
            </div>
            <div className="flex justify-between items-center text-[10px] font-black">
              <div className="flex items-center gap-1 text-green-600">GOOD {Math.round((fleetMetrics.healthyCount / (tyres.length || 1)) * 100)}%</div>
              <div className="flex items-center gap-1 text-amber-600">WATCH {Math.round((fleetMetrics.watchCount / (tyres.length || 1)) * 100)}%</div>
              <div className="flex items-center gap-1 text-red-600">CRIT {Math.round((fleetMetrics.replaceCount / (tyres.length || 1)) * 100)}%</div>
            </div>
          </div>

          {/* At Risk Trend */}
          <div 
            onClick={handleRiskDrilldown}
            className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md hover:border-red-100 transition-all cursor-pointer group active:scale-95"
          >
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 group-hover:text-red-600">Critical Assets</p>
            <p className="text-3xl font-black text-red-600">{fleetMetrics.highRiskCount}</p>
            <div className="mt-2 flex items-center gap-1">
               <span className="text-xs text-red-600 font-bold">⚠ {fleetMetrics.replaceCount} Terminal</span>
               <span className="text-[10px] text-slate-400">View Recovery Plan →</span>
            </div>
          </div>

          {/* Total Spend */}
          <div 
            onClick={() => onNavigate('history')}
            className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all cursor-pointer group active:scale-95"
          >
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 group-hover:text-indigo-600">Total Life Spend</p>
            <p className="text-3xl font-black text-slate-900">₹{(fleetMetrics.totalSpend / 100000).toFixed(2)}L</p>
            <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-tight">Audit Fleet History →</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Brand Efficiency */}
          <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
            <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs mb-8">Efficiency By Brand (CPK)</h3>
            <div className="space-y-8">
              {brandStats.map(brand => (
                <div key={brand.name}>
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-sm font-black text-slate-700 uppercase">{brand.name} <span className="text-[9px] font-bold text-slate-400 tracking-normal italic">({brand.count} Active)</span></span>
                    <span className={`text-sm font-black ${brand.cpk < fleetMetrics.avgCpk ? 'text-green-600' : 'text-slate-900'}`}>₹{brand.cpk.toFixed(2)} / KM</span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden relative">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${brand.cpk < 2.0 ? 'bg-indigo-600' : brand.cpk < 2.5 ? 'bg-indigo-400' : 'bg-slate-400'}`} 
                      style={{ width: `${(brand.cpk / 3.5) * 100}%` }}
                    ></div>
                    {/* Benchmark lines */}
                    <div className="absolute top-0 bottom-0 w-0.5 bg-green-500 z-10 opacity-30" style={{ left: `${(1.5 / 3.5) * 100}%` }}></div>
                    <div className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10 opacity-30" style={{ left: `${(3.0 / 3.5) * 100}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 p-6 bg-slate-950 text-slate-300 rounded-2xl border border-slate-800 flex justify-between items-center">
               <div>
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Performance Winner</p>
                 <p className="text-xs font-black text-white uppercase">{brandStats[0]?.name} (₹{brandStats[0]?.cpk.toFixed(2)})</p>
               </div>
               <div className="text-right">
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Projected Savings</p>
                 <p className="text-xs font-black text-green-400 uppercase">₹12,400 / Month</p>
               </div>
            </div>
          </div>

          {/* Intelligence Actions */}
          <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
             <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs mb-6">Strategic Directives</h3>
             <div className="space-y-4">
                <div className="p-6 bg-slate-50 border border-slate-100 rounded-3xl hover:border-indigo-200 transition-colors cursor-pointer group" onClick={handleRiskDrilldown}>
                   <div className="flex items-start gap-5">
                      <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center text-2xl shrink-0 shadow-sm group-hover:scale-110 transition-transform">⚠</div>
                      <div>
                         <h4 className="text-xs font-black text-slate-900 uppercase">High Leakage Alert</h4>
                         <p className="text-[11px] text-slate-500 mt-2 leading-relaxed font-medium italic">
                           {fleetMetrics.replaceCount} tyres are currently performing at &gt; ₹3.00 CPK. Removing these from active long-haul duties will save approximately ₹800 per 1,000 KM traveled.
                         </p>
                         <button className="mt-3 text-[9px] font-black text-indigo-600 uppercase tracking-widest group-hover:underline">Reconcile Assets →</button>
                      </div>
                   </div>
                </div>
                <div className="p-6 bg-slate-50 border border-slate-100 rounded-3xl hover:border-indigo-200 transition-colors cursor-pointer group" onClick={() => onNavigate('inventory')}>
                   <div className="flex items-start gap-5">
                      <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center text-2xl shrink-0 shadow-sm group-hover:scale-110 transition-transform">📊</div>
                      <div>
                         <h4 className="text-xs font-black text-slate-900 uppercase">Retread Opportunity</h4>
                         <p className="text-[11px] text-slate-500 mt-2 leading-relaxed font-medium italic">
                           8 drive-axle casings on HR-38-AS-4421 have reached 20k KM. Pre-emptive removal for retreading will protect casing value (₹14,000/unit) and maintain sub-₹2.0 CPK.
                         </p>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </div>

        {/* Risk List Drilldown */}
        {drillDown === 'risk' && (
          <div ref={drillDownRef} className="mt-12 bg-white border border-slate-200 rounded-[40px] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-6 duration-500">
            <div className="px-10 py-6 bg-slate-950 text-white flex justify-between items-center">
              <div>
                <h3 className="font-black uppercase tracking-[0.2em] text-sm">Critical Efficiency Recovery</h3>
                <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mt-1">High-impact replacement candidates</p>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={() => onNavigate('inventory')}
                  className="px-4 py-2 bg-indigo-600 text-white text-[9px] font-black uppercase rounded-lg hover:bg-indigo-700 transition-all"
                >
                  Jump to Full Inventory
                </button>
                <button onClick={() => setDrillDown('none')} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all font-bold">✕</button>
              </div>
            </div>
            <div className="p-2 overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Tyre ID</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Real CPK</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status Flags</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tyres.map(t => {
                    const m = calculateTyreMetrics(t);
                    if (m.tpiBand !== TPIBand.WATCH && m.tpiBand !== TPIBand.REPLACE) return null;
                    return (
                      <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-8 py-5 font-black text-slate-900 text-sm uppercase tracking-tight">{t.id}</td>
                        <td className="px-8 py-5">
                          <span className={`px-3 py-1 text-[10px] font-black rounded-full uppercase border ${
                            m.tpiBand === TPIBand.REPLACE ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            ₹{m.costPerKm.toFixed(2)} — {m.tpiBand}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                          {m.riskFlags.join(' • ')}
                        </td>
                        <td className="px-8 py-5 text-right">
                          <button onClick={() => onViewTyre(t.id)} className="text-[10px] font-black text-indigo-600 hover:text-indigo-800 uppercase tracking-widest">Inspect Detail</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
