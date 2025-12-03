import React from "react";
import { Range } from "react-range";
import demoApi from "lib/demoApi";
import Pagination from "components/pagination";
import DetailModal from "components/modal/DetailModalNew";
import AvatarName from "components/AvatarName";
import DateRangePicker from "components/DateRangePicker";
import CustomSelect from "components/dropdown/CustomSelect";
import { formatPhone, formatMoney, formatMoneyWithUZS, appStatusBadge, formatDateNoSeconds, formatDate24Hour, isApproved, isLimit, isConfirmed } from "lib/formatters";
import { exportSingleTable } from "lib/exportExcel";
import Toast from "components/toast/ToastNew";

// Same type as original Applications
type Application = {
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
  status?: string | null;
  fillial_id?: number;
  bank_id?: number;
  request_id?: string | null;
  createdAt?: string;
  updatedAt?: string | null;
  merchant?: { id: number; name: string } | null;
  fillial?: { id: number; name: string } | null;
  user?: { id: number; fullname: string; phone?: string | null; image?: string | null } | null;
  myid_id?: number | null;
  paid?: boolean | null;
  fcmToken?: string | null;
  products?: { id: number; name: string; price: number; count?: number | null }[];
};

const DemoApplications = (): JSX.Element => {
  const [applications, setApplications] = React.useState<Application[]>([]);
  const [fillialsList, setFillialsList] = React.useState<any[]>([]);
  const [merchants, setMerchants] = React.useState<any[]>([]);
  const [agents, setAgents] = React.useState<any[]>([]);
  const [selectedMerchantId, setSelectedMerchantId] = React.useState<number | "all">("all");
  const [selectedAgentId, setSelectedAgentId] = React.useState<number | "all">("all");
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [paidFilter, setPaidFilter] = React.useState("all");
  const [fillialFilter, setFillialFilter] = React.useState<number | "all">("all");
  const [regionFilter, setRegionFilter] = React.useState<string>("all");
  const [expiredMonthFilter, setExpiredMonthFilter] = React.useState<number | "all">("all");
  const [amountRange, setAmountRange] = React.useState<[number, number]>([0, 50000000]);
  const [startDate, setStartDate] = React.useState<string>("");
  const [endDate, setEndDate] = React.useState<string>("");
  const [selected, setSelected] = React.useState<Application | null>(null);
  const [open, setOpen] = React.useState(false);
  const [detailLoading, setDetailLoading] = React.useState(false);
  
  const [page, setPage] = React.useState<number>(1);
  const [pageSize, setPageSize] = React.useState<number>(10);
  
  const [toastMessage, setToastMessage] = React.useState<string>("");
  const [toastOpen, setToastOpen] = React.useState<boolean>(false);
  const [toastType, setToastType] = React.useState<'success' | 'error' | 'info' | 'warning'>('info');
  
  const [downloadLoading, setDownloadLoading] = React.useState<{[key: string]: boolean}>({});
  
  const SLIDER_MIN = 0;
  const SLIDER_MAX = 50000000;
  const SLIDER_STEP = 10000;

  const generateCopyText = (app: Application): string => {
    let text = `👤 Ariza beruvchi:\n${app.fullname}\n${app.passport || ''}\n\n`;
    text += `📱 Telefon: ${formatPhone(app.phone)}\n`;
    text += `🛒 Tovarlar summasi: ${formatMoney(app.amount)}\n`;
    text += `💰 To'lov summasi: ${formatMoney(app.payment_amount || app.amount)}\n`;
    text += `💳 To'lov: ${app.paid ? "✅ To'landi" : "❌ To'lanmadi"}\n`;
    text += `🏢 Filial: ${app.fillial?.name ?? "-"}\n`;
    
    if ((app as any).request?.orderid) {
      text += `📦 Order ID: #${(app as any).request.orderid}\n`;
    }
    
    const loanId = (app as any).request?.loanid;
    if (loanId) {
      text += `💳 KREDIT ID: #${loanId}\n`;
    }
    
    if (app.user) {
      text += `\n👨‍💼 Operator ma'lumotlari:\n`;
      text += `   • F.I.O: ${app.user.fullname}\n`;
      if (app.user.phone) text += `   • Telefon: ${formatPhone(app.user.phone)}\n`;
      text += `   • ID: #${app.user.id}\n`;
    }
    
    text += `\n`;
    if (app.phone2) text += `📞 Qo'shimcha telefon: ${formatPhone(app.phone2)}\n`;
    if (app.limit) text += `💵 Limit: ${formatMoney(app.limit)}\n`;
    if (app.expired_month) text += `📅 Muddat (oy): ${app.expired_month}\n`;
    if (app.percent) text += `📊 Foiz: ${app.percent}%\n`;
    if (app.createdAt) text += `🗓 Yaratilgan sana: ${formatDateNoSeconds(app.createdAt)}\n`;
    if (app.canceled_reason) text += `❌ Bekor qilish sababi: ${app.canceled_reason}\n`;
    text += `📈 Holat: ${appStatusBadge(app.status).label}\n`;
    
    if (app.products && app.products.length > 0) {
      text += `\n🛍️ Mahsulotlar:\n`;
      app.products.forEach((p, idx) => {
        text += `   ${idx + 1}. ${p.name} - ${formatMoney(p.price)} - ${p.count ?? 1} ta\n`;
      });
    }
    
    return text;
  };

  const statuses = React.useMemo(() => {
    return [
      { value: "all", label: "Barcha holatlar" },
      { value: "CONFIRMED", label: "Tasdiqlangan" },
      { value: "FINISHED", label: "Tugatilgan" },
      { value: "PENDING", label: "Kutilmoqda" },
      { value: "REJECTED", label: "Rad qilingan" },
      { value: "LIMIT", label: "Limit" }
    ];
  }, []);

  const regions = React.useMemo(() => {
    const s = new Set<string>();
    const fillials = Array.isArray(fillialsList) ? fillialsList : [];
    fillials.forEach((f) => { if (f.region) s.add(f.region); });
    return ["all", ...Array.from(s)];
  }, [fillialsList]);

  React.useEffect(() => {
    let mounted = true;
    
    const fetchData = async () => {
      try {
        const [appsRes, fillialsRes, merchantsRes, agentsRes] = await Promise.all([
          demoApi.listApplications({}),
          demoApi.listFillials({}),
          demoApi.listMerchants({ page: 1, pageSize: 100 }),
          demoApi.listAgents({ page: 1, pageSize: 100 })
        ]);
        
        if (!mounted) return;
        
        const apps = appsRes?.items || [];
        setApplications(apps);
        setFillialsList(fillialsRes?.items || []);
        setMerchants(merchantsRes?.items || []);
        setAgents(agentsRes?.items || []);
      } catch (err: any) {
        if (!mounted) return;
        setApplications([]);
        setFillialsList([]);
        setMerchants([]);
      }
    };
    
    fetchData();
    
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = React.useMemo(() => {
    const s = search.trim().toLowerCase();
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    if (end) end.setHours(23, 59, 59, 999);

    const apps = Array.isArray(applications) ? applications : [];
    return apps.filter((a) => {
      const fullname = (a.fullname ?? "").toLowerCase();
      const phone = (a.phone ?? "").toLowerCase();
      const passport = (a.passport ?? "").toLowerCase();
      const matchesSearch = !s || fullname.includes(s) || phone.includes(s) || passport.includes(s);
      
      let matchesStatus = true;
      if (statusFilter !== "all") {
        const st = (a.status ?? "").toUpperCase();
        
        if (statusFilter === "CONFIRMED") {
          matchesStatus = st === "CONFIRMED";
        } else if (statusFilter === "FINISHED") {
          matchesStatus = st === "FINISHED" || st === "COMPLETED" || st === "ACTIVE";
        } else if (statusFilter === "REJECTED") {
          matchesStatus = st.includes("CANCELED") || st === "SCORING RAD ETDI" || st === "DAILY RAD ETDI" || 
                         st === "REJECTED" || st.includes("RAD") || st.includes("SCORING") ||
                         st === "DECLINED" || st === "REFUSED";
        } else if (statusFilter === "LIMIT") {
          matchesStatus = st === "LIMIT" || st.includes("LIMIT");
        } else if (statusFilter === "PENDING") {
          const isConfirmed = st === "CONFIRMED";
          const isFinished = st === "FINISHED" || st === "COMPLETED" || st === "ACTIVE";
          const isRejected = st.includes("CANCELED") || st === "SCORING RAD ETDI" || st === "DAILY RAD ETDI" || 
                            st === "REJECTED" || st.includes("RAD") || st.includes("SCORING") ||
                            st === "DECLINED" || st === "REFUSED";
          
          matchesStatus = !isConfirmed && !isFinished && !isRejected && 
                         (st === "CREATED" || st === "ADDED_DETAIL" || st.includes("WAITING") || 
                          st === "ADDED_PRODUCT" || st === "PENDING" || st === "NEW" || st === "PROCESSING");
        } else {
          matchesStatus = a.status === statusFilter;
        }
      }
      
      let matchesPaid = true;
      if (paidFilter !== "all") {
        const st = (a.status ?? "").toUpperCase();
        const isFinished = st === "FINISHED" || st === "COMPLETED" || st === "ACTIVE";
        
        if (paidFilter === "paid") {
          matchesPaid = isFinished && a.paid === true;
        } else if (paidFilter === "unpaid") {
          matchesPaid = isFinished && (a.paid === false || a.paid == null);
        }
      }
      const matchesFillial = fillialFilter === "all" || a.fillial_id === Number(fillialFilter);
      const fillials = Array.isArray(fillialsList) ? fillialsList : [];
      const fillialObj = fillials.find((f) => f.id === (a.fillial?.id ?? a.fillial_id));
      const fillialRegion = fillialObj?.region ?? (a.fillial && (a.fillial as any).region) ?? null;
      const matchesRegion = regionFilter === "all" || (!fillialRegion && regionFilter === "all") || fillialRegion === regionFilter;
      const matchesMerchant = selectedMerchantId === "all" || (fillialObj && fillialObj.merchant_id === Number(selectedMerchantId));
      let matchesAgent = true;
      if (selectedAgentId !== "all") {
        const agent = agents.find((ag: any) => ag.id === Number(selectedAgentId));
        if (agent && agent.fillials) {
          const agentFillialIds = agent.fillials.map((f: any) => f.id);
          matchesAgent = agentFillialIds.includes(a.fillial_id);
        } else {
          matchesAgent = false;
        }
      }
      const matchesExpiredMonth = expiredMonthFilter === "all" || (a.expired_month && Number(a.expired_month) === Number(expiredMonthFilter));
      const matchesMinAmount = (a.amount ?? 0) >= amountRange[0];
      const matchesMaxAmount = (a.amount ?? 0) <= amountRange[1];

      if (!matchesSearch || !matchesStatus || !matchesPaid || !matchesFillial || !matchesRegion || !matchesMerchant || !matchesAgent || !matchesExpiredMonth || !matchesMinAmount || !matchesMaxAmount) return false;

      if ((start || end) && a.createdAt) {
        const created = new Date(a.createdAt);
        if (start && created < start) return false;
        if (end && created > end) return false;
      }

      return true;
    });
  }, [applications, search, statusFilter, startDate, endDate, paidFilter, fillialFilter, regionFilter, expiredMonthFilter, amountRange, fillialsList, selectedMerchantId, selectedAgentId, agents]);

  const stats = React.useMemo(() => {
    const items = filtered;
    const totalCount = items.length;
    const approvedItems = items.filter((a) => a.status === "CONFIRMED" || a.status === "FINISHED" || a.status === "COMPLETED" || a.status === "ACTIVE");
    const approvedAmount = approvedItems.reduce((s, a) => s + (a.amount ?? 0), 0);
    const approvedPaidAmount = approvedItems.filter((a) => a.paid).reduce((s, a) => s + (a.amount ?? 0), 0);
    const approvedUnpaidAmount = approvedAmount - approvedPaidAmount;
    return { totalCount, approvedAmount, approvedPaidAmount, approvedUnpaidAmount };
  }, [filtered]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  
  React.useEffect(() => {
    setFillialFilter("all");
  }, [selectedMerchantId, selectedAgentId]);

  React.useEffect(() => {
    setPage(1);
  }, [search, statusFilter, paidFilter, fillialFilter, regionFilter, expiredMonthFilter, amountRange, startDate, endDate, selectedMerchantId, selectedAgentId]);

  const pageData = React.useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  return (
    <div>
      {/* Demo Mode Banner */}
      <div className="mb-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 p-4 text-white shadow-lg">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🎭</span>
          <div>
            <h3 className="text-lg font-bold">DEMO MODE</h3>
            <p className="text-sm opacity-90">Bu demo versiya - real ma'lumotlar bilan ishlayapdi</p>
          </div>
        </div>
      </div>

      {/* Rest of the component - same as original Applications */}
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-navy-800 p-3">
          <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Jami arizalar</div>
          <div className="text-base sm:text-lg font-semibold dark:text-white">{stats.totalCount}</div>
        </div>
        <div className="rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-navy-800 p-3">
          <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Tasdiqlangan jami</div>
          <div className="text-base sm:text-lg font-semibold dark:text-white">{formatMoneyWithUZS(stats.approvedAmount)}</div>
        </div>
        <div className="rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-navy-800 p-3 sm:col-span-2 lg:col-span-1">
          <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">To'landi / To'lanmadi</div>
          <div className="text-base sm:text-lg font-semibold dark:text-white">{formatMoneyWithUZS(stats.approvedPaidAmount)} / {formatMoneyWithUZS(stats.approvedUnpaidAmount)}</div>
        </div>
      </div>
      
      {/* Filters - Same as original */}
      <div className="mb-4 space-y-3">
        <div className="relative w-full sm:w-80 lg:w-96">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 rounded-xl border border-gray-200 dark:border-navy-600 bg-white dark:bg-navy-700 px-4 pl-10 w-full text-sm font-medium text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 shadow-sm hover:shadow-md hover:border-brand-500 dark:hover:border-brand-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            placeholder="Ism yoki telefon raqam bo'yicha qidirish"
          />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        
        <DateRangePicker 
          startDate={startDate} 
          endDate={endDate} 
          onStartChange={setStartDate} 
          onEndChange={setEndDate}
        />
        
        <div className="flex flex-wrap items-stretch gap-2">
          <CustomSelect
            value={statusFilter}
            onChange={setStatusFilter}
            options={statuses}
            className="flex-1 min-w-[140px] sm:flex-initial sm:w-auto"
          />
          <CustomSelect
            value={paidFilter}
            onChange={setPaidFilter}
            options={[
              { value: "all", label: "Barcha to'lovlar" },
              { value: "paid", label: "To'landi" },
              { value: "unpaid", label: "To'lanmadi" }
            ]}
            className="flex-1 min-w-[130px] sm:flex-initial sm:w-auto"
          />
          <CustomSelect
            value={String(selectedMerchantId)}
            onChange={(value) => {
              setSelectedMerchantId(value === "all" ? "all" : Number(value));
              setFillialFilter("all");
            }}
            options={[
              { value: "all", label: "Barcha merchantlar" },
              ...(Array.isArray(merchants) ? merchants : []).map((m) => ({ 
                value: String(m.id), 
                label: m.name || `Merchant #${m.id}` 
              }))
            ]}
            className="flex-1 min-w-[160px] sm:flex-initial sm:w-auto"
          />
          <CustomSelect
            value={regionFilter}
            onChange={setRegionFilter}
            options={regions.map(r => ({ 
              value: r, 
              label: r === "all" ? "Barcha hududlar" : r 
            }))}
            className="flex-1 min-w-[140px] sm:flex-initial sm:w-auto"
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
            className="flex-1 min-w-[160px] sm:flex-initial sm:w-auto"
          />
          <CustomSelect
            value={String(fillialFilter)}
            onChange={(value) => setFillialFilter(value === "all" ? "all" : Number(value))}
            options={[
              { value: "all", label: "Barcha filiallar" },
              ...(Array.isArray(fillialsList) ? fillialsList : [])
                .filter(f => {
                  if (selectedMerchantId !== "all" && f.merchant_id !== Number(selectedMerchantId)) {
                    return false;
                  }
                  if (selectedAgentId !== "all") {
                    const agent = agents.find((ag: any) => ag.id === Number(selectedAgentId));
                    if (agent && agent.fillials && agent.fillials.length > 0) {
                      const agentFillialIds = agent.fillials.map((af: any) => af.id);
                      return agentFillialIds.includes(f.id);
                    }
                    return false;
                  }
                  return true;
                })
                .map(f => ({ value: String(f.id), label: f.name }))
            ]}
            className="flex-1 min-w-[150px] sm:flex-initial sm:w-auto"
          />
          <CustomSelect
            value={String(expiredMonthFilter)}
            onChange={(value) => setExpiredMonthFilter(value === "all" ? "all" : Number(value))}
            options={[
              { value: "all", label: "Barcha oylar" },
              { value: "3", label: "3 oy" },
              { value: "6", label: "6 oy" },
              { value: "9", label: "9 oy" },
              { value: "12", label: "12 oy" }
            ]}
            className="flex-1 min-w-[120px] sm:flex-initial sm:w-auto"
          />
          <CustomSelect
            value={String(pageSize)}
            onChange={(value) => setPageSize(Number(value))}
            options={[
              { value: "5", label: "5 ta" },
              { value: "10", label: "10 ta" },
              { value: "25", label: "25 ta" },
              { value: "50", label: "50 ta" },
              { value: "100", label: "100 ta" }
            ]}
            className="flex-1 min-w-[100px] sm:flex-initial sm:w-auto"
          />
          
          <button
            onClick={async () => {
              const dateLabel = startDate || endDate ? `${startDate || "-"} — ${endDate || "-"}` : "Barcha sanalar";
              const apps = filtered.map((a) => ({
                ID: a.id,
                "F.I.Sh": a.fullname,
                Telefon: a.phone ?? "",
                Summa: a.amount ?? 0,
                Holat: a.status ?? "",
                Filial: a.fillial?.name ?? "",
                Yaratildi: formatDateNoSeconds(a.createdAt) ?? "",
              }));
              exportSingleTable({ rows: apps, title: "Arizalar (Demo)", dateLabel });
            }}
            className="flex-shrink-0 h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 px-3 sm:px-4 text-white inline-flex items-center justify-center gap-2 text-sm whitespace-nowrap"
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
            className="flex-shrink-0 h-11 rounded-xl bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 px-3 sm:px-4 text-white inline-flex items-center justify-center gap-2 text-sm whitespace-nowrap transition-all duration-200 active:scale-95"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4">
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="hidden sm:inline">Yangilash</span>
          </button>
        </div>
      </div>

      <div className="mt-4">
        <div className="w-full md:w-1/4 px-2">
          <Range
            values={amountRange}
            step={SLIDER_STEP}
            min={SLIDER_MIN}
            max={SLIDER_MAX}
            onChange={(vals) => {
              const a = Math.max(SLIDER_MIN, Math.min(vals[0], vals[1]));
              const b = Math.max(a, vals[1]);
              setAmountRange([a, b]);
            }}
            renderTrack={({ props, children }) => (
              <div
                {...props}
                className="relative h-2 w-full rounded bg-gray-200 dark:bg-gray-700"
                style={{ ...props.style }}
              >
                <div
                  className="absolute h-2 rounded"
                  style={{
                    left: `${((amountRange[0] - SLIDER_MIN) / (SLIDER_MAX - SLIDER_MIN)) * 100}%`,
                    right: `${100 - ((amountRange[1] - SLIDER_MIN) / (SLIDER_MAX - SLIDER_MIN)) * 100}%`,
                    background: "linear-gradient(90deg, #6366f1, #06b6d4)",
                  }}
                />
                {children}
              </div>
            )}
            renderThumb={({ props }) => (
              <div
                {...props}
                className="flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-md ring-1 ring-gray-300"
                style={{ ...props.style }}
              >
                <div className="h-2 w-2 rounded-full bg-indigo-600" />
              </div>
            )}
          />
          <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            {formatMoneyWithUZS(amountRange[0])} — {formatMoneyWithUZS(amountRange[1])}
          </div>
        </div>
      </div>

      <div className="mt-2 overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-600">
        <table className="w-full table-auto min-w-[800px]">
          <thead className="bg-gray-50 dark:bg-navy-800 text-left text-xs sm:text-sm text-gray-600 dark:text-gray-300">
            <tr>
              <th className="px-2 sm:px-4 py-2 sm:py-3 text-center">ID</th>
              <th className="px-2 sm:px-4 py-2 sm:py-3">Ariza beruvchi</th>
              <th className="px-2 sm:px-4 py-2 sm:py-3 text-center">Telefon</th>
              <th className="px-2 sm:px-4 py-2 sm:py-3 text-center hidden md:table-cell">Tovar</th>
              <th className="px-2 sm:px-4 py-2 sm:py-3 text-center hidden lg:table-cell">To'lov/Limit</th>
              <th className="px-2 sm:px-4 py-2 sm:py-3 text-center hidden sm:table-cell">To'lov</th>
              <th className="px-2 sm:px-4 py-2 sm:py-3 text-center hidden xl:table-cell">Filial</th>
              <th className="px-2 sm:px-4 py-2 sm:py-3 text-center">Grafik</th>
              <th className="px-2 sm:px-6 py-2 sm:py-3 text-center">Holat</th>
              <th className="px-2 sm:px-4 py-2 sm:py-3 text-center hidden lg:table-cell">Muddat</th>
              <th className="px-2 sm:px-4 py-2 sm:py-3 text-center hidden xl:table-cell">Yaratildi</th>
            </tr>
          </thead>
          <tbody className="text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-navy-800">
            {pageData.map((a) => {
              const shouldPulse = isLimit(a.status) || isConfirmed(a.status);
              return (
              <tr
                key={a.id}
                className={`border-t border-gray-200 dark:border-gray-600 cursor-pointer hover:bg-gray-50 dark:hover:bg-navy-700 ${shouldPulse ? 'animate-pulse bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-l-yellow-500 shadow-sm' : ''}`}
                onClick={async () => {
                  try {
                    setDetailLoading(true);
                    const fullApplication = await demoApi.getZayavka(a.id);
                    setSelected(fullApplication);
                    setOpen(true);
                  } catch (err) {
                    console.error('Error fetching application:', err);
                    setToastMessage("Ariza tafsilotlarini yuklashda xatolik yuz berdi");
                    setToastType('error');
                    setToastOpen(true);
                    setSelected(a);
                    setOpen(true);
                  } finally {
                    setDetailLoading(false);
                  }
                }}
              >
                <td className="px-2 sm:px-4 py-2 text-center text-xs sm:text-sm">{a.id}</td>
                <td className="px-2 sm:px-4 py-2">
                  <AvatarName
                    image={(a.user as any)?.image ?? null}
                    name={a.fullname}
                    subtitle={a.passport ?? undefined}
                    size="sm"
                  />
                </td>
                <td className="px-2 sm:px-4 py-2 text-center text-xs sm:text-sm whitespace-nowrap">{formatPhone(a.phone)}</td>
                <td className="px-2 sm:px-4 py-2 text-center text-xs sm:text-sm whitespace-nowrap hidden md:table-cell">
                  {(a.products && a.products.length > 0) || a.amount ? (
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">{a.products && a.products.length > 0 ? `${a.products.length} dona` : "-"}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{a.amount ? formatMoney(a.amount) : "-"}</span>
                    </div>
                  ) : (
                    <span className="text-gray-400 dark:text-gray-500">-</span>
                  )}
                </td>
                <td className="px-2 sm:px-4 py-2 text-center text-xs sm:text-sm whitespace-nowrap hidden lg:table-cell">
                  {(a.payment_amount || a.amount) && a.limit ? (
                    <div className="flex flex-col gap-0">
                      <span className="font-semibold text-brand-500 dark:text-brand-400">{formatMoney(a.payment_amount || a.amount)}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{formatMoney(a.limit)}</span>
                    </div>
                  ) : (a.payment_amount || a.amount) ? (
                    <span className="font-semibold text-brand-500 dark:text-brand-400">{formatMoney(a.payment_amount || a.amount)}</span>
                  ) : a.limit ? (
                    <span className="text-gray-700 dark:text-gray-300">{formatMoney(a.limit)}</span>
                  ) : (
                    <span className="text-gray-400 dark:text-gray-500">-</span>
                  )}
                </td>
                <td className="px-2 sm:px-4 py-2 text-center hidden sm:table-cell">
                  {(() => {
                    const st = (a.status ?? "").toUpperCase();
                    const isFinished = st === "FINISHED" || st === "COMPLETED" || st === "ACTIVE";
                    if (!isFinished) return <span className="text-gray-400 dark:text-gray-500">-</span>;
                    return a.paid ? 
                      <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/30 px-2 py-1 text-xs font-medium text-green-800 dark:text-green-300">To'landi</span> : 
                      <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-1 text-xs font-medium text-gray-800 dark:text-gray-300">To'lanmadi</span>;
                  })()}
                </td>
                <td className="px-2 sm:px-4 py-2 text-center text-xs sm:text-sm whitespace-nowrap hidden xl:table-cell">
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="font-medium">{a.fillial?.name ?? "-"}</span>
                    {a.user?.fullname && (
                      <span className="text-[10px] text-gray-500 dark:text-gray-400">
                        {a.user.fullname}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-2 sm:px-4 py-2 text-center">
                  {isApproved(a.status) ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setToastMessage("Demo mode: Grafik yuklab olish o'chirilgan");
                        setToastType('info');
                        setToastOpen(true);
                      }}
                      className="inline-flex items-center justify-center rounded border border-gray-300 dark:border-gray-600 p-2 text-sm whitespace-nowrap transition-all duration-200 hover:bg-gray-100 dark:hover:bg-navy-700 dark:text-gray-300"
                      title="Grafikni yuklab olish (Demo)"
                      type="button"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        <polyline points="7 10 12 15 17 10" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        <line x1="12" y1="15" x2="12" y2="3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-2 sm:px-6 py-2 text-center">{(() => { const b = appStatusBadge(a.status, true); return <span className={b.className}>{b.label}</span>; })()}</td>
                <td className="px-2 sm:px-4 py-2 text-center hidden lg:table-cell">
                  {a.expired_month ? (
                    <span className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900/30 px-2 py-1 text-xs font-medium text-blue-800 dark:text-blue-300">
                      {a.expired_month} oy
                    </span>
                  ) : (
                    <span className="text-gray-400 dark:text-gray-500">-</span>
                  )}
                </td>
                <td className="px-2 sm:px-4 py-2 text-center text-xs sm:text-sm hidden xl:table-cell">{formatDate24Hour(a.createdAt)}</td>
              </tr>
              );
            })}
            {pageData.length === 0 && (
              <tr>
                <td colSpan={11} className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                  Hech qanday natija topilmadi
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Detail Modal - Same as original */}
      <DetailModal
        title={selected ? `Ariza #${selected.id}` : "Ariza tafsilotlari"}
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
          <div className="space-y-3">
            <div className="flex justify-end -mt-2 mb-2">
              <button
                onClick={() => {
                  const copyText = generateCopyText(selected);
                  navigator.clipboard.writeText(copyText).then(() => {
                    setToastMessage("Ma'lumotlar nusxalandi!");
                    setToastType('success');
                    setToastOpen(true);
                  }).catch(() => {
                    setToastMessage("Nusxalashda xatolik yuz berdi");
                    setToastType('error');
                    setToastOpen(true);
                  });
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 dark:bg-brand-600 dark:hover:bg-brand-700 text-white transition-all duration-200 text-sm font-medium shadow-md hover:shadow-lg"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4" strokeWidth="2.5">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Nusxalash
              </button>
            </div>
            
            <div>
              <strong className="text-gray-900 dark:text-white block mb-2">Ariza beruvchi:</strong>
              <AvatarName
                image={(selected as any).image ?? null}
                name={selected.fullname}
                subtitle={selected.passport ?? undefined}
                size="md"
              />
            </div>
            <div><strong className="text-gray-900 dark:text-white">Telefon:</strong> <span className="text-gray-700 dark:text-gray-300">{formatPhone(selected.phone)}</span></div>
            <div><strong className="text-gray-900 dark:text-white">Tovarlar summasi:</strong> <span className="text-gray-700 dark:text-gray-300">{formatMoney(selected.amount)}</span></div>
            <div><strong className="text-gray-900 dark:text-white">To'lov summasi:</strong> <span className="font-semibold text-brand-500 dark:text-brand-400">{formatMoney(selected.payment_amount || selected.amount)}</span></div>
            <div><strong className="text-gray-900 dark:text-white">To'lov:</strong> {selected.paid ? <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/30 px-2 py-1 text-xs font-medium text-green-800 dark:text-green-300">To'landi</span> : <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-1 text-xs font-medium text-gray-800 dark:text-gray-300">To'lanmadi</span>}</div>
            <div><strong className="text-gray-900 dark:text-white">Filial:</strong> <span className="text-gray-700 dark:text-gray-300">{selected.fillial?.name ?? "-"}</span></div>
            
            {(selected as any).request?.orderid && (
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5 text-blue-600" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeLinecap="round" strokeLinejoin="round"/>
                  <polyline points="14 2 14 8 20 8" strokeLinecap="round" strokeLinejoin="round"/>
                  <line x1="16" y1="13" x2="8" y2="13" strokeLinecap="round" strokeLinejoin="round"/>
                  <line x1="16" y1="17" x2="8" y2="17" strokeLinecap="round" strokeLinejoin="round"/>
                  <polyline points="10 9 9 9 8 9" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <strong className="text-gray-900 dark:text-white">Order ID:</strong> 
                <span className="text-blue-600 dark:text-blue-400 font-semibold">#{(selected as any).request.orderid}</span>
              </div>
            )}
            
            {(selected as any).request?.loanid && (
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5 text-blue-600" strokeWidth="2">
                  <rect x="1" y="4" width="22" height="16" rx="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <line x1="1" y1="10" x2="23" y2="10" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <strong className="text-gray-900 dark:text-white">KREDIT ID:</strong> 
                <span className="text-blue-600 dark:text-blue-400 font-semibold">#{(selected as any).request.loanid}</span>
              </div>
            )}
            
            {selected.user && (
              <div className="border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
                <strong className="text-gray-900 dark:text-white block mb-2">Operator ma'lumotlari:</strong>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600 dark:text-gray-400">F.I.O:</span>
                    <span className="font-medium text-blue-700 dark:text-blue-300">{selected.user.fullname}</span>
                  </div>
                  {selected.user.phone && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600 dark:text-gray-400">Telefon:</span>
                      <span className="text-gray-700 dark:text-gray-300">{formatPhone(selected.user.phone)}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600 dark:text-gray-400">ID:</span>
                    <span className="text-gray-700 dark:text-gray-300">#{selected.user.id}</span>
                  </div>
                </div>
              </div>
            )}
            
            {selected.phone2 && (
              <div><strong className="text-gray-900 dark:text-white">Qo'shimcha telefon:</strong> <span className="text-gray-700 dark:text-gray-300">{formatPhone(selected.phone2)}</span></div>
            )}
            {selected.limit && (
              <div><strong className="text-gray-900 dark:text-white">Limit:</strong> <span className="text-gray-700 dark:text-gray-300">{formatMoney(selected.limit)}</span></div>
            )}
            {selected.expired_month && (
              <div><strong className="text-gray-900 dark:text-white">Muddat (oy):</strong> <span className="text-gray-700 dark:text-gray-300">{selected.expired_month}</span></div>
            )}
            {selected.percent && (
              <div><strong className="text-gray-900 dark:text-white">Foiz:</strong> <span className="text-gray-700 dark:text-gray-300">{selected.percent}%</span></div>
            )}
            {selected.createdAt && (
              <div><strong className="text-gray-900 dark:text-white">Yaratilgan sana:</strong> <span className="text-gray-700 dark:text-gray-300">{formatDateNoSeconds(selected.createdAt)}</span></div>
            )}
            {selected.canceled_reason && (
              <div><strong className="text-red-600 dark:text-red-400">Bekor qilish sababi:</strong> <span className="text-red-600 dark:text-red-400">{selected.canceled_reason}</span></div>
            )}
            <div><strong className="text-gray-900 dark:text-white">Holat:</strong> {(() => { const b = appStatusBadge(selected.status); return <span className={b.className}>{b.label}</span>; })()}</div>
            <div>
              <strong className="text-gray-900 dark:text-white">Mahsulotlar:</strong>
              {selected.products && selected.products.length > 0 ? (
                <div className="mt-2 border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-navy-800 p-2">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-gray-500 dark:text-gray-400">
                        <th className="px-2 py-1">Nomi</th>
                        <th className="px-2 py-1">Narxi</th>
                        <th className="px-2 py-1">Soni</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-700 dark:text-gray-300">
                      {selected.products.map((p: any) => (
                        <tr key={p.id} className="border-t border-gray-200 dark:border-gray-600">
                          <td className="px-2 py-1">{p.name}</td>
                          <td className="px-2 py-1">{formatMoney(p.price)}</td>
                          <td className="px-2 py-1">{p.count ?? 1}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">Mahsulot yo'q</span>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500 dark:text-gray-400">
            Ma'lumot topilmadi
          </div>
        )}
      </DetailModal>

      <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">{`${total} dan ${pageData.length} ta ko'rsatilmoqda`}</div>
        <Pagination page={page} totalPages={totalPages} onPageChange={(p) => setPage(p)} />
      </div>
      
      <Toast
        message={toastMessage}
        isOpen={toastOpen}
        onClose={() => setToastOpen(false)}
        type={toastType}
      />
    </div>
  );
};

export default DemoApplications;
