// Demo API - uses data from DemoContext without making any fetch requests
import type { Paginated, User, Fillial, Zayavka, Merchant, Agent, Admin } from "types/api";
import type { DemoData } from "contexts/DemoContext";

// This will be set by DemoLayout
let demoDataStore: DemoData | null = null;

export function setDemoData(data: DemoData | null) {
  console.log('setDemoData called with:', data ? 'data loaded' : 'null');
  if (data) {
    console.log('Demo data counts:', {
      users: data.users.length,
      fillials: data.fillials.length,
      applications: data.applications.length,
    });
  }
  demoDataStore = data;
}

function getDemoData(): DemoData {
  if (!demoDataStore) {
    // Return empty data instead of throwing error while data is loading
    console.warn('Demo data not yet loaded, returning empty data');
    return {
      users: [],
      fillials: [],
      applications: [],
      merchants: [],
      agents: [],
      admins: [],
    };
  }
  return demoDataStore;
}

// Helper to filter and paginate
function filterAndPaginate<T>(
  items: T[],
  opts?: {
    page?: number;
    pageSize?: number;
    search?: string;
    filterFn?: (item: T) => boolean;
  }
): Paginated<T> {
  let filtered = items;
  
  if (opts?.filterFn) {
    filtered = filtered.filter(opts.filterFn);
  }
  
  const page = opts?.page || 1;
  const pageSize = opts?.pageSize || 1000;
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const pageItems = filtered.slice(startIndex, endIndex);
  
  return {
    items: pageItems,
    total: filtered.length,
    page,
    pageSize,
  };
}

// Auth - Demo mode always authenticated
export async function login(login: string, password: string): Promise<any> {
  return {
    user: {
      id: 1,
      phone: login,
      fullname: "Demo User",
      image: null,
      role: "super",
    },
    access_token: "demo-token",
    message: "Demo mode - no real authentication",
  };
}

export async function logout(): Promise<void> {
  // No-op in demo mode
}

export function getCurrentUser(): any {
  return {
    id: 1,
    phone: "demo",
    fullname: "Demo User",
    image: null,
    role: "super",
  };
}

export function isAuthenticated(): boolean {
  return true;
}

// Users
export async function listUsers(opts?: {
  page?: number;
  pageSize?: number;
  search?: string;
  role?: string;
  fillialId?: number | "all";
}): Promise<Paginated<User>> {
  console.log('demoApi.listUsers called with opts:', opts);
  const data = getDemoData();
  console.log('Demo data users:', data.users.length);
  return filterAndPaginate(data.users, {
    ...opts,
    filterFn: (user) => {
      if (opts?.search) {
        const searchLower = opts.search.toLowerCase();
        if (!user.fullname?.toLowerCase().includes(searchLower) && 
            !user.phone?.toLowerCase().includes(searchLower)) {
          return false;
        }
      }
      if (opts?.role && user.role !== opts.role) return false;
      if (opts?.fillialId && opts.fillialId !== "all" && user.fillial_id !== opts.fillialId) return false;
      return true;
    },
  });
}

export async function getUser(id: number): Promise<User> {
  const data = getDemoData();
  const user = data.users.find(u => u.id === id);
  if (!user) throw new Error(`User ${id} not found in demo data`);
  return user;
}

export async function createUser(payload: Partial<User>): Promise<User> {
  throw new Error("Cannot create users in demo mode");
}

export async function updateUser(id: number, payload: Partial<User>): Promise<User> {
  throw new Error("Cannot update users in demo mode");
}

export async function deleteUser(id: number): Promise<void> {
  throw new Error("Cannot delete users in demo mode");
}

// Fillials
export async function listFillials(opts?: { 
  page?: number; 
  pageSize?: number; 
  search?: string; 
  region?: string;
}): Promise<Paginated<Fillial>> {
  console.log('demoApi.listFillials called with opts:', opts);
  const data = getDemoData();
  console.log('Demo data fillials:', data.fillials.length);
  return filterAndPaginate(data.fillials, {
    ...opts,
    filterFn: (fillial) => {
      if (opts?.search) {
        const searchLower = opts.search.toLowerCase();
        if (!fillial.name?.toLowerCase().includes(searchLower) && 
            !fillial.address?.toLowerCase().includes(searchLower)) {
          return false;
        }
      }
      if (opts?.region && fillial.region !== opts.region) return false;
      return true;
    },
  });
}

