import { api } from '@/api/client';
import type {
  ApiPaginated,
  ApiSuccess,
  AuthResponse,
  AuthTokens,
  Cost,
  CostCategory,
  Cow,
  CreateCostPayload,
  CreatePoultryBatchPayload,
  Customer,
  DashboardData,
  Farm,
  InventoryItem,
  Organization,
  PoultryBatch,
  RegisterPayload,
  Sale,
  Supplier,
  User,
} from '@/types/api';

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
    saleDate?: string;
    items: Array<{
      itemName: string;
      quantity: number;
      unit: 'piece' | 'dozen' | 'tray' | 'kg' | 'liter' | 'animal';
      rate: number;
      referenceType?: string;
      referenceId?: string;
    }>;
    receivedAmount?: number;
    notes?: string;
  }) => {
    const { data } = await api.post<ApiSuccess<Sale>>('/sales', payload);
    return data.data;
  },
};

export const domainApi = {
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
};
