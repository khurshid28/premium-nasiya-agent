import React from "react";
import DetailModal from "components/modal/DetailModalNew";
import EditModal from "components/modal/EditModal";
import api from "lib/api";
import { exportSingleTable } from "lib/exportExcel";
import { formatPhone } from "lib/formatters";
import Pagination from "components/pagination";
import Toast from "components/toast/Toast";
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
  const [data, setData] = React.useState<Fillial[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [total, setTotal] = React.useState(0);
  
  const [search, setSearch] = React.useState("");
  const [regionFilter, setRegionFilter] = React.useState("all");
  
  // Client-side pagination
  const [page, setPage] = React.useState<number>(1);
  const [pageSize, setPageSize] = React.useState<number>(5);
  
  const [selected, setSelected] = React.useState<Fillial | null>(null);
  const [open, setOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [editInitial, setEditInitial] = React.useState<any>(null);
  const [toastOpen, setToastOpen] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState("");
  const [toastType, setToastType] = React.useState<"main" | "success" | "error">("main");

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
  }, [search, regionFilter]);

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
      console.log('Fetching fillials from API...');
      
      // Create a promise that can be aborted
      const fetchData = async () => {
        try {
          // API dan barcha ma'lumotlarni olish (client-side filtering uchun)
          const res = await api.listFillials({});
          if (!mounted || abortController.signal.aborted) return;
          
          console.log('Fillials response:', res);
          console.log('Fillials data items:', res?.items);
          console.log('Fillials data type:', Array.isArray(res?.items));
          console.log('Fillials API params:', { page, pageSize, search, regionFilter });
          
          // API dan pagination formatida ma'lumot olish (api.ts da convert qilingan)
          console.log('Fillials response:', res);
          console.log('Items:', res?.items?.length || 0);
          console.log('Total:', res?.total || 0);
          
          setData(res?.items || []);
          setTotal(res?.total || 0);
          setLoading(false);
        } catch (err: any) {
          if (!mounted || abortController.signal.aborted) return;
          
          console.error("Error fetching fillials:", err);
          console.error("Error details:", {
            message: err.message,
            status: err.status,
            body: err.body,
            url: `${process.env.REACT_APP_API_BASE || "http://localhost:3333/api"}/fillial/all`
          });
          
          // Error handling - clear data on error
          setData([]);
          setLoading(false);
          
          // Only show error if it's not an abort error
          if (err.name !== 'AbortError') {
            const errorMessage = err.message || "Ma'lumotlarni yuklashda xatolik yuz berdi";
            console.warn('Fillials API error:', errorMessage);
            
            // Network error yoki authorization error uchun user-friendly message
            if (err.message.includes('Failed to fetch') || err.message.includes('fetch')) {
              console.warn('Server bilan aloqa o\'rnatilmadi. Sabablari:');
              console.warn('1. Internet aloqasi yo\'q');
              console.warn('2. API server ishlamayapti (https://api.premiumnasiya.uz/api/v1)');
              console.warn('3. CORS policy muammosi');
              console.warn('4. Firewall yoki proxy bloklayapti');
              console.warn('Test Data tugmasini bosib, offline rejimda ishlang.');
            } else if (err.status === 401) {
              console.warn('Authentication kerak. Login qiling yoki token yangilang.');
              console.warn('Test Data tugmasini bosib, offline rejimda ishlang.');
            }
          }
        }
      };
      
      fetchData();
    }, 150); // 150ms delay to prevent rapid successive calls
    
    return () => {
      mounted = false;
      abortController.abort();
      clearTimeout(timeoutId);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // Faqat component mount bo'lganda API chaqirish (client-side filtering)

  // Client-side filtering va pagination
  const filteredData = React.useMemo(() => {
    let filtered = data;
    
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
  }, [data, search, regionFilter]);
  
  // Pagination
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const pageData = filteredData.slice(startIndex, endIndex);
  
  // Total pages filtered data bo'yicha
  const totalFiltered = filteredData.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  
  // Debug: Ma'lumotlar holatini tekshirish
  console.log('==== FILLIALS PAGINATION DEBUG ====');
  console.log('Original data (from API):', data);
  console.log('Total data length:', data?.length);
  console.log('Search term:', `"${search}"`);
  console.log('Region filter:', regionFilter);
  console.log('Filtered data:', filteredData);
  console.log('Filtered data length:', filteredData?.length);
  console.log('Current page:', page, 'Page size:', pageSize);
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Filiallar</h2>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <input
              value={search}
              onChange={(e) => {
                console.log('Search changing from', `"${search}"`, 'to', `"${e.target.value}"`);
                setSearch(e.target.value);
              }}
              className="h-11 rounded-xl border border-gray-200 dark:border-navy-600 bg-white dark:bg-navy-700 px-4 pl-10 w-80 text-sm font-medium text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 shadow-sm hover:shadow-md hover:border-brand-500 dark:hover:border-brand-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              placeholder="Nom yoki hudud bo'yicha qidirish"
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <button onClick={() => { setEditInitial(null); setEditOpen(true); }} className="h-11 rounded-xl bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 px-4 text-white font-medium shadow-sm hover:shadow-md transition-all duration-200">Filial qo'shish</button>
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
            className="min-w-[140px]"
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
            className="min-w-[120px]"
          />
          
          <button
            onClick={async () => {
              const res = await api.listFillials({ page: 1, pageSize: 10000 });
              const rows = (res.items ?? []).map((f: any) => ({
                ID: f.id,
                Name: f.name,
                Address: f.address ?? "",
                Merchant: f.merchant?.name ?? "",
                Region: f.region ?? "",
                Status: f.work_status ?? "",
                Created: f.createdAt ?? "",
              }));
              exportSingleTable({ rows, title: "Filiallar", dateLabel: "Barcha sanalar" });
            }}
            className="h-10 rounded bg-indigo-600 hover:bg-indigo-700 px-3 text-white"
          >
            Filiallarni export qilish
          </button>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-600">
        <table className="w-full table-auto min-w-[600px]">
          <thead className="bg-gray-50 dark:bg-navy-800 text-left text-sm text-gray-600 dark:text-gray-300">
            <tr>
              <th className="px-6 py-4">ID</th>
              <th className="px-6 py-4">Nomi</th>
              <th className="px-6 py-4">Hudud</th>
              <th className="px-6 py-4">Direktor</th>
              <th className="px-6 py-4">Holat</th>
              <th className="px-6 py-4">Yaratildi</th>
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
                onClick={() => {
                  setSelected(row);
                  setOpen(true);
                }}
              >
                <td className="px-6 py-3">{row.id}</td>
                <td className="px-6 py-3">{row.name}</td>
                <td className="px-6 py-3">{row.region ?? "-"}</td>
                <td className="px-6 py-3">{row.director_name ?? "-"}</td>
                <td className="px-4 py-2">
                  {row.work_status === "WORKING" ? (
                    <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-800 px-2 py-1 text-xs font-medium text-green-800 dark:text-green-100">Ishlaydi</span>
                  ) : row.work_status === "BLOCKED" ? (
                    <span className="inline-flex items-center rounded-full bg-yellow-100 dark:bg-yellow-800 px-2 py-1 text-xs font-medium text-yellow-800 dark:text-yellow-100">Bloklangan</span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-1 text-xs font-medium text-gray-800 dark:text-gray-100">{row.work_status ?? "-"}</span>
                  )}
                </td>
                <td className="px-4 py-2">{row.createdAt ? new Date(row.createdAt).toLocaleString() : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-gray-600 dark:text-gray-400">
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
      {selected ? (
        <div className="space-y-2">
                    <div className="flex items-start gap-4">
                      {selected.image ? (
                        <img src={selected.image} alt={selected.name} className="h-20 w-20 rounded object-cover" />
                      ) : null}
                      <div>
                        <div><strong className="text-gray-700 dark:text-gray-300">Hudud:</strong> <span className="text-gray-900 dark:text-white">{selected.region ?? "-"}</span></div>
                      </div>
                    </div>
                    <div><strong className="text-gray-700 dark:text-gray-300">Direktor:</strong> <span className="text-gray-900 dark:text-white">{selected.director_name ?? "-"} ({formatPhone(selected.director_phone)})</span></div>
                    <div><strong className="text-gray-700 dark:text-gray-300">Bank:</strong> <span className="text-gray-900 dark:text-white">{selected.bank_name ?? "-"} {selected.mfo ? `MFO:${selected.mfo}` : ""}</span></div>
                    <div><strong className="text-gray-700 dark:text-gray-300">Hisob raqam:</strong> <span className="text-gray-900 dark:text-white">{selected.hisob_raqam ?? "-"}</span></div>
                    <div><strong className="text-gray-700 dark:text-gray-300">NDS:</strong> <span className="text-gray-900 dark:text-white">{selected.nds ?? "-"}</span></div>
                    <div className="mt-4 flex gap-2">
                      <button
                        className="rounded bg-gray-200 dark:bg-gray-600 px-3 py-1 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500"
                        onClick={() => {
                          const payload = `Nomi: ${selected.name}\nManzil: ${selected.address ?? "-"}\nHudud: ${selected.region ?? "-"}\nNDS: ${selected.nds ?? "-"}\nHisob raqam: ${selected.hisob_raqam ?? "-"}\nBank: ${selected.bank_name ?? "-"} ${selected.mfo ? `MFO:${selected.mfo}` : ""}\nINN: ${selected.inn ?? "-"}\nDirektor: ${selected.director_name ?? "-"} (${selected.director_phone ?? "-"})`;
                          navigator.clipboard.writeText(payload).then(() => {
                            setToastType("main");
                            setToastMessage("Ma'lumotlar clipboard'ga ko'chirildi");
                            setToastOpen(true);
                          }).catch(() => {
                            setToastType("error");
                            setToastMessage("Ko'chirishda xatolik");
                            setToastOpen(true);
                          });
                        }}
                      >
                        Barcha ma'lumotlarni ko'chirish
                      </button>
                      <button className="rounded bg-blue-600 hover:bg-blue-700 px-3 py-1 text-white" onClick={() => { setEditInitial(selected); setEditOpen(true); }}>Tahrirlash</button>
                    </div>
                  </div>
              ) : null}
            </DetailModal>
            <EditModal
              isOpen={editOpen}
              onClose={() => { setEditOpen(false); setEditInitial(null); }}
              initial={editInitial}
              type="fillial"
              onSave={async (payload) => {
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
                setTotal(res.total || 0);
              }}
            />

      <Toast message={toastMessage} isOpen={toastOpen} onClose={() => setToastOpen(false)} type={toastType} />
    </div>
  );
};

export default Fillials;
