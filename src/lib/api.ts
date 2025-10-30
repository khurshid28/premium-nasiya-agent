import type { Paginated, User, Fillial, Zayavka } from "types/api";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:3333/api";

// Auth response types
export interface LoginResponse {
  user: {
    id: number;
    phone: string;
    fullname: string;
    image: string | null;
    role: string;
  };
  access_token: string;
  message: string;
}

function authHeaders() {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Custom error type for API errors
interface ApiError extends Error {
  status?: number;
  body?: any;
  originalError?: Error;
}

// Helper function to check if an error is a network error
function isNetworkError(error: unknown): boolean {
  return error instanceof TypeError && 
    (error.message.includes('Failed to fetch') || 
     error.message.includes('NetworkError') ||
     error.message.includes('Network request failed'));
}

async function handleResponse<T>(res: Response): Promise<T> {
  const text = await res.text();
  const contentType = res.headers.get("content-type") || "";
  const body = contentType.includes("application/json") && text ? JSON.parse(text) : text;
  if (!res.ok) {
    // Extract error message from different possible formats
    let errorMessage = "Request failed";
    
    if (typeof body === 'object' && body !== null) {
      // Try common error message fields
      errorMessage = body.message || body.error || body.msg || body.detail || JSON.stringify(body);
    } else if (typeof body === 'string') {
      errorMessage = body;
    } else {
      errorMessage = res.statusText || "Request failed";
    }
    
    const err = new Error(errorMessage) as ApiError;
    err.status = res.status;
    err.body = body;
    throw err;
  }
  return body as T;
}

async function fetchWithRetry(url: string, options: RequestInit = {}, retries = 2): Promise<Response> {
  let lastError: Error | null = null;
  
  // Add cache-busting parameter to force fresh requests and avoid cached CORS issues
  const separator = url.includes('?') ? '&' : '?';
  const cacheBustUrl = `${url}${separator}_t=${Date.now()}`;
  
  for (let i = 0; i <= retries; i++) {
    try {
      // Check if request was aborted before making the call
      if (options.signal?.aborted) {
        throw new DOMException('Request was aborted', 'AbortError');
      }
      
      const res = await fetch(cacheBustUrl, options);
      return res;
    } catch (error) {
      lastError = error as Error;
      
      // If request was aborted, don't retry
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw error;
      }
      
      // Check if this is a network error that should be retried
      if (isNetworkError(error) && i < retries && !options.signal?.aborted) {
        // Network error - retry with exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
        continue;
      }
      
      // If it's not a network error or we've exhausted retries, break
      break;
    }
  }
  
  // If we get here, all retries failed
  const err = new Error(
    `Server aloqasi o'rnatilmadi. Iltimos, internetingizni tekshiring yoki keyinroq qayta urinib ko'ring. ${lastError?.message || ''}`
  ) as ApiError;
  err.originalError = lastError ?? undefined;
  throw err;
}

function qs(params?: Record<string, any>) {
  if (!params) return "";
  const q = new URLSearchParams();
  Object.keys(params).forEach((k) => {
    const v = params[k];
    if (v === undefined || v === null) return;
    q.append(k, String(v));
  });
  const s = q.toString();
  return s ? `?${s}` : "";
}

// Auth
export async function login(login: string, password: string): Promise<LoginResponse> {
  const res = await fetchWithRetry(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ login, password }),
  });
  const data = await handleResponse<LoginResponse>(res);
  // Save token to localStorage
  if (data.access_token && typeof window !== "undefined") {
    localStorage.setItem("token", data.access_token);
    localStorage.setItem("user", JSON.stringify(data.user));
  }
  return data;
}

export async function logout(): Promise<void> {
  if (typeof window !== "undefined") {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }
}

export function getCurrentUser(): LoginResponse["user"] | null {
  if (typeof window !== "undefined") {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  }
  return null;
}

export function isAuthenticated(): boolean {
  if (typeof window !== "undefined") {
    return !!localStorage.getItem("token");
  }
  return false;
}

// Users
export async function listUsers(opts?: {
  page?: number;
  pageSize?: number;
  search?: string;
  role?: string;
  fillialId?: number | "all";
}): Promise<Paginated<User>> {
  const params: any = {};
  if (opts?.page !== undefined) params.page = opts.page;
  if (opts?.pageSize !== undefined) params.pageSize = opts.pageSize;
  if (opts?.search) params.search = opts.search;
  if (opts?.role) params.role = opts.role;
  if (opts?.fillialId && opts.fillialId !== "all") {
    params.fillialId = opts.fillialId;
  }
  const url = `${API_BASE}/user/all${qs(params)}`;
  
  // Minimal headers to avoid CORS issues
  const headers: Record<string, string> = {};
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  const res = await fetchWithRetry(url, { 
    method: 'GET',
    headers
  });
  
  const result = await handleResponse<any>(res);
  
  // If API returns array directly, return all data for client-side pagination
  if (Array.isArray(result)) {
    return {
      items: result, // Barcha ma'lumotlarni qaytarish
      total: result.length,
      page: opts?.page || 1,
      pageSize: opts?.pageSize || 5
    };
  }
  
  // If API returns pagination format, return as is
  return result;
}

export async function getUser(id: number): Promise<User> {
  const res = await fetchWithRetry(`${API_BASE}/user/${id}`, { headers: { "Content-Type": "application/json", ...authHeaders() } });
  return handleResponse<User>(res);
}

export async function createUser(payload: Partial<User>): Promise<User> {
  const res = await fetchWithRetry(`${API_BASE}/user`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload),
  });
  return handleResponse<User>(res);
}

