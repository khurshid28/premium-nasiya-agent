import type { Paginated, User } from "types/api";

// Simple in-memory mock users dataset (demo only)
const MOCK_USERS: User[] = [
  { id: 1, fullname: "Alisher Karimov", phone: "+998900000001", password: "aJk#2025", role: "USER", work_status: "WORKING", merchant_id: 10, fillial_id: 1, fillial: { id: 1, name: "Bosh filial" }, merchant: { id: 10, name: "ACME Retail" }, createdAt: new Date().toISOString() },
  { id: 2, fullname: "Bobur Saidov", phone: "+998900000002", password: "bS!2025", role: "USER", work_status: "WORKING", merchant_id: 10, fillial_id: 1, fillial: { id: 1, name: "Bosh filial" }, merchant: { id: 10, name: "ACME Retail" }, createdAt: new Date().toISOString() },
  { id: 3, fullname: "Sardor Rahimov", phone: "+998900000003", password: "cD%2025", role: "USER", work_status: "BLOCKED", merchant_id: 10, fillial_id: 2, fillial: { id: 2, name: "Sharq filiali" }, merchant: { id: 10, name: "ACME Retail" }, createdAt: new Date().toISOString() },
  { id: 4, fullname: "Malika Tosheva", phone: "+998900000004", password: "dR$2025", role: "USER", work_status: "WORKING", merchant_id: 10, fillial_id: 1, fillial: { id: 1, name: "Bosh filial" }, merchant: { id: 10, name: "ACME Retail" }, createdAt: new Date().toISOString() },
  { id: 5, fullname: "Sevara Nazarova", phone: "+998900000005", password: "eA*2025", role: "USER", work_status: "WORKING", merchant_id: 11, fillial_id: 3, fillial: { id: 3, name: "G'arb filiali" }, merchant: { id: 11, name: "Beta Corp" }, createdAt: new Date().toISOString() },
  { id: 6, fullname: "Jasur Abdullayev", phone: "+998900000006", password: "fC(2025", role: "USER", work_status: "WORKING", merchant_id: 11, fillial_id: 3, fillial: { id: 3, name: "G'arb filiali" }, merchant: { id: 11, name: "Beta Corp" }, createdAt: new Date().toISOString() },
];

// Auto-generate more users for better demo
(() => {
  const names = ["Aziza", "Dilshod", "Feruza", "Gulsara", "Husnora", "Jasurbek", "Kamila", "Laziz", "Madina", "Nodir", "Oysha", "Parviz", "Qodira", "Rustam", "Shaxnoza", "Toxir", "Umida", "Vali", "Yulduz", "Zarina"];
  const surnames = ["Karimov", "Saidov", "Rahimov", "Toshev", "Nazarov", "Abdullayev", "Mahmudov", "Yusupov", "Akbarov", "Usmanov"];
  
  for (let i = 7; i <= 100; i++) {
    const name = names[i % names.length];
    const surname = surnames[i % surnames.length];
    const fillialId = 1 + (i % 35); // Distribute across 35 fillials
    const user: User = {
      id: i,
      fullname: `${name} ${surname}`,
      phone: `+99890${(1000000 + i).toString().slice(-7)}`,
      password: `pass${i}#2025`,
      role: i % 15 === 0 ? "ADMIN" : "USER", // 1 admin per 15 users
      work_status: i % 25 === 0 ? "BLOCKED" : "WORKING", // 4% blocked
      merchant_id: i % 2 === 0 ? 10 : 11,
      fillial_id: fillialId,
      fillial: { id: fillialId, name: `Filial ${fillialId}` },
      merchant: i % 2 === 0 ? { id: 10, name: "ACME Retail" } : { id: 11, name: "Beta Corp" },
      createdAt: new Date(Date.now() - i * 86400000).toISOString()
    };
    MOCK_USERS.push(user);
  }
})();

// Simple in-memory fillials
const MOCK_FILLIALS: any[] = [
  { 
    id: 1, 
    name: "Bosh filial", 
    address: "Toshkent sh, Amir Temur ko'chasi 123", 
    image: "", 
    region: "Toshkent", 
    work_status: "WORKING", 
    merchant_id: 10,
    inn: "123456789",
    nds: 12,
    hisob_raqam: "20208000000000000001",
    bank_name: "Xalq Banki",
    mfo: "00014",
    director_name: "Karimov Akmal Tursunovich",
    director_phone: "+998901234567",
    createdAt: new Date().toISOString() 
  },
  { 
    id: 2, 
    name: "Sharq filiali", 
    address: "Andijon sh, Navoi ko'chasi 45", 
    image: "", 
    region: "Andijon", 
    work_status: "BLOCKED", 
    merchant_id: 10,
    inn: "987654321",
    nds: 15,
    hisob_raqam: "20208000000000000002",
    bank_name: "Asaka Bank",
    mfo: "00015",
    director_name: "Saidov Botir Olimovich",
    director_phone: "+998901234568",
    createdAt: new Date().toISOString() 
  },
  { 
    id: 3, 
    name: "G'arb filiali", 
    address: "Samarqand sh, Registon ko'chasi 78", 
    image: "", 
    region: "Samarqand", 
    work_status: "WORKING", 
    merchant_id: 11,
    inn: "456789123",
    nds: 12,
    hisob_raqam: "20208000000000000003",
    bank_name: "Ipoteka Bank",
    mfo: "00422",
    director_name: "Rahmonova Dilnoza Shavkatovna",
    director_phone: "+998901234569",
    createdAt: new Date().toISOString() 
  },
];

// Simple in-memory merchants
const MOCK_MERCHANTS = [
  { id: 10, name: "ACME Retail", image: "" },
  { id: 11, name: "Beta Corp", image: "" },
];

function delay<T>(value: T, ms = 300): Promise<T> {
  return new Promise((res) => setTimeout(() => res(value), ms));
}

