import { api } from '@/api/client';
import type {
  ApiPaginated,
  ApiSuccess,
  AuthResponse,
  AuthTokens,
  Cost,
  CostCategory,
  Cow,
  CowHealthRecord,
  CreateCostPayload,
  CreatePoultryBatchPayload,
  Customer,
  DashboardData,
  EggRecord,
  Farm,
  InventoryItem,
  MilkRecord,
  Organization,
  PoultryBatch,
  Purchase,
  RegisterPayload,
  Sale,
  Shed,
  Supplier,
  User,
  UserRole,
} from '@/types/api';

/** Backend caps `limit` at 100, so walk every page for reports and charts. */
export async function fetchAll<T>(
  path: string,
  params: Record<string, string | number | undefined> = {},
  maxPages = 20
) {
  const rows: T[] = [];
  for (let page = 1; page <= maxPages; page++) {
    const { data } = await api.get<ApiPaginated<T>>(path, { params: { ...params, page, limit: 100 } });
    rows.push(...data.data);
    if (page >= (data.pagination?.totalPages ?? 1)) break;
  }
  return rows;
}

export const authApi = {
  login: async (email: string, password: string) => {
    const { data } = await api.post<ApiSuccess<AuthResponse>>('/auth/login', {
      email,
      password,
    });
    return data.data;
  },
  register: async (payload: RegisterPayload) => {
    const { data } = await api.post<ApiSuccess<AuthResponse>>('/auth/register', payload);
    return data.data;
  },
  profile: async () => {
    const { data } = await api.get<ApiSuccess<{ user: User; organization: Organization }>>(
      '/auth/profile'
    );
    return data.data;
  },
  logout: async (refreshToken?: string | null) => {
    await api.post('/auth/logout', refreshToken ? { refreshToken } : {});
  },
  refresh: async (refreshToken: string) => {
    const { data } = await api.post<ApiSuccess<AuthTokens>>('/auth/refresh', { refreshToken });
    return data.data;
  },
  changePassword: async (currentPassword: string, newPassword: string) => {
    await api.post('/auth/change-password', { currentPassword, newPassword });
  },
  listUsers: () => fetchAll<User>('/auth/users'),
  createUser: async (payload: {
    name: string;
    email: string;
    phone?: string;
    password: string;
    role: UserRole;
  }) => {
    const { data } = await api.post<ApiSuccess<User>>('/auth/users', payload);
    return data.data;
  },
  updateUser: async (
    id: string,
    payload: Partial<{ name: string; phone: string; role: UserRole; isActive: boolean }>
  ) => {
    const { data } = await api.patch<ApiSuccess<User>>(`/auth/users/${id}`, payload);
    return data.data;
  },
};

export const dashboardApi = {
  get: async () => {
    const { data } = await api.get<ApiSuccess<DashboardData>>('/dashboard');
    return data.data;
  },
};

export const organizationApi = {
  get: async () => {
    const { data } = await api.get<ApiSuccess<Organization>>('/organization');
    return data.data;
  },
  listFarms: async (page = 1, limit = 50) => {
    const { data } = await api.get<ApiPaginated<Farm>>('/farms', {
      params: { page, limit },
    });
    return data;
  },
  listCustomers: async (page = 1, limit = 50, search?: string) => {
    const { data } = await api.get<ApiPaginated<Customer>>('/customers', {
      params: { page, limit, search },
    });
    return data;
  },
  listSuppliers: async (page = 1, limit = 50, search?: string) => {
    const { data } = await api.get<ApiPaginated<Supplier>>('/suppliers', {
      params: { page, limit, search },
    });
    return data;
  },
  update: async (payload: Partial<Omit<Organization, '_id' | 'email' | 'farmType'>>) => {
    const { data } = await api.patch<ApiSuccess<Organization>>('/organization', payload);
    return data.data;
  },
  allFarms: () => fetchAll<Farm>('/farms'),
  createFarm: async (payload: {
    name: string;
    farmType: 'poultry' | 'cow';
    district?: string;
    upazila?: string;
    address?: string;
  }) => {
    const { data } = await api.post<ApiSuccess<Farm>>('/farms', payload);
    return data.data;
  },
  updateFarm: async (id: string, payload: Partial<Pick<Farm, 'name' | 'district' | 'upazila' | 'address' | 'isActive'>>) => {
    const { data } = await api.patch<ApiSuccess<Farm>>(`/farms/${id}`, payload);
    return data.data;
  },
  allSheds: (farmId?: string) => fetchAll<Shed>('/sheds', { farmId }),
  createShed: async (payload: { farmId: string; name: string; capacity?: number; description?: string }) => {
    const { data } = await api.post<ApiSuccess<Shed>>('/sheds', payload);
    return data.data;
  },
  allCustomers: () => fetchAll<Customer>('/customers'),
  createCustomer: async (payload: Omit<Customer, '_id'>) => {
    const { data } = await api.post<ApiSuccess<Customer>>('/customers', payload);
    return data.data;
  },
  updateCustomer: async (id: string, payload: Partial<Omit<Customer, '_id'>>) => {
    const { data } = await api.patch<ApiSuccess<Customer>>(`/customers/${id}`, payload);
    return data.data;
  },
  allSuppliers: () => fetchAll<Supplier>('/suppliers'),
  createSupplier: async (payload: Omit<Supplier, '_id'>) => {
    const { data } = await api.post<ApiSuccess<Supplier>>('/suppliers', payload);
    return data.data;
  },
};

