
import { Tyre, Vehicle, TyreStatus, UserRole, HistoryEvent, ActionType, Vendor, VehicleType, Inspection, TyrePosition, formatPosition, JobCard, JobStatus, RemovalReason, Location, StockPolicy } from './types';

export const MOCK_LOCATIONS: Location[] = [
  { id: 'LOC-MUM-01', name: 'Mumbai Central Hub', type: 'HUB', address: 'Bhiwandi, MH' },
  { id: 'LOC-DEL-01', name: 'Delhi NCR Depot', type: 'DEPOT', address: 'Gurgaon, HR' },
  { id: 'LOC-BLR-01', name: 'Bangalore South', type: 'WORKSHOP', address: 'Electronic City, KA' }
];

export const MOCK_STOCK_POLICIES: StockPolicy[] = [
  { size: '295/80 R22.5', minLevel: 5, maxLevel: 50 },
  { size: '10.00 R20', minLevel: 2, maxLevel: 20 }
];

export const MOCK_VEHICLE_TYPES: VehicleType[] = [
  {
    id: 'TYPE-6W',
    name: 'Standard 6-Wheeler (4x2)',
    axles: [
      { id: 'Axle 1', isSteer: true, isDual: false },
      { id: 'Axle 2', isSteer: false, isDual: true }
    ]
  },
  {
    id: 'TYPE-10W',
    name: 'Heavy 10-Wheeler (6x2/6x4)',
    axles: [
      { id: 'Axle 1', isSteer: true, isDual: false },
      { id: 'Axle 2', isSteer: false, isDual: true },
      { id: 'Axle 3', isSteer: false, isDual: true }
    ]
  },
  {
    id: 'TYPE-12W',
    name: 'Multi-Axle 12-Wheeler (8x2/8x4)',
    axles: [
      { id: 'Axle 1', isSteer: true, isDual: false },
      { id: 'Axle 2', isSteer: true, isDual: false },
      { id: 'Axle 3', isSteer: false, isDual: true },
      { id: 'Axle 4', isSteer: false, isDual: true }
    ]
  }
];

export const MOCK_VENDORS: Vendor[] = [
  { id: 'VND-001', name: 'Premium Retreads India Pvt Ltd', type: 'Retread' },
  { id: 'VND-002', name: 'City Workshop & Repair Services', type: 'Repair' },
  { id: 'VND-003', name: 'Global Tyre Solutions (India)', type: 'All' }
];

export const MOCK_VEHICLES: Vehicle[] = [
  { id: 'V-101', plateNumber: 'HR-38-AS-4421', typeId: 'TYPE-6W', odometer: 125400 },
  { id: 'V-102', plateNumber: 'MH-12-PQ-9812', typeId: 'TYPE-10W', odometer: 89000 },
  { id: 'V-103', plateNumber: 'DL-1G-BT-1102', typeId: 'TYPE-12W', odometer: 210500 }
];

const generateTyresForVehicle = (vehicle: Vehicle): Tyre[] => {
  const type = MOCK_VEHICLE_TYPES.find(t => t.id === vehicle.typeId)!;
  const tyres: Tyre[] = [];
  
  let steerCount = 0;
  let driveCount = 0;

  type.axles.forEach((axle, idx) => {
    // Determine functional axle index (1-based for naming, though logical index is idx+1)
    let axleDisplayIndex = 0;
    if (axle.isSteer) {
      steerCount++;
      axleDisplayIndex = steerCount;
    } else {
      driveCount++;
      axleDisplayIndex = driveCount + 2; // Rough mapping for display logic (L3, etc.)
    }
    
    // We use the ACTUAL axle index (idx + 1) for the data structure to be robust
    const trueAxleIndex = idx + 1;

    const brand = vehicle.id === 'V-101' ? 'Michelin' : vehicle.id === 'V-102' ? 'Apollo' : 'Bridgestone';
    const model = brand === 'Michelin' ? 'X Multi Z' : brand === 'Apollo' ? 'EnduRace' : 'R192';
    const purchaseCost = brand === 'Michelin' ? 42500 : brand === 'Bridgestone' ? 38000 : 35000;

    const createTyre = (pos: TyrePosition) => {
      const posString = formatPosition(pos);
      const id = `T-${vehicle.id.split('-')[1]}-${posString}`;
      tyres.push({
        id,
        brand,
        model,
        size: '295/80 R22.5',
        purchaseDate: '2023-01-15',
        purchaseCost,
        status: TyreStatus.FITTED,
        locationId: vehicle.id,
        currentVehicleId: vehicle.id,
        position: pos,
        lastActionDate: '2024-03-10',
        currentLifeNo: tyres.length % 2,
        totalKm: 12000 + (tyres.length * 2000),
        expectedLifeKm: 45000
      });
    };

    if (axle.isDual) {
      createTyre({ axleIndex: trueAxleIndex, side: 'Left', position: 'Outer' });
      createTyre({ axleIndex: trueAxleIndex, side: 'Left', position: 'Inner' });
      createTyre({ axleIndex: trueAxleIndex, side: 'Right', position: 'Inner' });
      createTyre({ axleIndex: trueAxleIndex, side: 'Right', position: 'Outer' });
    } else {
      createTyre({ axleIndex: trueAxleIndex, side: 'Left', position: 'Single' });
      createTyre({ axleIndex: trueAxleIndex, side: 'Right', position: 'Single' });
    }
  });

  return tyres;
};

