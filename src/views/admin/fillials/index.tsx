import React from "react";
import DetailModal from "components/modal/DetailModalNew";
import EditModal from "components/modal/EditModal";
import { useLocation } from "react-router-dom";
import apiReal from "lib/api";
import demoApi from "lib/demoApi";
import { exportSingleTable } from "lib/exportExcel";
import { formatPhone } from "lib/formatters";
import Pagination from "components/pagination";
import Toast from "components/toast/ToastNew";
import CustomSelect from "components/dropdown/CustomSelect";

// Assumed Prisma model fields for Fillial/Branch. If your schema uses different names,
// tell me and I'll update these mappings to match.
// Mapped to your Prisma `Fillial` model. Adjust names if your schema differs.
type Fillial = {
  id: number;
  name: string;
  image?: string | null;
  address?: string | null;
  region?: string | null; // REGION enum in Prisma
  work_status?: string | null; // WORK_STATUS enum
  merchant?: { id: number; name: string } | null;
  nds?: string | null;
  hisob_raqam?: string | null;
  bank_name?: string | null;
  mfo?: string | null;
  inn?: string | null;
  director_name?: string | null;
  director_phone?: string | null;
  percent_type?: string | null; // PERCENT_TYPE enum
  expired_months?: any; // Json
  cashback_percent?: number;
  cashback_amount?: number;
  max_amount?: number;
  timeout?: number;
  createdAt?: string;
  updatedAt?: string | null;
};