export async function getFillial(id: number): Promise<Fillial> {
  const data = getDemoData();
  const fillial = data.fillials.find(f => f.id === id);
  if (!fillial) throw new Error(`Fillial ${id} not found in demo data`);
  return fillial;
}

export async function createFillial(payload: Partial<Fillial>): Promise<Fillial> {
  throw new Error("Cannot create fillials in demo mode");
}

export async function updateFillial(id: number, payload: Partial<Fillial>): Promise<Fillial> {
  throw new Error("Cannot update fillials in demo mode");
}

export async function deleteFillial(id: number): Promise<void> {
  throw new Error("Cannot delete fillials in demo mode");
}

// Applications
export async function listZayavkalar(opts?: { 
  page?: number; 
  pageSize?: number; 
  search?: string; 
  status?: string;
}): Promise<Paginated<Zayavka>> {
  const data = getDemoData();
  return filterAndPaginate(data.applications, {
    ...opts,
    filterFn: (app) => {
      if (opts?.search) {
        const searchLower = opts.search.toLowerCase();
        // Search in customer name, phone, etc.
        const appData = app as any;
        if (!appData.customer_fullname?.toLowerCase().includes(searchLower) && 
            !appData.customer_phone?.toLowerCase().includes(searchLower)) {
          return false;
        }
      }
      if (opts?.status && app.status !== opts.status) return false;
      return true;
    },
  });
}

export async function getZayavka(id: number): Promise<Zayavka> {
  const data = getDemoData();
  const app = data.applications.find(a => a.id === id);
  if (!app) throw new Error(`Application ${id} not found in demo data`);
  return app;
}

export async function createZayavka(payload: Partial<Zayavka>): Promise<Zayavka> {
  throw new Error("Cannot create applications in demo mode");
}

export async function updateZayavka(id: number, payload: Partial<Zayavka>): Promise<Zayavka> {
  throw new Error("Cannot update applications in demo mode");
}

export async function deleteZayavka(id: number): Promise<void> {
  throw new Error("Cannot delete applications in demo mode");
}

// Merchants
export async function listMerchants(opts?: { 
  page?: number; 
  pageSize?: number; 
  search?: string; 
  type?: string;
}): Promise<Paginated<Merchant>> {
  console.log('demoApi.listMerchants called with opts:', opts);
  const data = getDemoData();
  console.log('Demo data merchants:', data.merchants.length);
  return filterAndPaginate(data.merchants, {
    ...opts,
    filterFn: (merchant) => {
      if (opts?.search) {
        const searchLower = opts.search.toLowerCase();
        if (!merchant.name?.toLowerCase().includes(searchLower)) {
          return false;
        }
      }
      if (opts?.type && merchant.type !== opts.type) return false;
      return true;
    },
  });
}

export async function getMerchant(id: number): Promise<Merchant> {
  const data = getDemoData();
  const merchant = data.merchants.find(m => m.id === id);
  if (!merchant) throw new Error(`Merchant ${id} not found in demo data`);
  return merchant;
}

export async function createMerchant(payload: Partial<Merchant>): Promise<Merchant> {
  throw new Error("Cannot create merchants in demo mode");
}

export async function updateMerchant(id: number, payload: Partial<Merchant>): Promise<Merchant> {
  throw new Error("Cannot update merchants in demo mode");
}

export async function deleteMerchant(id: number): Promise<void> {
  throw new Error("Cannot delete merchants in demo mode");
}

