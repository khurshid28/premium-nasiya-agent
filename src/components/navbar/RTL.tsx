import React from "react";
import Dropdown from "components/dropdown";
import { FiAlignJustify, FiUser } from "react-icons/fi";
// Link removed — not needed for the simplified navbar
import navbarimage from "assets/img/layout/Navbar.png";
import { useNavigate } from "react-router-dom";
import { useUser } from "contexts/UserContext";

import { FiSearch } from "react-icons/fi";
import { RiMoonFill, RiSunFill } from "react-icons/ri";
import {
  IoMdInformationCircleOutline,
} from "react-icons/io";

const Navbar = (props: {
  onOpenSidenav: () => void;
  brandText: string;
  secondary?: boolean | string;
}) => {
  const { onOpenSidenav, brandText } = props;
  const navigate = useNavigate();
  const { user, logout } = useUser();
  const [darkmode, setDarkmode] = React.useState(false);

  const handleLogout = () => {
    logout();
    navigate("/sign-in");
  };

  return (
    <nav className="sticky top-4 z-40 flex flex-row flex-wrap items-center justify-between rounded-xl bg-white/10 p-2 backdrop-blur-xl dark:bg-[#0b14374d]">
      <div className="ms-[6px]">
        <div className="h-6 w-[224px] pt-1">
          <span className="text-sm font-normal text-navy-700 dark:text-white">Pages</span>
          <span className="mx-1 text-sm text-navy-700 dark:text-white">/</span>
          <span className="text-sm font-normal capitalize text-navy-700 dark:text-white">{brandText}</span>
        </div>
      </div>

      <div className="relative mt-[3px] flex h-[61px] w-[355px] flex-grow items-center justify-around gap-2 rounded-full bg-white px-2 py-2 shadow-xl shadow-shadow-500 dark:!bg-navy-800 dark:shadow-none md:w-[365px] md:flex-grow-0 md:gap-1 xl:w-[365px] xl:gap-2">
        <div className="flex h-full items-center rounded-full bg-lightPrimary text-navy-700 dark:bg-navy-900 dark:text-white xl:w-[225px]">
          <p className="text-xl pe-2 ps-3">
            <FiSearch className="h-4 w-4 text-gray-400 dark:text-white" />
          </p>
          <input
            type="text"
            placeholder="Search..."
            className="block h-full w-full rounded-full bg-lightPrimary text-sm font-medium text-navy-700 outline-none placeholder:!text-gray-400 dark:bg-navy-900 dark:text-white dark:placeholder:!text-white sm:w-fit"
          />
        </div>
        <span
          className="flex cursor-pointer text-xl text-gray-600 dark:text-white xl:hidden"
          onClick={onOpenSidenav}
        >
          <FiAlignJustify className="h-5 w-5" />
        </span>

        {/* start Horizon PRO */}
        <Dropdown
          button={
            <p className="cursor-pointer">
              <IoMdInformationCircleOutline className="h-4 w-4 text-gray-600 dark:text-white" />
            </p>
          }
          children={
            <div className="flex w-[350px] flex-col gap-2 rounded-[20px] bg-white p-4 shadow-xl shadow-shadow-500 dark:!bg-navy-700 dark:text-white dark:shadow-none">
              <div
                style={{
                  backgroundImage: `url(${navbarimage})`,
                  backgroundRepeat: "no-repeat",
                  backgroundSize: "cover",
                }}
                className="mb-2 aspect-video w-full rounded-lg"
              />
              <a
                target="blank"
                href="https://horizon-ui.com/pro?ref=live-free-tailwind-react"
                className="px-full linear flex cursor-pointer items-center justify-center rounded-xl bg-brand-500 py-[11px] font-bold text-white transition duration-200 hover:bg-brand-600 hover:text-white active:bg-brand-700 dark:bg-brand-400 dark:hover:bg-brand-300 dark:active:bg-brand-200"
              >
                Buy Horizon UI PRO
              </a>
              <a
                target="blank"
                href="https://horizon-ui.com/docs-tailwind/docs/react/installation?ref=live-free-tailwind-react"
                className="px-full linear flex cursor-pointer items-center justify-center rounded-xl border py-[11px] font-bold text-navy-700 transition duration-200 hover:bg-gray-200 hover:text-navy-700 dark:!border-white/10 dark:text-white dark:hover:bg-white/20 dark:hover:text-white dark:active:bg-white/10"
              >
                See Documentation
              </a>
              <button
                type="button"
                className="hover:bg-black px-full linear flex cursor-pointer items-center justify-center rounded-xl py-[11px] font-bold text-navy-700 transition duration-200 hover:text-navy-700 dark:text-white dark:hover:text-white"
              >
                Premium Nasiya Admin
              </button>
            </div>
          }
          classNames={"py-2 top-6 -start-[250px] md:-start-[330px] w-max"}
          animation="origin-[75%_0%] md:origin-top-start transition-all duration-300 ease-in-out"
        />
        <div
          className="cursor-pointer text-gray-600"
          onClick={() => {
            if (darkmode) {
              document.body.classList.remove("dark");
              setDarkmode(false);
            } else {
              document.body.classList.add("dark");
              setDarkmode(true);
            }
          }}
        >
          {darkmode ? (
            <RiSunFill className="h-4 w-4 text-gray-600 dark:text-white" />
          ) : (
            <RiMoonFill className="h-4 w-4 text-gray-600 dark:text-white" />
          )}
        </div>
        {/* Profile & Dropdown */}
        <Dropdown
          button={
            user?.image ? (
              <img
                className="h-10 w-10 rounded-full object-cover flex-shrink-0"
                src={user.image}
                alt={user?.fullname || "User"}
                title={`${user?.fullname ?? "User"}${user?.phone ? " • " + user.phone : ""}`}
              />
            ) : (
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-brand-500 text-white">
                <FiUser className="h-5 w-5" />
              </div>
            )
          }
          children={
            <div className="flex w-60 flex-col rounded-[20px] bg-white shadow-xl shadow-shadow-500 dark:!bg-navy-700 dark:text-white dark:shadow-none">
              {/* User info */}
              <div className="flex items-center gap-3 p-4">
                {user?.image ? (
                  <img
                    className="h-10 w-10 rounded-full object-cover flex-shrink-0"
                    src={user.image}
                    alt={user?.fullname || "User"}
                  />
                ) : (
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-brand-500 text-white">
                    <FiUser className="h-5 w-5" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-navy-700 dark:text-white break-words">{user?.fullname || "Anonim"}</div>
                  {user?.phone ? (
                    <div className="truncate text-xs text-gray-600 dark:text-gray-300">{user.phone}</div>
                  ) : null}
                </div>
              </div>
              <div className="h-px w-full bg-gray-200 dark:bg-white/20" />

              {/* Actions */}
              <div className="p-2 space-y-1">
                <button
                  onClick={() => navigate("/agent/info")}
                  className="w-full rounded-md px-3 py-2 text-start text-sm font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-white/10 flex items-center gap-2"
                >
                  <IoMdInformationCircleOutline className="h-4 w-4" />
                  Ma'lumot
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full rounded-md px-3 py-2 text-start text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-white/10"
                >
                  Chiqish
                </button>
              </div>
            </div>
          }
          classNames={"py-2 top-8 -start-[180px] w-max"}
        />
      </div>
    </nav>
  );
};

export default Navbar;