export async function listUsers(opts?: { page?: number; pageSize?: number; search?: string; role?: string; fillialId?: number | "all" }): Promise<Paginated<User>> {
  const page = opts?.page ?? 1;
  const pageSize = opts?.pageSize ?? 5;
  const search = (opts?.search ?? "").trim().toLowerCase();
  const role = opts?.role ?? "all";
  const fillialId = opts?.fillialId ?? "all";

  let filtered = MOCK_USERS.slice();
  if (search) {
    filtered = filtered.filter((u) => (u.fullname ?? "").toLowerCase().includes(search) || (u.phone ?? "").toLowerCase().includes(search));
  }
  if (role && role !== "all") {
    filtered = filtered.filter((u) => u.role === role);
  }
  if (fillialId && fillialId !== "all") {
    filtered = filtered.filter((u) => u.fillial_id === Number(fillialId));
  }
  const total = filtered.length;
  const start = (page - 1) * pageSize;
  const items = filtered.slice(start, start + pageSize);

  return delay({ items, total, page, pageSize });
}

export async function getUser(id: number): Promise<User> {
  const user = MOCK_USERS.find((u) => u.id === id);
  if (!user) throw new Error("Not found");
  return delay(user);
}

// Create or update user (in-memory)
export async function createUser(payload: Partial<User>): Promise<User> {
  const id = MOCK_USERS.reduce((mx, u) => Math.max(mx, u.id), 0) + 1;
  const now = new Date().toISOString();
  // Simulate backend-generated password: if no password provided, generate one here
  const generatedPassword = payload.password ?? ((): string => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#$%";
    let p = "";
    for (let i = 0; i < 8; i++) p += chars[Math.floor(Math.random() * chars.length)];
    return p;
  })();

  const user: User = {
    id,
    fullname: payload.fullname ?? "",
    phone: payload.phone ?? "",
    // store generated password to simulate backend returning it
    password: generatedPassword,
    role: (payload.role ?? "USER") as any,
    work_status: (payload.work_status ?? "WORKING") as any,
    merchant_id: payload.merchant_id ?? 0,
    fillial_id: payload.fillial_id ?? null,
    fillial: payload.fillial ?? null,
    merchant: payload.merchant ?? null,
    createdAt: now,
  } as User;
  MOCK_USERS.push(user);
  return delay(user);
}

export async function updateUser(id: number, payload: Partial<User>): Promise<User> {
  const idx = MOCK_USERS.findIndex((u) => u.id === id);
  if (idx === -1) throw new Error("Not found");
  const existing = MOCK_USERS[idx];
  const updated = { ...existing, ...payload, updatedAt: new Date().toISOString() } as User;
  MOCK_USERS[idx] = updated;
  return delay(updated);
}

export async function listFillials(opts?: { page?: number; pageSize?: number; search?: string }): Promise<Paginated<any>> {
  const page = opts?.page ?? 1;
  const pageSize = opts?.pageSize ?? 10;
  const search = (opts?.search ?? "").trim().toLowerCase();
  let filtered = MOCK_FILLIALS.slice();
  if (search) filtered = filtered.filter((f) => f.name.toLowerCase().includes(search) || (f.address ?? "").toLowerCase().includes(search));
  const total = filtered.length;
  const start = (page - 1) * pageSize;
  const items = filtered.slice(start, start + pageSize);
  return delay({ items, total, page, pageSize });
}

