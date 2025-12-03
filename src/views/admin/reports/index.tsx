import React, { useState, useEffect } from "react";
import Card from "components/card";
import { useLocation } from "react-router-dom";
import apiReal from "lib/api";
import demoApi from "lib/demoApi";
import { formatMoney } from "lib/formatters";
import { MdCalendarMonth, MdAttachMoney, MdCheckCircle, MdShoppingCart } from "react-icons/md";
import Pagination from "components/pagination";
import CustomSelect from "components/dropdown/CustomSelect";
import { exportSingleTable } from "lib/exportExcel";

interface MonthlyReport {
  month: string;
  year: number;
  totalProfit: number;
  completedApplications: number;
  totalProducts: number;
  totalProductsAmount: number;
  displayDate: string;
}

const ReportsPage = () => {
  const location = useLocation();
  const api = React.useMemo(() => {
    const isDemo = location.pathname.startsWith('/demo');
    return isDemo ? demoApi : apiReal;
  }, [location.pathname]);

  const [reports, setReports] = useState<MonthlyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [fillialFilter, setFillialFilter] = useState<string>("all");
  const [fillials, setFillials] = useState<any[]>([]);
  const [merchants, setMerchants] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [selectedMerchantId, setSelectedMerchantId] = useState<number | "all">("all");
  const [selectedAgentId, setSelectedAgentId] = useState<number | "all">("all");

  useEffect(() => {
    loadFillials();
  }, [api]);

  const loadFillials = async () => {
    try {
      const [filialsRes, merchantsRes, agentsRes] = await Promise.all([
        api.listFillials({ page: 1, pageSize: 1000 }),
        (api as any).listMerchants({ page: 1, pageSize: 100 }),
        (api as any).listAgents({ page: 1, pageSize: 100 })
      ]);
      setFillials(filialsRes?.items || []);
      setMerchants(merchantsRes?.items || []);
      setAgents(agentsRes?.items || []);
    } catch (error) {
      console.error("Error loading data:", error);
      setFillials([]);
      setMerchants([]);
      setAgents([]);
    }
  };

  const loadReports = async () => {
    try {
      setLoading(true);
      const response = await api.listApplications({ page: 1, pageSize: 10000 });
      const applications = response?.items || [];

      // Group by month
      const monthlyData: { [key: string]: MonthlyReport } = {};

      applications.forEach((app: any) => {
        if (!app.createdAt) return;

        // Filter by merchant if selected (through fillial)
        if (selectedMerchantId !== "all") {
          const appFillialId = app.fillial?.id || app.fillialId;
          const fillialObj = fillials.find(f => f.id === appFillialId);
          if (!fillialObj || fillialObj.merchant_id !== Number(selectedMerchantId)) {
            return;
          }
        }

        // Filter by agent if selected (through fillial)
        if (selectedAgentId !== "all") {
          const agent = agents.find((a: any) => a.id === Number(selectedAgentId));
          if (agent && agent.fillials) {
            const agentFillialIds = agent.fillials.map((f: any) => f.id);
            const appFillialId = app.fillial?.id || app.fillialId;
            if (!agentFillialIds.includes(appFillialId)) {
              return;
            }
          } else {
            return;
          }
        }

        // Filter by fillial if selected
        if (fillialFilter !== "all") {
          const appFillialId = app.fillial?.id || app.fillialId;
          if (appFillialId?.toString() !== fillialFilter) {
            return;
          }
        }

        const date = new Date(app.createdAt);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyData[monthKey]) {
          const monthNames = ["Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"];
          monthlyData[monthKey] = {
            month: monthNames[date.getMonth()],
            year: date.getFullYear(),
            totalProfit: 0,
            completedApplications: 0,
            totalProducts: 0,
            totalProductsAmount: 0,
            displayDate: `${monthNames[date.getMonth()]} ${date.getFullYear()}`
          };
        }

        // Check if application is completed
        const status = (app.status || "").toUpperCase();
        const isCompleted = status === "FINISHED" || status === "COMPLETED" || status === "ACTIVE";

        if (isCompleted) {
          monthlyData[monthKey].completedApplications += 1;
          const paymentAmount = parseFloat(app.payment_amount) || parseFloat(app.amount) || 0;
          monthlyData[monthKey].totalProfit += paymentAmount;
          
          // Count products and their total amount
          if (app.products && Array.isArray(app.products)) {
            monthlyData[monthKey].totalProducts += app.products.length;
            // Sum up all product prices
            const productsSum = app.products.reduce((sum: number, product: any) => {
              return sum + (product.price || 0);
            }, 0);
            monthlyData[monthKey].totalProductsAmount += productsSum;
          }
        }
      });

      // Convert to array and sort by date (newest first)
      const reportsArray = Object.values(monthlyData).sort((a, b) => {
        return b.year - a.year || parseInt(b.month) - parseInt(a.month);
      });

      setReports(reportsArray);
    } catch (error) {
      console.error("Error loading reports:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api, fillialFilter, selectedMerchantId, selectedAgentId]);

  // Get unique years for filter
  const availableYears = Array.from(new Set(reports.map(r => r.year))).sort((a, b) => b - a);

  // Apply filters
  const filteredReports = yearFilter === "all" 
    ? reports 
    : reports.filter(r => r.year === parseInt(yearFilter));

  // Calculate totals based on filtered data
  const totalProfit = filteredReports.reduce((sum, r) => sum + r.totalProfit, 0);
  const totalApplications = filteredReports.reduce((sum, r) => sum + r.completedApplications, 0);
  const totalProducts = filteredReports.reduce((sum, r) => sum + r.totalProducts, 0);
  const totalProductsAmount = filteredReports.reduce((sum, r) => sum + r.totalProductsAmount, 0);

  // Pagination
  const totalPages = Math.ceil(filteredReports.length / pageSize);
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedReports = filteredReports.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-600 dark:text-gray-400">Yuklanmoqda...</div>
      </div>
    );
  }

  const handleExport = () => {
    const rows = filteredReports.map((report) => ({
      "Oy": report.displayDate,
      "Aylanma": report.totalProfit,
      "Tugatilgan Arizalar": report.completedApplications,
      "Sotilgan Tovarlar": report.totalProducts,
      "Tovarlar Summasi": report.totalProductsAmount
    }));

    const fillialName = fillialFilter !== "all" 
      ? fillials.find(f => f.id.toString() === fillialFilter)?.name || ""
      : "Barcha filiallar";
    
    const yearName = yearFilter !== "all" ? yearFilter : "Barcha yillar";
    
    exportSingleTable({ 
      rows, 
      title: `Hisobotlar - ${fillialName} - ${yearName}`,
      dateLabel: new Date().toLocaleString('uz-UZ')
    });
  };

  return (
    <div className="mt-3">
      <div className="mb-4">
        <h2 className="text-xl sm:text-2xl font-semibold text-navy-700 dark:text-white">Oylik Hisobotlar</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Tugatilgan arizalar bo'yicha statistika</p>
      </div>

      {/* Filters and Action Buttons in one row */}
      <div className="flex flex-wrap gap-2 mb-6">
        <CustomSelect
          value={String(selectedMerchantId)}
          onChange={(value) => {
            setSelectedMerchantId(value === "all" ? "all" : Number(value));
            setFillialFilter("all");
            setPage(1);
          }}
          options={[
            { value: "all", label: "Barcha merchantlar" },
            ...(Array.isArray(merchants) ? merchants : []).map((m) => ({ 
              value: String(m.id), 
              label: m.name || `Merchant #${m.id}` 
            }))
          ]}
          className="min-w-[120px] sm:min-w-[180px] flex-1 sm:flex-none"
        />
        <CustomSelect
          value={String(selectedAgentId)}
          onChange={(value) => {
            setSelectedAgentId(value === "all" ? "all" : Number(value));
            setPage(1);
          }}
          options={[
            { value: "all", label: "Barcha agentlar" },
            ...(Array.isArray(agents) ? agents : []).map((a) => ({ 
              value: String(a.id), 
              label: a.fullname || `Agent #${a.id}` 
            }))
          ]}
          className="min-w-[120px] sm:min-w-[180px] flex-1 sm:flex-none"
        />
        <CustomSelect
          value={fillialFilter}
          onChange={(value) => {
            setFillialFilter(value);
            setPage(1);
          }}
          options={[
            { value: "all", label: "Barcha filiallar" },
            ...fillials
              .filter(f => {
                // Merchant filter
                if (selectedMerchantId !== "all" && f.merchant_id !== Number(selectedMerchantId)) {
                  return false;
                }
                // Agent filter
                if (selectedAgentId !== "all") {
                  const agent = agents.find((a: any) => a.id === Number(selectedAgentId));
                  if (agent && agent.fillials && agent.fillials.length > 0) {
                    const agentFillialIds = agent.fillials.map((af: any) => af.id);
                    return agentFillialIds.includes(f.id);
                  }
                  return false;
                }
                return true;
              })
              .map(f => ({ value: f.id.toString(), label: f.name }))
          ]}
          className="min-w-[120px] sm:min-w-[180px] flex-1 sm:flex-none"
        />
        <CustomSelect
          value={yearFilter}
          onChange={setYearFilter}
          options={[
            { value: "all", label: "Barcha yillar" },
            ...availableYears.map(year => ({ value: year.toString(), label: year.toString() }))
          ]}
          className="min-w-[100px] sm:min-w-[150px]"
        />
        <CustomSelect
          value={pageSize.toString()}
          onChange={(value) => {
            setPageSize(parseInt(value));
            setPage(1);
          }}
          options={[
            { value: "5", label: "5 ta" },
            { value: "10", label: "10 ta" },
            { value: "20", label: "20 ta" },
            { value: "50", label: "50 ta" }
          ]}
          className="min-w-[100px] sm:min-w-[120px]"
        />
        <button
          onClick={handleExport}
          disabled={filteredReports.length === 0}
          className="h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 px-3 sm:px-4 text-white inline-flex items-center gap-2 font-medium shadow-sm hover:shadow-md transition-all duration-200 text-sm whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <polyline points="7 10 12 15 17 10" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="12" y1="15" x2="12" y2="3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="hidden sm:inline">Yuklab olish</span>
        </button>
        <button
          onClick={loadReports}
          className="h-11 rounded-xl bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 px-3 sm:px-4 text-white inline-flex items-center gap-2 font-medium shadow-sm hover:shadow-md transition-all duration-200 text-sm whitespace-nowrap"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4">
            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="hidden sm:inline">Yangilash</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        <Card extra="p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/10 border-l-4 border-purple-500">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-purple-500 shadow-lg">
              <MdShoppingCart className="h-8 w-8 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Sotilgan Tovarlar</p>
              <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">
                {totalProducts} ta ({formatMoney(totalProductsAmount)})
              </p>
            </div>
          </div>
        </Card>

        <Card extra="p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/10 border-l-4 border-green-500">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-green-500 shadow-lg">
              <MdAttachMoney className="h-8 w-8 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Jami Aylanma</p>
              <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                {formatMoney(totalProfit)}
              </p>
            </div>
          </div>
        </Card>

        <Card extra="p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/10 border-l-4 border-blue-500">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-500 shadow-lg">
              <MdCheckCircle className="h-8 w-8 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Tugatilgan Arizalar</p>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                {totalApplications} ta
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Monthly Reports Table */}
      <Card extra="p-6">
        <div className="mb-4">
          <h3 className="text-xl font-bold text-navy-700 dark:text-white">Oylik Hisobotlar Jadvali</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {filteredReports.length} ta natija topildi
          </p>
        </div>

        {filteredReports.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            Hisobotlar mavjud emas
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-navy-800">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                    <div className="flex items-center gap-2">
                      <MdCalendarMonth className="h-5 w-5" />
                      Oy
                    </div>
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">Aylanma</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">Tugatilgan Arizalar</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">Sotilgan Tovarlar</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">Tovar Summalari</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {paginatedReports.map((report, index) => (
                  <tr 
                    key={`${report.year}-${report.month}`}
                    className="hover:bg-gray-50 dark:hover:bg-navy-800 transition-colors"
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-brand-500"></div>
                        <span className="font-semibold text-navy-700 dark:text-white">{report.displayDate}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className="font-bold text-green-600 dark:text-green-400">
                        {formatMoney(report.totalProfit)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-sm font-medium">
                        <MdCheckCircle className="h-4 w-4" />
                        {report.completedApplications} ta
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-sm font-medium">
                        <MdShoppingCart className="h-4 w-4" />
                        {report.totalProducts} ta
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className="font-semibold text-orange-600 dark:text-orange-400">
                        {formatMoney(report.totalProductsAmount)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {filteredReports.length > 0 && (
          <div className="mt-4">
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        )}
      </Card>
    </div>
  );
};

export default ReportsPage;