export const MOCK_TYRES: Tyre[] = [
  ...generateTyresForVehicle(MOCK_VEHICLES[0]),
  ...generateTyresForVehicle(MOCK_VEHICLES[1]),
  ...generateTyresForVehicle(MOCK_VEHICLES[2]),
  { id: 'T-INV-NEW-01', brand: 'Continental', model: 'LS3', size: '295/80 R22.5', purchaseDate: '2024-02-01', purchaseCost: 39000, status: TyreStatus.IN_STORE, locationId: 'LOC-MUM-01', lastActionDate: '2024-02-01', currentLifeNo: 0, totalKm: 0, expectedLifeKm: 40000 },
  { id: 'T-INV-RT-01', brand: 'Apollo', model: 'EnduRace', size: '295/80 R22.5', purchaseDate: '2023-05-10', purchaseCost: 35000, status: TyreStatus.IN_STORE, locationId: 'LOC-MUM-01', lastActionDate: '2024-03-05', currentLifeNo: 1, totalKm: 18000, expectedLifeKm: 35000 },
  { id: 'T-INV-RT-02', brand: 'Michelin', model: 'X Multi Z', size: '295/80 R22.5', purchaseDate: '2023-01-20', purchaseCost: 42500, status: TyreStatus.IN_STORE, locationId: 'LOC-DEL-01', lastActionDate: '2024-02-15', currentLifeNo: 2, totalKm: 24000, expectedLifeKm: 45000 },
  { id: 'T-RETREAD-SENT-01', brand: 'Bridgestone', model: 'R192', size: '295/80 R22.5', purchaseDate: '2023-06-15', purchaseCost: 38000, status: TyreStatus.RETREAD_IN_PROGRESS, locationId: 'VND-001', lastActionDate: '2024-03-01', currentLifeNo: 0, totalKm: 22000, expectedLifeKm: 40000 },
  { id: 'T-AWAITING-01', brand: 'JK Tyre', model: 'JetX', size: '295/80 R22.5', purchaseDate: '2023-10-10', purchaseCost: 28000, status: TyreStatus.AWAITING_DECISION, locationId: 'LOC-MUM-01', lastActionDate: '2024-03-10', currentLifeNo: 1, totalKm: 14000, expectedLifeKm: 30000 },
  { id: 'T-SCRAP-01', brand: 'JK Tyre', model: 'JetX', size: '295/80 R22.5', purchaseDate: '2022-12-15', purchaseCost: 28000, status: TyreStatus.SCRAPPED, locationId: 'LOC-MUM-01', lastActionDate: '2024-03-01', currentLifeNo: 2, totalKm: 32000, expectedLifeKm: 30000 },
];

