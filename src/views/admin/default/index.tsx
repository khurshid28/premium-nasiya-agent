import React from "react";
import { useLocation } from "react-router-dom";
import apiReal from "lib/api";
import demoApi from "lib/demoApi";
import DateRangePicker from "components/DateRangePicker";
import CustomSelect from "components/dropdown/CustomSelect";
// formatShortMoney removed (unused in this view)
import TotalSpent from "./components/TotalSpent";
import WeeklyRevenue from "./components/WeeklyRevenue";
import PieChartCard from "./components/PieChartCard";
import DailyTraffic from "./components/DailyTraffic";
import ErrorBoundary from "components/ErrorBoundary";
import Widget from "components/widget/Widget";
import { MdBarChart, MdDashboard } from "react-icons/md";
import { IoDocuments } from "react-icons/io5";
import { IoMdHome } from "react-icons/io";
import { isApproved, isPending } from "lib/formatters";

const Dashboard = (): JSX.Element => {
  const location = useLocation();
  const api = React.useMemo(() => {
    const isDemo = location.pathname.startsWith('/demo');
    return isDemo ? demoApi : apiReal;
  }, [location.pathname]);
  
  const [fillials, setFillials] = React.useState<any[]>([]);
  const [usersCount, setUsersCount] = React.useState<number>(0);
  const [applicationsCount, setApplicationsCount] = React.useState<number>(0);
  const [approvedAmount, setApprovedAmount] = React.useState<number>(0);
  const [pendingCount, setPendingCount] = React.useState<number>(0);
  const [totalProducts, setTotalProducts] = React.useState<number>(0);
  const [activeFilialsCount, setActiveFilialsCount] = React.useState<number>(0);
  const [search, setSearch] = React.useState("");
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");
  const [selectedFillialId, setSelectedFillialId] = React.useState<number | "all">("all");
  const [selectedRegion, setSelectedRegion] = React.useState<string>("all");
  const [selectedExpiredMonth, setSelectedExpiredMonth] = React.useState<number | "all">("all");
  // charts removed: barData, pieData, lineData
  // pagination state for fillial cards removed

  React.useEffect(() => {
    let mounted = true;
    const controller = new AbortController();
    
    api.listFillials({ page: 1, pageSize: 100 })
      .then((res) => { 
        if (!mounted) return; 
        setFillials(res?.items || []); 
      })
      .catch((err) => {
        if (!mounted || err.name === 'AbortError') return;
        console.error("Failed to load fillials:", err);
        setFillials([]);
      });
    
    return () => { 
      mounted = false; 
      controller.abort();
    };
  }, [api]);

  // fetch global counts for dashboard widgets with filters applied
  React.useEffect(() => {
    let mounted = true;
    const abortController = new AbortController();
    
    // Add debounce to prevent rapid successive calls
    const fetchData = async () => {
      if (!mounted || abortController.signal.aborted) return;
      
      try {
        const [apps, users] = await Promise.all([
          api.listApplications({ page: 1, pageSize: 10000 }),
          api.listUsers({ page: 1, pageSize: 10000 })
        ]);
        
        if (!mounted || abortController.signal.aborted) return;

        // Apply filters to applications
        let filteredApps = apps?.items || [];
        
        // Ensure fillials is an array for filtering
        const fillialsList = Array.isArray(fillials) ? fillials : [];

        // Filter by date range
        if (startDate && endDate) {
          const start = new Date(startDate);
          const end = new Date(endDate);
          filteredApps = filteredApps.filter((a: any) => {
            if (!a.createdAt) return false;
            const appDate = new Date(a.createdAt);
            return appDate >= start && appDate <= end;
          });
        }

        // Filter by fillial
        if (selectedFillialId !== "all") {
          filteredApps = filteredApps.filter((a: any) => a.fillial_id === selectedFillialId);
        } else if (selectedRegion !== "all") {
          // Filter by region if no specific fillial is selected
          const regionFillials = fillialsList.filter(f => f.region === selectedRegion);
          const regionFillialIds = regionFillials.map(f => f.id);
          filteredApps = filteredApps.filter((a: any) => regionFillialIds.includes(a.fillial_id));
        }

        // Filter by search (search in fillial names)
        if (search.trim()) {
          const searchLower = search.toLowerCase();
          const matchingFillials = fillialsList.filter(f => 
            f.name?.toLowerCase().includes(searchLower) || 
            f.address?.toLowerCase().includes(searchLower)
          );
          const matchingFillialIds = matchingFillials.map(f => f.id);
          filteredApps = filteredApps.filter((a: any) => matchingFillialIds.includes(a.fillial_id));
        }

        // Filter by expired month
        if (selectedExpiredMonth !== "all") {
          console.log(`DEBUG: Filtering by expired month: ${selectedExpiredMonth}`);
          console.log(`DEBUG: Before month filter: ${filteredApps.length} apps`);
          // Log first few apps' expired_month values for debugging
          const sampleApps = filteredApps.slice(0, 5);
          console.log(`DEBUG: Sample expired_month values:`, sampleApps.map(a => ({ id: a.id, expired_month: a.expired_month })));
          const monthlyApps = filteredApps.filter((a: any) => a.expired_month && a.expired_month === String(selectedExpiredMonth));
          console.log(`DEBUG: After month filter: ${monthlyApps.length} apps`);
          filteredApps = monthlyApps;
        } else {
          console.log(`DEBUG: No month filter applied, ${filteredApps.length} apps`);
        }

        // Filter users by fillial
        let filteredUsers = users?.items || [];
        if (selectedFillialId !== "all") {
          filteredUsers = filteredUsers.filter((u: any) => u.fillial_id === selectedFillialId);
        } else if (selectedRegion !== "all") {
          const regionFillials = fillialsList.filter(f => f.region === selectedRegion);
          const regionFillialIds = regionFillials.map(f => f.id);
          filteredUsers = filteredUsers.filter((u: any) => regionFillialIds.includes(u.fillial_id));
        }
        if (search.trim()) {
          const searchLower = search.toLowerCase();
          const matchingFillials = fillialsList.filter(f => 
            f.name?.toLowerCase().includes(searchLower) || 
            f.address?.toLowerCase().includes(searchLower)
          );
          const matchingFillialIds = matchingFillials.map(f => f.id);
          filteredUsers = filteredUsers.filter((u: any) => matchingFillialIds.includes(u.fillial_id));
        }

        // Filter fillials for count
        let filteredFillials = fillialsList;
        if (selectedRegion !== "all") {
          filteredFillials = filteredFillials.filter(f => f.region === selectedRegion);
        }
        if (search.trim()) {
          const searchLower = search.toLowerCase();
          filteredFillials = filteredFillials.filter(f => 
            f.name?.toLowerCase().includes(searchLower) || 
            f.address?.toLowerCase().includes(searchLower)
          );
        }
        if (selectedFillialId !== "all") {
          filteredFillials = filteredFillials.filter(f => f.id === selectedFillialId);
        }

        // Calculate stats from filtered data
        setApplicationsCount(filteredApps.length);
        setUsersCount(filteredUsers.length);
        setActiveFilialsCount(filteredFillials.length);
        
        // Calculate approved amount from FINISHED apps only
        const approved = filteredApps.filter((a: any) => isApproved(a.status));
        setApprovedAmount(approved.reduce((s: any, a: any) => s + (a.amount ?? 0), 0));
        
        // Pending are apps that are not approved, not confirmed, not rejected, not limit
        const pending = filteredApps.filter((a: any) => isPending(a.status));
        setPendingCount(pending.length);
        
        // compute total products across filtered applications
        const prodCount = filteredApps.reduce((acc: any, a: any) => {
          if (Array.isArray(a.products)) return acc + a.products.reduce((s: any, p: any) => s + (p.count ?? 1), 0);
          return acc;
        }, 0);
        setTotalProducts(prodCount);

      } catch (e: any) {
        if (!mounted || abortController.signal.aborted) return;
        if (e.name === 'AbortError') return;
        console.error("Error loading dashboard data:", e);
      }
    };
    
    const timeoutId = setTimeout(fetchData, 100);
    
    return () => { 
      mounted = false; 
      abortController.abort();
      clearTimeout(timeoutId);
    };
  }, [api, startDate, endDate, selectedFillialId, selectedRegion, search, fillials, selectedExpiredMonth]);

  // metrics are provided by the reusable dashboard components in ./components

  // aggregation/useEffect for charts removed

  // prettier chart options
  // chart option constants removed

  // filteredFillials and usersByFillial removed - fillial list cards are hidden per request

  // (previously computed stats were displayed in a different layout; kept data in state for future cards)

  const regions = React.useMemo(() => {
    const s = new Set<string>();
    if (fillials && Array.isArray(fillials)) {
      fillials.forEach((f) => { if (f.region) s.add(f.region); });
    }
    return ["all", ...Array.from(s)];
  }, [fillials]);

  const expiredMonths = React.useMemo(() => {
    // Only 3, 6, 9, 12 months allowed
    return ["all", 3, 6, 9, 12];
  }, []);

  return (
    <div>
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold dark:text-white">Admin</h2>
            <div className="text-sm text-gray-500 dark:text-gray-300">Asosiy ko'rsatkichlar va tizim holati</div>
          </div>
        </div>
        
        {/* Filters - Multiple rows */}
        <div className="space-y-3">
          {/* Row 1: Search only */}
          <div className="relative w-full sm:w-80 lg:w-96">
            <input 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              placeholder="Filial yoki manzil bo'yicha qidirish" 
              className="h-11 rounded-xl border border-gray-200 dark:border-navy-600 bg-white dark:bg-navy-700 px-4 pl-10 w-full text-sm font-medium text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 shadow-sm hover:shadow-md hover:border-brand-500 dark:hover:border-brand-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          
          {/* Row 2: Date Picker only */}
          <DateRangePicker startDate={startDate} endDate={endDate} onStartChange={setStartDate} onEndChange={setEndDate} />
          
          {/* Row 3: All Filters and Refresh button */}
          <div className="flex flex-wrap items-center gap-2">
            <CustomSelect
              value={selectedRegion}
              onChange={(value) => { setSelectedRegion(value); setSelectedFillialId("all"); }}
              options={regions.map(r => ({ 
                value: r, 
                label: r === "all" ? "Barcha hududlar" : r 
              }))}
              className="w-full sm:w-auto sm:min-w-[160px]"
            />
            <CustomSelect
              value={String(selectedFillialId)}
              onChange={(value) => { setSelectedFillialId(value === "all" ? "all" : Number(value)); }}
              options={[
                { value: "all", label: "Barcha filiallar" },
                ...(Array.isArray(fillials) ? fillials : []).filter((f) => selectedRegion === "all" || f.region === selectedRegion).map((f) => ({ 
                  value: String(f.id), 
                  label: f.name 
                }))
              ]}
              className="w-full sm:w-auto sm:min-w-[160px]"
            />
            <CustomSelect
              value={String(selectedExpiredMonth)}
              onChange={(value) => { setSelectedExpiredMonth(value === "all" ? "all" : Number(value)); }}
              options={expiredMonths.map(m => ({ 
                value: String(m), 
                label: m === "all" ? "Barcha muddatlar" : `${m} oy` 
              }))}
              className="w-full sm:w-auto sm:min-w-[160px]"
            />
            
            <button
              onClick={() => window.location.reload()}
              className="flex-shrink-0 h-11 rounded-xl bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 px-3 sm:px-4 text-white inline-flex items-center justify-center gap-2 text-sm whitespace-nowrap transition-all duration-200 active:scale-95"
              title="Sahifani yangilash"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4">
                <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="hidden sm:inline">Yangilash</span>
            </button>
          </div>
        </div>
      </div>

      {/* Widget grid (top) */}
    <div className="mt-3 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-3 3xl:grid-cols-6">
    <Widget icon={<MdBarChart className="h-7 w-7" />} title={"Jami arizalar"} subtitle={String(applicationsCount || 0)} />
    <Widget icon={<IoDocuments className="h-6 w-6" />} title={"Tasdiqlangan summa"} subtitle={`${(approvedAmount || 0).toLocaleString()} UZS`} />
    <Widget icon={<MdBarChart className="h-7 w-7" />} title={"Jami operatorlar"} subtitle={String(usersCount || 0)} />
    <Widget icon={<MdDashboard className="h-6 w-6" />} title={"Faol filiallar"} subtitle={String(activeFilialsCount || 0)} />
    <Widget icon={<MdBarChart className="h-7 w-7" />} title={"Kutilayotgan arizalar"} subtitle={String(pendingCount || 0)} />
    <Widget icon={<IoMdHome className="h-6 w-6" />} title={"Jami mahsulotlar"} subtitle={String(totalProducts || 0)} />
  </div>

      {/* Top template cards - Date filter NOT applied to charts */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 items-stretch auto-rows-min">
        <ErrorBoundary>
          <TotalSpent 
            startDate="" 
            endDate="" 
            fillialId={selectedFillialId} 
            region={selectedRegion}
            search={search}
            fillials={fillials}
            expiredMonth={selectedExpiredMonth}
          />
        </ErrorBoundary>

        <ErrorBoundary>
          <WeeklyRevenue 
            startDate="" 
            endDate="" 
            fillialId={selectedFillialId} 
            region={selectedRegion}
            search={search}
            fillials={fillials}
            expiredMonth={selectedExpiredMonth}
          />
        </ErrorBoundary>

        <ErrorBoundary>
          <PieChartCard 
            startDate="" 
            endDate="" 
            fillialId={selectedFillialId} 
            region={selectedRegion}
            search={search}
            fillials={fillials}
            expiredMonth={selectedExpiredMonth}
          />
        </ErrorBoundary>

        <ErrorBoundary>
          <DailyTraffic 
            startDate="" 
            endDate="" 
            fillialId={selectedFillialId} 
            region={selectedRegion}
            search={search}
            fillials={fillials}
            expiredMonth={selectedExpiredMonth}
          />
        </ErrorBoundary>
      </div>

      {/* small stat cards removed (duplicate / copyable cards) */}

      {/* Charts and task row removed per request (Applications by Fillial, Status distribution, Applications over time, Tasks) */}

      {/* Fillial cards removed per request */}
    </div>
  );
};

export default Dashboard;