// Simple in-memory applications dataset (Zayavka-like)
const MOCK_APPLICATIONS: any[] = [
  {
    id: 1,
    fullname: "Ali Karimov",
    phone: "+998900100001",
    passport: "AA1234567",
    amount: 2500000,
    payment_amount: 2800000,
    percent: 12,
    status: "PENDING",
    expired_month: 6,
    merchant: { id: 10, name: "ACME Retail" },
    fillial: { id: 1, name: "Bosh filial" },
    fillial_id: 1,
    user: { id: 1, fullname: "Alisher Karimov", phone: "+998900000001" },
    paid: false,
    products: [
      { id: 101, name: "Telefon qopqog'i", price: 15000, count: 2 },
      { id: 102, name: "Ekran himoyasi", price: 5000, count: 1 },
    ],
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
  },
  {
    id: 2,
    fullname: "Mariya Nazarova",
    phone: "+998900100002",
    passport: "BB7654321",
    amount: 3200000,
    payment_amount: 3520000,
    percent: 10,
    status: "APPROVED",
    expired_month: 12,
    merchant: { id: 10, name: "ACME Retail" },
    fillial: { id: 2, name: "Sharq filiali" },
    fillial_id: 2,
    user: { id: 2, fullname: "Bobur Saidov", phone: "+998900000002" },
    paid: false,
    products: [{ id: 103, name: "USB kabel", price: 10000, count: 1 }],
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
  },
  {
    id: 3,
    fullname: "John Doe",
    phone: "+998900100003",
    passport: "CC9988776",
    amount: 1800000,
    percent: 8,
    status: "REJECTED",
    expired_month: 3,
    merchant: { id: 11, name: "Beta Corp" },
    fillial: { id: 3, name: "West Branch" },
    fillial_id: 3,
    user: { id: 3, fullname: "Charlie Day", phone: "+998900000003" },
    paid: false,
    products: [],
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(), // 45 days ago (older than month)
  },
  // more demo items to better populate charts
  {
    id: 4,
    fullname: "Zara Ali",
    phone: "+998900100004",
    passport: "DD1122334",
    amount: 5600000,
    percent: 15,
    status: "PENDING",
    expired_month: null,
    merchant: { id: 10, name: "ACME Retail" },
    fillial: { id: 1, name: "Main Branch" },
    fillial_id: 1,
    user: { id: 4, fullname: "Donna Reed", phone: "+998900000004" },
    paid: false,
    products: [
      { id: 104, name: "Bluetooth Speaker", price: 75000, count: 1 },
      { id: 105, name: "Headphones", price: 75000, count: 1 },
    ],
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
  },
  {
    id: 5,
    fullname: "Liam Smith",
    phone: "+998900100005",
    passport: "EE5566778",
    amount: 4300000,
    percent: 11,
    status: "APPROVED",
    expired_month: null,
    merchant: { id: 11, name: "Beta Corp" },
    fillial: { id: 3, name: "West Branch" },
    fillial_id: 3,
    user: { id: 5, fullname: "Eve Adams", phone: "+998900000005" },
    paid: true,
    products: [{ id: 106, name: "Smartwatch", price: 75000, count: 1 }],
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
  },
  {
    id: 6,
    fullname: "Noah Brown",
    phone: "+998900100006",
    passport: "FF4433221",
    amount: 2100000,
    percent: 9,
    status: "PENDING",
    merchant: { id: 10, name: "ACME Retail" },
    fillial: { id: 2, name: "East Branch" },
    fillial_id: 2,
    user: { id: 6, fullname: "Frank Cole", phone: "+998900000006" },
    paid: false,
    products: [{ id: 107, name: "Charger", price: 30000, count: 1 }],
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(), // 20 days ago
  },
  // Weekly data (last 7 days) - target 75% rejected
  { id: 7, fullname: "Rejected User 1", phone: "+998900100007", status: "REJECTED", fillial_id: 1, fillial: { id: 1, name: "Main Branch" }, merchant: { id: 10, name: "ACME Retail" }, createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() }, // 1 day ago
  { id: 8, fullname: "Rejected User 2", phone: "+998900100008", status: "REJECTED", fillial_id: 1, fillial: { id: 1, name: "Main Branch" }, merchant: { id: 10, name: "ACME Retail" }, createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() }, // 2 days ago
  { id: 9, fullname: "Rejected User 3", phone: "+998900100009", status: "REJECTED", fillial_id: 2, fillial: { id: 2, name: "East Branch" }, merchant: { id: 10, name: "ACME Retail" }, createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() }, // 3 days ago
  { id: 10, fullname: "Rejected User 4", phone: "+998900100010", status: "REJECTED", fillial_id: 2, fillial: { id: 2, name: "East Branch" }, merchant: { id: 10, name: "ACME Retail" }, createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() }, // 4 days ago
  // More weekly rejected applications
  { id: 11, fullname: "Rejected User 5", phone: "+998900100011", status: "REJECTED", fillial_id: 3, fillial: { id: 3, name: "West Branch" }, merchant: { id: 11, name: "Beta Corp" }, createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() }, // 5 days ago
  { id: 12, fullname: "Rejected User 6", phone: "+998900100012", status: "REJECTED", fillial_id: 3, fillial: { id: 3, name: "West Branch" }, merchant: { id: 11, name: "Beta Corp" }, createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString() }, // 6 days ago
  { id: 13, fullname: "Weekly Approved 1", phone: "+998900100013", status: "APPROVED", fillial_id: 1, fillial: { id: 1, name: "Main Branch" }, merchant: { id: 10, name: "ACME Retail" }, createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() }, // 1 day ago
  { id: 14, fullname: "Weekly Pending 1", phone: "+998900100014", status: "PENDING", fillial_id: 2, fillial: { id: 2, name: "East Branch" }, merchant: { id: 10, name: "ACME Retail" }, createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() }, // 3 days ago
  // Monthly data (8-30 days) - reduce rejected % for monthly
  { id: 15, fullname: "Monthly Approved 1", phone: "+998900100015", status: "APPROVED", fillial_id: 3, fillial: { id: 3, name: "West Branch" }, merchant: { id: 11, name: "Beta Corp" }, createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() }, // 10 days ago
  { id: 16, fullname: "Monthly Approved 2", phone: "+998900100016", status: "APPROVED", fillial_id: 1, fillial: { id: 1, name: "Main Branch" }, merchant: { id: 10, name: "ACME Retail" }, createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString() }, // 15 days ago
  { id: 17, fullname: "Monthly Approved 3", phone: "+998900100017", status: "APPROVED", fillial_id: 2, fillial: { id: 2, name: "East Branch" }, merchant: { id: 10, name: "ACME Retail" }, createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString() }, // 20 days ago
  { id: 18, fullname: "Monthly Pending 1", phone: "+998900100018", status: "PENDING", fillial_id: 3, fillial: { id: 3, name: "West Branch" }, merchant: { id: 11, name: "Beta Corp" }, createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString() }, // 25 days ago
  // Yearly data (31-365 days) - more rejected for 81%
  { id: 19, fullname: "Yearly Rejected 1", phone: "+998900100019", status: "REJECTED", fillial_id: 1, fillial: { id: 1, name: "Main Branch" }, merchant: { id: 10, name: "ACME Retail" }, createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString() }, // 45 days ago
  { id: 20, fullname: "Yearly Rejected 2", phone: "+998900100020", status: "REJECTED", fillial_id: 2, fillial: { id: 2, name: "East Branch" }, merchant: { id: 10, name: "ACME Retail" }, createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString() }, // 60 days ago
  { id: 21, fullname: "Yearly Rejected 3", phone: "+998900100021", status: "REJECTED", fillial_id: 3, fillial: { id: 3, name: "West Branch" }, merchant: { id: 11, name: "Beta Corp" }, createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString() }, // 90 days ago
  { id: 22, fullname: "Yearly Rejected 4", phone: "+998900100022", status: "REJECTED", fillial_id: 1, fillial: { id: 1, name: "Main Branch" }, merchant: { id: 10, name: "ACME Retail" }, createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString() }, // 120 days ago
  { id: 23, fullname: "Yearly Rejected 5", phone: "+998900100023", status: "REJECTED", fillial_id: 2, fillial: { id: 2, name: "East Branch" }, merchant: { id: 10, name: "ACME Retail" }, createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString() }, // 180 days ago
  { id: 24, fullname: "Yearly Rejected 6", phone: "+998900100024", status: "REJECTED", fillial_id: 3, fillial: { id: 3, name: "West Branch" }, merchant: { id: 11, name: "Beta Corp" }, createdAt: new Date(Date.now() - 250 * 24 * 60 * 60 * 1000).toISOString() }, // 250 days ago
  // More yearly applications
  { id: 25, fullname: "Yearly Approved 1", phone: "+998900100025", status: "APPROVED", fillial_id: 1, fillial: { id: 1, name: "Main Branch" }, merchant: { id: 10, name: "ACME Retail" }, createdAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString() }, // 100 days ago
  { id: 26, fullname: "Yearly Rejected 7", phone: "+998900100026", status: "REJECTED", fillial_id: 2, fillial: { id: 2, name: "East Branch" }, merchant: { id: 10, name: "ACME Retail" }, createdAt: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString() }, // 200 days ago
  { id: 27, fullname: "Yearly Rejected 8", phone: "+998900100027", status: "REJECTED", fillial_id: 3, fillial: { id: 3, name: "West Branch" }, merchant: { id: 11, name: "Beta Corp" }, createdAt: new Date(Date.now() - 300 * 24 * 60 * 60 * 1000).toISOString() }, // 300 days ago
  
  // Weekly approved applications with higher amounts
  { id: 28, fullname: "Weekly Approved Big 1", phone: "+998900100028", passport: "WA1111111", amount: 8500000, percent: 15, status: "APPROVED", fillial_id: 1, fillial: { id: 1, name: "Main Branch" }, merchant: { id: 10, name: "ACME Retail" }, createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() }, // 2 hours ago (06:00)
  { id: 29, fullname: "Weekly Approved Big 2", phone: "+998900100029", passport: "WA2222222", amount: 12300000, percent: 18, status: "APPROVED", fillial_id: 2, fillial: { id: 2, name: "East Branch" }, merchant: { id: 10, name: "ACME Retail" }, createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString() }, // 4 hours ago (04:00)
  { id: 30, fullname: "Weekly Approved Big 3", phone: "+998900100030", passport: "WA3333333", amount: 6700000, percent: 12, status: "APPROVED", fillial_id: 3, fillial: { id: 3, name: "West Branch" }, merchant: { id: 11, name: "Beta Corp" }, createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() }, // Yesterday
  { id: 31, fullname: "Weekly Approved Big 4", phone: "+998900100031", passport: "WA4444444", amount: 9800000, percent: 14, status: "APPROVED", fillial_id: 1, fillial: { id: 1, name: "Main Branch" }, merchant: { id: 10, name: "ACME Retail" }, createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() }, // 3 days ago
  { id: 32, fullname: "Weekly Approved Big 5", phone: "+998900100032", passport: "WA5555555", amount: 11200000, percent: 16, status: "APPROVED", fillial_id: 2, fillial: { id: 2, name: "East Branch" }, merchant: { id: 10, name: "ACME Retail" }, createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() }, // 4 days ago
  { id: 33, fullname: "Weekly Approved Big 6", phone: "+998900100033", passport: "WA6666666", amount: 7400000, percent: 13, status: "APPROVED", fillial_id: 3, fillial: { id: 3, name: "West Branch" }, merchant: { id: 11, name: "Beta Corp" }, createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() }, // 5 days ago
  { id: 34, fullname: "Weekly Approved Big 7", phone: "+998900100034", passport: "WA7777777", amount: 14500000, percent: 20, status: "APPROVED", fillial_id: 1, fillial: { id: 1, name: "Main Branch" }, merchant: { id: 10, name: "ACME Retail" }, createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString() }, // 6 days ago
  
  // Today's approved applications spread across different hours
  { id: 35, fullname: "Today Approved 1", phone: "+998900100035", passport: "TA1111111", amount: 5200000, percent: 10, status: "APPROVED", fillial_id: 1, fillial: { id: 1, name: "Main Branch" }, merchant: { id: 10, name: "ACME Retail" }, createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString() }, // 1 hour ago (07:00)
  { id: 36, fullname: "Today Approved 2", phone: "+998900100036", passport: "TA2222222", amount: 3800000, percent: 8, status: "APPROVED", fillial_id: 2, fillial: { id: 2, name: "East Branch" }, merchant: { id: 10, name: "ACME Retail" }, createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString() }, // 10 minutes ago
  { id: 37, fullname: "Today Approved 3", phone: "+998900100037", passport: "TA3333333", amount: 7600000, percent: 12, status: "APPROVED", fillial_id: 3, fillial: { id: 3, name: "West Branch" }, merchant: { id: 11, name: "Beta Corp" }, createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() }, // 3 hours ago (05:00)
  { id: 38, fullname: "Today Approved 4", phone: "+998900100038", passport: "TA4444444", amount: 9300000, percent: 14, status: "APPROVED", fillial_id: 1, fillial: { id: 1, name: "Main Branch" }, merchant: { id: 10, name: "ACME Retail" }, createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString() }, // 5 hours ago (03:00)
  { id: 39, fullname: "Today Approved 5", phone: "+998900100039", passport: "TA5555555", amount: 6100000, percent: 11, status: "APPROVED", fillial_id: 2, fillial: { id: 2, name: "East Branch" }, merchant: { id: 10, name: "ACME Retail" }, createdAt: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString() }, // 7 hours ago (01:00)
  
  // Monthly data for line chart (last 6 months)
  { id: 40, fullname: "Sep User 1", phone: "+998900100040", amount: 8900000, status: "APPROVED", fillial_id: 1, fillial: { id: 1, name: "Main Branch" }, merchant: { id: 10, name: "ACME Retail" }, createdAt: new Date(2025, 8, 15).toISOString() }, // September 2025
  { id: 41, fullname: "Sep User 2", phone: "+998900100041", amount: 6400000, status: "APPROVED", fillial_id: 2, fillial: { id: 2, name: "East Branch" }, merchant: { id: 10, name: "ACME Retail" }, createdAt: new Date(2025, 8, 20).toISOString() }, // September 2025
  { id: 42, fullname: "Aug User 1", phone: "+998900100042", amount: 11700000, status: "APPROVED", fillial_id: 1, fillial: { id: 1, name: "Main Branch" }, merchant: { id: 10, name: "ACME Retail" }, createdAt: new Date(2025, 7, 10).toISOString() }, // August 2025
  { id: 43, fullname: "Aug User 2", phone: "+998900100043", amount: 13200000, status: "APPROVED", fillial_id: 3, fillial: { id: 3, name: "West Branch" }, merchant: { id: 11, name: "Beta Corp" }, createdAt: new Date(2025, 7, 25).toISOString() }, // August 2025
  { id: 44, fullname: "Jul User 1", phone: "+998900100044", amount: 7800000, status: "APPROVED", fillial_id: 2, fillial: { id: 2, name: "East Branch" }, merchant: { id: 10, name: "ACME Retail" }, createdAt: new Date(2025, 6, 5).toISOString() }, // July 2025
  { id: 45, fullname: "Jun User 1", phone: "+998900100045", amount: 10100000, status: "APPROVED", fillial_id: 1, fillial: { id: 1, name: "Main Branch" }, merchant: { id: 10, name: "ACME Retail" }, createdAt: new Date(2025, 5, 12).toISOString() }, // June 2025
  { id: 46, fullname: "May User 1", phone: "+998900100046", amount: 14800000, status: "APPROVED", fillial_id: 3, fillial: { id: 3, name: "West Branch" }, merchant: { id: 11, name: "Beta Corp" }, createdAt: new Date(2025, 4, 8).toISOString() }, // May 2025
    { id: 47, fullname: "May User 2", phone: "+998900100047", amount: 5900000, status: "APPROVED", fillial_id: 2, fillial: { id: 2, name: "East Branch" }, merchant: { id: 10, name: "ACME Retail" }, createdAt: new Date(2025, 4, 22).toISOString() }, // May 2025
  
  // 12-month data for extended charts
  { id: 48, fullname: "Apr User 1", phone: "+998900100048", amount: 7200000, status: "APPROVED", fillial_id: 1, fillial: { id: 1, name: "Main Branch" }, merchant: { id: 10, name: "ACME Retail" }, createdAt: new Date(2025, 3, 10).toISOString() }, // April 2025
  { id: 49, fullname: "Mar User 1", phone: "+998900100049", amount: 10800000, status: "APPROVED", fillial_id: 3, fillial: { id: 3, name: "West Branch" }, merchant: { id: 11, name: "Beta Corp" }, createdAt: new Date(2025, 2, 15).toISOString() }, // March 2025
  { id: 50, fullname: "Feb User 1", phone: "+998900100050", amount: 8500000, status: "APPROVED", fillial_id: 2, fillial: { id: 2, name: "East Branch" }, merchant: { id: 10, name: "ACME Retail" }, createdAt: new Date(2025, 1, 8).toISOString() }, // February 2025
  { id: 51, fullname: "Jan User 1", phone: "+998900100051", amount: 6300000, status: "APPROVED", fillial_id: 1, fillial: { id: 1, name: "Main Branch" }, merchant: { id: 10, name: "ACME Retail" }, createdAt: new Date(2025, 0, 20).toISOString() }, // January 2025
  { id: 52, fullname: "Dec User 1", phone: "+998900100052", amount: 12400000, status: "APPROVED", fillial_id: 3, fillial: { id: 3, name: "West Branch" }, merchant: { id: 11, name: "Beta Corp" }, createdAt: new Date(2024, 11, 12).toISOString() }, // December 2024
  { id: 53, fullname: "Nov User 1", phone: "+998900100053", amount: 9600000, status: "APPROVED", fillial_id: 2, fillial: { id: 2, name: "East Branch" }, merchant: { id: 10, name: "ACME Retail" }, createdAt: new Date(2024, 10, 25).toISOString() } // November 2024
];