const Fillials = (): JSX.Element => {
  const location = useLocation();
  
  console.log('=== Fillials Component Render ===');
  console.log('location.pathname:', location.pathname);
  console.log('location:', location);
  
  const api = React.useMemo(() => {
    const isDemo = location.pathname.startsWith('/demo');
    console.log('Fillials useMemo - pathname:', location.pathname, 'isDemo:', isDemo);
    console.log('Fillials useMemo - demoApi:', demoApi);
    console.log('Fillials useMemo - apiReal:', apiReal);
    console.log('Fillials useMemo - returning:', isDemo ? 'demoApi' : 'apiReal');
    const selectedApi = isDemo ? demoApi : apiReal;
    console.log('Fillials useMemo - selectedApi.listFillials:', selectedApi.listFillials);
    return selectedApi;
  }, [location.pathname]);

  const [data, setData] = React.useState<Fillial[]>([]);
  const [loading, setLoading] = React.useState(true);
  
  const [search, setSearch] = React.useState("");
  const [regionFilter, setRegionFilter] = React.useState("all");
  const [merchants, setMerchants] = React.useState<any[]>([]);
  const [agents, setAgents] = React.useState<any[]>([]);
  const [selectedMerchantId, setSelectedMerchantId] = React.useState<number | "all">("all");
  const [selectedAgentId, setSelectedAgentId] = React.useState<number | "all">("all");
  const [selectedFillialId, setSelectedFillialId] = React.useState<number | "all">("all");
  
  // Client-side pagination
  const [page, setPage] = React.useState<number>(1);
  const [pageSize, setPageSize] = React.useState<number>(5);
  
  const [selected, setSelected] = React.useState<Fillial | null>(null);
  const [open, setOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [detailLoading, setDetailLoading] = React.useState(false);
  const [editInitial, setEditInitial] = React.useState<any>(null);
  const [toastOpen, setToastOpen] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState("");
  const [toastType, setToastType] = React.useState<'success' | 'error' | 'info' | 'warning'>('info');

  // Create a ref to store the latest abort controller
  const abortControllerRef = React.useRef<AbortController | null>(null);

  const regions = React.useMemo(() => {
    const set = new Set<string>();
    const fillials = Array.isArray(data) ? data : [];
    fillials.forEach((d) => { if (d.region) set.add(d.region); });
    return Array.from(set).sort();
  }, [data]);

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setPage(1);
  }, [search, regionFilter, selectedMerchantId, selectedAgentId, selectedFillialId]);

  // Reset fillial filter when merchant or agent changes
  React.useEffect(() => {
    setSelectedFillialId("all");
  }, [selectedMerchantId, selectedAgentId]);

  React.useEffect(() => {
    let mounted = true;
    
    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new abort controller for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    
    // Add a small delay to prevent rapid successive calls
    const timeoutId = setTimeout(() => {
      if (!mounted || abortController.signal.aborted) return;
      
      setLoading(true);
      
      // Create a promise that can be aborted
      const fetchData = async () => {
        try {
          // API dan barcha ma'lumotlarni olish (client-side filtering uchun)
          const [filialsRes, merchantsRes, agentsRes] = await Promise.all([
            api.listFillials({}),
            (api as any).listMerchants({ page: 1, pageSize: 100 }),
            (api as any).listAgents({ page: 1, pageSize: 100 })
          ]);
          if (!mounted || abortController.signal.aborted) return;
          
          setData(filialsRes?.items || []);
          setMerchants(merchantsRes?.items || []);
          setAgents(agentsRes?.items || []);
          setLoading(false);
        } catch (err: any) {
          if (!mounted || abortController.signal.aborted) return;
          
          // Error handling - clear data on error
          setData([]);
          setMerchants([]);
          setLoading(false);
        }
      };
      
      fetchData();
    }, 150); // 150ms delay to prevent rapid successive calls
    
    return () => {
      mounted = false;
      abortController.abort();
      clearTimeout(timeoutId);
    };
  }, [api]); // Re-run when api changes (demo vs real API)

  // Fillials dropdown uchun - agent va merchant filterga qarab
  const availableFillials = React.useMemo(() => {
    let fillials = data;
    
    // Merchant filter
    if (selectedMerchantId !== "all") {
      fillials = fillials.filter((item: any) => item.merchant_id === Number(selectedMerchantId));
    }
    
    // Agent filter - agar agent tanlangan bo'lsa, faqat o'sha agentning filliallarini ko'rsat
    if (selectedAgentId !== "all") {
      const agent = agents.find(a => a.id === Number(selectedAgentId));
      if (agent && agent.fillials && agent.fillials.length > 0) {
        const agentFillialIds = agent.fillials.map((f: any) => f.id);
        fillials = fillials.filter((item: any) => agentFillialIds.includes(item.id));
      } else {
        fillials = [];
      }
    }
    
    return fillials;
  }, [data, selectedMerchantId, selectedAgentId, agents]);

  // Client-side filtering va pagination
  const filteredData = React.useMemo(() => {
    let filtered = availableFillials;
    
    // Fillial filter - agar aniq fillial tanlangan bo'lsa
    if (selectedFillialId !== "all") {
      filtered = filtered.filter((item: any) => item.id === selectedFillialId);
    }
    
    // Search filter
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(item => 
        item.name?.toLowerCase().includes(searchLower) ||
        item.region?.toLowerCase().includes(searchLower) ||
        item.director_name?.toLowerCase().includes(searchLower)
      );
    }
    
    // Region filter
    if (regionFilter !== "all") {
      filtered = filtered.filter(item => item.region === regionFilter);
    }
    
    return filtered;
  }, [availableFillials, search, regionFilter, selectedFillialId]);
  
  // Pagination
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const pageData = filteredData.slice(startIndex, endIndex);
  
  // Total pages filtered data bo'yicha
  const totalFiltered = filteredData.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  console.log('Start index:', startIndex, 'End index:', endIndex);
  console.log('Page data:', pageData);
  console.log('Page data length:', pageData?.length);
  console.log('Total pages calculated:', totalPages);
  console.log('===================================');

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-xl sm:text-2xl font-semibold text-navy-700 dark:text-white">Filiallar</h2>
      </div>
      
      {/* Mobile: Stack everything vertically */}
      <div className="flex flex-col gap-3 mb-4">
        {/* Search input - full width on mobile, limited on desktop */}
        <div className="relative w-full sm:w-80 lg:w-96">
          <input
            value={search}
            onChange={(e) => {
              console.log('Search changing from', `"${search}"`, 'to', `"${e.target.value}"`);
              setSearch(e.target.value);
            }}
            className="h-11 rounded-xl border border-gray-200 dark:border-navy-600 bg-white dark:bg-navy-700 px-4 pl-10 w-full text-sm font-medium text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 shadow-sm hover:shadow-md hover:border-brand-500 dark:hover:border-brand-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            placeholder="Nom yoki hudud bo'yicha qidirish"
          />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        
        {/* Buttons and filters row */}
        <div className="flex flex-wrap gap-2">
          <button onClick={() => { 
            if (location.pathname.startsWith('/demo')) {
              setEditInitial(null);
              setEditOpen(true);
            } else {
              setToastType("error");
              setToastMessage("Vaqtincha bu funksiya ishlamayapti");
              setToastOpen(true);
            }
          }} className="h-11 rounded-xl bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 px-4 text-white font-medium shadow-sm hover:shadow-md transition-all duration-200 text-sm whitespace-nowrap">
            <span className="hidden sm:inline">Filial qo'shish</span>
            <span className="sm:hidden">+ Filial</span>
          </button>
          
          <CustomSelect
            value={String(selectedMerchantId)}
            onChange={(value) => {
              setSelectedMerchantId(value === "all" ? "all" : Number(value));
            }}
            options={[
              { value: "all", label: "Barcha merchantlar" },
              ...(Array.isArray(merchants) ? merchants : []).map((m) => ({ 
                value: String(m.id), 
                label: m.name || `Merchant #${m.id}` 
              }))
            ]}
            className="min-w-[120px] sm:min-w-[160px] flex-1 sm:flex-none"
          />
          
          <CustomSelect
            value={regionFilter}
            onChange={(value) => {
              console.log('Region filter changing from', regionFilter, 'to', value);
              setRegionFilter(value);
            }}
            options={[
              { value: "all", label: "Barcha hududlar" },
              ...regions.map(c => ({ value: c, label: c }))
            ]}
            className="min-w-[120px] sm:min-w-[140px] flex-1 sm:flex-none"
          />
          
          <CustomSelect
            value={String(selectedAgentId)}
            onChange={(value) => {
              setSelectedAgentId(value === "all" ? "all" : Number(value));
            }}
            options={[
              { value: "all", label: "Barcha agentlar" },
              ...(Array.isArray(agents) ? agents : []).map((a) => ({ 
                value: String(a.id), 
                label: a.fullname || `Agent #${a.id}` 
              }))
            ]}
            className="min-w-[120px] sm:min-w-[160px] flex-1 sm:flex-none"
          />
          
          <CustomSelect
            value={String(selectedFillialId)}
            onChange={(value) => {
              setSelectedFillialId(value === "all" ? "all" : Number(value));
            }}
            options={[
              { value: "all", label: "Barcha filliallar" },
              ...(Array.isArray(availableFillials) ? availableFillials : []).map((f) => ({ 
                value: String(f.id), 
                label: f.name || `Fillial #${f.id}` 
              }))
            ]}
            className="min-w-[120px] sm:min-w-[180px] flex-1 sm:flex-none"
          />
          
          <CustomSelect
            value={String(pageSize)}
            onChange={(value) => {
              console.log('Page size changing from', pageSize, 'to', value);
              setPageSize(Number(value));
              setPage(1); // Page size o'zgarganda birinchi sahifaga qaytish
            }}
            options={[
              { value: "5", label: "5 ta" },
              { value: "10", label: "10 ta" },
              { value: "25", label: "25 ta" },
              { value: "50", label: "50 ta" }
            ]}
            className="min-w-[100px] sm:min-w-[120px]"
          />
          
          <button
            onClick={async () => {
              const rows = filteredData.map((f: any) => ({
                ID: f.id,
                Nomi: f.name,
                Manzil: f.address ?? "",
                Merchant: f.merchant?.name ?? "",
                Hudud: f.region ?? "",
                Holat: f.work_status ?? "",
                Yaratildi: f.createdAt ?? "",
              }));
              exportSingleTable({ rows, title: "Filiallar", dateLabel: "Barcha sanalar" });
            }}
            className="h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-3 sm:px-4 text-white inline-flex items-center gap-2 text-sm whitespace-nowrap"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <polyline points="7 10 12 15 17 10" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <line x1="12" y1="15" x2="12" y2="3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="hidden sm:inline">Yuklab olish</span>
            <span className="sm:hidden">Excel</span>
          </button>
          
          <button
            onClick={() => window.location.reload()}
            className="flex-shrink-0 h-11 rounded-xl bg-green-600 hover:bg-green-700 px-3 sm:px-4 text-white inline-flex items-center gap-2 text-sm whitespace-nowrap transition-all duration-200 active:scale-95"
            title="Sahifani yangilash"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4">
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="hidden sm:inline">Yangilash</span>
          </button>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-600">
        <table className="w-full table-auto min-w-[600px]">
          <thead className="bg-gray-50 dark:bg-navy-800 text-left text-xs sm:text-sm text-gray-600 dark:text-gray-300">
            <tr>
              <th className="px-3 sm:px-6 py-3 sm:py-4">ID</th>
              <th className="px-3 sm:px-6 py-3 sm:py-4">Nomi</th>
              <th className="px-3 sm:px-6 py-3 sm:py-4 hidden sm:table-cell">Hudud</th>
              <th className="px-3 sm:px-6 py-3 sm:py-4 hidden md:table-cell">Direktor</th>
              <th className="px-3 sm:px-6 py-3 sm:py-4">Holat</th>
              <th className="px-3 sm:px-6 py-3 sm:py-4 hidden lg:table-cell">Yaratildi</th>
            </tr>
          </thead>
          <tbody className="text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-navy-800">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <span>Ma'lumotlar yuklanmoqda...</span>
                  </div>
                </td>
              </tr>
            ) : !pageData || pageData.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                  {search || regionFilter !== "all" ? "Qidiruv bo'yicha filiallar topilmadi" : "Filiallar mavjud emas"}
                </td>
              </tr>
            ) : pageData.map((row) => (
              <tr
                key={row.id}
                className="border-t border-gray-200 dark:border-gray-600 cursor-pointer hover:bg-gray-50 dark:hover:bg-navy-700"
                onClick={async () => {
                  try {
                    setDetailLoading(true);
                    // Fetch complete fillial data with all relations
                    const fullFillial = await api.getFillial(row.id);
                    console.log('Full fillial data:', fullFillial);
                    setSelected(fullFillial);
                    setOpen(true);
                  } catch (err) {
                    console.error("Error fetching fillial details:", err);
                    // Show error message to user
                    setToastType("error");
                    setToastMessage("Filial tafsilotlarini yuklashda xatolik yuz berdi");
                    setToastType('error');
                    setToastOpen(true);
                    // Fallback to existing data if API call fails
                    setSelected(row);
                    setOpen(true);
                  } finally {
                    setDetailLoading(false);
                  }
                }}
              >
                <td className="px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm">{row.id}</td>
                <td className="px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-medium">{row.name}</td>
                <td className="px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm hidden sm:table-cell">{row.region ?? "-"}</td>
                <td className="px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm hidden md:table-cell">{row.director_name ?? "-"}</td>
                <td className="px-3 sm:px-4 py-2">
                  {row.work_status === "WORKING" ? (
                    <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-800 px-2 py-1 text-xs font-medium text-green-800 dark:text-green-100">Ishlaydi</span>
                  ) : row.work_status === "BLOCKED" ? (
                    <span className="inline-flex items-center rounded-full bg-yellow-100 dark:bg-yellow-800 px-2 py-1 text-xs font-medium text-yellow-800 dark:text-yellow-100">Bloklangan</span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-1 text-xs font-medium text-gray-800 dark:text-gray-100">{row.work_status ?? "-"}</span>
                  )}
                </td>
                <td className="px-3 sm:px-4 py-2 text-xs sm:text-sm hidden lg:table-cell">{row.createdAt ? new Date(row.createdAt).toLocaleString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' }) : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
          {`${totalFiltered} dan ${pageData?.length || 0} ta ko'rsatilmoqda`}
        </div>
        <Pagination 
          page={page} 
          totalPages={totalPages} 
          onPageChange={(p) => {
            console.log('Pagination clicked, changing to page:', p);
            setPage(p);
          }} 
        />
      </div>

      {/* Modals */}
      <DetailModal
              title={selected ? `Filial: ${selected.name}` : "Filial tafsilotlari"}
              isOpen={open}
              onClose={() => {
                setOpen(false);
                setSelected(null);
              }}
            >
      {detailLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-400">Ma'lumotlar yuklanmoqda...</span>
        </div>
      ) : selected ? (
        <div className="space-y-4">
                    {/* Main Info Card */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-navy-800 dark:to-navy-900 rounded-xl p-4 border border-blue-100 dark:border-navy-700">
                      <div className="flex items-start gap-4">
                        {selected.image && (
                          <img src={selected.image} alt={selected.name} className="h-20 w-20 rounded-lg object-cover border-2 border-white dark:border-navy-700 shadow-md" />
                        )}
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">📍</span>
                            <div>
                              <p className="text-xs text-gray-600 dark:text-gray-400">Hudud</p>
                              <p className="font-semibold text-gray-900 dark:text-white">{selected.region ?? "-"}</p>
                            </div>
                          </div>
                          {selected.address && (
                            <div className="flex items-start gap-2">
                              <span className="text-xl">🏢</span>
                              <div>
                                <p className="text-xs text-gray-600 dark:text-gray-400">Manzil</p>
                                <p className="text-sm text-gray-700 dark:text-gray-300">{selected.address}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Director info */}
                    <div className="bg-white dark:bg-navy-800 rounded-xl p-4 border border-gray-200 dark:border-navy-700 shadow-sm">
                      <h4 className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white mb-3 text-lg">
                        <span className="text-2xl">👤</span>
                        Direktor ma'lumotlari
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="bg-gray-50 dark:bg-navy-900 rounded-lg p-3">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Ism-familiya</p>
                          <p className="font-medium text-gray-900 dark:text-white">{selected.director_name ?? "-"}</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-navy-900 rounded-lg p-3">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Telefon</p>
                          <p className="font-medium text-gray-900 dark:text-white">{formatPhone(selected.director_phone)}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Financial info */}
                    <div className="bg-white dark:bg-navy-800 rounded-xl p-4 border border-gray-200 dark:border-navy-700 shadow-sm">
                      <h4 className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white mb-3 text-lg">
                        <span className="text-2xl">💰</span>
                        Moliyaviy ma'lumotlar
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="bg-gray-50 dark:bg-navy-900 rounded-lg p-3">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Bank</p>
                          <p className="font-medium text-gray-900 dark:text-white">{selected.bank_name ?? "-"}</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-navy-900 rounded-lg p-3">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">MFO</p>
                          <p className="font-medium text-gray-900 dark:text-white">{selected.mfo ?? "-"}</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-navy-900 rounded-lg p-3">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Hisob raqam</p>
                          <p className="font-medium text-gray-900 dark:text-white text-sm">{selected.hisob_raqam ?? "-"}</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-navy-900 rounded-lg p-3">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">INN</p>
                          <p className="font-medium text-gray-900 dark:text-white">{selected.inn ?? "-"}</p>
                        </div>
                        {selected.nds && (
                          <div className="bg-gray-50 dark:bg-navy-900 rounded-lg p-3">
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">NDS</p>
                            <p className="font-medium text-gray-900 dark:text-white">{selected.nds}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Expired months */}
                    {selected.expired_months && Array.isArray(selected.expired_months) && selected.expired_months.length > 0 && (
                      <div className="bg-white dark:bg-navy-800 rounded-xl p-4 border border-gray-200 dark:border-navy-700 shadow-sm">
                        <h4 className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white mb-3 text-lg">
                          <span className="text-2xl">📅</span>
                          Muddatli to'lov rejalari
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {selected.expired_months.map((item: any, index: number) => (
                            <div 
                              key={index} 
                              className={`p-3 rounded-lg border-2 transition-all ${
                                item.active 
                                  ? 'border-green-400 bg-gradient-to-br from-green-50 to-green-100 dark:border-green-600 dark:from-green-900/30 dark:to-green-900/20 shadow-sm' 
                                  : 'border-gray-200 bg-gray-50 dark:border-gray-600 dark:bg-gray-700/20'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-lg font-bold text-gray-900 dark:text-white">
                                  {item.month} oy
                                </span>
                                <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                                  item.active 
                                    ? 'bg-green-500 text-white dark:bg-green-600'
                                    : 'bg-gray-300 text-gray-700 dark:bg-gray-600 dark:text-gray-300'
                                }`}>
                                  {item.active ? 'Aktiv' : 'Nofaol'}
                                </span>
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                Foiz: <span className="font-medium text-gray-900 dark:text-white">{item.percent}%</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Merchant info */}
                    {selected.merchant && (
                      <div className="bg-white dark:bg-navy-800 rounded-xl p-4 border border-gray-200 dark:border-navy-700 shadow-sm">
                        <h4 className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white mb-3 text-lg">
                          <span className="text-2xl">🏪</span>
                          Merchant ma'lumotlari
                        </h4>
                        <div className="grid grid-cols-1 gap-2">
                          <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-navy-700 rounded-lg">
                            <span className="text-gray-600 dark:text-gray-400 font-medium">Nomi:</span>
                            <span className="text-gray-900 dark:text-white font-semibold">{selected.merchant.name}</span>
                          </div>
                          <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-navy-700 rounded-lg">
                            <span className="text-gray-600 dark:text-gray-400 font-medium">ID:</span>
                            <span className="text-gray-900 dark:text-white font-semibold">{selected.merchant.id}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Agent info */}
                    {(() => {
                      const agent = agents.find((a: any) => 
                        a.fillials && a.fillials.some((f: any) => f.id === selected.id)
                      );
                      
                      return agent ? (
                        <div className="bg-white dark:bg-navy-800 rounded-xl p-4 border border-gray-200 dark:border-navy-700 shadow-sm">
                          <h4 className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white mb-3 text-lg">
                            <span className="text-2xl">👨‍💼</span>
                            Agent ma'lumotlari
                          </h4>
                          <div className="grid grid-cols-1 gap-2">
                            <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-navy-700 rounded-lg">
                              <span className="text-gray-600 dark:text-gray-400 font-medium">Ism-familiya:</span>
                              <span className="text-gray-900 dark:text-white font-semibold">{agent.fullname || "-"}</span>
                            </div>
                            <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-navy-700 rounded-lg">
                              <span className="text-gray-600 dark:text-gray-400 font-medium">Telefon:</span>
                              <span className="text-gray-900 dark:text-white font-semibold">{formatPhone(agent.phone)}</span>
                            </div>
                            <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-navy-700 rounded-lg">
                              <span className="text-gray-600 dark:text-gray-400 font-medium">Holat:</span>
                              <span className="text-gray-900 dark:text-white font-semibold">{agent.work_status || "-"}</span>
                            </div>
                          </div>
                        </div>
                      ) : null;
                    })()}

                    {/* Status and dates */}
                    <div className="bg-white dark:bg-navy-800 rounded-xl p-4 border border-gray-200 dark:border-navy-700 shadow-sm">
                      <h4 className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white mb-3 text-lg">
                        <span className="text-2xl">📊</span>
                        Holat va sana
                      </h4>
                      <div className="grid grid-cols-1 gap-3">
                        <div className="flex items-center justify-between p-3 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-navy-700 dark:to-navy-600 rounded-lg">
                          <span className="text-gray-600 dark:text-gray-400 font-medium">Ish holati:</span>
                          <div>
                            {selected.work_status === "WORKING" ? (
                              <span className="inline-flex items-center rounded-full bg-gradient-to-r from-green-500 to-green-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm">
                                ✓ Ishlaydi
                              </span>
                            ) : selected.work_status === "BLOCKED" ? (
                              <span className="inline-flex items-center rounded-full bg-gradient-to-r from-yellow-500 to-yellow-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm">
                                ⚠ Bloklangan
                              </span>
                            ) : (
                              <span className="text-gray-700 dark:text-gray-300 font-semibold">{selected.work_status ?? "-"}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-navy-700 dark:to-navy-600 rounded-lg">
                          <span className="text-gray-600 dark:text-gray-400 font-medium">Yaratilgan:</span>
                          <span className="text-gray-900 dark:text-white font-semibold">
                            {selected.createdAt ? new Date(selected.createdAt).toLocaleDateString('en-GB') : "-"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <button
                        className="rounded bg-gray-200 dark:bg-gray-600 px-3 py-1 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500"
                        onClick={() => {
                          const payload = `Nomi: ${selected.name}\nManzil: ${selected.address ?? "-"}\nHudud: ${selected.region ?? "-"}\nNDS: ${selected.nds ?? "-"}\nHisob raqam: ${selected.hisob_raqam ?? "-"}\nBank: ${selected.bank_name ?? "-"} ${selected.mfo ? `MFO:${selected.mfo}` : ""}\nINN: ${selected.inn ?? "-"}\nDirektor: ${selected.director_name ?? "-"} (${selected.director_phone ?? "-"})`;
                          navigator.clipboard.writeText(payload).then(() => {
                            setToastType('success');
                            setToastMessage("Ma'lumotlar clipboard'ga ko'chirildi");
                            setToastOpen(true);
                          }).catch(() => {
                            setToastType('error');
                            setToastMessage("Ko'chirishda xatolik");
                            setToastOpen(true);
                          });
                        }}
                      >
                        Barcha ma'lumotlarni ko'chirish
                      </button>
                      <button className="rounded bg-blue-600 hover:bg-blue-700 px-3 py-1 text-white" onClick={() => { 
                        if (location.pathname.startsWith('/demo')) {
                          setEditInitial(selected);
                          setEditOpen(true);
                          setOpen(false);
                        } else {
                          setToastType("error");
                          setToastMessage("Vaqtincha bu funksiya ishlamayapti");
                          setToastOpen(true);
                        }
                      }}>Tahrirlash</button>
                    </div>
                  </div>
              ) : (
                <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                  Ma'lumot topilmadi
                </div>
              )}
            </DetailModal>
            <EditModal
              isOpen={editOpen}
              onClose={() => { setEditOpen(false); setEditInitial(null); }}
              initial={editInitial}
              type="fillial"
              onSave={async (payload) => {
                if (location.pathname.startsWith('/demo')) {
                  // Demo mode: simulate save
                  setEditOpen(false);
                  setEditInitial(null);
                  setToastType('success');
                  setToastMessage(editInitial ? 'Filial tahrirlandi (Demo)' : 'Filial qo\'shildi (Demo)');
                  setToastOpen(true);
                  return;
                }
                if (editInitial && editInitial.id) {
                  await api.updateFillial(editInitial.id, payload);
                } else {
                  await api.createFillial(payload);
                }
                const res = await api.listFillials({
                  page: page,
                  pageSize: pageSize,
                  search: search,
                  region: regionFilter === "all" ? undefined : regionFilter
                });
                setData(res.items || []);
              }}
            />

      <Toast message={toastMessage} isOpen={toastOpen} onClose={() => setToastOpen(false)} type={toastType} />
    </div>
  );
};

export default Fillials;
