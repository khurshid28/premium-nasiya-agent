import React from "react";
import BarChart from "components/charts/BarChart";
import { barChartOptionsDailyTraffic } from "variables/charts";
import { MdArrowDropUp } from "react-icons/md";
import Card from "components/card";
import { useLocation } from "react-router-dom";
import apiReal from "lib/api";
import demoApi from "lib/demoApi";
import { isApproved } from "lib/formatters";

interface DailyTrafficProps {
  startDate?: string;
  endDate?: string;
  fillialId?: number | "all";
  region?: string;
  search?: string;
  fillials?: any[];
  expiredMonth?: number | "all";
}

const DailyTraffic: React.FC<DailyTrafficProps> = ({ 
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
  
  const [chartData, setChartData] = React.useState<any[]>([]);
  const [dailyAmount, setDailyAmount] = React.useState(0);
  const [growthPercent, setGrowthPercent] = React.useState(0);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const loadDailyData = async () => {
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
        
        // Get today's approved applications
        const today = new Date();
        const todayApprovedApps = applications.filter(app => {
          if (!app.createdAt || !isApproved(app.status)) return false;
          const appDate = new Date(app.createdAt);
          return appDate.toDateString() === today.toDateString();
        });
        
        // Calculate total amount for today's approved applications
        const totalAmount = todayApprovedApps.reduce((sum, app) => sum + (app.amount || 0), 0);
        setDailyAmount(totalAmount);
        
        // Get yesterday's approved applications for comparison
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayApprovedApps = applications.filter(app => {
          if (!app.createdAt || !isApproved(app.status)) return false;
          const appDate = new Date(app.createdAt);
          return appDate.toDateString() === yesterday.toDateString();
        });
        
        // Calculate yesterday's total amount
        const yesterdayAmount = yesterdayApprovedApps.reduce((sum, app) => sum + (app.amount || 0), 0);
        
        // Calculate growth percentage (today vs yesterday)
        let percent = 0;
        if (yesterdayAmount > 0) {
          percent = ((totalAmount - yesterdayAmount) / yesterdayAmount) * 100;
        } else if (totalAmount > 0) {
          percent = 100; // If no data yesterday but has today, show 100% growth
        }
        setGrowthPercent(percent);
        
        // Create hourly amount data (24 hours)
        const hourlyData = Array.from({ length: 7 }, (_, i) => {
          const hour = i * 4; // 0, 4, 8, 12, 16, 20, 24
          const hourApps = todayApprovedApps.filter((app: any) => {
            const appDate = new Date(app.createdAt);
            const appHour = appDate.getHours();
            return appHour >= hour && appHour < hour + 4;
          });
          return hourApps.reduce((sum: number, app: any) => sum + (app.amount || 0), 0) / 1000; // Convert to thousands
        });
        
        const dynamicChartData = [
          {
            name: "Savdo hajmi",
            data: hourlyData,
            color: "#4318FF"
          }
        ];
        
        setChartData(dynamicChartData);
      } catch (error) {
        console.error("Error loading daily traffic:", error);
        // Set fallback data to prevent chart errors
        setChartData([{
          name: "Xarid",
          data: Array(7).fill(0),
          color: "#4318FF"
        }]);
        setDailyAmount(0);
      } finally {
        setLoading(false);
      }
    };

    loadDailyData();
  }, [api, startDate, endDate, fillialId, region, search, fillials, expiredMonth]);
  return (
    <Card extra="pb-7 p-[20px]">
      <div className="flex flex-row justify-between">
        <div className="ml-1 pt-2">
          <p className="text-sm font-medium leading-4 text-gray-600 dark:text-gray-400">Bugungi savdo</p>
          <p className="text-[34px] font-bold text-navy-700 dark:text-white">
            {dailyAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            <span className="text-sm font-medium leading-6 text-gray-600 dark:text-gray-400"> UZS</span>
          </p>
        </div>
        <div className="mt-2 flex items-start">
          <div className={`flex items-center text-sm ${growthPercent >= 0 ? "text-green-500" : "text-red-500"}`}>
            <MdArrowDropUp 
              className="h-5 w-5" 
              style={{ transform: growthPercent < 0 ? "rotate(180deg)" : "rotate(0deg)" }}
            />
            <p className="font-bold">
              {growthPercent >= 0 ? "+" : ""}{growthPercent.toFixed(2)}%
            </p>
          </div>
        </div>
      </div>

      <div className="h-full w-full pt-4 pb-0">
        {loading ? (
          <div className="flex h-[200px] w-full items-center justify-center">
            <div className="text-sm text-gray-500 dark:text-gray-400">Yuklanmoqda...</div>
          </div>
        ) : chartData && chartData.length > 0 ? (
          <BarChart
            key="daily-traffic-chart"
            chartData={chartData}
            chartOptions={barChartOptionsDailyTraffic}
          />
        ) : (
          <div className="flex h-[200px] w-full items-center justify-center">
            <div className="text-sm text-gray-500 dark:text-gray-400">Ma'lumot topilmadi</div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default DailyTraffic;