// If dataset is small, auto-seed more fillials and applications for better charts/demo
(() => {
  const TARGET_FILLIALS = 35;
  const existing = MOCK_FILLIALS.length;
  const now = Date.now();
  
  const regions = ["Toshkent", "Andijon", "Farg'ona", "Namangan", "Samarqand", "Buxoro", "Xorazm", "Qashqadaryo"];
  const cities = ["Toshkent", "Andijon", "Farg'ona", "Namangan", "Samarqand", "Buxoro", "Urganch", "Qarshi"];
  
  for (let i = existing + 1; i <= TARGET_FILLIALS; i++) {
    const regionIdx = i % regions.length;
    const f = {
      id: i,
      name: `${cities[regionIdx]} filiali ${i}`,
      address: `${cities[regionIdx]} sh, ${i}-ko'cha, ${i * 10}-uy`,
      image: "",
      region: regions[regionIdx],
      work_status: i % 10 === 0 ? "BLOCKED" : "WORKING", // 10% blocked
      merchant_id: i % 2 === 0 ? 10 : 11,
      inn: `${200000000 + i * 111}`,
      nds: 12 + (i % 4),
      hisob_raqam: `2020800000000000${String(i).padStart(4, '0')}`,
      bank_name: i % 3 === 0 ? "Xalq Banki" : i % 3 === 1 ? "Asaka Bank" : "Ipoteka Bank",
      mfo: `000${14 + (i % 10)}`,
      director_name: `Direktor ${i}`,
      director_phone: `+99890${(1000000 + i).toString().slice(-7)}`,
      merchant: (i % 2 === 0) ? MOCK_MERCHANTS.find(m => m.id === 10) : MOCK_MERCHANTS.find(m => m.id === 11),
      createdAt: new Date(now - i * 86400000).toISOString(),
    };
    MOCK_FILLIALS.push(f);

    // Create 8-15 applications per fillial for realistic data (more data for better stats)
    const appsToCreate = 8 + (i % 8); // 8-15 apps each
    for (let j = 0; j < appsToCreate; j++) {
      const aid = MOCK_APPLICATIONS.reduce((mx, a) => Math.max(mx, a.id), 0) + 1;
      const daysAgo = Math.floor((i * 5 + j * 3) % 200); // Spread over 200 days (6+ months)
      const hoursAgo = Math.floor(Math.random() * 24); // Random hour of day
      const createdAt = new Date(now - daysAgo * 86400000 - hoursAgo * 3600000).toISOString();
      
      // Status distribution: 55% APPROVED, 25% REJECTED, 20% PENDING
      let status = "APPROVED";
      const rand = (aid * 7) % 100;
      if (rand < 25) status = "REJECTED"; // 25%
      else if (rand < 45) status = "PENDING"; // 20%
      // else APPROVED 55%
      
      // Random expired_month from [3, 6, 9, 12]
      const expiredMonths = [3, 6, 9, 12];
      const expired_month = expiredMonths[aid % 4];
      
      // Random amounts between 500K - 25M UZS for realistic variety
      const baseAmount = 500000 + ((aid * 12347) % 24500000);
      const amount = Math.floor(baseAmount / 100000) * 100000; // Round to nearest 100K
      
      // More products for variety (1-5 products)
      const productCount = 1 + (aid % 5);
      const products = [];
      for (let p = 0; p < productCount; p++) {
        products.push({
          id: 1000 + aid * 10 + p,
          name: `Mahsulot ${aid}-${p}`,
          price: 50000 + ((aid * 100 + p * 1000) % 950000),
          count: 1 + (p % 4)
        });
      }
      
      const userId = 1 + (aid % 100);
      const operator = MOCK_USERS.find(u => u.id === userId);
      
      MOCK_APPLICATIONS.push({
        id: aid,
        fullname: `Mijoz ${i}-${j}`,
        phone: `+99890${(1000000 + aid).toString().slice(-7)}`,
        passport: `A${String(1000000 + aid).slice(-7)}`,
        amount: amount,
        payment_amount: Math.floor(amount * (1 + (10 + (aid % 10)) / 100)),
        percent: 10 + (aid % 10),
        status,
        expired_month,
        merchant: f.merchant,
        fillial: { id: f.id, name: f.name },
        fillial_id: f.id,
        user: operator ? { id: operator.id, fullname: operator.fullname, phone: operator.phone } : { id: userId, fullname: `Operator ${userId}` },
        paid: status === "APPROVED" && (aid % 5 === 0),
        products: products,
        createdAt,
      });
    }
  }
  
  // Add more recent applications for today and yesterday for better daily stats
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  
  // Add 20-30 applications for today spread across hours
  const todayAppsCount = 20 + Math.floor(Math.random() * 11);
  for (let t = 0; t < todayAppsCount; t++) {
    const aid = MOCK_APPLICATIONS.reduce((mx, a) => Math.max(mx, a.id), 0) + 1;
    const fillialId = 1 + (t % TARGET_FILLIALS);
    const fillial = MOCK_FILLIALS.find(f => f.id === fillialId);
    const hourOffset = Math.floor(Math.random() * 16); // Between 0-16 hours ago (morning to now)
    const createdAt = new Date(now - hourOffset * 3600000).toISOString();
    
    const status = t % 3 === 0 ? "PENDING" : t % 5 === 0 ? "REJECTED" : "APPROVED";
    const amount = 1000000 + Math.floor(Math.random() * 15000000);
    
    const userId = 1 + (t % 100);
    const operator = MOCK_USERS.find(u => u.id === userId);
    
    MOCK_APPLICATIONS.push({
      id: aid,
      fullname: `Bugungi mijoz ${t + 1}`,
      phone: `+99890${(2000000 + aid).toString().slice(-7)}`,
      passport: `A${String(2000000 + aid).slice(-7)}`,
      amount: amount,
      payment_amount: Math.floor(amount * 1.15),
      percent: 12 + (t % 6),
      status,
      expired_month: [3, 6, 9, 12][t % 4],
      merchant: fillial?.merchant,
      fillial: { id: fillialId, name: fillial?.name || `Filial ${fillialId}` },
      fillial_id: fillialId,
      user: operator ? { id: operator.id, fullname: operator.fullname, phone: operator.phone } : { id: userId, fullname: `Operator ${userId}` },
      paid: false,
      products: [{ id: 5000 + t, name: `Mahsulot ${t}`, price: 100000 + t * 50000, count: 1 }],
      createdAt,
    });
  }
  
  // Add 15-25 applications for yesterday
  const yesterdayAppsCount = 15 + Math.floor(Math.random() * 11);
  for (let y = 0; y < yesterdayAppsCount; y++) {
    const aid = MOCK_APPLICATIONS.reduce((mx, a) => Math.max(mx, a.id), 0) + 1;
    const fillialId = 1 + (y % TARGET_FILLIALS);
    const fillial = MOCK_FILLIALS.find(f => f.id === fillialId);
    const hourOffset = 24 + Math.floor(Math.random() * 24); // Between 24-48 hours ago
    const createdAt = new Date(now - hourOffset * 3600000).toISOString();
    
    const status = y % 4 === 0 ? "PENDING" : y % 6 === 0 ? "REJECTED" : "APPROVED";
    const amount = 800000 + Math.floor(Math.random() * 12000000);
    
    const userId = 1 + (y % 100);
    const operator = MOCK_USERS.find(u => u.id === userId);
    
    MOCK_APPLICATIONS.push({
      id: aid,
      fullname: `Kechagi mijoz ${y + 1}`,
      phone: `+99890${(3000000 + aid).toString().slice(-7)}`,
      passport: `A${String(3000000 + aid).slice(-7)}`,
      amount: amount,
      payment_amount: Math.floor(amount * 1.12),
      percent: 10 + (y % 8),
      status,
      expired_month: [3, 6, 9, 12][y % 4],
      merchant: fillial?.merchant,
      fillial: { id: fillialId, name: fillial?.name || `Filial ${fillialId}` },
      fillial_id: fillialId,
      user: operator ? { id: operator.id, fullname: operator.fullname, phone: operator.phone } : { id: userId, fullname: `Operator ${userId}` },
      paid: status === "APPROVED" && (y % 3 === 0),
      products: [{ id: 6000 + y, name: `Mahsulot ${y}`, price: 80000 + y * 40000, count: 1 + (y % 3) }],
      createdAt,
    });
  }
})();

