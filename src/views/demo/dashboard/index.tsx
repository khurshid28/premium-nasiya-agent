import React from 'react';
import demoApi from 'lib/demoApi';
import { formatMoney, formatMoneyWithUZS } from 'lib/formatters';
import MiniCalendar from 'components/calendar/MiniCalendar';
import WeeklyRevenue from 'views/admin/default/components/WeeklyRevenue';
import TotalSpent from 'views/admin/default/components/TotalSpent';
import PieChartCard from 'views/admin/default/components/PieChartCard';
import { MdBarChart, MdDashboard } from 'react-icons/md';
import Widget from 'components/widget/Widget';

const DemoDashboard = () => {
  const [stats, setStats] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await demoApi.getDashboardStats();
        setStats(data);
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Demo Mode Banner */}
      <div className="mb-5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 p-4 text-white shadow-lg">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🎭</span>
          <div>
            <h3 className="text-lg font-bold">DEMO MODE - Boshqaruv Paneli</h3>
            <p className="text-sm opacity-90">Bu demo versiya - real ma'lumotlar bilan ishlayapdi</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="mt-3 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-3 3xl:grid-cols-6">
        <Widget
          icon={<MdBarChart className="h-7 w-7" />}
          title={"Jami Arizalar"}
          subtitle={stats?.totalApplications?.toString() || "0"}
        />
        <Widget
          icon={<MdBarChart className="h-6 w-6" />}
          title={"Tasdiqlangan"}
          subtitle={stats?.confirmedApplications?.toString() || "0"}
        />
        <Widget
          icon={<MdBarChart className="h-7 w-7" />}
          title={"Jami Summa"}
          subtitle={formatMoneyWithUZS(stats?.totalAmount || 0)}
        />
        <Widget
          icon={<MdDashboard className="h-6 w-6" />}
          title={"To'landi"}
          subtitle={formatMoneyWithUZS(stats?.paidAmount || 0)}
        />
        <Widget
          icon={<MdBarChart className="h-7 w-7" />}
          title={"To'lanmadi"}
          subtitle={formatMoneyWithUZS(stats?.unpaidAmount || 0)}
        />
        <Widget
          icon={<MdBarChart className="h-6 w-6" />}
          title={"Merchantlar"}
          subtitle={stats?.totalMerchants?.toString() || "0"}
        />
      </div>

      {/* Charts */}
      <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
        <TotalSpent />
        <WeeklyRevenue />
      </div>

      {/* Bottom Section */}
      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-2">
        <div>
          <PieChartCard />
        </div>
        
        <div className="grid grid-cols-1 gap-5 rounded-[20px] md:grid-cols-2">
          <div className="rounded-[20px] bg-white p-5 dark:bg-navy-800">
            <h4 className="text-lg font-bold text-navy-700 dark:text-white mb-3">
              Tezkor Ma'lumotlar
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Filiallar:</span>
                <span className="font-semibold text-navy-700 dark:text-white">{stats?.totalFillials || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Agentlar:</span>
                <span className="font-semibold text-navy-700 dark:text-white">{stats?.totalAgents || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Merchantlar:</span>
                <span className="font-semibold text-navy-700 dark:text-white">{stats?.totalMerchants || 0}</span>
              </div>
            </div>
          </div>
          
          <div className="rounded-[20px]">
            <MiniCalendar />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemoDashboard;
