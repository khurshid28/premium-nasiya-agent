import React from "react";
import DetailModal from "components/modal/DetailModalNew";
import { useLocation } from "react-router-dom";
import apiReal from "lib/api";
import demoApi from "lib/demoApi";
import { exportSingleTable } from "lib/exportExcel";
import Pagination from "components/pagination";
import Toast from "components/toast/ToastNew";
import CustomSelect from "components/dropdown/CustomSelect";
import type { Merchant } from "types/api";

const Merchants = (): JSX.Element => {
  const location = useLocation();
  const api = React.useMemo(() => {
    const isDemo = location.pathname.startsWith('/demo');
    return isDemo ? demoApi : apiReal;
  }, [location.pathname]);

  const [data, setData] = React.useState<Merchant[]>([]);
  const [loading, setLoading] = React.useState(true);
  
  const [search, setSearch] = React.useState("");
  
  const [page, setPage] = React.useState<number>(1);
  const [pageSize, setPageSize] = React.useState<number>(5);
  
  const [selected, setSelected] = React.useState<Merchant | null>(null);
  const [open, setOpen] = React.useState(false);
  const [detailLoading, setDetailLoading] = React.useState(false);
  const [toastOpen, setToastOpen] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState("");
  const [toastType, setToastType] = React.useState<'success' | 'error' | 'info' | 'warning'>('info');

  const abortControllerRef = React.useRef<AbortController | null>(null);

  React.useEffect(() => {
    setPage(1);
  }, [search]);

  React.useEffect(() => {
    let mounted = true;
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    
    const timeoutId = setTimeout(() => {
      if (!mounted || abortController.signal.aborted) return;
      
      setLoading(true);
      
      const fetchData = async () => {
        try {
          const res = await (api as any).listMerchants({});
          if (!mounted || abortController.signal.aborted) return;
          
          setData(res?.items || []);
          setLoading(false);
        } catch (err: any) {
          if (!mounted || abortController.signal.aborted) return;
          
          setData([]);
          setLoading(false);
        }
      };
      
      fetchData();
    }, 150);
    
    return () => {
      mounted = false;
      abortController.abort();
      clearTimeout(timeoutId);
    };
  }, [api]);

  const filteredData = React.useMemo(() => {
    let filtered = data;
    
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(item => 
        item.name?.toLowerCase().includes(searchLower)
      );
    }
    
    return filtered;
  }, [data, search]);
  
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const pageData = filteredData.slice(startIndex, endIndex);
  
  const totalFiltered = filteredData.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));

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
        <h2 className="text-xl sm:text-2xl font-semibold text-navy-700 dark:text-white">Merchantlar</h2>
      </div>
      
      <div className="flex flex-col gap-3 mb-4">
        <div className="relative w-full sm:w-80 lg:w-96">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 rounded-xl border border-gray-200 dark:border-navy-600 bg-white dark:bg-navy-700 px-4 pl-10 w-full text-sm font-medium text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 shadow-sm hover:shadow-md hover:border-brand-500 dark:hover:border-brand-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            placeholder="Merchant nomi bo'yicha qidirish"
          />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <button onClick={() => { 
            setToastType("error");
            setToastMessage("Vaqtincha bu funksiya ishlamayapti");
            setToastOpen(true);
          }} className="h-11 rounded-xl bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 px-4 text-white font-medium shadow-sm hover:shadow-md transition-all duration-200 text-sm whitespace-nowrap">
            <span className="hidden sm:inline">Merchant qo'shish</span>
            <span className="sm:hidden">+ Merchant</span>
          </button>
          
          <CustomSelect
            value={String(pageSize)}
            onChange={(value) => {
              setPageSize(Number(value));
              setPage(1);
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
              const rows = filteredData.map((m: any) => ({
                ID: m.id,
                Nomi: m.name,
                Holat: m.work_status ?? "",
                Yaratildi: m.createdAt ?? "",
              }));
              exportSingleTable({ rows, title: "Merchantlar", dateLabel: "Barcha sanalar" });
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
              <th className="px-3 sm:px-6 py-3 sm:py-4">Holat</th>
              <th className="px-3 sm:px-6 py-3 sm:py-4 hidden lg:table-cell">Yaratildi</th>
            </tr>
          </thead>
          <tbody className="text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-navy-800">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <span>Ma'lumotlar yuklanmoqda...</span>
                  </div>
                </td>
              </tr>
            ) : !pageData || pageData.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                  {search ? "Qidiruv bo'yicha merchantlar topilmadi" : "Merchantlar mavjud emas"}
                </td>
              </tr>
            ) : pageData.map((row) => (
              <tr
                key={row.id}
                className="border-t border-gray-200 dark:border-gray-600 cursor-pointer hover:bg-gray-50 dark:hover:bg-navy-700"
                onClick={async () => {
                  try {
                    setDetailLoading(true);
                    const fullMerchant = await (api as any).getMerchant(row.id);
                    setSelected(fullMerchant);
                    setOpen(true);
                  } catch (err) {
                    console.error("Error fetching merchant details:", err);
                    setToastType("error");
                    setToastMessage("Merchant tafsilotlarini yuklashda xatolik yuz berdi");
                    setToastOpen(true);
                    setSelected(row);
                    setOpen(true);
                  } finally {
                    setDetailLoading(false);
                  }
                }}
              >
                <td className="px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm">{row.id}</td>
                <td className="px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-medium">{row.name}</td>
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
          onPageChange={(p) => setPage(p)} 
        />
      </div>

      <DetailModal
        title={selected ? `Merchant: ${selected.name}` : "Merchant tafsilotlari"}
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
          <div className="space-y-2">
            <div className="flex items-start gap-4">
              {selected.image ? (
                <img src={selected.image} alt={selected.name} className="h-20 w-20 rounded object-cover" />
              ) : null}
              <div className="flex-1">
                <div><strong className="text-gray-900 dark:text-white">Turi:</strong> <span className="text-gray-700 dark:text-gray-300">{selected.type ?? "-"}</span></div>
                <div><strong className="text-gray-900 dark:text-white">ID:</strong> <span className="text-gray-700 dark:text-gray-300">{selected.id}</span></div>
              </div>
            </div>
            
            <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Holat va sana</h4>
              <div><strong className="text-gray-900 dark:text-white">Ish holati:</strong> 
                {selected.work_status === "WORKING" ? (
                  <span className="ml-2 inline-flex items-center rounded-full bg-green-100 dark:bg-green-800 px-2 py-1 text-xs font-medium text-green-800 dark:text-green-100">Ishlaydi</span>
                ) : selected.work_status === "BLOCKED" ? (
                  <span className="ml-2 inline-flex items-center rounded-full bg-yellow-100 dark:bg-yellow-800 px-2 py-1 text-xs font-medium text-yellow-800 dark:text-yellow-100">Bloklangan</span>
                ) : (
                  <span className="ml-2 text-gray-700 dark:text-gray-300">{selected.work_status ?? "-"}</span>
                )}
              </div>
              <div><strong className="text-gray-900 dark:text-white">Yaratilgan:</strong> 
                <span className="text-gray-700 dark:text-gray-300 ml-2">
                  {selected.createdAt ? new Date(selected.createdAt).toLocaleDateString('en-GB') : "-"}
                </span>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                className="rounded bg-gray-200 dark:bg-gray-600 px-3 py-1 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500"
                onClick={() => {
                  const payload = `Nomi: ${selected.name}\nTuri: ${selected.type ?? "-"}\nHolat: ${selected.work_status ?? "-"}`;
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
                setToastType("error");
                setToastMessage("Vaqtincha bu funksiya ishlamayapti");
                setToastOpen(true);
              }}>Tahrirlash</button>
            </div>
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500 dark:text-gray-400">
            Ma'lumot topilmadi
          </div>
        )}
      </DetailModal>

      <Toast message={toastMessage} isOpen={toastOpen} onClose={() => setToastOpen(false)} type={toastType} />
    </div>
  );
};

export default Merchants;