export async function listApplications(opts?: { page?: number; pageSize?: number; search?: string; status?: string; startDate?: string; endDate?: string; fillialId?: number | "all"; expiredMonth?: number | "all" }): Promise<Paginated<any>> {
  const page = opts?.page ?? 1;
  const pageSize = opts?.pageSize ?? 10;
  const search = (opts?.search ?? "").trim().toLowerCase();
  const status = opts?.status ?? "all";
  const fillialId = opts?.fillialId ?? "all";
  const expiredMonth = opts?.expiredMonth ?? "all";
  const start = opts?.startDate ? new Date(opts.startDate) : null;
  const end = opts?.endDate ? new Date(opts.endDate) : null;
  if (end) end.setHours(23, 59, 59, 999);

  let filtered = MOCK_APPLICATIONS.slice();
  if (search) filtered = filtered.filter((a) => (a.fullname ?? "").toLowerCase().includes(search) || (a.phone ?? "").toLowerCase().includes(search) || (a.passport ?? "").toLowerCase().includes(search));
  if (status && status !== "all") filtered = filtered.filter((a) => a.status === status);
  if (fillialId && fillialId !== "all") filtered = filtered.filter((a) => a.fillial_id === Number(fillialId));
  if (expiredMonth && expiredMonth !== "all") filtered = filtered.filter((a) => a.expired_month === Number(expiredMonth));
  if (start || end) {
    filtered = filtered.filter((a) => {
      if (!a.createdAt) return false;
      const created = new Date(a.createdAt);
      if (start && created < start) return false;
      if (end && created > end) return false;
      return true;
    });
  }
  const total = filtered.length;
  const startIdx = (page - 1) * pageSize;
  const items = filtered.slice(startIdx, startIdx + pageSize);
  return delay({ items, total, page, pageSize });
}