export const MOCK_JOB_CARDS: JobCard[] = [
  {
    id: 'JC-1001',
    vehicleId: 'V-102',
    type: 'REPLACEMENT',
    priority: 'High',
    status: JobStatus.OPEN,
    createdAt: '2024-03-20T09:00:00Z',
    createdBy: 'Maintenance Manager',
    targetTyreId: 'T-102-L3-IN',
    position: { axleIndex: 3, side: 'Left', position: 'Inner' },
    replacementTyreId: 'T-INV-NEW-01',
    removalReason: RemovalReason.WEAR,
    nextDestination: 'Retread'
  }
];

export const MOCK_HISTORY: HistoryEvent[] = [
  { id: 'H-001', tyreId: 'T-101-L1', action: ActionType.FITTED, details: 'Fitted to HR-38-AS-4421 during vehicle commissioning.', timestamp: '2023-12-12T09:00:00Z', user: 'Admin User', role: UserRole.FLEET_ADMIN },
  { id: 'H-002', tyreId: 'T-102-R1', action: ActionType.INSPECTED, details: 'Routine yard check. Found minor chip, marked for monitoring.', timestamp: '2024-01-11T14:30:00Z', user: 'Mike Chen', role: UserRole.MAINTENANCE_MANAGER },
  { id: 'H-003', tyreId: 'T-RETREAD-SENT-01', action: ActionType.RETREAD_SENT, details: 'Sent to Premium Retreads (VND-001) for cold retreading.', timestamp: '2024-03-01T11:15:00Z', user: 'Admin User', role: UserRole.FLEET_ADMIN },
  { id: 'H-004', tyreId: 'T-SCRAP-01', action: ActionType.SCRAPPED, details: 'Casing failure beyond repair limit. Terminal disposal.', timestamp: '2024-03-05T16:00:00Z', user: 'Admin User', role: UserRole.FLEET_ADMIN },
  { id: 'H-005', tyreId: 'T-INV-RT-01', action: ActionType.RETREAD_COMPLETED, details: 'Retread cycle 1 completed. Returned to hub inventory.', timestamp: '2024-03-08T10:00:00Z', user: 'Admin User', role: UserRole.FLEET_ADMIN },
  { id: 'H-006', tyreId: 'T-101-L3-OUT', action: ActionType.FITTED, details: 'Standard fitment on rear drive axle.', timestamp: '2024-03-07T08:45:00Z', user: 'Maintenance Lead', role: UserRole.MAINTENANCE_MANAGER },
  { id: 'H-007', tyreId: 'T-102-L3-IN', action: ActionType.INSPECTED, details: 'Pressure corrected from 92 PSI to 105 PSI.', timestamp: '2024-03-12T10:15:00Z', user: 'John Doe', role: UserRole.MAINTENANCE_MANAGER },
  { id: 'H-008', tyreId: 'T-103-L1', action: ActionType.INSPECTED, details: 'Sidewall check performed. No defects observed.', timestamp: '2024-03-14T11:00:00Z', user: 'Mike Chen', role: UserRole.MAINTENANCE_MANAGER }
];

export const MOCK_INSPECTIONS: Inspection[] = [
  { id: 'INSP-001', tyreId: 'T-101-L1', condition: 'OK', pressurePsi: 105, treadDepthMm: 12.5, timestamp: '2023-12-12T09:00:00Z', user: 'Mike Chen' },
  { id: 'INSP-002', tyreId: 'T-102-R1', condition: 'Damaged', pressurePsi: 98, treadDepthMm: 11.2, remarks: 'Minor sidewall chip. Monitor for 2k km.', timestamp: '2024-01-11T14:30:00Z', user: 'Mike Chen' },
  { id: 'INSP-003', tyreId: 'T-101-L3-OUT', condition: 'OK', pressurePsi: 110, treadDepthMm: 9.8, timestamp: '2024-03-10T10:00:00Z', user: 'John Doe' },
  { id: 'INSP-004', tyreId: 'T-103-L1', condition: 'Uneven', pressurePsi: 85, treadDepthMm: 6.5, remarks: 'Shoulder wear detected. Alignment check required.', timestamp: '2024-03-09T12:00:00Z', user: 'Sam Wilson' },
  { id: 'INSP-005', tyreId: 'T-102-L3-IN', condition: 'OK', pressurePsi: 105, treadDepthMm: 10.5, timestamp: '2024-03-12T10:15:00Z', user: 'John Doe' }
];
