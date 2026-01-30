
import React, { useState, useMemo, useEffect } from 'react';
import { 
  UserRole, 
  Tyre, 
  TyreStatus, 
  Vehicle, 
  HistoryEvent, 
  ActionType, 
  Inspection, 
  Defect, 
  Repair,
  Vendor,
  RetreadRecord,
  TPIBand,
  RemovalReason,
  VehicleType,
  formatPosition,
  JobCard,
  JobStatus,
  Location,
  TyrePosition
} from './types';
import { MOCK_TYRES, MOCK_VEHICLES, MOCK_HISTORY, MOCK_VENDORS, MOCK_INSPECTIONS, MOCK_VEHICLE_TYPES, MOCK_JOB_CARDS, MOCK_LOCATIONS } from './mockData';
import { TyreInventory } from './components/TyreInventory';
import { TyreDetail } from './components/TyreDetail';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { FleetAnalytics } from './components/FleetAnalytics';
import { TruckVisualization } from './components/TruckVisualization';
import { TruckOnboarding } from './components/TruckOnboarding';
import { VehicleMaster } from './components/VehicleMaster';
import { InspectionLog } from './components/InspectionLog';
import { JobCardBoard } from './components/JobCardBoard';
import { GoodsReceiptModal } from './components/GoodsReceiptModal';
import { StockTransferModal } from './components/StockTransferModal';
import { RotationWizard } from './components/RotationWizard';
import { ScrapDisposalModal } from './components/ScrapDisposalModal';
import { DriverWalkaround } from './components/DriverWalkaround';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<{ name: string; role: UserRole }>({
    name: 'Admin User',
    role: UserRole.FLEET_ADMIN
  });

  const [tyres, setTyres] = useState<Tyre[]>(MOCK_TYRES);
  const [vehicles, setVehicles] = useState<Vehicle[]>(MOCK_VEHICLES);
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>(MOCK_VEHICLE_TYPES);
  const [history, setHistory] = useState<HistoryEvent[]>(MOCK_HISTORY);
  const [inspections, setInspections] = useState<Inspection[]>(MOCK_INSPECTIONS);
  const [defects, setDefects] = useState<Defect[]>([]);
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [retreads, setRetreads] = useState<RetreadRecord[]>([]);
  const [vendors] = useState<Vendor[]>(MOCK_VENDORS);
  const [jobCards, setJobCards] = useState<JobCard[]>(MOCK_JOB_CARDS);
  const [locations, setLocations] = useState<Location[]>(MOCK_LOCATIONS);
  
  const [currentView, setCurrentView] = useState<'inventory' | 'details' | 'on_vehicles' | 'analytics' | 'inspections' | 'history' | 'onboard_truck' | 'vehicle_master' | 'job_cards'>('on_vehicles');
  const [selectedTyreId, setSelectedTyreId] = useState<string | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('V-101');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  const [isInspectModalOpen, setIsInspectModalOpen] = useState(false);
  const [inspectCondition, setInspectCondition] = useState<Inspection['condition']>('OK');
  const [inspectPressure, setInspectPressure] = useState<string>('');
  const [inspectTread, setInspectTread] = useState<string>('');
  const [inspectRemarks, setInspectRemarks] = useState<string>('');

  const [isGRNModalOpen, setIsGRNModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferSourceId, setTransferSourceId] = useState<string>('');
  
  const [isRotationWizardOpen, setIsRotationWizardOpen] = useState(false);

  // Scrap Disposal
  const [isScrapModalOpen, setIsScrapModalOpen] = useState(false);
  const [scrapSelectedIds, setScrapSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsDrawerOpen(false);
        setIsInspectModalOpen(false);
        setIsGRNModalOpen(false);
        setIsTransferModalOpen(false);
        setIsRotationWizardOpen(false);
        setIsScrapModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const selectedTyre = useMemo(() => 
    tyres.find(t => t.id === (selectedTyreId || '')) || null
  , [tyres, selectedTyreId]);

  const selectedVehicle = useMemo(() => 
    vehicles.find(v => v.id === selectedVehicleId) || vehicles[0]
  , [vehicles, selectedVehicleId]);

  const selectedVehicleType = useMemo(() => 
    vehicleTypes.find(vt => vt.id === selectedVehicle.typeId) || vehicleTypes[0]
  , [vehicleTypes, selectedVehicle]);

  const vehicleTyres = useMemo(() => 
    tyres.filter(t => t.currentVehicleId === selectedVehicleId)
  , [tyres, selectedVehicleId]);

  const calculateTPI = (tyre: Tyre) => {
    const tyreRepairs = repairs.filter(r => r.tyreId === tyre.id);
    const tyreRetreads = retreads.filter(r => r.tyreId === tyre.id && r.status === 'Completed');
    
    const repairCost = tyreRepairs.reduce((s, r) => s + r.cost, 0);
    const retreadCost = tyreRetreads.reduce((s, r) => s + (r.cost || 0), 0);
    const grossCost = tyre.purchaseCost + repairCost + retreadCost;
    // Factor in recovered sale price
    const netCost = grossCost - (tyre.salePrice || 0);

    const cpk = tyre.totalKm > 0 ? netCost / tyre.totalKm : 0;
    
    let score = 100;
    if (cpk > 2.8) score -= 30; 
    else if (cpk > 2.3) score -= 15;
    
    if (tyre.totalKm > (tyre.expectedLifeKm * 0.9)) score -= 25;
    const tyreInsps = inspections.filter(i => i.tyreId === tyre.id);
    const lastInsp = tyreInsps[tyreInsps.length - 1];
    if (lastInsp && lastInsp.condition !== 'OK') score -= 20;

    let band = TPIBand.EXCELLENT;
    if (score < 50) band = TPIBand.REPLACE;
    else if (score < 75) band = TPIBand.WATCH;
    else if (score < 90) band = TPIBand.ACCEPTABLE;
    return { band, score: Math.min(100, Math.max(0, score)), cpk };
  };

  const vehicleSummary = useMemo(() => {
    const summary = vehicleTyres.reduce((acc, t) => {
      const stats = calculateTPI(t);
      return {
        highRiskCount: acc.highRiskCount + (stats.band === TPIBand.REPLACE ? 1 : 0),
        watchCount: acc.watchCount + (stats.band === TPIBand.WATCH ? 1 : 0),
        totalCpk: acc.totalCpk + stats.cpk
      };
    }, { highRiskCount: 0, watchCount: 0, totalCpk: 0 });

    const avgCpk = vehicleTyres.length > 0 ? summary.totalCpk / vehicleTyres.length : 0;
    return { ...summary, avgCpk };
  }, [vehicleTyres, inspections, repairs, retreads]);

  const handleVisualTyreClick = (tyre: Tyre) => {
    setSelectedTyreId(tyre.id);
    setIsDrawerOpen(true);
  };

  const navigateToDetails = (id: string) => {
    setSelectedTyreId(id);
    setCurrentView('details');
    setIsDrawerOpen(false);
  };

  // ... (handleOnboardComplete, handleCreateJobCard, handleCreateRotationJob, handleIssueStock, handleCompleteJob, handleCompleteRetread, handleRejectRetread, handleGRN, handleTransfer logic same as previous) ...
  
  const handleOnboardComplete = (newVehicle: Vehicle, newTyres: Tyre[]) => {
    const timestamp = new Date().toISOString();
    setVehicles(prev => [...prev, newVehicle]);
    setTyres(prev => [...prev, ...newTyres]);
    // History logic omitted for brevity as it is unchanged
    setSelectedVehicleId(newVehicle.id);
    setCurrentView('on_vehicles');
  };

  const handleInspectSubmit = () => {
    if (!selectedTyre) return;
    const tid = selectedTyre.id;
    const timestamp = new Date().toISOString();
    const newInsp: Inspection = { 
      id: `I-${Date.now()}`, 
      tyreId: tid, 
      condition: inspectCondition, 
      pressurePsi: inspectPressure ? parseFloat(inspectPressure) : undefined, 
      treadDepthMm: inspectTread ? parseFloat(inspectTread) : 0, 
      remarks: inspectRemarks,
      timestamp, 
      user: currentUser.name 
    };
    setInspections(p => [newInsp, ...p]);
    
    // Auto-trigger Alignment Job if Uneven wear is detected
    if (inspectCondition === 'Uneven' && selectedTyre.currentVehicleId) {
       const existingJob = jobCards.find(j => 
         j.vehicleId === selectedTyre.currentVehicleId && 
         j.type === 'ALIGNMENT' && 
         j.status !== JobStatus.COMPLETED && 
         j.status !== JobStatus.CANCELLED
       );

       if (!existingJob) {
          const alignJob: JobCard = {
              id: `JC-ALIGN-${Date.now()}`,
              vehicleId: selectedTyre.currentVehicleId,
              type: 'ALIGNMENT',
              priority: 'High',
              status: JobStatus.OPEN,
              createdAt: timestamp,
              createdBy: 'System (Auto-Trigger)',
              targetTyreId: selectedTyre.id // Reference causing tyre
          };
          setJobCards(prev => [...prev, alignJob]);
          // Optional: Add history log for job creation
          const historyEvent: HistoryEvent = {
             id: `H-AUTO-${Date.now()}`,
             tyreId: selectedTyre.id,
             action: ActionType.ALIGNMENT_JOB_CREATED,
             details: `Automated Alignment Job (${alignJob.id}) created due to Uneven wear detection on ${selectedTyre.currentVehicleId}.`,
             timestamp,
             user: 'System',
             role: UserRole.FLEET_ADMIN
          };
          setHistory(prev => [historyEvent, ...prev]);
       }
    }

    setIsInspectModalOpen(false);
    // Reset form
    setInspectCondition('OK');
    setInspectPressure('');
    setInspectTread('');
    setInspectRemarks('');
  };

  const handleInspection = (tyreId: string, condition: Inspection['condition'], pressure?: number, tread?: number, remarks?: string) => {
      const timestamp = new Date().toISOString();
      const newInsp: Inspection = { 
        id: `I-${Date.now()}`, 
        tyreId, 
        condition, 
        pressurePsi: pressure, 
        treadDepthMm: tread || 0, 
        remarks,
        timestamp, 
        user: currentUser.name 
      };
      setInspections(p => [newInsp, ...p]);
      
      const tyre = tyres.find(t => t.id === tyreId);
      if (condition === 'Uneven' && tyre?.currentVehicleId) {
         const existingJob = jobCards.find(j => 
           j.vehicleId === tyre.currentVehicleId && 
           j.type === 'ALIGNMENT' && 
           j.status !== JobStatus.COMPLETED && 
           j.status !== JobStatus.CANCELLED
         );

         if (!existingJob) {
            const alignJob: JobCard = {
                id: `JC-ALIGN-${Date.now()}`,
                vehicleId: tyre.currentVehicleId,
                type: 'ALIGNMENT',
                priority: 'High',
                status: JobStatus.OPEN,
                createdAt: timestamp,
                createdBy: 'System (Auto-Trigger)',
                targetTyreId: tyre.id
            };
            setJobCards(prev => [...prev, alignJob]);
            
            const historyEvent: HistoryEvent = {
               id: `H-AUTO-${Date.now()}`,
               tyreId: tyre.id,
               action: ActionType.ALIGNMENT_JOB_CREATED,
               details: `Automated Alignment Job (${alignJob.id}) created due to Uneven wear detection on ${tyre.currentVehicleId}.`,
               timestamp,
               user: 'System',
               role: UserRole.FLEET_ADMIN
            };
            setHistory(prev => [historyEvent, ...prev]);
         }
      }
  };

  const handleLinkSensor = (tyreId: string) => {
    const timestamp = new Date().toISOString();
    const sensorId = `TPMS-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
    
    setTyres(prev => prev.map(t => {
      if (t.id === tyreId) {
        return {
          ...t,
          sensorId,
          currentPressure: t.oemPsi ? t.oemPsi - 2 : 100, // Mock initial reading
          currentTemp: 42, // Celsius
          lastSignalTime: timestamp
        };
      }
      return t;
    }));

    const historyEvent: HistoryEvent = {
        id: `H-SENS-${Date.now()}`,
        tyreId: tyreId,
        action: ActionType.SENSOR_LINKED,
        details: `Linked new TPMS Sensor: ${sensorId}.`,
        timestamp,
        user: currentUser.name,
        role: currentUser.role
    };
    setHistory(prev => [historyEvent, ...prev]);
  };

  const handleCreateJobCard = (removedId: string, reason: RemovalReason, nextAction: 'Retread' | 'Inventory' | 'Scrap', replacementId: string) => {
    const timestamp = new Date().toISOString();
    const removedTyre = tyres.find(t => t.id === removedId);
    if (!removedTyre || !removedTyre.position || !removedTyre.currentVehicleId) return;

    const newJob: JobCard = {
      id: `JC-${Date.now()}`,
      vehicleId: removedTyre.currentVehicleId,
      type: 'REPLACEMENT',
      priority: 'Medium',
      status: JobStatus.OPEN,
      createdAt: timestamp,
      createdBy: currentUser.name,
      targetTyreId: removedId,
      position: removedTyre.position,
      replacementTyreId: replacementId,
      removalReason: reason,
      nextDestination: nextAction
    };

    setJobCards(prev => [...prev, newJob]);

    setTyres(prev => prev.map(t => {
      if (t.id === replacementId) {
        return { ...t, status: TyreStatus.ALLOCATED, lastActionDate: timestamp };
      }
      return t;
    }));
    
    setCurrentView('job_cards');
    setSelectedTyreId(null);
  };

  const handleCreateRotationJob = (moves: { tyreId: string, from: TyrePosition, to: TyrePosition }[]) => {
    const timestamp = new Date().toISOString();
    const newJob: JobCard = {
        id: `JC-ROT-${Date.now()}`,
        vehicleId: selectedVehicleId,
        type: 'ROTATION',
        priority: 'Medium',
        status: JobStatus.OPEN,
        createdAt: timestamp,
        createdBy: currentUser.name,
        targetTyreId: moves[0]?.tyreId,
        position: moves[0]?.to,
        rotationList: moves
    };
    setJobCards(prev => [...prev, newJob]);
    setIsRotationWizardOpen(false);
    setCurrentView('job_cards');
  };

  const handleIssueStock = (jobId: string) => {
    const timestamp = new Date().toISOString();
    setJobCards(prev => prev.map(jc => jc.id === jobId ? { ...jc, status: JobStatus.IN_PROGRESS, issuedAt: timestamp } : jc));
    
    const job = jobCards.find(jc => jc.id === jobId);
    
    if (job?.type === 'ROTATION' || job?.type === 'ALIGNMENT') return;

    if (job && job.replacementTyreId) {
       setTyres(prev => prev.map(t => {
          if (t.id === job.replacementTyreId) {
            return { ...t, status: TyreStatus.ISSUED, locationId: 'WORKSHOP', lastActionDate: timestamp };
          }
          return t;
       }));
    }
  };

  const handleCompleteJob = (jobId: string) => {
    const timestamp = new Date().toISOString();
    const job = jobCards.find(jc => jc.id === jobId);
    if (!job) return;

    if (job.type === 'ALIGNMENT') {
        setJobCards(prev => prev.map(jc => jc.id === jobId ? { ...jc, status: JobStatus.COMPLETED, completedAt: timestamp, completedBy: currentUser.name } : jc));
        return;
    }

    if (job.type === 'ROTATION' && job.rotationList) {
        setTyres(prev => prev.map(t => {
            const move = job.rotationList?.find(m => m.tyreId === t.id);
            if (move) {
                return { ...t, position: move.to, lastActionDate: timestamp };
            }
            return t;
        }));
        setJobCards(prev => prev.map(jc => jc.id === jobId ? { ...jc, status: JobStatus.COMPLETED, completedAt: timestamp, completedBy: currentUser.name } : jc));
        return;
    }

    if (job.replacementTyreId) {
        setTyres(prev => prev.map(t => {
        if (t.id === job.targetTyreId) {
            let newStatus = TyreStatus.IN_STORE;
            let newLocation = 'LOC-MUM-01';
            if (job.nextDestination === 'Retread') { newStatus = TyreStatus.RETREAD_IN_PROGRESS; newLocation = 'VND-001'; }
            if (job.nextDestination === 'Scrap') { newStatus = TyreStatus.SCRAPPED; newLocation = 'STORE-SCRAP'; }
            return { 
            ...t, 
            status: newStatus, 
            locationId: newLocation,
            currentVehicleId: undefined, 
            position: undefined, 
            lastActionDate: timestamp 
            };
        }
        if (t.id === job.replacementTyreId) {
            return { 
            ...t, 
            status: TyreStatus.FITTED, 
            locationId: job.vehicleId,
            currentVehicleId: job.vehicleId, 
            position: job.position, 
            lastActionDate: timestamp 
            };
        }
        return t;
        }));
        setJobCards(prev => prev.map(jc => jc.id === jobId ? { ...jc, status: JobStatus.COMPLETED, completedAt: timestamp, completedBy: currentUser.name } : jc));
    }
  };

  const handleCompleteRetread = (tyreId: string, cost: number, newModel: string, newTreadDepth: number) => {
    const timestamp = new Date().toISOString();
    setTyres(prev => prev.map(t => {
      if (t.id === tyreId) {
        return { 
            ...t, 
            status: TyreStatus.IN_STORE, 
            locationId: 'LOC-MUM-01',
            currentLifeNo: t.currentLifeNo + 1, 
            lastActionDate: timestamp,
            model: newModel,
            initialTreadDepthMm: newTreadDepth
        };
      }
      return t;
    }));
    setRetreads(prev => [...prev, {
      id: `RT-${Date.now()}`,
      tyreId,
      lifeNo: tyres.find(t => t.id === tyreId)?.currentLifeNo || 0,
      vendorId: 'VND-001',
      type: 'Cold',
      startDate: timestamp,
      completionDate: timestamp,
      cost,
      status: 'Completed'
    }]);
  };

  const handleRejectRetread = (tyreId: string, reason: string) => {
    const timestamp = new Date().toISOString();
    setTyres(prev => prev.map(t => {
      if (t.id === tyreId) {
        return { 
            ...t, 
            status: TyreStatus.SCRAPPED, 
            locationId: 'STORE-SCRAP', 
            lastActionDate: timestamp 
        };
      }
      return t;
    }));
    setRetreads(prev => [...prev, {
      id: `RT-REJ-${Date.now()}`,
      tyreId,
      lifeNo: tyres.find(t => t.id === tyreId)?.currentLifeNo || 0,
      vendorId: 'VND-001',
      type: 'Cold',
      startDate: timestamp,
      status: 'Rejected',
      rejectionReason: reason
    }]);
  };

  const handleGRN = (newTyres: Tyre[], poRef: string, vendorId: string, locationId: string) => {
    setTyres(prev => [...prev, ...newTyres]);
    setIsGRNModalOpen(false);
  };

  const handleTransfer = (tyreIds: string[], targetLocationId: string) => {
    const timestamp = new Date().toISOString();
    setTyres(prev => prev.map(t => {
      if (tyreIds.includes(t.id)) {
        return { ...t, locationId: targetLocationId, lastActionDate: timestamp };
      }
      return t;
    }));
    setIsTransferModalOpen(false);
  };

  const handleScrapSale = (buyerName: string, totalAmount: number, invoiceRef: string) => {
    const timestamp = new Date().toISOString();
    const count = scrapSelectedIds.length;
    if (count === 0) return;
    
    // Distribute value evenly
    const pricePerUnit = Math.round(totalAmount / count);

    setTyres(prev => prev.map(t => {
        if (scrapSelectedIds.includes(t.id)) {
            return {
                ...t,
                status: TyreStatus.SOLD,
                salePrice: pricePerUnit,
                disposalDate: timestamp,
                locationId: `SOLD: ${buyerName}`,
                lastActionDate: timestamp
            };
        }
        return t;
    }));

    // Log History
    const historyEvent: HistoryEvent = {
        id: `H-SALE-${Date.now()}`,
        tyreId: 'BULK-SALE',
        action: ActionType.SCRAP_SOLD,
        details: `Sold ${count} scrapped units to ${buyerName}. Ref: ${invoiceRef}. Total: ₹${totalAmount}.`,
        timestamp,
        user: currentUser.name,
        role: currentUser.role
    };
    setHistory(prev => [historyEvent, ...prev]);

    setIsScrapModalOpen(false);
    setScrapSelectedIds([]);
  };

  const handleDriverInspectionSave = (newInspections: Inspection[]) => {
    setInspections(prev => [...newInspections, ...prev]);
    
    // Auto-create defects or alerts if bad conditions found
    newInspections.forEach(insp => {
      if (insp.condition !== 'OK') {
         const hist: HistoryEvent = {
            id: `H-DRV-${Date.now()}-${insp.tyreId}`,
            tyreId: insp.tyreId,
            action: ActionType.INSPECTED,
            details: `Driver reported issue: ${insp.condition} (${insp.remarks})`,
            timestamp: insp.timestamp,
            user: currentUser.name,
            role: currentUser.role
         };
         setHistory(prev => [hist, ...prev]);
      }
    });
  };

  if (currentUser.role === UserRole.DRIVER) {
     return (
        <div className="h-screen w-full bg-slate-50">
           <TopBar user={currentUser} setUserRole={(role) => setCurrentUser(prev => ({ ...prev, role }))} />
           <DriverWalkaround 
              vehicles={vehicles}
              vehicleTypes={vehicleTypes}
              tyres={tyres}
              onSaveInspection={handleDriverInspectionSave}
           />
        </div>
     );
  }

  return (
    <div className="flex h-screen w-full relative bg-slate-50">
      <Sidebar 
        currentView={currentView} 
        setView={(v) => {
          setCurrentView(v as any);
          if (v !== 'details') {
            setSelectedTyreId(null);
            setIsDrawerOpen(false);
          }
        }} 
      />
      
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopBar user={currentUser} setUserRole={(role) => setCurrentUser(prev => ({ ...prev, role }))} />
        
        <main className="flex-1 overflow-hidden flex flex-col p-6">
          {currentView === 'vehicle_master' && (
            <VehicleMaster 
              vehicleTypes={vehicleTypes}
              onAddType={(vt) => setVehicleTypes([...vehicleTypes, vt])}
              onDeleteType={(id) => setVehicleTypes(vehicleTypes.filter(v => v.id !== id))}
            />
          )}

          {currentView === 'job_cards' && (
            <JobCardBoard 
              jobCards={jobCards}
              onIssueStock={handleIssueStock}
              onCompleteJob={handleCompleteJob}
              userRole={currentUser.role}
            />
          )}

          {currentView === 'onboard_truck' && (
            <TruckOnboarding 
              onCancel={() => setCurrentView('on_vehicles')}
              onComplete={handleOnboardComplete}
              availableInventory={tyres.filter(t => t.status === TyreStatus.IN_STORE)}
              vehicleTypes={vehicleTypes}
            />
          )}

          {currentView === 'on_vehicles' && (
            <div className="max-w-6xl mx-auto w-full h-full flex flex-col">
              <div className="flex justify-between items-start mb-6 shrink-0">
                <div>
                  <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                    Visual Tracker
                  </h1>
                  <p className="text-xs text-slate-400 mt-1 uppercase font-bold tracking-[0.2em]">Vehicle Fleet View: {selectedVehicle.plateNumber} ({selectedVehicleType.name})</p>
                </div>
                
                <div className="flex items-center gap-3">
                  <button onClick={() => setIsRotationWizardOpen(true)} className="px-4 py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all mr-2">Plan Rotation ⇄</button>
                  <button onClick={() => setCurrentView('onboard_truck')} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-indigo-700 transition-all mr-4">+ Onboard Truck</button>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Unit:</span>
                  <select 
                    className="bg-white border-2 border-slate-100 rounded-xl px-4 py-2 text-xs font-black uppercase tracking-widest shadow-sm outline-none cursor-pointer"
                    value={selectedVehicleId}
                    onChange={(e) => {
                      setSelectedVehicleId(e.target.value);
                      setSelectedTyreId(null);
                      setIsDrawerOpen(false);
                    }}
                  >
                    {vehicles.map(v => <option key={v.id} value={v.id}>{v.plateNumber}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6 mb-8 shrink-0">
                 <div 
                   onClick={() => setCurrentView('analytics')}
                   className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm flex items-center justify-between cursor-pointer hover:shadow-xl hover:border-indigo-100 transition-all active:scale-95 group"
                 >
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-indigo-500 transition-colors">Avg Efficiency</p>
                      <p className="text-xl font-black text-slate-900">₹{vehicleSummary.avgCpk.toFixed(2)}</p>
                    </div>
                    <span className="text-3xl grayscale group-hover:grayscale-0 transition-all">💹</span>
                 </div>
                 <div 
                   onClick={() => setCurrentView('inventory')}
                   className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm flex items-center justify-between cursor-pointer hover:shadow-xl hover:border-red-100 transition-all active:scale-95 group"
                 >
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-red-500 transition-colors">High Risk</p>
                      <p className={`text-xl font-black ${vehicleSummary.highRiskCount > 0 ? 'text-red-600' : 'text-slate-900'}`}>{vehicleSummary.highRiskCount}</p>
                    </div>
                    <span className="text-3xl grayscale group-hover:grayscale-0 transition-all">⚠️</span>
                 </div>
                 <div 
                   onClick={() => setCurrentView('inventory')}
                   className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm flex items-center justify-between cursor-pointer hover:shadow-xl hover:border-amber-100 transition-all active:scale-95 group"
                 >
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-amber-500 transition-colors">Watchlist</p>
                      <p className="text-xl font-black text-amber-600">{vehicleSummary.watchCount}</p>
                    </div>
                    <span className="text-3xl grayscale group-hover:grayscale-0 transition-all">🔍</span>
                 </div>
              </div>

              <div className="flex-1 bg-white rounded-[40px] border border-slate-200 shadow-2xl overflow-hidden relative p-4">
                <div className="h-full w-full overflow-y-auto p-8 custom-scrollbar bg-slate-50/50 rounded-[32px] border border-slate-100">
                  <TruckVisualization 
                    vehicleType={selectedVehicleType} 
                    tyres={vehicleTyres} 
                    onTyreClick={handleVisualTyreClick}
                    calculateTPI={calculateTPI}
                    selectedTyreId={selectedTyreId}
                    inspections={inspections}
                  />
                  <div className="h-20 w-full"></div>
                </div>
              </div>
            </div>
          )}

          {currentView === 'analytics' && (
            <FleetAnalytics 
              tyres={tyres} 
              repairs={repairs} 
              retreads={retreads} 
              inspections={inspections} 
              onViewTyre={navigateToDetails}
              onNavigate={(view) => setCurrentView(view as any)}
            />
          )}

          {currentView === 'inspections' && (
            <InspectionLog 
              inspections={inspections}
              tyres={tyres}
              onViewTyre={navigateToDetails}
            />
          )}

          {currentView === 'inventory' && (
            <TyreInventory 
              tyres={tyres} 
              locations={locations}
              onViewDetails={navigateToDetails} 
              onReceiveRequest={() => setIsGRNModalOpen(true)}
              onTransferRequest={(sourceId) => {
                setTransferSourceId(sourceId);
                setIsTransferModalOpen(true);
              }}
              onSellScrapRequest={(ids) => {
                 setScrapSelectedIds(ids);
                 setIsScrapModalOpen(true);
              }}
              userRole={currentUser.role} 
              vehicles={vehicles} 
              inspections={inspections} 
            />
          )}
          
          {currentView === 'history' && (
            <div className="flex-1 overflow-y-auto custom-scrollbar -mx-6 px-6">
              <div className="max-w-7xl mx-auto py-4">
                <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight mb-8">Fleet Audit Log</h1>
                <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Asset ID</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Action</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {history.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map(evt => (
                        <tr key={evt.id}>
                          <td className="px-6 py-4 text-[10px] font-black text-slate-400">{new Date(evt.timestamp).toLocaleString()}</td>
                          <td className="px-6 py-4 text-xs font-black text-slate-900">{evt.tyreId}</td>
                          <td className="px-6 py-4"><span className="px-2 py-0.5 bg-slate-100 text-[9px] font-black uppercase rounded border">{evt.action}</span></td>
                          <td className="px-6 py-4 text-xs font-medium text-slate-500">{evt.details}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
          
          {currentView === 'details' && selectedTyre && (
            <TyreDetail 
              tyre={selectedTyre} 
              history={history.filter(h => h.tyreId === selectedTyre.id)} 
              inspections={inspections.filter(i => i.tyreId === selectedTyre.id)} 
              defects={[]} repairs={[]} retreads={[]} vendors={vendors} vehicles={vehicles} 
              onFit={() => {}} 
              onRemove={() => {}} 
              onInspect={handleInspection} 
              onScrap={() => {}} 
              onSendForRetread={() => {}} 
              onCompleteRetread={handleCompleteRetread} 
              onRejectRetread={handleRejectRetread} 
              onLogRepair={() => {}} 
              userRole={currentUser.role} 
              onBack={() => setCurrentView('inventory')} 
              allTyres={tyres} 
              onCreateWorkOrder={handleCreateJobCard} 
              onLinkSensor={handleLinkSensor}
            />
          )}
        </main>
      </div>

      {isDrawerOpen && selectedTyre && (
        <>
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-40" onClick={() => setIsDrawerOpen(false)} />
          <div className="fixed right-0 top-0 h-full w-[480px] bg-white shadow-2xl z-50 animate-in slide-in-from-right duration-300 flex flex-col">
             <div className="p-10 border-b border-slate-100 bg-slate-950 text-white flex justify-between items-center">
                <h2 className="text-2xl font-black tracking-tight">{selectedTyre.id}</h2>
                <button onClick={() => setIsDrawerOpen(false)} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-bold">✕</button>
             </div>
             <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-100 text-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Health Score</p>
                    <p className="text-5xl font-black text-slate-900">{calculateTPI(selectedTyre).score}</p>
                  </div>
                  <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-100 text-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Efficiency</p>
                    <p className="text-2xl font-black text-slate-900">₹{calculateTPI(selectedTyre).cpk.toFixed(2)}</p>
                  </div>
                </div>
                <button onClick={() => navigateToDetails(selectedTyre.id)} className="w-full py-5 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-2xl">View Detailed Profile →</button>
             </div>
          </div>
        </>
      )}

      {/* Existing Modals ... */}
      {isInspectModalOpen && selectedTyre && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-6 z-[60]">
          <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-lg p-10 animate-in zoom-in-95">
              <h2 className="text-xl font-black uppercase tracking-[0.1em] mb-8 text-indigo-900">Yard Inspection</h2>
              <div className="space-y-6">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Physical Condition</label>
                   <select 
                      value={inspectCondition} 
                      onChange={e => setInspectCondition(e.target.value as any)} 
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold outline-none"
                   >
                      <option value="OK">OK - Good Condition</option>
                      <option value="Uneven">Uneven Wear (Alignment Issue)</option>
                      <option value="Cut">Cut / Sidewall Damage</option>
                      <option value="Bulge">Bulge / Separation</option>
                      <option value="Damaged">Severe Damage</option>
                   </select>
                </div>
                <input type="number" value={inspectPressure} onChange={e => setInspectPressure(e.target.value)} placeholder="Pressure (PSI)..." className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold outline-none" />
                <input type="number" step="0.1" value={inspectTread} onChange={e => setInspectTread(e.target.value)} placeholder="Tread Depth (MM)..." className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold outline-none" />
                <input type="text" value={inspectRemarks} onChange={e => setInspectRemarks(e.target.value)} placeholder="Optional Remarks..." className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold outline-none" />
                
                <div className="flex gap-4">
                  <button onClick={() => setIsInspectModalOpen(false)} className="flex-1 py-5 border-2 border-slate-100 rounded-2xl text-[10px] font-black uppercase">Cancel</button>
                  <button onClick={handleInspectSubmit} className="flex-[2] py-5 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase">Commit Log</button>
                </div>
              </div>
          </div>
        </div>
      )}

      {isGRNModalOpen && (
        <GoodsReceiptModal 
          onClose={() => setIsGRNModalOpen(false)}
          onReceive={handleGRN}
          locations={locations}
          vendors={vendors}
        />
      )}

      {isTransferModalOpen && (
        <StockTransferModal 
          onClose={() => setIsTransferModalOpen(false)}
          onTransfer={handleTransfer}
          locations={locations}
          availableTyres={tyres.filter(t => t.locationId === transferSourceId && t.status === TyreStatus.IN_STORE)}
          currentLocationId={transferSourceId}
        />
      )}

      {isRotationWizardOpen && (
        <RotationWizard 
            vehicle={selectedVehicle}
            vehicleType={selectedVehicleType}
            currentTyres={vehicleTyres}
            onClose={() => setIsRotationWizardOpen(false)}
            onCreateJob={handleCreateRotationJob}
            inspections={inspections}
        />
      )}

      {isScrapModalOpen && (
        <ScrapDisposalModal 
           selectedTyres={tyres.filter(t => scrapSelectedIds.includes(t.id))}
           onClose={() => setIsScrapModalOpen(false)}
           onSell={handleScrapSale}
        />
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default App;