// Aggregation helpers for dashboard charts
export async function aggregateApplicationsByFillial(opts?: { startDate?: string; endDate?: string; status?: string; fillialIds?: number[] }) {
  const start = opts?.startDate ? new Date(opts.startDate) : null;
  const end = opts?.endDate ? new Date(opts.endDate) : null;
  if (end) end.setHours(23, 59, 59, 999);
  const status = opts?.status ?? "all";
  const fillialIds = opts?.fillialIds ?? null;

  const counts: Record<number, number> = {};
  MOCK_APPLICATIONS.forEach((a) => {
    if (status !== "all" && a.status !== status) return;
    if (fillialIds && fillialIds.length > 0 && !fillialIds.includes(a.fillial_id)) return;
    if (start || end) {
      const created = new Date(a.createdAt);
      if (start && created < start) return;
      if (end && created > end) return;
    }
    const id = a.fillial_id ?? -1;
    counts[id] = (counts[id] || 0) + 1;
  });

  const result = Object.keys(counts).map((k) => {
    const id = Number(k);
    const f = MOCK_FILLIALS.find((x) => x.id === id) ?? { id, name: `#${id}` };
    return { id, label: f.name, value: counts[id] };
  }).sort((a, b) => b.value - a.value);

  return delay(result);
}

export async function aggregateStatusDistribution(opts?: { startDate?: string; endDate?: string; fillialIds?: number[] }) {
  const start = opts?.startDate ? new Date(opts.startDate) : null;
  const end = opts?.endDate ? new Date(opts.endDate) : null;
  if (end) end.setHours(23, 59, 59, 999);
  const counts: Record<string, number> = {};
  MOCK_APPLICATIONS.forEach((a) => {
    if (opts?.fillialIds && opts.fillialIds.length && !opts.fillialIds.includes(a.fillial_id)) return;
    if (start || end) {
      const created = new Date(a.createdAt);
      if (start && created < start) return;
      if (end && created > end) return;
    }
    const s = a.status ?? "UNKNOWN";
    counts[s] = (counts[s] || 0) + 1;
  });
  const labels = Object.keys(counts);
  const series = labels.map((l) => counts[l]);
  return delay({ labels, series });
}