export const inventoryApi = {
  list: async (page = 1, limit = 50, category?: string) => {
    const { data } = await api.get<ApiPaginated<InventoryItem>>('/inventory', {
      params: { page, limit, category },
    });
    return data;
  },
  lowStock: async () => {
    const { data } = await api.get<ApiSuccess<InventoryItem[]>>('/inventory/low-stock');
    return data.data;
  },
  allItems: () => fetchAll<InventoryItem>('/inventory'),
  createItem: async (payload: {
    farmId?: string;
    name: string;
    category: string;
    unit: string;
    currentStock?: number;
    minStockLevel?: number;
    unitCost?: number;
  }) => {
    const { data } = await api.post<ApiSuccess<InventoryItem>>('/inventory', payload);
    return data.data;
  },
  recordMovement: async (payload: {
    inventoryItemId: string;
    farmId?: string;
    movementType: 'purchase' | 'receive' | 'transfer' | 'consume' | 'wastage' | 'adjustment';
    quantity: number;
    unitCost?: number;
    notes?: string;
  }) => {
    const { data } = await api.post<ApiSuccess<unknown>>('/inventory/movements', payload);
    return data.data;
  },
  allPurchases: () => fetchAll<Purchase>('/purchases'),
  allSales: () => fetchAll<Sale>('/sales'),
  allCosts: (farmId?: string) => fetchAll<Cost>('/costs', { farmId }),
  listSales: async (page = 1, limit = 30) => {
    const { data } = await api.get<ApiPaginated<Sale>>('/sales', {
      params: { page, limit },
    });
    return data;
  },
  listCostCategories: async () => {
    const { data } = await api.get<ApiSuccess<CostCategory[]>>('/costs/categories');
    return data.data;
  },
  listCosts: async (page = 1, limit = 100, farmId?: string) => {
    const { data } = await api.get<ApiPaginated<Cost>>('/costs', {
      params: { page, limit, farmId },
    });
    return data;
  },
  createCost: async (payload: CreateCostPayload) => {
    const { data } = await api.post<ApiSuccess<Cost>>('/costs', payload);
    return data.data;
  },
  createSale: async (payload: {
    farmId?: string;
    customerId?: string;
    saleDate?: string;
    items: Array<{
      itemName: string;
      quantity: number;
      unit: 'piece' | 'dozen' | 'tray' | 'kg' | 'liter' | 'animal';
      rate: number;
      referenceType?: string;
      referenceId?: string;
    }>;
    discount?: number;
    receivedAmount?: number;
    notes?: string;
  }) => {
    const { data } = await api.post<ApiSuccess<Sale>>('/sales', payload);
    return data.data;
  },
};

export const domainApi = {
  allPoultryBatches: () => fetchAll<PoultryBatch>('/poultry/batches'),
  allCows: () => fetchAll<Cow>('/cows'),
  recentEggs: async () => {
    const { data } = await api.get<ApiPaginated<EggRecord>>('/poultry/eggs', { params: { limit: 100 } });
    return data.data;
  },
  recentMilk: async () => {
    const { data } = await api.get<ApiPaginated<MilkRecord>>('/cows/milk', { params: { limit: 100 } });
    return data.data;
  },
  listPoultryBatches: async (page = 1, limit = 50, farmId?: string) => {
    const { data } = await api.get<ApiPaginated<PoultryBatch>>('/poultry/batches', {
      params: { page, limit, farmId },
    });
    return data;
  },
  getPoultryBatch: async (id: string) => {
    const { data } = await api.get<ApiSuccess<PoultryBatch>>(`/poultry/batches/${id}`);
    return data.data;
  },
  createPoultryBatch: async (payload: CreatePoultryBatchPayload) => {
    const { data } = await api.post<ApiSuccess<PoultryBatch>>('/poultry/batches', payload);
    return data.data;
  },
  recordMortality: async (
    batchId: string,
    payload: { quantity: number; averageWeight?: number; notes?: string }
  ) => {
    const { data } = await api.post<ApiSuccess<PoultryBatch>>(
      `/poultry/batches/${batchId}/mortality`,
      payload
    );
    return data.data;
  },
  listCows: async (page = 1, limit = 50, farmId?: string) => {
    const { data } = await api.get<ApiPaginated<Cow>>('/cows', {
      params: { page, limit, farmId },
    });
    return data;
  },
  getCow: async (id: string) => {
    const { data } = await api.get<ApiSuccess<Cow>>(`/cows/${id}`);
    return data.data;
  },
  createCow: async (payload: {
    farmId: string;
    animalId: string;
    breed: string;
    gender: 'male' | 'female';
    purpose: 'dairy' | 'beef';
    purchaseDate?: string;
    purchasePrice?: number;
    entryWeight?: number;
    currentWeight?: number;
  }) => {
    const { data } = await api.post<ApiSuccess<Cow>>('/cows', payload);
    return data.data;
  },
  listMilk: async (cowId: string) => {
    const { data } = await api.get<ApiPaginated<MilkRecord>>('/cows/milk', {
      params: { cowId, limit: 20 },
    });
    return data;
  },
  recordMilk: async (payload: {
    farmId: string;
    cowId: string;
    productionDate: string;
    morningQuantity?: number;
    eveningQuantity?: number;
  }) => {
    const { data } = await api.post<ApiSuccess<MilkRecord>>('/cows/milk', payload);
    return data.data;
  },
  listCowHealth: async (cowId: string) => {
    const { data } = await api.get<ApiSuccess<CowHealthRecord[]>>('/cows/health', {
      params: { cowId },
    });
    return data.data;
  },
  recordWeight: async (payload: { cowId: string; weight: number; recordDate: string }) => {
    const { data } = await api.post<ApiSuccess<CowHealthRecord>>('/cows/health', {
      cowId: payload.cowId,
      recordType: 'weight',
      recordDate: payload.recordDate,
      title: 'Weight',
      weight: payload.weight,
    });
    return data.data;
  },
};
