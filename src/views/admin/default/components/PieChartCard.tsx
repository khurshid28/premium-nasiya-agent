import React from "react";
import PieChart from "components/charts/PieChart";
import { pieChartOptions } from "variables/charts";
import Card from "components/card";
import CustomSelect from "components/dropdown/CustomSelect";
import { useLocation } from "react-router-dom";
import apiReal from "lib/api";
import demoApi from "lib/demoApi";
import { isApproved, isConfirmed, isRejected, isPending } from "lib/formatters";

interface PieChartCardProps {
  startDate?: string;
  endDate?: string;
  fillialId?: number | "all";
  region?: string;
  search?: string;
  fillials?: any[];
  expiredMonth?: number | "all";
}

const PieChartCard: React.FC<PieChartCardProps> = ({ 
  startDate = "", 
  endDate = "", 
  fillialId = "all", 
  region = "all",
  search = "",
  fillials = [],
  expiredMonth = "all"
}) => {
  const location = useLocation();
  const api = React.useMemo(() => {
    const isDemo = location.pathname.startsWith('/demo');
    return isDemo ? demoApi : apiReal;
  }, [location.pathname]);
  
  const [timePeriod, setTimePeriod] = React.useState("daily");
  const [statusDistribution, setStatusDistribution] = React.useState({
    approved: 0,
    pending: 0,
    rejected: 0,
    total: 0
  });
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const loadStatusData = async () => {
      try {
        const response = await api.listApplications({ page: 1, pageSize: 10000 });
        let applications = response?.items || [];
        
        // Ensure fillials is an array
        const fillialsList = Array.isArray(fillials) ? fillials : [];
        
        // Apply global filters first
        if (startDate && endDate) {
          const start = new Date(startDate);
          const end = new Date(endDate);
          applications = applications.filter(app => {
            if (!app.createdAt) return false;
            const appDate = new Date(app.createdAt);
            return appDate >= start && appDate <= end;
          });
        }

        if (fillialId !== "all") {
          applications = applications.filter(app => app.fillial_id === fillialId);
        } else if (region !== "all") {
          const regionFillials = fillialsList.filter(f => f.region === region);
          const regionFillialIds = regionFillials.map(f => f.id);
          applications = applications.filter(app => regionFillialIds.includes(app.fillial_id));
        }

        if (search.trim()) {
          const searchLower = search.toLowerCase();
          const matchingFillials = fillialsList.filter(f => 
            f.name?.toLowerCase().includes(searchLower) || 
            f.address?.toLowerCase().includes(searchLower)
          );
          const matchingFillialIds = matchingFillials.map(f => f.id);
          applications = applications.filter(app => matchingFillialIds.includes(app.fillial_id));
        }

        // Filter by expired month
        if (expiredMonth !== "all") {
          applications = applications.filter(app => app.expired_month && app.expired_month === String(expiredMonth));
        }
        
        // Filter by time period
        const now = new Date();
        const filtered = applications.filter(app => {
          if (!app.createdAt) return true;
          const createdDate = new Date(app.createdAt);
          
          switch (timePeriod) {
            case "daily":
              const today = new Date();
              const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
              const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
              return createdDate >= todayStart && createdDate < todayEnd;
            case "weekly":
              const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
              return createdDate >= weekAgo;
            case "monthly":
              const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
              return createdDate >= monthAgo;
            case "yearly":
              const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
              return createdDate >= yearAgo;
            default:
              return true;
          }
        });
        
        const counts = {
          approved: filtered.filter(app => isApproved(app.status) || isConfirmed(app.status)).length,
          pending: filtered.filter(app => isPending(app.status)).length,
          rejected: filtered.filter(app => isRejected(app.status)).length,
          total: filtered.length
        };
        
        setStatusDistribution(counts);
      } catch (error) {
        console.error("Error loading status data:", error);
        // Set default data if error occurs
        setStatusDistribution({
          approved: 1,
          rejected: 1,
          pending: 1,
          total: 3
        });
      } finally {
        setLoading(false);
      }
    };

    loadStatusData();
  }, [api, timePeriod, startDate, endDate, fillialId, region, search, fillials, expiredMonth]);

  const approvedPercent = statusDistribution.total > 0 
    ? Math.round((statusDistribution.approved / statusDistribution.total) * 100) 
    : 0;
  const rejectedPercent = statusDistribution.total > 0 
    ? Math.round((statusDistribution.rejected / statusDistribution.total) * 100) 
    : 0;
  const pendingPercent = statusDistribution.total > 0 
    ? Math.round((statusDistribution.pending / statusDistribution.total) * 100) 
    : 0;

  // Create dynamic chart data with 3 statuses: Rejected, Approved, Pending
  const dynamicChartData = [rejectedPercent, approvedPercent, pendingPercent];
  
  // Check if we have valid data (at least one value > 0)
  const hasValidData = statusDistribution.total > 0;
  const safeChartData = hasValidData ? dynamicChartData : [33, 33, 34];
  
  const dynamicChartOptions = {
    ...pieChartOptions,
    labels: hasValidData ? ["Rad qilingan", "Tugatilgan", "Kutilmoqda"] : ["Ma'lumot yo'q", "Ma'lumot yo'q", "Ma'lumot yo'q"],
    colors: hasValidData ? ["#EF4444", "#10B981", "#F59E0B"] : ["#E5E7EB", "#D1D5DB", "#9CA3AF"], // Red, Green, Yellow OR Gray shades
    fill: {
      ...pieChartOptions.fill,
      colors: hasValidData ? ["#EF4444", "#10B981", "#F59E0B"] : ["#E5E7EB", "#D1D5DB", "#9CA3AF"] // Match with colors array
    },
    // Add safety options for chart rendering
    chart: {
      ...pieChartOptions.chart,
      animations: {
        enabled: false // Disable animations to prevent render issues
      }
    },
    legend: {
      show: false, // Hide ApexCharts legend, use custom legend below chart
      position: 'bottom',
      fontSize: '14px',
      fontFamily: 'inherit',
      labels: {
        colors: '#6B7280',
        useSeriesColors: false
      }
    },
    dataLabels: {
      enabled: false
    },
    tooltip: {
      enabled: hasValidData,
      y: {
        formatter: function(value: number, { seriesIndex }: { seriesIndex: number }) {
          // seriesIndex: 0 = Rad qilingan, 1 = Tugatilgan, 2 = Kutilmoqda
          const counts = [statusDistribution.rejected, statusDistribution.approved, statusDistribution.pending];
          return counts[seriesIndex] + ' ta ariza';
        }
      }
    },
    plotOptions: {
      pie: {
        dataLabels: {
          offset: -10
        }
      }
    }
  };

  return (
    <Card extra="rounded-[20px] p-3">
      <div className="flex flex-row justify-between px-3 pt-2">
        <div>
          <h4 className="text-lg font-bold text-navy-700 dark:text-white">
            Arizalar statistikasi
          </h4>
        </div>

        <div className="mb-6 flex items-center justify-center">
          <CustomSelect
            value={timePeriod}
            onChange={setTimePeriod}
            options={[
              { value: "daily", label: "Kunlik" },
              { value: "weekly", label: "Haftalik" },
              { value: "monthly", label: "Oylik" },
              { value: "yearly", label: "Yillik" }
            ]}
            className="min-w-[110px]"
          />
        </div>
      </div>

      <div className="mb-auto flex h-full w-full flex-col items-center justify-center">
        {loading ? (
          <div className="flex items-center justify-center h-[220px]">
            <div className="text-gray-500 dark:text-gray-400">Yuklanmoqda...</div>
          </div>
        ) : !hasValidData ? (
          <div className="flex items-center justify-center h-[220px]">
            <div className="text-lg font-medium text-gray-500 dark:text-gray-400">Ma'lumot yo'q</div>
          </div>
        ) : (
          <>
            <PieChart 
              key={`pie-chart-${timePeriod}`}
              chartOptions={dynamicChartOptions} 
              chartData={safeChartData} 
              series={safeChartData} 
            />
          </>
        )}
      </div>
      {hasValidData && !loading && (
        <div className="flex flex-row !justify-between rounded-2xl px-2 py-3 shadow-2xl shadow-shadow-500 dark:!bg-navy-700 dark:shadow-none">
          <div className="flex flex-col items-center justify-center">
            <div className="flex items-center justify-center">
              <div className="h-2 w-2 rounded-full bg-red-500" />
              <p className="ml-1 text-xs font-normal text-gray-600 dark:text-gray-300">Rad qilingan</p>
            </div>
            <p className="mt-px text-lg font-bold text-navy-700 dark:text-white">
              {rejectedPercent}%
            </p>
          </div>

          <div className="h-11 w-px bg-gray-300 dark:bg-white/10" />

          <div className="flex flex-col items-center justify-center">
            <div className="flex items-center justify-center">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <p className="ml-1 text-xs font-normal text-gray-600 dark:text-gray-300">Tugatilgan</p>
            </div>
            <p className="mt-px text-lg font-bold text-navy-700 dark:text-white">
              {approvedPercent}%
            </p>
          </div>

          <div className="h-11 w-px bg-gray-300 dark:bg-white/10" />

          <div className="flex flex-col items-center justify-center">
            <div className="flex items-center justify-center">
              <div className="h-2 w-2 rounded-full bg-yellow-500" />
              <p className="ml-1 text-xs font-normal text-gray-600 dark:text-gray-300">Kutilmoqda</p>
            </div>
            <p className="mt-px text-lg font-bold text-navy-700 dark:text-white">
              {pendingPercent}%
            </p>
          </div>
        </div>
      )}
    </Card>
  );
};

export default PieChartCard;
