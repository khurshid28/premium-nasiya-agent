import React from "react";
import {
  MdArrowDropUp,
  MdBarChart,
} from "react-icons/md";
import Card from "components/card";
import {
  lineChartOptionsTotalSpent,
} from "variables/charts";
import LineChart from "components/charts/LineChart";
import CustomSelect from "components/dropdown/CustomSelect";
import { useLocation } from "react-router-dom";
import apiReal from "lib/api";
import demoApi from "lib/demoApi";
import { isApproved } from "lib/formatters";

interface TotalSpentProps {
  startDate?: string;
  endDate?: string;
  fillialId?: number | "all";
  region?: string;
  search?: string;
  fillials?: any[];
  expiredMonth?: number | "all";
}

const TotalSpent: React.FC<TotalSpentProps> = ({ 
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
  
  const [totalData, setTotalData] = React.useState({
    count: 0,
    totalAmount: 0,
    percent: 0
  });
  const [chartData, setChartData] = React.useState<any[]>([{
    name: "Tasdiqlangan arizalar",
    data: [0, 0, 0, 0, 0, 0],
    color: "#4318FF"
  }]);
  const [chartOptions, setChartOptions] = React.useState(lineChartOptionsTotalSpent);
  const [timePeriod, setTimePeriod] = React.useState("6months"); // "2months", "6months", "12months"
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const loadTotalData = async () => {
      try {
        const response = await api.listApplications({ page: 1, pageSize: 10000 });
        let applications = response?.items || [];
        
        // Ensure fillials is an array
        const fillialsList = Array.isArray(fillials) ? fillials : [];
        
        // Apply filters
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
        
        // Calculate total count and amount for current period
        const count = applications.length;
        const totalAmount = applications.reduce((sum, app) => sum + (app.amount || 0), 0);
        
        // Generate data based on selected time period
        const now = new Date();
        const monthlyData = [];
        const monthNames = [];
        
        // Determine number of months based on time period
        let monthsCount;
        switch (timePeriod) {
          case "2months": monthsCount = 2; break;
          case "12months": monthsCount = 12; break;
          default: monthsCount = 6; // 6months
        }
        
        // Calculate current period total
        let currentPeriodTotal = 0;
        
        for (let i = monthsCount - 1; i >= 0; i--) {
          const monthDate = new Date();
          monthDate.setMonth(now.getMonth() - i);
          
          const monthApps = applications.filter(app => {
            if (!app.createdAt || !isApproved(app.status)) return false;
            const appDate = new Date(app.createdAt);
            return appDate.getMonth() === monthDate.getMonth() && 
                   appDate.getFullYear() === monthDate.getFullYear();
          });
          
          const monthTotal = monthApps.reduce((sum, app) => sum + (app.amount || 0), 0);
          currentPeriodTotal += monthTotal;
          monthlyData.push(monthTotal / 1000); // Convert to thousands
          
          // Get month name in short format
          const monthName = monthDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
          monthNames.push(monthName);
        }
        
        // Calculate previous period total for comparison (same duration, previous period)
        let previousPeriodTotal = 0;
        const allApplications = await api.listApplications({ page: 1, pageSize: 10000 });
        let allApps = allApplications?.items || [];
        
        // Apply same filters to all applications
        if (startDate && endDate) {
          const start = new Date(startDate);
          const end = new Date(endDate);
          allApps = allApps.filter(app => {
            if (!app.createdAt) return false;
            const appDate = new Date(app.createdAt);
            return appDate >= start && appDate <= end;
          });
        }

        if (fillialId !== "all") {
          allApps = allApps.filter(app => app.fillial_id === fillialId);
        } else if (region !== "all") {
          const regionFillials = fillialsList.filter(f => f.region === region);
          const regionFillialIds = regionFillials.map(f => f.id);
          allApps = allApps.filter(app => regionFillialIds.includes(app.fillial_id));
        }

        if (search.trim()) {
          const searchLower = search.toLowerCase();
          const matchingFillials = fillialsList.filter(f => 
            f.name?.toLowerCase().includes(searchLower) || 
            f.address?.toLowerCase().includes(searchLower)
          );
          const matchingFillialIds = matchingFillials.map(f => f.id);
          allApps = allApps.filter(app => matchingFillialIds.includes(app.fillial_id));
        }
        
        for (let i = monthsCount * 2 - 1; i >= monthsCount; i--) {
          const monthDate = new Date();
          monthDate.setMonth(now.getMonth() - i);
          
          const monthApps = allApps.filter(app => {
            if (!app.createdAt || !isApproved(app.status)) return false;
            const appDate = new Date(app.createdAt);
            return appDate.getMonth() === monthDate.getMonth() && 
                   appDate.getFullYear() === monthDate.getFullYear();
          });
          
          const monthTotal = monthApps.reduce((sum, app) => sum + (app.amount || 0), 0);
          previousPeriodTotal += monthTotal;
        }
        
        // Calculate growth percentage
        let percent = 0;
        if (previousPeriodTotal > 0) {
          percent = ((currentPeriodTotal - previousPeriodTotal) / previousPeriodTotal) * 100;
        } else if (currentPeriodTotal > 0) {
          percent = 100; // If no previous data but has current data, show 100% growth
        }
        
        setTotalData({ count, totalAmount, percent });
        
        // Create dynamic chart data structure
        const dynamicChartData = [
          {
            name: "Tasdiqlangan arizalar",
            data: monthlyData,     
            color: "#4318FF"
          }
        ];
        
        // Create dynamic chart options with month names
        const dynamicChartOptions = {
          ...lineChartOptionsTotalSpent,
          xaxis: {
            ...lineChartOptionsTotalSpent.xaxis,
            categories: monthNames
          }
        };
        
        setChartData(dynamicChartData);
        setChartOptions(dynamicChartOptions);
      } catch (error) {
        console.error("Error loading total data:", error);
        // Set default data if error occurs
        setChartData([{
          name: "Total Amount",
          data: Array(6).fill(0)
        }]);
        setTotalData({ count: 0, totalAmount: 0, percent: 0 });
      } finally {
        setLoading(false);
      }
    };

    loadTotalData();
  }, [api, timePeriod, startDate, endDate, fillialId, region, search, fillials, expiredMonth]);
  return (
    <Card extra="!p-[20px] text-center">
      <div className="flex justify-between">
        <CustomSelect
          value={timePeriod}
          onChange={setTimePeriod}
          options={[
            { value: "2months", label: "2 oy" },
            { value: "6months", label: "6 oy" },
            { value: "12months", label: "12 oy" }
          ]}
        />
        <button className="!linear z-[1] flex items-center justify-center rounded-lg bg-gray-100 p-2 text-brand-500 !transition !duration-200 hover:bg-gray-200 active:bg-gray-300 dark:bg-navy-700 dark:text-white dark:hover:bg-white/10 dark:active:bg-white/20">
          <MdBarChart className="h-6 w-6" />
        </button>
      </div>

      <div className="flex h-full w-full flex-row justify-between sm:flex-wrap lg:flex-nowrap 2xl:overflow-hidden">
        <div className="flex flex-col">
          <p className="mt-[20px] text-2xl font-bold text-navy-700 dark:text-white">
            {(totalData.totalAmount || 0).toLocaleString()} UZS
          </p>
          <div className="flex flex-col items-start">
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              {timePeriod === "2months" ? "2 oylik xarid" : 
               timePeriod === "12months" ? "Yillik xarid" : "6 oylik xarid"}
            </p>
            <div className="flex flex-row items-center justify-center">
              <MdArrowDropUp 
                className={`font-medium ${totalData.percent >= 0 ? "text-green-500" : "text-red-500"}`} 
                style={{ transform: totalData.percent < 0 ? "rotate(180deg)" : "rotate(0deg)" }}
              />
              <p className={`text-sm font-bold ${totalData.percent >= 0 ? "text-green-500" : "text-red-500"}`}>
                {totalData.percent >= 0 ? "+" : ""}{totalData.percent.toFixed(2)}%
              </p>
            </div>
          </div>
        </div>
        <div className="h-full w-full">
          {loading ? (
            <div className="flex items-center justify-center h-[220px]">
              <div className="text-gray-500 dark:text-gray-400">Yuklanmoqda...</div>
            </div>
          ) : chartData && chartData.length > 0 ? (
            <LineChart
              key={`line-chart-${timePeriod}`}
              chartOptions={chartOptions}
              chartData={chartData}
            />
          ) : (
            <div className="flex items-center justify-center h-[220px]">
              <div className="text-gray-500 dark:text-gray-400">Ma'lumot topilmadi</div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default TotalSpent;
