export type FarmType = 'poultry' | 'cow';
export type PoultryPurpose = 'broiler' | 'layer' | 'breeding' | 'mixed';
export type CowPurpose = 'dairy' | 'beef' | 'breeding' | 'mixed';
export type UserRole =
  | 'owner'
  | 'admin'
  | 'farm_manager'
  | 'accountant'
  | 'farm_supervisor'
  | 'veterinarian'
  | 'worker'
  | 'salesperson';

export type InventoryCategory =
  | 'feed'
  | 'medicine'
  | 'vaccine'
  | 'egg_tray'
  | 'milk_can'
  | 'equipment'
  | 'cleaning'
  | 'fuel'
  | 'packaging'
  | 'other';

export interface ApiSuccess<T> {
  success: true;
  message?: string;
  data: T;
}

export interface ApiPaginated<T> {
  success: true;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiErrorBody {
  success: false;
  message: string;
}

export interface User {
  id: string;
  organizationId: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt?: string;
}

export interface BankInfo {
  bankName?: string;
  accountNumber?: string;
  accountHolder?: string;
  branch?: string;
}

export interface MobileBanking {
  provider?: 'bkash' | 'nagad' | 'rocket' | 'other';
  accountNumber?: string;
}

export interface Organization {
  _id: string;
  name: string;
  ownerName: string;
  phone: string;
  email: string;
  address?: string;
  district?: string;
  upazila?: string;
  location?: string;
  establishedDate?: string;
  logo?: string;
  farmType: FarmType;
  poultryPurpose?: PoultryPurpose;
  cowPurpose?: CowPurpose;
  tradeLicense?: string;
  tinNumber?: string;
  binVatNumber?: string;
  bankInfo?: BankInfo;
  mobileBanking?: MobileBanking;
  isSetupComplete?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse extends AuthTokens {
  user: User;
  organization: Organization;
}

export interface RegisterPayload {
  name: string;
  email: string;
  phone?: string;
  password: string;
  organization: {
    name: string;
    ownerName: string;
    phone: string;
    email: string;
    farmType: FarmType;
    poultryPurpose?: PoultryPurpose;
    cowPurpose?: CowPurpose;
    address?: string;
    district?: string;
    upazila?: string;
  };
}

export interface Farm {
  _id: string;
  organizationId: string;
  name: string;
  farmType: FarmType;
  district?: string;
  upazila?: string;
  location?: string;
  address?: string;
  isActive?: boolean;
  createdAt?: string;
}

export interface InventoryItem {
  _id: string;
  farmId?: string;
  name: string;
  category: InventoryCategory;
  unit: string;
  currentStock: number;
  minStockLevel?: number;
  unitCost?: number;
  description?: string;
}

export interface Sale {
  _id: string;
  saleNumber?: string;
  farmId?: string;
  customerId?: string;
  saleDate?: string;
  totalAmount: number;
  receivableAmount?: number;
  status?: string;
  items?: Array<{
    itemName: string;
    quantity: number;
    unit: string;
    rate: number;
  }>;
}

export interface PoultryBatch {
  _id: string;
  organizationId?: string;
  farmId: string;
  shedId?: string;
  batchName: string;
  birdType: string;
  purchaseDate: string;
  initialQuantity: number;
  currentQuantity: number;
  unitPrice?: number;
  mortalityCount?: number;
  mortalityPercentage?: number;
  totalCost?: number;
  totalRevenue?: number;
  profitLoss?: number;
  status?: string;
}

export interface Cow {
  _id: string;
  farmId: string;
  animalId: string;
  breed: string;
  gender: 'male' | 'female';
  purpose: CowPurpose;
  status?: string;
  currentWeight?: number;
  dateOfBirth?: string;
}

export interface Customer {
  _id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  district?: string;
  notes?: string;
}

export interface Supplier {
  _id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  district?: string;
  supplierType?: string;
  notes?: string;
}

export interface Cost {
  _id: string;
  organizationId?: string;
  farmId?: string;
  categoryId: string;
  categoryName?: string;
  costType: string;
  scope: string;
  referenceType?: string;
  referenceId?: string;
  quantity: number;
  unit: string;
  rate: number;
  totalAmount: number;
  costDate?: string;
  description?: string;
}

export interface CostCategory {
  _id: string;
  name: string;
  isDefault?: boolean;
  isActive?: boolean;
}

export interface CreatePoultryBatchPayload {
  farmId: string;
  shedId?: string;
  batchName: string;
  birdType: string;
  supplierId?: string;
  purchaseDate: string;
  initialQuantity: number;
  unitPrice: number;
}

export interface CreateCostPayload {
  farmId?: string;
  categoryId: string;
  costType: 'purchase' | 'operating' | 'custom';
  scope: 'farm_wide' | 'poultry_batch' | 'cow_animal' | 'cow_group' | 'operational';
  referenceType?: string;
  referenceId?: string;
  quantity: number;
  unit: string;
  rate: number;
  costDate?: string;
  description?: string;
  isRecurring?: boolean;
  recurringInterval?: 'daily' | 'weekly' | 'monthly' | 'yearly';
}

export interface DashboardData {
  financials: {
    totalRevenue: number;
    totalCost: number;
    netProfit: number;
  };
  poultry: {
    activeBatches: number;
    todayEggProduction: number;
  };
  dairy: {
    totalCows: number;
    lactatingCows: number;
    pregnantCows: number;
    todayMilkProduction: number;
  };
  alerts: {
    lowStockItems: InventoryItem[];
  };
  topCostCategories: Array<{ _id: string; total: number }>;
  recentSales: Sale[];
}