export async function aggregateApplicationsOverTime(opts?: { startDate?: string; endDate?: string; fillialIds?: number[]; granularity?: "day" | "week" }) {
  const start = opts?.startDate ? new Date(opts.startDate) : null;
  const end = opts?.endDate ? new Date(opts.endDate) : null;
  if (end) end.setHours(23, 59, 59, 999);
  const gran = opts?.granularity ?? "day";
  const map: Record<string, number> = {};
  MOCK_APPLICATIONS.forEach((a) => {
    if (opts?.fillialIds && opts.fillialIds.length && !opts.fillialIds.includes(a.fillial_id)) return;
    if (start || end) {
      const created = new Date(a.createdAt);
      if (start && created < start) return;
      if (end && created > end) return;
    }
    const d = new Date(a.createdAt);
    let key = "";
    if (gran === "week") {
      // Year-week
      const year = d.getFullYear();
      const wk = Math.ceil(((+d - +new Date(year,0,1)) / 86400000 + new Date(year,0,1).getDay()+1)/7);
      key = `${year}-W${wk}`;
    } else {
      // day
      key = d.toISOString().slice(0,10);
    }
    map[key] = (map[key] || 0) + 1;
  });
  const categories = Object.keys(map).sort();
  const series = categories.map((c) => map[c]);
  return delay({ categories, series });
}

