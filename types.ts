
export enum UserRole {
  FLEET_ADMIN = 'Fleet Admin',
  MAINTENANCE_MANAGER = 'Maintenance Manager',
  OPS_VIEWER = 'Ops / Viewer',
  DRIVER = 'Driver'
}

export enum TyreStatus {
  IN_STORE = 'In Store',
  ALLOCATED = 'Allocated', // Reserved for a Job Card
  ISSUED = 'Issued',       // With Mechanic
  FITTED = 'Fitted',
  RETREAD_IN_PROGRESS = 'Retread In Progress',
  AWAITING_DECISION = 'Awaiting Decision',
  SCRAPPED = 'Scrapped',
  SOLD = 'Sold / Disposed'
}

export enum JobStatus {
  OPEN = 'Open',             // Created, waiting for stock issue
  IN_PROGRESS = 'In Progress', // Stock issued, waiting for fitment
  COMPLETED = 'Completed',   // Fitment done
  CANCELLED = 'Cancelled'
}

export interface Location {
  id: string;
  name: string;
  type: 'HUB' | 'DEPOT' | 'WORKSHOP';
  address?: string;
}

export interface StockPolicy {
  size: string;
  minLevel: number;
  maxLevel: number;
}

export interface RotationMove {
  tyreId: string;
  from: TyrePosition;
  to: TyrePosition;
}

export interface JobCard {
  id: string;
  vehicleId: string;
  type: 'REPLACEMENT' | 'ROTATION' | 'INSPECTION' | 'ALIGNMENT';
  priority: 'High' | 'Medium' | 'Low';
  status: JobStatus;
  createdAt: string;
  createdBy: string;
  
  // Workflow timestamps
  issuedAt?: string;
  completedAt?: string;
  completedBy?: string;

  // The Plan
  targetTyreId?: string; // Optional for Rotation
  position?: TyrePosition; // Optional for Rotation
  
  // For Replacement
  replacementTyreId?: string;
  removalReason?: RemovalReason;
  nextDestination?: 'Retread' | 'Inventory' | 'Scrap';

  // For Rotation
  rotationList?: RotationMove[];
}

export enum ActionType {
  CREATED = 'Created',
  FITTED = 'Fitted',
  REMOVED = 'Removed',
  INSPECTED = 'Inspected',
  RETREAD_SENT = 'Sent for Retread',
  RETREAD_COMPLETED = 'Retread Completed',
  RETREAD_REJECTED = 'Retread Rejected',
  REPAIR_LOGGED = 'Repair Logged',
  DEFECT_CREATED = 'Defect Created',
  SCRAPPED = 'Scrapped',
  JOB_CREATED = 'Job Card Created',
  JOB_COMPLETED = 'Job Card Completed',
  STOCK_RECEIVED = 'Stock Received (GRN)',
  STOCK_TRANSFERRED = 'Stock Transferred',
  ROTATION = 'Tyre Rotated',
  SCRAP_SOLD = 'Scrap Sold',
  ALIGNMENT_JOB_CREATED = 'Alignment Job Created',
  SENSOR_LINKED = 'TPMS Sensor Linked'
}

export enum RemovalReason {
  WEAR = 'Excessive Wear',
  DAMAGE = 'Damage / Blowout',
  ROTATION = 'Rotation',
  EOL = 'End of Life',
  ABNORMAL_WEAR = 'Abnormal Wear'
}

export enum DefectStatus {
  OPEN = 'Open',
  IN_REPAIR = 'In Repair',
  RESOLVED = 'Resolved'
}

export enum TPIBand {
  EXCELLENT = 'Excellent',
  ACCEPTABLE = 'Acceptable',
  WATCH = 'Watch',
  REPLACE = 'Replace'
}

export interface AxleDefinition {
  id: string;
  isSteer: boolean;
  isDual: boolean; // true = 4 tyres, false = 2 tyres
}

export interface VehicleType {
  id: string;
  name: string;
  axles: AxleDefinition[];
}

export interface Vendor {
  id: string;
  name: string;
  type: 'Retread' | 'Repair' | 'All';
}

export interface TyrePosition {
  axleIndex: number; // 1-based index to match visual "Axle 1"
  side: 'Left' | 'Right';
  position: 'Inner' | 'Outer' | 'Single' | 'Spare';
}

export interface Tyre {
  id: string;
  brand: string;
  model: string;
  size: string;
  purchaseDate: string;
  purchaseCost: number;
  status: TyreStatus;
  
  // Location & Assignment
  locationId: string; // References Location.id or Vehicle ID (if fitted)
  currentVehicleId?: string; // If fitted
  position?: TyrePosition; // Structured object replacing string
  
  // IoT
  sensorId?: string; 
  currentPressure?: number;
  currentTemp?: number;
  lastSignalTime?: string;

  lastActionDate: string;
  currentLifeNo: number;
  totalKm: number;
  expectedLifeKm: number;
  oemPsi?: number;
  initialTreadDepthMm?: number;
  
  // Financials
  salePrice?: number; // Recovered value from scrap
  disposalDate?: string;
}

export interface Vehicle {
  id: string;
  plateNumber: string;
  typeId: string; // References VehicleType.id
  odometer: number;
}

export interface Inspection {
  id: string;
  tyreId: string;
  condition: 'OK' | 'Cut' | 'Bulge' | 'Uneven' | 'Damaged';
  pressurePsi?: number;
  treadDepthMm?: number;
  startingTreadMm?: number;
  remarks?: string;
  timestamp: string;
  user: string;
}

export interface Defect {
  id: string;
  tyreId: string;
  description: string;
  status: DefectStatus;
  createdAt: string;
  resolvedAt?: string;
}

export interface Repair {
  id: string;
  tyreId: string;
  type: string;
  cost: number;
  vendorId: string;
  date: string;
  remarks?: string;
}

export interface HistoryEvent {
  id: string;
  tyreId: string;
  action: ActionType;
  details: string;
  timestamp: string;
  user: string;
  role: UserRole;
}

export interface RetreadRecord {
  id: string;
  tyreId: string;
  lifeNo: number;
  vendorId: string;
  type: 'Cold' | 'Hot';
  startDate: string;
  completionDate?: string;
  cost?: number;
  status: 'Pending' | 'Completed' | 'Rejected';
  rejectionReason?: string;
}

export interface TyreMetrics {
  totalCost: number;
  costPerKm: number;
  wearRate: number;
  repairFrequency: number;
  tpiScore: number;
  tpiBand: TPIBand;
  riskFlags: string[];
}

// Helper to display Indian FMS Standard codes from Object
export const formatPosition = (pos?: TyrePosition): string => {
  if (!pos) return 'STORE';
  if (pos.position === 'Spare') return `SP-${pos.axleIndex}`;
  const side = pos.side === 'Left' ? 'L' : 'R';
  if (pos.position === 'Single') return `${side}${pos.axleIndex}`;
  const suffix = pos.position === 'Inner' ? 'IN' : 'OUT';
  return `${side}${pos.axleIndex}-${suffix}`;
};
