import React from "react";

// Agent Imports
import MainDashboard from "views/admin/default";
import Profile from "views/admin/profile";
import Fillials from "views/admin/fillials";
import Users from "views/admin/users";
import Applications from "views/admin/applications";
import InfoPage from "views/admin/info";
import ReportsPage from "views/admin/reports";
// Auth import
import SignIn from "views/auth/SignIn";

// Icon Imports (Tabler icons)
import { LayoutDashboard, Home, User, FileText, Login, InfoCircle, Report } from "tabler-icons-react";

const routes = [
  {
    name: "Boshqaruv paneli",
    layout: "/agent",
    path: "dashboard",
  icon: <LayoutDashboard size={20} />,
    component: <MainDashboard />,
  },
  {
    name: "Boshqaruv paneli",
    layout: "/demo",
    path: "dashboard",
  icon: <LayoutDashboard size={20} />,
    component: <MainDashboard />,
  },
  // {
  //   name: "NFT Marketplace",
  //   layout: "/agent",
  //   path: "nft-marketplace",
  //   icon: <MdOutlineShoppingCart className="h-6 w-6" />,
  //   component: <NFTMarketplace />,
  //   secondary: true,
  // },
  // {
  //   name: "Data Tables",
  //   layout: "/agent",
  //   icon: <MdBarChart className="h-6 w-6" />,
  //   path: "data-tables",
  //   component: <DataTables />,
  // },
  {
    name: "Profile",
    layout: "/agent",
    path: "profile",
    icon: <User size={20} />,
    component: <Profile />,
    hidden: true,
  },
  // {
  //   name: "Agent Dashboard",
  //   layout: "/agent",
  //   path: "agent-dashboard",
  //   icon: <MdBarChart className="h-6 w-6" />,
  //   component: <AgentDashboard />,
  // },
  {
    name: "Filiallar",
    layout: "/agent",
    path: "fillials",
  icon: <Home size={20} />,
    component: <Fillials />,
  },
  {
    name: "Filiallar",
    layout: "/demo",
    path: "fillials",
  icon: <Home size={20} />,
    component: <Fillials />,
  },
  {
    name: "Operatorlar",
    layout: "/agent",
    path: "users",
  icon: <User size={20} />,
    component: <Users />,
  },
  {
    name: "Operatorlar",
    layout: "/demo",
    path: "users",
  icon: <User size={20} />,
    component: <Users />,
  },
  {
    name: "Arizalar",
    layout: "/agent",
    path: "applications",
  icon: <FileText size={20} />,
    component: <Applications />,
  },
  {
    name: "Arizalar",
    layout: "/demo",
    path: "applications",
  icon: <FileText size={20} />,
    component: <Applications />,
  },
  {
    name: "Ma'lumot",
    layout: "/agent",
    path: "info",
    icon: <InfoCircle size={20} />,
    component: <InfoPage />,
  },
  {
    name: "Ma'lumot",
    layout: "/demo",
    path: "info",
    icon: <InfoCircle size={20} />,
    component: <InfoPage />,
  },
  {
    name: "Hisobotlar",
    layout: "/agent",
    path: "reports",
    icon: <Report size={20} />,
    component: <ReportsPage />,
  },
  {
    name: "Hisobotlar",
    layout: "/demo",
    path: "reports",
    icon: <Report size={20} />,
    component: <ReportsPage />,
  },
  {
    name: "Kirish",
    layout: "/auth",
    path: "sign-in",
  icon: <Login size={20} />,
    component: <SignIn />,
  },
  // {
  //   name: "Sign In",
  //   layout: "/auth",
  //   path: "sign-in",
  //   icon: <MdLock className="h-6 w-6" />,
  //   component: <SignIn />,
  // },
  // {
  //   name: "RTL Admin",
  //   layout: "/rtl",
  //   path: "rtl",
  //   icon: <MdHome className="h-6 w-6" />,
  //   component: <RTLDefault />,
  // },
];
export default routes;