export async function getFillial(id: number) {
  const f = MOCK_FILLIALS.find((x) => x.id === id);
  if (!f) throw new Error("Not found");
  return delay(f);
}

export async function createFillial(payload: Partial<any>) {
  const id = MOCK_FILLIALS.reduce((mx, f) => Math.max(mx, f.id), 0) + 1;
  const now = new Date().toISOString();
  const merchant = payload.merchant_id ? MOCK_MERCHANTS.find((m) => m.id === payload.merchant_id) ?? null : null;
  const f = {
    id,
    name: payload.name ?? "",
    address: payload.address ?? "",
    image: payload.image ?? "",
    region: payload.region ?? null,
    work_status: payload.work_status ?? "WORKING",
    merchant_id: payload.merchant_id ?? null,
    merchant: merchant,
    nds: payload.nds ?? null,
    hisob_raqam: payload.hisob_raqam ?? null,
    bank_name: payload.bank_name ?? null,
    mfo: payload.mfo ?? null,
    inn: payload.inn ?? null,
    director_name: payload.director_name ?? null,
    director_phone: payload.director_phone ?? null,
    createdAt: now,
  };
  MOCK_FILLIALS.push(f);
  return delay(f);
}

export async function updateFillial(id: number, payload: Partial<any>) {
  const idx = MOCK_FILLIALS.findIndex((x) => x.id === id);
  if (idx === -1) throw new Error("Not found");
  const merchant = payload.merchant_id ? MOCK_MERCHANTS.find((m) => m.id === payload.merchant_id) ?? null : MOCK_FILLIALS[idx].merchant ?? null;
  const updated = {
    ...MOCK_FILLIALS[idx],
    ...payload,
    merchant_id: payload.merchant_id ?? MOCK_FILLIALS[idx].merchant_id,
    merchant,
    updatedAt: new Date().toISOString(),
  };
  MOCK_FILLIALS[idx] = updated;
  return delay(updated);
}

export async function listMerchants(): Promise<any[]> {
  return delay(MOCK_MERCHANTS.slice());
}

export async function getMerchant(id: number) {
  const m = MOCK_MERCHANTS.find((x) => x.id === id);
  if (!m) throw new Error("Not found");
  return delay(m);
}

// Auth functions for compatibility
export async function login(phone: string, password: string) {
  // Mock login - in development, always succeed
  return delay({
    access_token: "mock-token-12345",
    user: { 
      id: 1, 
      phone, 
      fullname: "Mock Admin User", 
      role: "ADMIN",
      image: null as string | null,
      work_status: "WORKING",
      merchant_id: null as number | null,
      fillial_id: null as number | null,
      createdAt: new Date().toISOString()
    }
  });
}

export async function logout() {
  // Mock logout
  return delay(undefined);
}

export function getCurrentUser() {
  // Mock current user
  return { 
    id: 1, 
    phone: "+998900000001", 
    fullname: "Mock Admin User", 
    role: "ADMIN",
    image: null as string | null,
    work_status: "WORKING",
    merchant_id: null as number | null,
    fillial_id: null as number | null,
    createdAt: new Date().toISOString()
  };
}

export function isAuthenticated() {
  // In mock mode, always authenticated
  return true;
}

const mock = {
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
  deleteUser: async (id: number) => delay(undefined), // mock delete
  // Fillials
  listFillials,
  getFillial,
  createFillial,
  updateFillial,
  deleteFillial: async (id: number) => delay(undefined), // mock delete
  // Applications
  listApplications,
  listZayavkalar: listApplications, // alias for compatibility
  getZayavka: async (id: number) => {
    const app = MOCK_APPLICATIONS.find(a => a.id === id);
    if (!app) throw new Error("Not found");
    return delay(app);
  },
  getApplication: async (id: number) => {
    const app = MOCK_APPLICATIONS.find(a => a.id === id);
    if (!app) throw new Error("Not found");
    return delay(app);
  },
  createZayavka: async (payload: any) => delay({ id: Date.now(), ...payload }), // mock create
  updateZayavka: async (id: number, payload: any) => delay({ id, ...payload }), // mock update
  deleteZayavka: async (id: number) => delay(undefined), // mock delete
  // Merchants
  listMerchants,
  getMerchant,
  // Aggregations
  aggregateApplicationsByFillial,
  aggregateStatusDistribution,
  aggregateApplicationsOverTime,
  // document generator (mock)
  getApplicationDocument: async (id: number, format: "pdf" | "doc" = "pdf") => {
    const app = MOCK_APPLICATIONS.find((a) => a.id === id);
    if (!app) throw new Error("Not found");
    const content = `Application #${app.id}\nFullname: ${app.fullname}\nPhone: ${app.phone}\nFillial: ${app.fillial?.name ?? "-"}\nAmount: ${app.amount}\nStatus: ${app.status}\nGenerated: ${new Date().toISOString()}`;
    const mime = format === "pdf" ? "application/pdf" : "application/msword";
    const blob = new Blob([content], { type: mime });
    return delay(blob, 300);
  },
};

export default mock;