export async function updateUser(id: number, payload: Partial<User>): Promise<User> {
  const res = await fetchWithRetry(`${API_BASE}/user/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload),
  });
  return handleResponse<User>(res);
}

export async function deleteUser(id: number): Promise<void> {
  const res = await fetchWithRetry(`${API_BASE}/user/${id}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json", ...authHeaders() },
  });
  return handleResponse<void>(res);
}

// Fillials
export async function listFillials(opts?: { page?: number; pageSize?: number; search?: string; region?: string }): Promise<Paginated<Fillial>> {
  const params: any = {};
  if (opts?.page !== undefined) params.page = opts.page;
  if (opts?.pageSize !== undefined) params.pageSize = opts.pageSize;
  if (opts?.search) params.search = opts.search;
  if (opts?.region) params.region = opts.region;
  const url = `${API_BASE}/fillial/all${qs(params)}`;
  
  // Minimal headers to avoid CORS issues
  const headers: Record<string, string> = {};
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  console.log('API Call: Fillials URL:', url);
  console.log('API Call: Fillials params:', params);
  console.log('API Call: Fillials headers:', headers);
  
  const res = await fetchWithRetry(url, { 
    method: 'GET',
    headers
  });
  
  console.log('API Response: Status:', res.status);
  console.log('API Response: Headers:', Object.fromEntries(res.headers.entries()));
  
  const result = await handleResponse<any>(res);
  console.log('API Response: Fillials raw result:', result);
  console.log('API Response: Result type:', typeof result);
  console.log('API Response: Is Array:', Array.isArray(result));
  
  // If API returns array directly, return all data for client-side pagination
  if (Array.isArray(result)) {
    console.log('API returned array, returning all data for client-side pagination');
    return {
      items: result, // Barcha ma'lumotlarni qaytarish
      total: result.length,
      page: opts?.page || 1,
      pageSize: opts?.pageSize || 5
    };
  }
  
  // If API returns pagination format, return as is
  return result;
}

export async function getFillial(id: number): Promise<Fillial> {
  const res = await fetchWithRetry(`${API_BASE}/fillial/${id}`, { headers: { "Content-Type": "application/json", ...authHeaders() } });
  return handleResponse<Fillial>(res);
}

export async function createFillial(payload: Partial<Fillial>): Promise<Fillial> {
  const res = await fetchWithRetry(`${API_BASE}/fillial`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload),
  });
  return handleResponse<Fillial>(res);
}

export async function updateFillial(id: number, payload: Partial<Fillial>): Promise<Fillial> {
  const res = await fetchWithRetry(`${API_BASE}/fillial/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload),
  });
  return handleResponse<Fillial>(res);
}

export async function deleteFillial(id: number): Promise<void> {
  const res = await fetchWithRetry(`${API_BASE}/fillial/${id}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json", ...authHeaders() },
  });
  return handleResponse<void>(res);
}

// Zayavkalar (applications)
export async function listZayavkalar(opts?: { page?: number; pageSize?: number; search?: string; status?: string }): Promise<Paginated<Zayavka>> {
  const params: any = {};
  if (opts?.page !== undefined) params.page = opts.page;
  if (opts?.pageSize !== undefined) params.pageSize = opts.pageSize;
  if (opts?.search) params.search = opts.search;
  if (opts?.status) params.status = opts.status;
  const url = `${API_BASE}/app/all${qs(params)}`;
  
  // Minimal headers to avoid CORS issues
  const headers: Record<string, string> = {};
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  const res = await fetchWithRetry(url, { 
    method: 'GET',
    headers
  });
  
  const result = await handleResponse<any>(res);
  
  // If API returns array directly, return all data for client-side pagination
  if (Array.isArray(result)) {
    return {
      items: result, // Barcha ma'lumotlarni qaytarish
      total: result.length,
      page: opts?.page || 1,
      pageSize: opts?.pageSize || 5
    };
  }
  
  // If API returns pagination format, return as is
  return result;
}

export async function getZayavka(id: number): Promise<Zayavka> {
  const res = await fetchWithRetry(`${API_BASE}/app/${id}`, { headers: { "Content-Type": "application/json", ...authHeaders() } });
  return handleResponse<Zayavka>(res);
}

export async function createZayavka(payload: Partial<Zayavka>): Promise<Zayavka> {
  const res = await fetchWithRetry(`${API_BASE}/app`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload),
  });
  return handleResponse<Zayavka>(res);
}

export async function updateZayavka(id: number, payload: Partial<Zayavka>): Promise<Zayavka> {
  const res = await fetchWithRetry(`${API_BASE}/app/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload),
  });
  return handleResponse<Zayavka>(res);
}

export async function deleteZayavka(id: number): Promise<void> {
  const res = await fetchWithRetry(`${API_BASE}/app/${id}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json", ...authHeaders() },
  });
  return handleResponse<void>(res);
}

// NOTE:
// - The endpoints above assume these paths: /user/all, /fillial/all, /app/all.
//   If your NestJS controllers use different paths, adjust API_BASE or endpoint paths accordingly.
// - Pagination/query param names might differ; adjust qs(...) usage if your API expects skip/take or offset/limit.
// - For secure credential retrieval (passwords), prefer a dedicated endpoint such as GET /user/:id/credentials that requires admin auth.

const api = {
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
  listApplications: listZayavkalar, // alias for compatibility
  getZayavka,
  getApplication: getZayavka, // alias for compatibility
  createZayavka,
  updateZayavka,
  deleteZayavka,
};

export default api;
