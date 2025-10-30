import React from "react";
import Dropdown from "components/dropdown";
import { FiAlignJustify, FiUser } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useUser } from "contexts/UserContext";

import { FiSearch } from "react-icons/fi";
import { RiMoonFill, RiSunFill } from "react-icons/ri";
import {
  IoMdInformationCircleOutline,
} from "react-icons/io";
import api from "lib/api";
import DetailModal from "components/modal/DetailModalNew";

const Navbar = (props: {
  onOpenSidenav: () => void;
  brandText: string;
  secondary?: boolean | string;
}) => {
  const { onOpenSidenav, brandText } = props;
  const navigate = useNavigate();
  const { user, logout } = useUser();

  const handleLogout = () => {
    logout();
    navigate("/sign-in");
  };
  const [darkmode, setDarkmode] = React.useState(false);

  // Global search state
  type SearchItem = {
    type: "operator" | "application" | "fillial";
    id: number;
    title: string;
    subtitle?: string;
    raw: any;
  };
  const [query, setQuery] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [results, setResults] = React.useState<SearchItem[]>([]);
  const [showResults, setShowResults] = React.useState(false);
  const [selected, setSelected] = React.useState<SearchItem | null>(null);
  const [selectedIndex, setSelectedIndex] = React.useState(-1);
  const searchBoxRef = React.useRef<HTMLDivElement | null>(null);

  // Status mapping - inglizcha status larni uzbekchaga
  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'ACTIVE': 'Faol',
      'PENDING': 'Kutilmoqda', 
      'APPROVED': 'Tasdiqlangan',
      'REJECTED': 'Rad qilingan',
      'COMPLETED': 'Tugatilgan',
      'CANCELLED': 'Bekor qilingan',
      'CANCELED_BY_SCORING': 'Rad qilingan',
      'CANCELED_BY_CLIENT': 'Rad qilingan',
      'CANCELED_BY_DAILY': 'Rad qilingan',
      'LIMIT': 'Limit',
      'DRAFT': 'Qoralama'
    };
    return statusMap[status?.toUpperCase()] || status;
  };

  // Status color mapping
  const getStatusColor = (status: string) => {
    const statusLower = status?.toLowerCase();
    if (statusLower === 'active' || statusLower === 'approved' || statusLower === 'completed') {
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    } else if (statusLower === 'pending' || statusLower === 'draft') {
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    } else if (statusLower === 'rejected' || statusLower === 'cancelled' || statusLower.includes('canceled') || statusLower.includes('scoring')) {
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    } else if (statusLower === 'limit') {
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
    }
    return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  };

  // Highlight search term in text
  const highlightText = (text: string, searchTerm: string) => {
    if (!searchTerm.trim()) return text;
    
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? 
        <span key={index} className="bg-yellow-200 dark:bg-yellow-600 text-gray-900 dark:text-white font-medium">{part}</span> : 
        part
    );
  };

  // Outside click listener
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(event.target as Node)) {
        setShowResults(false);
        setSelectedIndex(-1);
      }
    };

    if (showResults) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showResults]);

  React.useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }
    setLoading(true);
    setShowResults(true);
    const t = setTimeout(async () => {
      try {
        // Global search - barcha ma'lumotlarni olib, client-side da search qilish
        const [usersRes, appsRes, filsRes] = await Promise.all([
          api.listUsers({}),
          api.listApplications({}),
          api.listFillials({}),
        ]);
        const searchLower = query.toLowerCase();
        const list: SearchItem[] = [];
        
        // Users/Operators search - name, phone, fullname
        usersRes.items
          .filter((u: any) => {
            const searchFields = [
              u.fullname?.toLowerCase() || '',
              u.phone?.toLowerCase() || '',
              u.name?.toLowerCase() || '',
              u.id?.toString() || ''
            ];
            return searchFields.some(field => field.includes(searchLower));
          })
          .slice(0, 5) // Faqat 5 ta natija
          .forEach((u: any) =>
            list.push({
              type: "operator",
              id: u.id,
              title: u.fullname ?? u.name ?? "",
              subtitle: u.phone ?? "",
              raw: u,
            })
          );
        
        // Applications search - fullname, phone, ID, status
        appsRes.items
          .filter((a: any) => {
            const searchFields = [
              a.fullname?.toLowerCase() || '',
              a.phone?.toLowerCase() || '',
              a.id?.toString() || '',
              a.status?.toLowerCase() || '',
              a.passport?.toLowerCase() || '',
              // Uzbekcha status nomlari bilan ham search qilish
              getStatusText(a.status || '')?.toLowerCase() || ''
            ];
            return searchFields.some(field => field.includes(searchLower));
          })
          .slice(0, 5) // Faqat 5 ta natija
          .forEach((a: any) =>
            list.push({
              type: "application",
              id: a.id,
              title: `${a.fullname ?? "-"} • #${a.id}`,
              subtitle: `${a.phone ?? ""} ${a.status ? " • " + getStatusText(a.status) : ""}`.trim(),
              raw: a,
            })
          );
        
        // Fillials search - name, region, director_name, director_phone
        filsRes.items
          .filter((f: any) => {
            const searchFields = [
              f.name?.toLowerCase() || '',
              f.director_name?.toLowerCase() || '',
              f.director_phone?.toLowerCase() || '',
              f.address?.toLowerCase() || '',
              f.id?.toString() || ''
            ];
            
            // Region uchun alohida, aniqroq search
            const regionMatch = f.region?.toLowerCase().includes(searchLower) || false;
            
            // Agar search term region bilan match bo'lsa, aniq match talab qilamiz
            if (searchLower === 'alp' || searchLower === 'qora' || searchLower === 'qalp') {
              return f.region?.toLowerCase().includes('qoraqalp') || 
                     searchFields.some(field => field.includes(searchLower));
            }
            
            return regionMatch || searchFields.some(field => field.includes(searchLower));
          })
          .slice(0, 5) // Faqat 5 ta natija
          .forEach((f: any) =>
            list.push({
              type: "fillial",
              id: f.id,
              title: f.name ?? "",
              subtitle: f.region ? `Hudud: ${f.region}` : (f.director_name ? `Direktor: ${f.director_name}` : undefined),
              raw: f,
            })
          );
        setResults(list);
      } catch (e) {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  React.useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!searchBoxRef.current) return;
      if (!searchBoxRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  return (
    <nav className="sticky top-4 z-40 flex flex-row flex-wrap items-center justify-between rounded-xl bg-white/10 p-2 backdrop-blur-xl dark:bg-[#0b14374d]">
      <div className="ml-[6px]">
        <div className="h-6 w-[224px] pt-1">
          <span className="text-sm font-normal text-navy-700 dark:text-white">Sahifalar</span>
          <span className="mx-1 text-sm text-navy-700 dark:text-white">/</span>
          <span className="text-sm font-normal capitalize text-navy-700 dark:text-white">{brandText}</span>
        </div>
      </div>

      <div className="relative mt-[3px] flex h-[61px] w-[355px] flex-grow items-center justify-around gap-2 rounded-full bg-white px-2 py-2 shadow-xl shadow-shadow-500 dark:!bg-navy-800 dark:shadow-none md:w-[365px] md:flex-grow-0 md:gap-1 xl:w-[365px] xl:gap-2">
        <div ref={searchBoxRef} className="relative flex h-full items-center rounded-full bg-lightPrimary text-navy-700 dark:bg-navy-900 dark:text-white xl:w-[225px]">
          <p className="pl-3 pr-2 text-xl">
            <FiSearch className="h-4 w-4 text-gray-400 dark:text-white" />
          </p>
          <input
            type="text"
            placeholder="Qidirish..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(-1); // Reset selection on typing
            }}
            onFocus={() => query.trim().length >= 2 && setShowResults(true)}
            onKeyDown={(e) => {
              if (!showResults || results.length === 0) return;
              
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => prev < results.length - 1 ? prev + 1 : 0);
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => prev > 0 ? prev - 1 : results.length - 1);
              } else if (e.key === 'Enter' && selectedIndex >= 0) {
                e.preventDefault();
                const selectedResult = results[selectedIndex];
                setShowResults(false);
                setQuery("");
                setSelectedIndex(-1);
                
                // Navigate to appropriate page
                if (selectedResult.type === "operator") {
                  navigate("/admin/users");
                } else if (selectedResult.type === "application") {
                  navigate("/admin/applications");
                } else if (selectedResult.type === "fillial") {
                  navigate("/admin/fillials");
                }
                // Then show modal
                setTimeout(() => setSelected(selectedResult), 100);
              } else if (e.key === 'Escape') {
                setShowResults(false);
                setSelectedIndex(-1);
              }
            }}
            className="block h-full w-full rounded-full bg-lightPrimary text-sm font-medium text-navy-700 outline-none placeholder:!text-gray-400 dark:bg-navy-900 dark:text-white dark:placeholder:!text-white sm:w-fit"
          />
          {showResults && (
            <div className="absolute left-0 top-full z-50 mt-2 w-full min-w-[400px] max-w-[600px] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl shadow-shadow-500 dark:border-white/10 dark:bg-navy-700 dark:shadow-none">
              {loading ? (
                <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-300 flex items-center gap-2">
                  <div className="animate-spin h-4 w-4 border-2 border-gray-300 rounded-full border-t-blue-600"></div>
                  Qidirilmoqda...
                </div>
              ) : results.length === 0 ? (
                <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-300">Natija topilmadi</div>
              ) : (
                <div>
                  <div className="px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-300 bg-gray-50 dark:bg-navy-800 border-b border-gray-100 dark:border-gray-600 flex items-center justify-between">
                    <span>{results.length} ta natija topildi</span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      ESC - yopish, ↑↓ - tanlash, Enter - ochish
                    </span>
                  </div>
                  <ul className="max-h-96 overflow-auto py-1">
                  {results.map((r, index) => (
                    <li
                      key={`${r.type}-${r.id}`}
                      onClick={() => {
                        setShowResults(false);
                        setQuery("");
                        setSelectedIndex(-1);
                        // Navigate to appropriate page
                        if (r.type === "operator") {
                          navigate("/admin/users");
                        } else if (r.type === "application") {
                          navigate("/admin/applications");
                        } else if (r.type === "fillial") {
                          navigate("/admin/fillials");
                        }
                        // Then show modal
                        setTimeout(() => setSelected(r), 100);
                      }}
                      className={`cursor-pointer px-3 py-2 border-b border-gray-100 dark:border-gray-600 last:border-b-0 ${
                        index === selectedIndex 
                          ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700' 
                          : 'hover:bg-gray-50 dark:hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-navy-700 dark:text-white truncate">
                            {highlightText(r.title, query)}
                          </div>
                          {r.subtitle && (
                            <div className="text-xs text-gray-600 dark:text-gray-300 mt-1 truncate">
                              {highlightText(r.subtitle, query)}
                            </div>
                          )}
                          {/* Ko'shimcha ma'lumotlar */}
                          <div className="flex flex-wrap gap-2 mt-2">
                            {r.type === "operator" && r.raw?.phone && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                                📞 {r.raw.phone}
                              </span>
                            )}
                            {r.type === "application" && r.raw?.status && (
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${getStatusColor(r.raw.status)}`}>
                                {getStatusText(r.raw.status)}
                              </span>
                            )}
                            {r.type === "fillial" && r.raw?.region && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
                                📍 {r.raw.region}
                              </span>
                            )}
                            {r.raw?.id && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                                ID: {r.raw.id}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="flex-shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-white/10 dark:text-gray-300">
                          {r.type === "operator" ? "Operator" : r.type === "application" ? "Ariza" : "Filial"}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
                </div>
              )}
            </div>
          )}
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
            <div className="flex w-[350px] flex-col gap-3 rounded-[20px] bg-white p-4 shadow-xl shadow-shadow-500 dark:!bg-navy-700 dark:text-white dark:shadow-none">
              <div className="mb-2">
                <h3 className="text-lg font-bold text-navy-700 dark:text-white mb-2">Premium Nasiya</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                  Zamonaviy nasiya xizmatlarini taqdim etuvchi platforma. Tez va ishonchli nasiya olish imkoniyati.
                </p>
              </div>
              <a
                target="_blank"
                rel="noreferrer"
                href="https://premiumnasiya.uz"
                className="px-full linear flex cursor-pointer items-center justify-center rounded-xl bg-brand-500 py-[11px] font-bold text-white transition duration-200 hover:bg-brand-600 hover:text-white active:bg-brand-700 dark:bg-brand-400 dark:hover:bg-brand-300 dark:active:bg-brand-200"
              >
                Asosiy saytga o'tish
              </a>
              <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                Premium Nasiya Admin Panel
              </div>
            </div>
          }
          classNames={"py-2 top-6 -left-[250px] md:-left-[330px] w-max"}
          animation="origin-[75%_0%] md:origin-top-right transition-all duration-300 ease-in-out"
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
                className="h-10 w-10 rounded-full object-cover"
                src={user.image}
                alt={user?.fullname || "User"}
                title={`${user?.fullname ?? "User"}${user?.phone ? " • " + user.phone : ""}`}
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500 text-white font-semibold text-sm">
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
                    className="h-10 w-10 rounded-full object-cover"
                    src={user.image}
                    alt={user?.fullname || "User"}
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500 text-white">
                    <FiUser className="h-5 w-5" />
                  </div>
                )}
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-gray-900 dark:text-white">{user?.fullname || "Anonim"}</div>
                  {user?.phone ? (
                    <div className="truncate text-xs text-gray-600 dark:text-gray-300">{user.phone}</div>
                  ) : null}
                </div>
              </div>
              <div className="h-px w-full bg-gray-200 dark:bg-white/20" />

              {/* Actions */}
              <div className="p-2">
                <button
                  onClick={handleLogout}
                  className="w-full rounded-md px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-white/10"
                >
                  Chiqish
                </button>
              </div>
            </div>
          }
          classNames={"py-2 top-8 -left-[180px] w-max"}
        />
        <DetailModal
          isOpen={!!selected}
          onClose={() => setSelected(null)}
          title={selected ? (selected.type === "operator" ? "Operator ma'lumoti" : selected.type === "application" ? "Ariza ma'lumoti" : "Filial ma'lumoti") : undefined}
        >
          {selected && selected.type === "operator" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">F.I.Sh</p>
                  <p className="text-sm font-medium text-navy-700 dark:text-white">{selected.raw.fullname}</p>
                </div>
                {selected.raw.phone && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Telefon</p>
                    <p className="text-sm font-medium text-navy-700 dark:text-white">{selected.raw.phone}</p>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                {selected.raw.fillial?.name && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Filial</p>
                    <p className="text-sm font-medium text-navy-700 dark:text-white">{selected.raw.fillial.name}</p>
                  </div>
                )}
                {selected.raw.merchant?.name && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Merchant</p>
                    <p className="text-sm font-medium text-navy-700 dark:text-white">{selected.raw.merchant.name}</p>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                {selected.raw.role && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Rol</p>
                    <p className="text-sm font-medium text-navy-700 dark:text-white">{selected.raw.role}</p>
                  </div>
                )}
                {selected.raw.work_status && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Ish holati</p>
                    <span className={`inline-block px-2 py-1 text-xs rounded-full ${selected.raw.work_status === 'WORKING' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                      {selected.raw.work_status === 'WORKING' ? 'Faol' : 'Bloklangan'}
                    </span>
                  </div>
                )}
              </div>
              {selected.raw.createdAt && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Yaratilgan sana</p>
                  <p className="text-sm font-medium text-navy-700 dark:text-white">{new Date(selected.raw.createdAt).toLocaleString('uz-UZ')}</p>
                </div>
              )}
            </div>
          )}
          {selected && selected.type === "application" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Ariza ID</p>
                  <p className="text-sm font-medium text-navy-700 dark:text-white">#{selected.raw.id}</p>
                </div>
                {selected.raw.status && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Holat</p>
                    <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                      selected.raw.status === 'APPROVED' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      selected.raw.status === 'REJECTED' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                      'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                    }`}>
                      {selected.raw.status === 'APPROVED' ? 'Tasdiqlangan' : selected.raw.status === 'REJECTED' ? 'Rad etilgan' : 'Kutilmoqda'}
                    </span>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">F.I.Sh</p>
                  <p className="text-sm font-medium text-navy-700 dark:text-white">{selected.raw.fullname}</p>
                </div>
                {selected.raw.phone && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Telefon</p>
                    <p className="text-sm font-medium text-navy-700 dark:text-white">{selected.raw.phone}</p>
                  </div>
                )}
              </div>
              {selected.raw.passport && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Pasport</p>
                  <p className="text-sm font-medium text-navy-700 dark:text-white">{selected.raw.passport}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                {selected.raw.amount && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Tovarlar summasi</p>
                    <p className="text-sm font-medium text-navy-700 dark:text-white">{(selected.raw.amount || 0).toLocaleString()} so'm</p>
                  </div>
                )}
                {selected.raw.payment_amount && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">To'lov summasi</p>
                    <p className="text-sm font-bold text-brand-500 dark:text-brand-400">{(selected.raw.payment_amount || 0).toLocaleString()} so'm</p>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                {selected.raw.percent && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Foiz</p>
                    <p className="text-sm font-medium text-navy-700 dark:text-white">{selected.raw.percent || 0}%</p>
                  </div>
                )}
                {selected.raw.expired_month && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Muddat</p>
                    <p className="text-sm font-medium text-navy-700 dark:text-white">{selected.raw.expired_month || 0} oy</p>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                {selected.raw.paid !== undefined && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">To'lov holati</p>
                    <span className={`inline-block px-2 py-1 text-xs rounded-full ${selected.raw.paid ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'}`}>
                      {selected.raw.paid ? "To'langan" : "To'lanmagan"}
                    </span>
                  </div>
                )}
              </div>
              {selected.raw.fillial?.name && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Filial</p>
                  <p className="text-sm font-medium text-navy-700 dark:text-white">{selected.raw.fillial.name}</p>
                </div>
              )}
              {selected.raw.user?.fullname && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Operator</p>
                  <p className="text-sm font-medium text-navy-700 dark:text-white">{selected.raw.user.fullname}</p>
                </div>
              )}
              {selected.raw.createdAt && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Yaratilgan sana</p>
                  <p className="text-sm font-medium text-navy-700 dark:text-white">{new Date(selected.raw.createdAt).toLocaleString('uz-UZ')}</p>
                </div>
              )}
            </div>
          )}
          {selected && selected.type === "fillial" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Nomi</p>
                  <p className="text-sm font-medium text-navy-700 dark:text-white">{selected.raw.name}</p>
                </div>
                {selected.raw.region && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Hudud</p>
                    <p className="text-sm font-medium text-navy-700 dark:text-white">{selected.raw.region}</p>
                  </div>
                )}
              </div>
              {selected.raw.address && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Manzil</p>
                  <p className="text-sm font-medium text-navy-700 dark:text-white">{selected.raw.address}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                {selected.raw.merchant?.name && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Merchant</p>
                    <p className="text-sm font-medium text-navy-700 dark:text-white">{selected.raw.merchant.name}</p>
                  </div>
                )}
                {selected.raw.work_status && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Ish holati</p>
                    <span className={`inline-block px-2 py-1 text-xs rounded-full ${selected.raw.work_status === 'WORKING' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                      {selected.raw.work_status === 'WORKING' ? 'Faol' : 'Bloklangan'}
                    </span>
                  </div>
                )}
              </div>
              {selected.raw.inn && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">INN</p>
                    <p className="text-sm font-medium text-navy-700 dark:text-white">{selected.raw.inn}</p>
                  </div>
                  {selected.raw.nds && (
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">NDS</p>
                      <p className="text-sm font-medium text-navy-700 dark:text-white">{selected.raw.nds}</p>
                    </div>
                  )}
                </div>
              )}
              {selected.raw.director_name && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Direktor</p>
                    <p className="text-sm font-medium text-navy-700 dark:text-white">{selected.raw.director_name}</p>
                  </div>
                  {selected.raw.director_phone && (
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Direktor telefoni</p>
                      <p className="text-sm font-medium text-navy-700 dark:text-white">{selected.raw.director_phone}</p>
                    </div>
                  )}
                </div>
              )}
              {selected.raw.bank_name && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Bank</p>
                  <p className="text-sm font-medium text-navy-700 dark:text-white">{selected.raw.bank_name}</p>
                </div>
              )}
              {selected.raw.hisob_raqam && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Hisob raqam</p>
                    <p className="text-sm font-medium text-navy-700 dark:text-white">{selected.raw.hisob_raqam}</p>
                  </div>
                  {selected.raw.mfo && (
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">MFO</p>
                      <p className="text-sm font-medium text-navy-700 dark:text-white">{selected.raw.mfo}</p>
                    </div>
                  )}
                </div>
              )}
              {selected.raw.createdAt && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Yaratilgan sana</p>
                  <p className="text-sm font-medium text-navy-700 dark:text-white">{new Date(selected.raw.createdAt).toLocaleString('uz-UZ')}</p>
                </div>
              )}
            </div>
          )}
        </DetailModal>
      </div>
    </nav>
  );
};

export default Navbar;
