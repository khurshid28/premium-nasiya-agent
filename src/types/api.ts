// Auto-generated frontend types (based on your Prisma models)
// Adjust fields if your API uses different shapes or naming.

export type Role =
  | "USER"
  | "AGENT"
  | "ADMIN"
  | "SUPER"
  | "CLIENT"
  | "ACCOUNTANT"
  | "CALLCENTER"
  | "BANKUSER"
  | "BOTUSER";

export type REGION =
  | "ANDIJON"
  | "BUXORO"
  | "FARGONA"
  | "JIZZAX"
  | "XORAZM"
  | "NAMANGAN"
  | "NAVOIY"
  | "QASHQADARYO"
  | "QORAQALPOQ"
  | "SAMARQAND"
  | "SIRDARYO"
  | "SURXONDARYO"
  | "TOSHKENT"
  | "TOSHKENT_SHAHAR";

export type WORK_STATUS = "WORKING" | "BLOCKED" | "DELETED";
export type MERCHANT_TYPE = "MERCHANT" | "AGENT";
export type STATUS =
  | "CREATED"
  | "ADDED_DETAIL"
  | "WAITING_SCORING"
  | "LIMIT"
  | "CANCELED_BY_SCORING"
  | "CANCELED_BY_CLIENT"
  | "CANCELED_BY_DAILY"
  | "ADDED_PRODUCT"
  | "WAITING_BANK_UPDATE"
  | "WAITING_BANK_CONFIRM"
  | "CONFIRMED"
  | "FINISHED";
export type PERCENT_TYPE = "OUT" | "IN";

export interface Merchant {
  id: number;
  name: string;
  image?: string | null;
  type?: MERCHANT_TYPE;
  work_status?: WORK_STATUS;
  createdAt?: string;
  updatedAt?: string | null;
  // Relations may be included or not depending on your API
  // fillials?: Fillial[];
  // users?: User[];
}

export interface Fillial {
  id: number;
  name: string;
  image?: string | null;
  address?: string | null;
  region?: REGION | null;
  work_status?: WORK_STATUS;
  createdAt?: string;
  updatedAt?: string | null;
  merchant_id?: number | null;
  nds?: string | null;
  hisob_raqam?: string | null;
  bank_name?: string | null;
  mfo?: string | null;
  inn?: string | null;
  director_name?: string | null;
  director_phone?: string | null;
  percent_type?: PERCENT_TYPE;
  expired_months?: any;
  cashback_percent?: number;
  cashback_amount?: number;
  max_amount?: number;
  timeout?: number;
  merchant?: Merchant | null;
}

export interface Agent {
  id: number;
  fullname: string;
  image?: string | null;
  phone?: string | null;
  password?: string | null; // typically not returned by API
  role?: Role;
  work_status?: WORK_STATUS;
  createdAt?: string;
  updatedAt?: string | null;
  fillials?: Fillial[];
}

export interface Admin {
  id: number;
  fullname: string;
  image?: string | null;
  phone?: string | null;
  password?: string | null; // typically not returned by API
  merchant_id?: number | null;
  merchant?: Merchant | null;
  role?: Role;
  work_status?: WORK_STATUS;
  createdAt?: string;
  updatedAt?: string | null;
}

export interface User {
  id: number;
  fullname: string;
  image?: string | null;
  phone?: string | null;
  password?: string | null; // typically not returned by API
  role?: Role;
  work_status?: WORK_STATUS;
  createdAt?: string;
  updatedAt?: string | null;
  merchant_id?: number;
  fillial_id?: number;
  fillial?: Fillial;
  merchant?: Merchant;
}

export interface Product {
  id: number;
  name: string;
  price: number;
  count?: number | null;
  hash?: string | null;
  createdAt?: string;
  updatedAt?: string | null;
  zayavka_id?: number | null;
}

export interface MyId {
  id: number;
  response_id?: string | null;
  comparison_value?: number | null;
  passport?: string | null;
  profile?: any;
  createdAt?: string;
  updatedAt?: string | null;
}

export interface Zayavka {
  id: number;
  fullname: string;
  phone?: string | null;
  phone2?: string | null;
  passport?: string | null;
  limit?: number | null;
  canceled_reason?: string | null;
  expired_month?: string | null;
  percent?: number | null;
  amount?: number | null;
  payment_amount?: number | null;
  status?: STATUS | null;
  bank_id?: number;
  request_id?: string | null;
  createdAt?: string;
  updatedAt?: string | null;
  merchant_id?: number;
  fillial_id?: number;
  user_id?: number;
  myid_id?: number | null;
  paid?: boolean | null;
  products?: Product[];
  bank?: any;
  fillial?: Fillial;
  merchant?: Merchant;
  myid?: MyId | null;
  user?: User;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

// file only contains types; no runtime default export needed
export {};
