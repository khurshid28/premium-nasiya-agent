import React from "react";
import { Range } from "react-range";
import api from "lib/api";
import Pagination from "components/pagination";
import DetailModal from "components/modal/DetailModalNew";
import AvatarName from "components/AvatarName";
import DateRangePicker from "components/DateRangePicker";
import CustomSelect from "components/dropdown/CustomSelect";
import { formatPhone, formatMoney, appStatusBadge, formatDateNoSeconds, formatDate24Hour } from "lib/formatters";
import { exportSingleTable } from "lib/exportExcel";

// Mapped to your Prisma `Zayavka` model (named Zayavka in Prisma). Adjust names if needed.
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
  status?: string | null; // STATUS enum
  fillial_id?: number;
  bank_id?: number;
  request_id?: string | null;
  createdAt?: string;
  updatedAt?: string | null;
  merchant?: { id: number; name: string } | null;
  fillial?: { id: number; name: string } | null;
  user?: { id: number; fullname: string } | null;
  myid_id?: number | null;
  paid?: boolean | null;
  fcmToken?: string | null;
  products?: { id: number; name: string; price: number; count?: number | null }[];
};



const Applications = (): JSX.Element => {
  const [applications, setApplications] = React.useState<Application[]>([]);
  const [fillialsList, setFillialsList] = React.useState<any[]>([]);
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
  
  // Client-side pagination state
  const [page, setPage] = React.useState<number>(1);
  const [pageSize, setPageSize] = React.useState<number>(10);
  
  const SLIDER_MIN = 0;
  const SLIDER_MAX = 50000000; // 50 million UZS
  const SLIDER_STEP = 10000;

  const statuses = React.useMemo(() => {
    return [
      { value: "all", label: "Barcha holatlar" },
      { value: "CONFIRMED", label: "Tugatilgan" },
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
    const abortController = new AbortController();
    
    // Add delay to prevent rapid navigation issues
    const timeoutId = setTimeout(async () => {
      if (!mounted || abortController.signal.aborted) return;
      
      try {
        console.log('Fetching applications from API...');
        const [appsRes, fillialsRes] = await Promise.all([
          api.listApplications({}),
          api.listFillials({})
        ]);
        
        if (!mounted || abortController.signal.aborted) return;
        
        console.log('Applications response:', appsRes);
        const apps = appsRes?.items || [];
        console.log('Applications count:', apps.length);
        if (apps.length > 0) {
          const statuses = apps.map((a: any) => a.status);
          console.log('Application statuses:', statuses);
          const uniqueStatuses = [...new Set(statuses)];
          console.log('Unique statuses:', uniqueStatuses);
        }
        setApplications(apps);
        
        console.log('Fillials for applications:', fillialsRes);
        setFillialsList(fillialsRes?.items || []);
      } catch (err: any) {
        if (!mounted || abortController.signal.aborted) return;
        if (err.name === 'AbortError') return;
        
        console.error("Error fetching data:", err);
        console.error("Error details:", {
          message: err.message,
          status: err.status,
          body: err.body
        });
        setApplications([]);
        setFillialsList([]);
      }
    }, 150);
    
    return () => {
      mounted = false;
      abortController.abort();
      clearTimeout(timeoutId);
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
      
      // Status filter with category matching
      let matchesStatus = true;
      if (statusFilter !== "all") {
        const st = (a.status ?? "").toUpperCase();
        if (statusFilter === "CONFIRMED") {
          // Tugatilgan: CONFIRMED, FINISHED, COMPLETED, ACTIVE
          matchesStatus = st === "CONFIRMED" || st === "FINISHED" || st === "COMPLETED" || st === "ACTIVE";
        } else if (statusFilter === "REJECTED") {
          // Rad qilingan: all CANCELED_ statuses, REJECTED, SCORING
          matchesStatus = st.includes("CANCELED") || st === "SCORING RAD ETDI" || st === "DAILY RAD ETDI" || st === "REJECTED" || st.includes("RAD") || st.includes("SCORING");
        } else if (statusFilter === "LIMIT") {
          // Limit: LIMIT statuses
          matchesStatus = st === "LIMIT" || st.includes("LIMIT");
        } else if (statusFilter === "PENDING") {
          // Kutilmoqda: CREATED, ADDED_DETAIL, WAITING_, etc (excluding LIMIT and others)
          matchesStatus = st === "CREATED" || st === "ADDED_DETAIL" || st.includes("WAITING") || st === "ADDED_PRODUCT" || st === "PENDING" || 
                         (!st.includes("CANCELED") && st !== "CONFIRMED" && st !== "FINISHED" && st !== "COMPLETED" && st !== "ACTIVE" && 
                          st !== "REJECTED" && st !== "LIMIT" && !st.includes("RAD"));
        } else {
          matchesStatus = a.status === statusFilter;
        }
      }
      
  const matchesPaid = paidFilter === "all" || (paidFilter === "paid" ? a.paid === true : a.paid === false || a.paid == null);
      const matchesFillial = fillialFilter === "all" || a.fillial_id === Number(fillialFilter);
      // region may be stored on the fillial object; lookup in fillialsList
      const fillials = Array.isArray(fillialsList) ? fillialsList : [];
      const fillialObj = fillials.find((f) => f.id === (a.fillial?.id ?? a.fillial_id));
      const fillialRegion = fillialObj?.region ?? (a.fillial && (a.fillial as any).region) ?? null;
      const matchesRegion = regionFilter === "all" || (!fillialRegion && regionFilter === "all") || fillialRegion === regionFilter;
      const matchesExpiredMonth = expiredMonthFilter === "all" || (a.expired_month && a.expired_month === String(expiredMonthFilter));
  const matchesMinAmount = (a.amount ?? 0) >= amountRange[0];
  const matchesMaxAmount = (a.amount ?? 0) <= amountRange[1];

      if (!matchesSearch || !matchesStatus || !matchesPaid || !matchesFillial || !matchesRegion || !matchesExpiredMonth || !matchesMinAmount || !matchesMaxAmount) return false;

      if ((start || end) && a.createdAt) {
        const created = new Date(a.createdAt);
        if (start && created < start) return false;
        if (end && created > end) return false;
      }

      return true;
    });
  }, [applications, search, statusFilter, startDate, endDate, paidFilter, fillialFilter, regionFilter, expiredMonthFilter, amountRange, fillialsList]);

  const stats = React.useMemo(() => {
    const items = filtered;
    const totalCount = items.length;
    // For amount stats include CONFIRMED or FINISHED applications
    const approvedItems = items.filter((a) => a.status === "CONFIRMED" || a.status === "FINISHED");
    const approvedAmount = approvedItems.reduce((s, a) => s + (a.amount ?? 0), 0);
    const approvedPaidAmount = approvedItems.filter((a) => a.paid).reduce((s, a) => s + (a.amount ?? 0), 0);
    const approvedUnpaidAmount = approvedAmount - approvedPaidAmount;
    return { totalCount, approvedAmount, approvedPaidAmount, approvedUnpaidAmount };
  }, [filtered]);

  // Client-side pagination
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  
  // Reset to page 1 when filters change
  React.useEffect(() => {
    setPage(1);
  }, [search, statusFilter, paidFilter, fillialFilter, regionFilter, expiredMonthFilter, amountRange, startDate, endDate]);

  // Slice data for current page
  const pageData = React.useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  return (
    <div>
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-navy-800 p-3">
          <div className="text-sm text-gray-500 dark:text-gray-400">Jami arizalar</div>
          <div className="text-lg font-semibold dark:text-white">{stats.totalCount}</div>
        </div>
        <div className="rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-navy-800 p-3">
          <div className="text-sm text-gray-500 dark:text-gray-400">Tasdiqlangan jami</div>
          <div className="text-lg font-semibold dark:text-white">{formatMoney(stats.approvedAmount)}</div>
        </div>
        <div className="rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-navy-800 p-3">
          <div className="text-sm text-gray-500 dark:text-gray-400">To'landi / To'lanmadi (tasdiqlangan)</div>
          <div className="text-lg font-semibold dark:text-white">{formatMoney(stats.approvedPaidAmount)} / {formatMoney(stats.approvedUnpaidAmount)}</div>
        </div>
      </div>
      <div className="flex items-center justify-start">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-11 rounded-xl border border-gray-200 dark:border-navy-600 bg-white dark:bg-navy-700 px-4 pl-10 w-80 md:w-96 text-sm font-medium text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 shadow-sm hover:shadow-md hover:border-brand-500 dark:hover:border-brand-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              placeholder="Ism yoki telefon raqam bo'yicha qidirish"
              title="Ism yoki telefon raqam bo'yicha qidirish"
              aria-label="Ism yoki telefon raqam bo'yicha qidirish"
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
            <DateRangePicker startDate={startDate} endDate={endDate} onStartChange={setStartDate} onEndChange={setEndDate} />
          <CustomSelect
            value={statusFilter}
            onChange={setStatusFilter}
            options={statuses}
            className="min-w-[140px]"
          />
          <CustomSelect
            value={paidFilter}
            onChange={setPaidFilter}
            options={[
              { value: "all", label: "Barcha to'lovlar" },
              { value: "paid", label: "To'landi" },
              { value: "unpaid", label: "To'lanmadi" }
            ]}
            className="min-w-[130px]"
          />

          <CustomSelect
            value={String(fillialFilter)}
            onChange={(value) => setFillialFilter(value === "all" ? "all" : Number(value))}
            options={[
              { value: "all", label: "Barcha filiallar" },
              ...(Array.isArray(fillialsList) ? fillialsList : []).map(f => ({ value: String(f.id), label: f.name }))
            ]}
            className="min-w-[150px]"
          />
        </div>
      </div>

      {/* Row 2: Regions + Page size and export controls */}
      <div className="mt-4 flex items-center justify-start gap-3">
        <CustomSelect
          value={regionFilter}
          onChange={setRegionFilter}
          options={regions.map(r => ({ 
            value: r, 
            label: r === "all" ? "Barcha hududlar" : r 
          }))}
          className="min-w-[140px]"
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
          className="min-w-[120px]"
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
          className="min-w-[120px]"
        />
        
        <button
          onClick={async () => {
            const dateLabel = startDate || endDate ? `${startDate || "-"} — ${endDate || "-"}` : "All dates";
            const apps = filtered.map((a) => ({
              ID: a.id,
              Fullname: a.fullname,
              Phone: a.phone ?? "",
              Amount: a.amount ?? 0,
              Status: a.status ?? "",
              Fillial: a.fillial?.name ?? "",
              Created: formatDateNoSeconds(a.createdAt) ?? "",
            }));
            exportSingleTable({ rows: apps, title: "Applications", dateLabel });
          }}
          className="h-10 rounded bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 px-3 text-white"
        >
          Arizalarni Eksport Qilish
        </button>
      </div>

      {/* Row 3: Slider on its own line with 1/4 width */}
      <div className="mt-4">
        <div className="w-full md:w-1/4 px-2">
          {/* Numeric min/max inputs hidden when slider is available for a cleaner UI */}
          <Range
            values={amountRange}
            step={SLIDER_STEP}
            min={SLIDER_MIN}
            max={SLIDER_MAX}
            onChange={(vals) => {
              // ensure proper ordering
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
            {formatMoney(amountRange[0])} — {formatMoney(amountRange[1])}
          </div>
        </div>
      </div>

      <div className="mt-2 overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-600">
        <table className="w-full table-auto min-w-[640px]">
          <thead className="bg-gray-50 dark:bg-navy-800 text-left text-sm text-gray-600 dark:text-gray-300">
            <tr>
              {statusFilter === "approved" ? (
                <>
                  <th className="px-4 py-3">Tovarlar</th>
                  <th className="px-4 py-3">To'lov summasi</th>
                  <th className="px-4 py-3">Hujjat</th>
                  <th className="px-4 py-3">Muddati</th>
                  <th className="px-4 py-3">Yaratildi</th>
                </>
              ) : (
                <>
                  <th className="px-4 py-3 text-center">ID</th>
                  <th className="px-4 py-3">Ariza beruvchi</th>
                  <th className="px-4 py-3 text-center">Telefon</th>
                  <th className="px-4 py-3 text-center">Mahsulotlar</th>
                  <th className="px-4 py-3 text-center">Tovarlar</th>
                  <th className="px-4 py-3 text-center">To'lov summasi</th>
                  <th className="px-4 py-3 text-center">To'lov</th>
                  <th className="px-4 py-3 text-center">Filial</th>
                  <th className="px-4 py-3 text-center">Hujjat</th>
                  <th className="px-4 py-3 text-center">Holat</th>
                  <th className="px-4 py-3 text-center">Muddati</th>
                  <th className="px-4 py-3 text-center">Yaratildi</th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-navy-800">
            {pageData.map((a) => (
              <tr
                key={a.id}
                className="border-t border-gray-200 dark:border-gray-600 cursor-pointer hover:bg-gray-50 dark:hover:bg-navy-700"
                onClick={() => {
                  setSelected(a);
                  setOpen(true);
                }}
              >
                {statusFilter === "approved" ? (
                  <>
                    <td className="px-4 py-2">{formatMoney(a.amount)}</td>
                    <td className="px-4 py-2 font-semibold text-brand-500 dark:text-brand-400">{formatMoney(a.payment_amount || a.amount)}</td>
                    <td className="px-4 py-2">
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            const blob = await (api as any).getApplicationDocument(a.id, "pdf");
                            const url = URL.createObjectURL(blob);
                            const link = document.createElement("a");
                            link.href = url;
                            link.download = `application_${a.id}.pdf`;
                            document.body.appendChild(link);
                            link.click();
                            link.remove();
                            URL.revokeObjectURL(url);
                          } catch (err) {
                            console.error(err);
                            alert("Hujjatni yuklab olishda xatolik yuz berdi");
                          }
                        }}
                        className="inline-flex items-center gap-2 rounded border border-gray-300 dark:border-gray-600 px-2 py-1 text-sm hover:bg-gray-100 dark:hover:bg-navy-700 dark:text-gray-300"
                        title="Hujjatni yuklab olish"
                        type="button"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          <polyline points="7 10 12 15 17 10" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          <line x1="12" y1="15" x2="12" y2="3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span className="hidden sm:inline">Yuklab olish</span>
                      </button>
                    </td>
                    <td className="px-4 py-2">
                      {a.expired_month ? (
                        <span className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900/30 px-2 py-1 text-xs font-medium text-blue-800 dark:text-blue-300">
                          {a.expired_month} oy
                        </span>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-4 py-2">{formatDate24Hour(a.createdAt)}</td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-2 text-center">{a.id}</td>
                    <td className="px-4 py-2">
                      <AvatarName
                        image={(a.user as any)?.image ?? null}
                        name={a.fullname}
                        subtitle={a.passport ?? undefined}
                        size="md"
                      />
                    </td>
                    <td className="px-4 py-2 text-center">{formatPhone(a.phone)}</td>
                    <td className="px-4 py-2 text-center">{a.products ? a.products.length : 0}</td>
                    <td className="px-4 py-2 text-center">{formatMoney(a.amount)}</td>
                    <td className="px-4 py-2 text-center font-semibold text-brand-500 dark:text-brand-400">{formatMoney(a.payment_amount || a.amount)}</td>
                    <td className="px-4 py-2 text-center">{a.paid ? <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/30 px-2 py-1 text-xs font-medium text-green-800 dark:text-green-300">To'landi</span> : <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-1 text-xs font-medium text-gray-800 dark:text-gray-300">To'lanmadi</span>}</td>
                    <td className="px-4 py-2 text-center">{a.fillial?.name ?? "-"}</td>
                    <td className="px-4 py-2 text-center">
                      {a.status === "APPROVED" ? (
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            try {
                              const blob = await (api as any).getApplicationDocument(a.id, "pdf");
                              const url = URL.createObjectURL(blob);
                              const link = document.createElement("a");
                              link.href = url;
                              link.download = `application_${a.id}.pdf`;
                              document.body.appendChild(link);
                              link.click();
                              link.remove();
                              URL.revokeObjectURL(url);
                            } catch (err) {
                              console.error(err);
                              alert("Hujjatni yuklab olishda xatolik yuz berdi");
                            }
                          }}
                          className="inline-flex items-center gap-2 rounded border border-gray-300 dark:border-gray-600 px-2 py-1 text-sm hover:bg-gray-100 dark:hover:bg-navy-700 dark:text-gray-300"
                          title="Hujjatni yuklab olish"
                          type="button"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            <polyline points="7 10 12 15 17 10" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            <line x1="12" y1="15" x2="12" y2="3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <span className="hidden sm:inline">Yuklab olish</span>
                        </button>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-center">{(() => { const b = appStatusBadge(a.status); return <span className={b.className}>{b.label}</span>; })()}</td>
                    <td className="px-4 py-2 text-center">
                      {a.expired_month ? (
                        <span className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900/30 px-2 py-1 text-xs font-medium text-blue-800 dark:text-blue-300">
                          {a.expired_month} oy
                        </span>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-center">{formatDate24Hour(a.createdAt)}</td>
                  </>
                )}
              </tr>
            ))}
            <DetailModal
              title={selected ? `Ariza #${selected.id}` : "Ariza tafsilotlari"}
              isOpen={open}
              onClose={() => {
                setOpen(false);
                setSelected(null);
              }}
            >
              {selected ? (
                <div className="space-y-3">
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
                  {selected.user && (
                    <>
                      <div>
                        <strong className="text-gray-900 dark:text-white block mb-2">Operator:</strong>
                        <AvatarName
                          image={(selected.user as any).image ?? null}
                          name={selected.user.fullname}
                          subtitle={`ID: ${selected.user.id}`}
                          size="sm"
                        />
                      </div>
                      {(selected.user as any).phone && (
                        <div><strong className="text-gray-900 dark:text-white">Operator telefoni:</strong> <span className="text-gray-700 dark:text-gray-300">{formatPhone((selected.user as any).phone)}</span></div>
                      )}
                    </>
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
              ) : null}
            </DetailModal>
            {pageData.length === 0 && (
              <tr>
                <td colSpan={statusFilter === "approved" ? 4 : 11} className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                  Hech qanday natija topilmadi
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-gray-600 dark:text-gray-400">{`${total} dan ${pageData.length} ta ko'rsatilmoqda`}</div>
        <Pagination page={page} totalPages={totalPages} onPageChange={(p) => setPage(p)} />
      </div>
    </div>
  );
};

export default Applications;
