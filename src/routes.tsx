import React from "react";

// Admin Imports
import MainDashboard from "views/admin/default";
import Profile from "views/admin/profile";
import Fillials from "views/admin/fillials";
import Users from "views/admin/users";
import Applications from "views/admin/applications";
// Auth import
import SignIn from "views/auth/SignIn";

// Icon Imports (Tabler icons)
import { LayoutDashboard, Home, User, FileText, Login } from "tabler-icons-react";

const routes = [
  {
    name: "Boshqaruv paneli",
    layout: "/admin",
    path: "default",
  icon: <LayoutDashboard size={20} />,
    component: <MainDashboard />,
  },
  // {
  //   name: "NFT Marketplace",
  //   layout: "/admin",
  //   path: "nft-marketplace",
  //   icon: <MdOutlineShoppingCart className="h-6 w-6" />,
  //   component: <NFTMarketplace />,
  //   secondary: true,
  // },
  // {
  //   name: "Data Tables",
  //   layout: "/admin",
  //   icon: <MdBarChart className="h-6 w-6" />,
  //   path: "data-tables",
  //   component: <DataTables />,
  // },
  {
    name: "Profile",
    layout: "/admin",
    path: "profile",
    icon: <User size={20} />,
    component: <Profile />,
    hidden: true,
  },
  // {
  //   name: "Admin Dashboard",
  //   layout: "/admin",
  //   path: "admin-dashboard",
  //   icon: <MdBarChart className="h-6 w-6" />,
  //   component: <AdminDashboard />,
  // },
  {
    name: "Filiallar",
    layout: "/admin",
    path: "fillials",
  icon: <Home size={20} />,
    component: <Fillials />,
  },
  {
    name: "Operatorlar",
    layout: "/admin",
    path: "users",
  icon: <User size={20} />,
    component: <Users />,
  },
  {
    name: "Arizalar",
    layout: "/admin",
    path: "applications",
  icon: <FileText size={20} />,
    component: <Applications />,
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