// Agents
export async function listAgents(opts?: { 
  page?: number; 
  pageSize?: number; 
  search?: string;
}): Promise<Paginated<Agent>> {
  console.log('demoApi.listAgents called with opts:', opts);
  const data = getDemoData();
  console.log('Demo data agents:', data.agents.length);
  return filterAndPaginate(data.agents, {
    ...opts,
    filterFn: (agent) => {
      if (opts?.search) {
        const searchLower = opts.search.toLowerCase();
        if (!agent.fullname?.toLowerCase().includes(searchLower) && 
            !agent.phone?.toLowerCase().includes(searchLower)) {
          return false;
        }
      }
      return true;
    },
  });
}

export async function getAgent(id: number): Promise<Agent> {
  const data = getDemoData();
  const agent = data.agents.find(a => a.id === id);
  if (!agent) throw new Error(`Agent ${id} not found in demo data`);
  return agent;
}

export async function createAgent(payload: Partial<Agent>): Promise<Agent> {
  throw new Error("Cannot create agents in demo mode");
}

export async function updateAgent(id: number, payload: Partial<Agent>): Promise<Agent> {
  throw new Error("Cannot update agents in demo mode");
}

export async function deleteAgent(id: number): Promise<void> {
  throw new Error("Cannot delete agents in demo mode");
}

// Admins
export async function listAdmins(opts?: { 
  page?: number; 
  pageSize?: number; 
  search?: string; 
  merchantId?: number | "all";
}): Promise<Paginated<Admin>> {
  const data = getDemoData();
  return filterAndPaginate(data.admins, {
    ...opts,
    filterFn: (admin) => {
      if (opts?.search) {
        const searchLower = opts.search.toLowerCase();
        if (!admin.fullname?.toLowerCase().includes(searchLower) && 
            !admin.phone?.toLowerCase().includes(searchLower)) {
          return false;
        }
      }
      if (opts?.merchantId && opts.merchantId !== "all" && admin.merchant_id !== opts.merchantId) return false;
      return true;
    },
  });
}

export async function getAdmin(id: number): Promise<Admin> {
  const data = getDemoData();
  const admin = data.admins.find(a => a.id === id);
  if (!admin) throw new Error(`Admin ${id} not found in demo data`);
  return admin;
}

export async function createAdmin(payload: Partial<Admin>): Promise<Admin> {
  throw new Error("Cannot create admins in demo mode");
}

export async function updateAdmin(id: number, payload: Partial<Admin>): Promise<Admin> {
  throw new Error("Cannot update admins in demo mode");
}

export async function deleteAdmin(id: number): Promise<void> {
  throw new Error("Cannot delete admins in demo mode");
}

// Dashboard Stats
export async function getDashboardStats(): Promise<{
  totalApplications: number;
  confirmedApplications: number;
  totalAmount: number;
  paidAmount: number;
  unpaidAmount: number;
}> {
  const data = getDemoData();
  const applications = data.applications || [];
  
  const totalApplications = applications.length;
  // Count active applications (any status except canceled/rejected)
  const confirmedApplications = applications.filter(a => a.status && !['canceled', 'rejected', 'declined'].includes(a.status.toLowerCase())).length;
  const totalAmount = applications.reduce((sum, a) => sum + (a.limit || 0), 0);
  // Simulate paid amount as 60% of total (demo data)
  const paidAmount = Math.floor(totalAmount * 0.6);
  const unpaidAmount = totalAmount - paidAmount;
  
  return {
    totalApplications,
    confirmedApplications,
    totalAmount,
    paidAmount,
    unpaidAmount,
  };
}

const demoApi = {
  // Auth
  login,
  logout,
  getCurrentUser,
  isAuthenticated,
  // Users
  listUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  // Fillials
  listFillials,
  getFillial,
  createFillial,
  updateFillial,
  deleteFillial,
  // Applications
  listZayavkalar,
  listApplications: listZayavkalar,
  getZayavka,
  getApplication: getZayavka,
  createZayavka,
  updateZayavka,
  deleteZayavka,
  // Merchants
  listMerchants,
  getMerchant,
  createMerchant,
  updateMerchant,
  deleteMerchant,
  // Agents
  listAgents,
  getAgent,
  createAgent,
  updateAgent,
  deleteAgent,
  // Admins
  listAdmins,
  getAdmin,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  // Dashboard
  getDashboardStats,
};

export default demoApi;
