
import React from 'react';
import { VehicleType, Tyre, TPIBand, TyrePosition, formatPosition } from '../types';

interface TruckVisualizationProps {
  vehicleType: VehicleType;
  tyres: Tyre[];
  onTyreClick: (tyre: Tyre) => void;
  calculateTPI: (tyre: Tyre) => { band: TPIBand; score: number };
  selectedTyreId: string | null;
  inspections: any[];
  
  // New props for Rotation Mode
  isSelectionMode?: boolean;
  selectedTyreIds?: string[];
  
  // New prop for Driver Walkaround
  colorOverride?: Record<string, string>;
}

export const TruckVisualization: React.FC<TruckVisualizationProps> = ({ 
  vehicleType, 
  tyres, 
  onTyreClick, 
  calculateTPI,
  selectedTyreId,
  inspections,
  isSelectionMode = false,
  selectedTyreIds = [],
  colorOverride
}) => {
  
  const getLatestTread = (tyreId: string) => {
    const tyreInsps = inspections.filter(i => i.tyreId === tyreId).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return tyreInsps.length > 0 ? tyreInsps[0].treadDepthMm : 15;
  };

  const getTyreColor = (tyre?: Tyre) => {
    if (!tyre) return '#cbd5e1'; 
    
    // Custom color override (Driver Check)
    if (colorOverride && colorOverride[tyre.id]) {
      return colorOverride[tyre.id];
    }

    // In selection mode, if selected, show bright purple
    if (isSelectionMode && selectedTyreIds.includes(tyre.id)) {
        return '#4f46e5';
    }

    const { band } = calculateTPI(tyre);
    if (band === TPIBand.REPLACE) return '#ef4444';
    if (band === TPIBand.WATCH) return '#f59e0b';
    return '#10b981';
  };

  const findTyreByPosition = (axleIndex: number, side: 'Left' | 'Right', position: 'Inner' | 'Outer' | 'Single') => {
    return tyres.find(t => 
      t.position?.axleIndex === axleIndex && 
      t.position?.side === side && 
      t.position?.position === position
    );
  };

  const checkDualMismatch = (t1?: Tyre, t2?: Tyre) => {
    if (!t1 || !t2) return false;
    const tread1 = getLatestTread(t1.id);
    const tread2 = getLatestTread(t2.id);
    return Math.abs(tread1 - tread2) > 3;
  };

  // Find Spares
  const spareTyres = tyres
    .filter(t => t.position?.position === 'Spare')
    .sort((a, b) => (a.position?.axleIndex || 0) - (b.position?.axleIndex || 0));

  // State to track steering vs drive counts for labeling display
  let steerCount = 0;
  let driveCount = 0;

  const axleSpacing = 100;
  const steerDriveGap = 150;
  const svgWidth = 450;
  const headerHeight = 150;
  
  const calculateAxleY = (idx: number) => {
    let y = headerHeight + (idx * axleSpacing);
    const firstDriveIdx = vehicleType.axles.findIndex(a => !a.isSteer);
    if (firstDriveIdx !== -1 && idx >= firstDriveIdx) {
      y += (steerDriveGap - axleSpacing);
    }
    return y;
  };

  const lastAxleY = calculateAxleY(vehicleType.axles.length - 1);
  const spareY = lastAxleY + 130;
  const svgHeight = spareTyres.length > 0 ? spareY + 80 : lastAxleY + 100;

  return (
    <div className="relative flex flex-col items-center">
      <svg width={svgWidth} height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="drop-shadow-2xl">
        <rect x="140" y="20" width="170" height={svgHeight - 60} rx="12" fill="#0f172a" />
        <rect x="150" y="30" width="150" height="130" rx="10" fill="#1e293b" />
        <rect x="170" y="50" width="110" height="45" rx="4" fill="#334155" />

        {vehicleType.axles.map((axle, idx) => {
          const y = calculateAxleY(idx);
          let axleCode = '';
          if (axle.isSteer) {
            steerCount++;
            axleCode = steerCount.toString();
          } else {
            driveCount++;
            axleCode = (driveCount + 2).toString();
          }
          
          const trueAxleIndex = idx + 1;

          // Resolve Tyres for this axle
          const tL_Out = axle.isDual ? findTyreByPosition(trueAxleIndex, 'Left', 'Outer') : undefined;
          const tL_In = axle.isDual ? findTyreByPosition(trueAxleIndex, 'Left', 'Inner') : undefined;
          const tL_Sgl = !axle.isDual ? findTyreByPosition(trueAxleIndex, 'Left', 'Single') : undefined;
          
          const tR_In = axle.isDual ? findTyreByPosition(trueAxleIndex, 'Right', 'Inner') : undefined;
          const tR_Out = axle.isDual ? findTyreByPosition(trueAxleIndex, 'Right', 'Outer') : undefined;
          const tR_Sgl = !axle.isDual ? findTyreByPosition(trueAxleIndex, 'Right', 'Single') : undefined;

          // For rendering loop
          const positions: { pos: TyrePosition, tyre?: Tyre }[] = [];
          if (axle.isDual) {
            positions.push({ pos: { axleIndex: trueAxleIndex, side: 'Left', position: 'Outer' }, tyre: tL_Out });
            positions.push({ pos: { axleIndex: trueAxleIndex, side: 'Left', position: 'Inner' }, tyre: tL_In });
            positions.push({ pos: { axleIndex: trueAxleIndex, side: 'Right', position: 'Inner' }, tyre: tR_In });
            positions.push({ pos: { axleIndex: trueAxleIndex, side: 'Right', position: 'Outer' }, tyre: tR_Out });
          } else {
            positions.push({ pos: { axleIndex: trueAxleIndex, side: 'Left', position: 'Single' }, tyre: tL_Sgl });
            positions.push({ pos: { axleIndex: trueAxleIndex, side: 'Right', position: 'Single' }, tyre: tR_Sgl });
          }

          const hasMismatch = axle.isDual && (
            checkDualMismatch(tL_Out, tL_In) || 
            checkDualMismatch(tR_In, tR_Out)
          );

          return (
            <g key={idx}>
              <line 
                x1="80" y1={y} x2="370" y2={y} 
                stroke={hasMismatch ? "#ef4444" : "#334155"} 
                strokeWidth={hasMismatch ? "10" : "6"} 
                strokeDasharray={hasMismatch ? "" : "4 4"}
                className={hasMismatch ? "animate-pulse" : ""}
              />
              <text x="225" y={y - 45} textAnchor="middle" fill={hasMismatch ? "#f87171" : "#94a3b8"} fontSize="11" fontWeight="bold" className="uppercase tracking-widest">
                {axle.isSteer ? `Steer Axle ${axleCode}` : `Drive Axle ${axleCode}`} {hasMismatch ? "— MISMATCH" : ""}
              </text>

              {positions.map((p, pIdx) => {
                const { pos, tyre } = p;
                const isSelected = tyre && (selectedTyreId === tyre.id || selectedTyreIds.includes(tyre.id));
                const tWidth = axle.isSteer ? 38 : 32;
                const tHeight = axle.isSteer ? 62 : 54;
                
                let x = 0;
                if (axle.isDual) {
                   if (pos.side === 'Left' && pos.position === 'Outer') x = 140 - 45 - tWidth - 5;
                   else if (pos.side === 'Left' && pos.position === 'Inner') x = 140 - 45;
                   else if (pos.side === 'Right' && pos.position === 'Inner') x = 310 + 45 - tWidth;
                   else if (pos.side === 'Right' && pos.position === 'Outer') x = 310 + 45 + 5;
                } else {
                   if (pos.side === 'Left') x = 140 - 65;
                   else if (pos.side === 'Right') x = 310 + (65 - tWidth);
                }

                const color = getTyreColor(tyre);
                const label = formatPosition(pos);

                return (
                  <g key={pIdx} className={`cursor-pointer transition-all duration-300 ${!tyre ? 'opacity-30' : ''}`} onClick={() => tyre && onTyreClick(tyre)}>
                    <rect 
                      x={x} y={y - (tHeight/2)} width={tWidth} height={tHeight} rx="8" 
                      fill="#020617" 
                      stroke={isSelected ? "#4f46e5" : color} 
                      strokeWidth={isSelected ? "4" : tyre ? "2" : "1"}
                      className={isSelected ? "filter drop-shadow-[0_0_8px_rgba(79,70,229,0.6)]" : "hover:opacity-90"}
                    />
                    <text 
                      x={x + (tWidth/2)} y={y + 4} 
                      textAnchor="middle" 
                      fill={tyre ? "white" : "#475569"} 
                      fontSize={axle.isSteer ? "10" : "8"} 
                      fontWeight="black" 
                      className="pointer-events-none uppercase"
                    >
                      {label}
                    </text>
                    {tyre && tyre.totalKm > 20000 && !isSelectionMode && !colorOverride && (
                        <circle cx={x + tWidth - 6} cy={y - tHeight/2 + 6} r="3" fill="#f59e0b" />
                    )}
                  </g>
                );
              })}
            </g>
          );
        })}

        {/* Multiple Spare Tyres Visual */}
        {spareTyres.length > 0 && (
          <g>
             <line x1="180" y1={spareY - 50} x2="270" y2={spareY - 50} stroke="#334155" strokeWidth="2" strokeDasharray="4 4" />
             <text x="225" y={spareY - 60} textAnchor="middle" fill="#94a3b8" fontSize="11" fontWeight="bold" className="uppercase tracking-widest">
                SPARE UNITS
             </text>
             {spareTyres.map((tyre, idx) => {
               // Calculate X positions for centered, side-by-side layout
               const tWidth = 32;
               const gap = 12;
               const totalW = (spareTyres.length * tWidth) + ((spareTyres.length - 1) * gap);
               const startX = 225 - (totalW / 2);
               const x = startX + (idx * (tWidth + gap));
               
               const isSelected = selectedTyreId === tyre.id || selectedTyreIds.includes(tyre.id);
               const color = getTyreColor(tyre);

               return (
                 <g 
                   key={tyre.id}
                   className="cursor-pointer transition-all duration-300 hover:opacity-90" 
                   onClick={() => onTyreClick(tyre)}
                 >
                    <rect 
                       x={x} y={spareY - 27} width={tWidth} height="54" rx="8" 
                       fill="#020617" 
                       stroke={isSelected ? "#4f46e5" : color} 
                       strokeWidth={isSelected ? "4" : "2"}
                       className={isSelected ? "filter drop-shadow-[0_0_8px_rgba(79,70,229,0.6)]" : ""}
                    />
                    <text 
                       x={x + (tWidth/2)} y={spareY + 4} 
                       textAnchor="middle" 
                       fill="white" 
                       fontSize="8" 
                       fontWeight="black" 
                       className="pointer-events-none uppercase"
                    >
                       SP-{tyre.position?.axleIndex}
                    </text>
                 </g>
               );
             })}
          </g>
        )}
      </svg>
    </div>
  );
};
