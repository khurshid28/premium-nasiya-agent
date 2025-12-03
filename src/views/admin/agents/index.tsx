import React from "react";
import DetailModal from "components/modal/DetailModalNew";
import { useLocation } from "react-router-dom";
import apiReal from "lib/api";
import demoApi from "lib/demoApi";
import { exportSingleTable } from "lib/exportExcel";
import { formatPhone, formatMoney } from "lib/formatters";
import Pagination from "components/pagination";
import Toast from "components/toast/ToastNew";
import CustomSelect from "components/dropdown/CustomSelect";
import DateRangePicker from "components/DateRangePicker";
import type { Agent } from "types/api";

const Agents = (): JSX.Element => {
  const location = useLocation();
  const api = React.useMemo(() => {
    const isDemo = location.pathname.startsWith('/demo');
    console.log('Agents API Selection:', { pathname: location.pathname, isDemo, api: isDemo ? 'demoApi' : 'apiReal' });
    return isDemo ? demoApi : apiReal;
  }, [location.pathname]);
  const [data, setData] = React.useState<Agent[]>([]);
  const [loading, setLoading] = React.useState(true);
  
  const [search, setSearch] = React.useState("");
  
  const [page, setPage] = React.useState<number>(1);
  const [pageSize, setPageSize] = React.useState<number>(5);
  
  const [selected, setSelected] = React.useState<Agent | null>(null);
  const [open, setOpen] = React.useState(false);
  const [detailLoading, setDetailLoading] = React.useState(false);
  const [toastOpen, setToastOpen] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState("");
  const [toastType, setToastType] = React.useState<'success' | 'error' | 'info' | 'warning'>('info');
  const [agentStats, setAgentStats] = React.useState({ count: 0, totalAmount: 0 });
  const [fillialStats, setFillialStats] = React.useState<any[]>([]);
  const [allApplications, setAllApplications] = React.useState<any[]>([]);
  
  // Modal filters
  const [modalStartDate, setModalStartDate] = React.useState("");
  const [modalEndDate, setModalEndDate] = React.useState("");
  const [modalRegion, setModalRegion] = React.useState("all");
  const [modalMerchant, setModalMerchant] = React.useState<number | "all">("all");
  const [merchants, setMerchants] = React.useState<any[]>([]);

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
          const res = await (api as any).listAgents({});
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

  // Load merchants
  React.useEffect(() => {
    let mounted = true;
    (api as any).listMerchants({ page: 1, pageSize: 100 })
      .then((res: any) => {
        if (!mounted) return;
        setMerchants(res?.items || []);
      })
      .catch(() => {
        if (!mounted) return;
        setMerchants([]);
      });
    return () => { mounted = false; };
  }, [api]);

  // Calculate fillial stats based on filters
  const calculateFillialStats = React.useCallback((agent: Agent, apps: any[]) => {
    if (!agent.fillials || agent.fillials.length === 0) {
      setFillialStats([]);
      setAgentStats({ count: 0, totalAmount: 0 });
      return;
    }

    const agentFillialIds = agent.fillials.map(f => f.id);
    let filteredApps = apps.filter((app: any) => agentFillialIds.includes(app.fillial_id));

    // Apply date filter
    if (modalStartDate || modalEndDate) {
      const start = modalStartDate ? new Date(modalStartDate) : new Date(0);
      const end = modalEndDate ? new Date(modalEndDate) : new Date();
      end.setHours(23, 59, 59, 999);
      filteredApps = filteredApps.filter((app: any) => {
        if (!app.createdAt) return false;
        const d = new Date(app.createdAt);
        return d >= start && d <= end;
      });
    }

    // Apply region filter
    if (modalRegion !== "all") {
      filteredApps = filteredApps.filter((app: any) => {
        const fillial = agent.fillials?.find(f => f.id === app.fillial_id);
        return fillial?.region === modalRegion;
      });
    }

    // Apply merchant filter
    if (modalMerchant !== "all") {
      filteredApps = filteredApps.filter((app: any) => {
        const fillial = agent.fillials?.find(f => f.id === app.fillial_id);
        return fillial?.merchant_id === Number(modalMerchant);
      });
    }

    // Initialize all fillials with 0 values
    const statsByFillial: any = {};
    agent.fillials.forEach((fillial: any) => {
      statsByFillial[fillial.id] = {
        fillial: fillial,
        totalCount: 0,
        confirmedCount: 0,
        confirmedAmount: 0
      };
    });

    // Update stats for fillials with applications
    filteredApps.forEach((app: any) => {
      const fillialId = app.fillial_id;
      if (!fillialId || !statsByFillial[fillialId]) return;

      statsByFillial[fillialId].totalCount++;

      const status = (app.status || "").toUpperCase();
      const isConfirmed = status === "CONFIRMED" || status === "FINISHED" || status === "COMPLETED" || status === "ACTIVE";
      if (isConfirmed) {
        statsByFillial[fillialId].confirmedCount++;
        statsByFillial[fillialId].confirmedAmount += app.amount || 0;
      }
    });

    // Convert to array and sort by total count (descending)
    const statsArray = Object.values(statsByFillial).sort((a: any, b: any) => b.totalCount - a.totalCount);
    setFillialStats(statsArray);

    // Calculate total stats
    const totalCount = filteredApps.length;
    const totalAmount = filteredApps.reduce((sum: number, app: any) => {
      const status = (app.status || "").toUpperCase();
      const isConfirmed = status === "CONFIRMED" || status === "FINISHED" || status === "COMPLETED" || status === "ACTIVE";
      return sum + (isConfirmed ? (app.amount || 0) : 0);
    }, 0);
    setAgentStats({ count: totalCount, totalAmount });
  }, [modalStartDate, modalEndDate, modalRegion, modalMerchant]);

  // Recalculate when filters change
  React.useEffect(() => {
    if (selected && allApplications.length > 0) {
      calculateFillialStats(selected, allApplications);
    }
  }, [modalStartDate, modalEndDate, modalRegion, modalMerchant, selected, allApplications, calculateFillialStats]);

  const filteredData = React.useMemo(() => {
    let filtered = data;
    
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(item => 
        item.fullname?.toLowerCase().includes(searchLower) ||
        item.phone?.toLowerCase().includes(searchLower)
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
        <h2 className="text-xl sm:text-2xl font-semibold text-navy-700 dark:text-white">Agentlar</h2>
      </div>
      
      <div className="flex flex-col gap-3 mb-4">
        <div className="relative w-full sm:w-80 lg:w-96">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 rounded-xl border border-gray-200 dark:border-navy-600 bg-white dark:bg-navy-700 px-4 pl-10 w-full text-sm font-medium text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 shadow-sm hover:shadow-md hover:border-brand-500 dark:hover:border-brand-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            placeholder="Ism yoki telefon bo'yicha qidirish"
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
            <span className="hidden sm:inline">Agent qo'shish</span>
            <span className="sm:hidden">+ Agent</span>
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
              const rows = filteredData.map((a: any) => ({
                ID: a.id,
                "Ism-familiya": a.fullname,
                Telefon: a.phone ?? "",
                Holat: a.work_status ?? "",
                Yaratildi: a.createdAt ?? "",
              }));
              exportSingleTable({ rows, title: "Agentlar", dateLabel: "Barcha sanalar" });
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
              <th className="px-3 sm:px-6 py-3 sm:py-4">Ism-familiya</th>
              <th className="px-3 sm:px-6 py-3 sm:py-4 hidden sm:table-cell">Telefon</th>
              <th className="px-3 sm:px-6 py-3 sm:py-4">Holat</th>
              <th className="px-3 sm:px-6 py-3 sm:py-4 hidden lg:table-cell">Yaratildi</th>
            </tr>
          </thead>
          <tbody className="text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-navy-800">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <span>Ma'lumotlar yuklanmoqda...</span>
                  </div>
                </td>
              </tr>
            ) : !pageData || pageData.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                  {search ? "Qidiruv bo'yicha agentlar topilmadi" : "Agentlar mavjud emas"}
                </td>
              </tr>
            ) : pageData.map((row) => (
              <tr
                key={row.id}
                className="border-t border-gray-200 dark:border-gray-600 cursor-pointer hover:bg-gray-50 dark:hover:bg-navy-700"
                onClick={async () => {
                  try {
                    setDetailLoading(true);
                    // Reset filters when opening modal
                    setModalStartDate("");
                    setModalEndDate("");
                    setModalRegion("all");
                    setModalMerchant("all");
                    
                    const [fullAgent, applicationsRes] = await Promise.all([
                      (api as any).getAgent(row.id),
                      api.listApplications({})
                    ]);
                    
                    setSelected(fullAgent);
                    setAllApplications(applicationsRes?.items || []);
                    
                    // Calculate initial stats
                    calculateFillialStats(fullAgent, applicationsRes?.items || []);
                    setOpen(true);
                  } catch (err) {
                    console.error("Error fetching agent details:", err);
                    setToastType("error");
                    setToastMessage("Agent tafsilotlarini yuklashda xatolik yuz berdi");
                    setToastOpen(true);
                    setSelected(row);
                    setAllApplications([]);
                    setFillialStats([]);
                    setAgentStats({ count: 0, totalAmount: 0 });
                    setOpen(true);
                  } finally {
                    setDetailLoading(false);
                  }
                }}
              >
                <td className="px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm">{row.id}</td>
                <td className="px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-medium">{row.fullname}</td>
                <td className="px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm hidden sm:table-cell">{formatPhone(row.phone)}</td>
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
        title={selected ? `Agent: ${selected.fullname}` : "Agent tafsilotlari"}
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
                <img src={selected.image} alt={selected.fullname} className="h-20 w-20 rounded object-cover" />
              ) : null}
              <div className="flex-1">
                <div><strong className="text-gray-900 dark:text-white">Telefon:</strong> <span className="text-gray-700 dark:text-gray-300">{formatPhone(selected.phone)}</span></div>
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

            {/* Filterlar */}
            <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Filterlar</h4>
              <div className="space-y-2">
                <DateRangePicker 
                  startDate={modalStartDate} 
                  endDate={modalEndDate} 
                  onStartChange={setModalStartDate} 
                  onEndChange={setModalEndDate} 
                />
                <div className="flex flex-wrap gap-2">
                  <CustomSelect
                    value={String(modalMerchant)}
                    onChange={(value) => setModalMerchant(value === "all" ? "all" : Number(value))}
                    options={[
                      { value: "all", label: "Barcha merchantlar" },
                      ...(Array.isArray(merchants) ? merchants : []).map((m) => ({ 
                        value: String(m.id), 
                        label: m.name || `Merchant #${m.id}` 
                      }))
                    ]}
                    className="min-w-[150px] flex-1"
                  />
                  <CustomSelect
                    value={modalRegion}
                    onChange={setModalRegion}
                    options={[
                      { value: "all", label: "Barcha hududlar" },
                      ...Array.from(new Set((selected.fillials || []).map(f => f.region).filter(Boolean))).map(r => ({ 
                        value: r as string, 
                        label: r as string 
                      }))
                    ]}
                    className="min-w-[150px] flex-1"
                  />
                </div>
              </div>
            </div>

            {/* Filliallar bo'yicha hisobot */}
            <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Filliallar bo'yicha hisobot</h4>
              {fillialStats.length > 0 ? (
                <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-600">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-navy-700 text-xs text-gray-600 dark:text-gray-300">
                      <tr>
                        <th className="px-2 py-2 text-left">Filial</th>
                        <th className="px-2 py-2 text-right">Arizalar</th>
                        <th className="px-2 py-2 text-right">Tasdiqlangan summa</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-700 dark:text-gray-300">
                      {fillialStats.map((stat: any, index: number) => (
                        <tr key={stat.fillial?.id || index} className="border-t border-gray-200 dark:border-gray-600">
                          <td className="px-2 py-2">
                            <div className="font-medium">{stat.fillial?.name || "-"}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{stat.fillial?.region || ""}</div>
                          </td>
                          <td className="px-2 py-2 text-right">
                            <div className="font-semibold">{stat.totalCount}</div>
                            <div className="text-xs text-green-600 dark:text-green-400">✓ {stat.confirmedCount}</div>
                          </td>
                          <td className="px-2 py-2 text-right">
                            <div className="font-semibold text-green-600 dark:text-green-400">
                              {formatMoney(stat.confirmedAmount)}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Tanlangan filtrlar bo'yicha filliallar topilmadi
                </div>
              )}
            </div>

            {/* Umumiy statistika */}
            <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Umumiy statistika</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-3">
                  <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">Jami arizalar</div>
                  <div className="text-xl font-bold text-blue-700 dark:text-blue-300">{agentStats.count}</div>
                </div>
                <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-3">
                  <div className="text-xs text-green-600 dark:text-green-400 font-medium">Tasdiqlangan summa</div>
                  <div className="text-base font-bold text-green-700 dark:text-green-300">
                    {formatMoney(agentStats.totalAmount)}
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                className="rounded bg-gray-200 dark:bg-gray-600 px-3 py-1 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500"
                onClick={() => {
                  const payload = `Ism: ${selected.fullname}\nTelefon: ${selected.phone ?? "-"}\nHolat: ${selected.work_status ?? "-"}`;
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

export default Agents;
