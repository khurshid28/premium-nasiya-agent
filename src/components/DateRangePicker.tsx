import React from "react";
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

type Props = {
  startDate: string;
  endDate: string;
  onStartChange: (v: string) => void;
  onEndChange: (v: string) => void;
  className?: string;
};

function toDate(s: string) {
  if (!s) return null;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function toISODate(d: Date | null) {
  if (!d) return "";
  // Use local date to avoid timezone issues
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function DateRangePicker({ startDate, endDate, onStartChange, onEndChange, className = "" }: Props) {
  const start = toDate(startDate);
  const end = toDate(endDate);

  // Quick select functions
  const setThisMonth = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    onStartChange(toISODate(firstDay));
    onEndChange(toISODate(lastDay));
  };

  const setLastMonth = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
    onStartChange(toISODate(firstDay));
    onEndChange(toISODate(lastDay));
  };

  const setThisYear = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), 0, 1);
    const lastDay = new Date(now.getFullYear(), 11, 31);
    onStartChange(toISODate(firstDay));
    onEndChange(toISODate(lastDay));
  };

  const setLast30Days = () => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    onStartChange(toISODate(thirtyDaysAgo));
    onEndChange(toISODate(now));
  };

  const setLastYear = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear() - 1, 0, 1);
    const lastDay = new Date(now.getFullYear() - 1, 11, 31);
    onStartChange(toISODate(firstDay));
    onEndChange(toISODate(lastDay));
  };

  return (
    <div className={`flex flex-col gap-3 w-full sm:w-80 lg:w-96 ${className}`}>
      {/* Date pickers */}
      <div className="h-11 rounded-xl border border-gray-200 dark:border-navy-600 bg-white dark:bg-navy-700 px-3 shadow-sm hover:shadow-md hover:border-brand-500 dark:hover:border-brand-400 transition-all duration-200 flex items-center justify-between gap-2 w-full">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-400 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <ReactDatePicker
              selected={start}
              onChange={(d: Date | null) => onStartChange(toISODate(d))}
              selectsStart
              startDate={start}
              endDate={end}
              placeholderText="Boshlanish"
              dateFormat="dd.MM.yyyy"
              className="text-sm font-medium bg-transparent dark:text-white rounded-md border-none outline-none w-20 placeholder-gray-400 dark:placeholder-gray-500"
              withPortal
            />
          </div>

          <div className="w-px h-6 bg-gray-200 dark:bg-navy-500"></div>

          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-400 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <ReactDatePicker
              selected={end}
              onChange={(d: Date | null) => onEndChange(toISODate(d))}
              selectsEnd
              startDate={start}
              endDate={end}
              placeholderText="Tugash"
              dateFormat="dd.MM.yyyy"
              className="text-sm font-medium bg-transparent dark:text-white rounded-md border-none outline-none w-20 placeholder-gray-400 dark:placeholder-gray-500"
              withPortal
            />
          </div>
        </div>

        {(startDate || endDate) ? (
          <button 
            type="button" 
            onClick={() => { onStartChange(""); onEndChange(""); }} 
            title="Tozalash" 
            className="flex-shrink-0 p-1 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-all duration-200"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        ) : null}
      </div>

      {/* Quick select buttons - single row */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={setThisMonth}
          className="px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium rounded-xl bg-white dark:bg-navy-700 text-navy-700 dark:text-white border border-gray-200 dark:border-navy-600 hover:border-brand-500 dark:hover:border-brand-400 hover:bg-gray-50 dark:hover:bg-navy-600 shadow-sm hover:shadow-md active:scale-95 transition-all duration-200 whitespace-nowrap"
        >
          Bu oy
        </button>
        <button
          type="button"
          onClick={setLastMonth}
          className="px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium rounded-xl bg-white dark:bg-navy-700 text-navy-700 dark:text-white border border-gray-200 dark:border-navy-600 hover:border-brand-500 dark:hover:border-brand-400 hover:bg-gray-50 dark:hover:bg-navy-600 shadow-sm hover:shadow-md active:scale-95 transition-all duration-200 whitespace-nowrap"
        >
          O'tgan oy
        </button>
        <button
          type="button"
          onClick={setLast30Days}
          className="px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium rounded-xl bg-white dark:bg-navy-700 text-navy-700 dark:text-white border border-gray-200 dark:border-navy-600 hover:border-brand-500 dark:hover:border-brand-400 hover:bg-gray-50 dark:hover:bg-navy-600 shadow-sm hover:shadow-md active:scale-95 transition-all duration-200 whitespace-nowrap"
        >
          <span className="hidden sm:inline">Oxirgi 30 kun</span>
          <span className="sm:hidden">30 kun</span>
        </button>
        <button
          type="button"
          onClick={setThisYear}
          className="px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium rounded-xl bg-white dark:bg-navy-700 text-navy-700 dark:text-white border border-gray-200 dark:border-navy-600 hover:border-brand-500 dark:hover:border-brand-400 hover:bg-gray-50 dark:hover:bg-navy-600 shadow-sm hover:shadow-md active:scale-95 transition-all duration-200 whitespace-nowrap"
        >
          Bu yil
        </button>
        <button
          type="button"
          onClick={setLastYear}
          className="px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium rounded-xl bg-white dark:bg-navy-700 text-navy-700 dark:text-white border border-gray-200 dark:border-navy-600 hover:border-brand-500 dark:hover:border-brand-400 hover:bg-gray-50 dark:hover:bg-navy-600 shadow-sm hover:shadow-md active:scale-95 transition-all duration-200 whitespace-nowrap"
        >
          O'tgan yil
        </button>
      </div>
    </div>
  );
}
