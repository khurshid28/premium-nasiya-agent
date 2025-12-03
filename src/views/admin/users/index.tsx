import React from "react";
import DetailModal from "components/modal/DetailModalNew";
import Toast from "components/toast/ToastNew";
import EditModal from "components/modal/EditModal";
import AvatarName from "components/AvatarName";
import Pagination from "components/pagination";
import PasswordModal from "components/PasswordModal";
import CustomSelect from "components/dropdown/CustomSelect";
import { useLocation } from "react-router-dom";
import apiReal from "lib/api";
import demoApi from "lib/demoApi";
import { formatPhone, statusBadge, formatDateShort } from "lib/formatters";
import { exportSingleTable } from "lib/exportExcel";

// Mapped to your Prisma `User` model. Adjust field names if needed.
type User = {
  id: number;
  fullname: string;
  image?: string | null;
  phone?: string | null;
  password?: string | null; // not displayed
  role?: string | null; // Role enum
  work_status?: string | null; // WORK_STATUS enum
  createdAt?: string;
  updatedAt?: string | null;
  merchant?: { id: number; name: string } | null;
  fillial?: { id: number; name: string } | null;
};


const Users = (): JSX.Element => {
  const location = useLocation();
  const api = React.useMemo(() => {
    const isDemo = location.pathname.startsWith('/demo');
    console.log('Users component - pathname:', location.pathname, 'isDemo:', isDemo);
    console.log('Users component - using API:', isDemo ? 'demoApi' : 'apiReal');
    return isDemo ? demoApi : apiReal;
  }, [location.pathname]);

  const [users, setUsers] = React.useState<User[]>([]);
  const [search, setSearch] = React.useState("");
  const [fillials, setFillials] = React.useState<any[]>([]);
  const [fillialFilter, setFillialFilter] = React.useState<number | "all">("all");
  const [merchants, setMerchants] = React.useState<any[]>([]);
  const [selectedMerchantId, setSelectedMerchantId] = React.useState<number | "all">("all");
  
  // Client-side pagination
  const [page, setPage] = React.useState<number>(1);
  const [pageSize, setPageSize] = React.useState<number>(10);
  
  const [selected, setSelected] = React.useState<User | null>(null);
  const [open, setOpen] = React.useState(false);
  const [passwordOpen, setPasswordOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [editInitial, setEditInitial] = React.useState<any>(null);
  const [toastOpen, setToastOpen] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState("");
  const [toastType, setToastType] = React.useState<'success' | 'error' | 'info' | 'warning'>('info');

  // Filter users
  const filtered = React.useMemo(() => {
    const s = search.trim().toLowerCase();
    const usersList = Array.isArray(users) ? users : [];
    return usersList.filter((u) => {
      const matchesSearch = !s || 
        u.fullname?.toLowerCase().includes(s) || 
        u.phone?.toLowerCase().includes(s);
      const matchesFillial = fillialFilter === "all" || u.fillial?.id === fillialFilter;
      const matchesMerchant = selectedMerchantId === "all" || u.merchant?.id === Number(selectedMerchantId);
      return matchesSearch && matchesFillial && matchesMerchant;
    });
  }, [users, search, fillialFilter, selectedMerchantId]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setPage(1);
  }, [search, fillialFilter, selectedMerchantId]);

  // Paginate filtered data
  const pageData = React.useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  React.useEffect(() => {
    // Fetch all users from API
    let mounted = true;
    const abortController = new AbortController();
    
    const timeoutId = setTimeout(async () => {
      if (!mounted || abortController.signal.aborted) return;
      
      try {
        const res = await api.listUsers({});
        if (!mounted || abortController.signal.aborted) return;
        
        setUsers(res.items || []);
      } catch (err: any) {
        if (!mounted || abortController.signal.aborted) return;
        if (err.name === 'AbortError') return;
        
        setUsers([]);
      }
    }, 150);

    return () => {
      mounted = false;
      abortController.abort();
      clearTimeout(timeoutId);
    };
  }, [api]);

  React.useEffect(() => {
    let mounted = true;
    Promise.all([
      api.listFillials({}),
      (api as any).listMerchants({ page: 1, pageSize: 100 })
    ]).then(([filialsRes, merchantsRes]) => {
      if (!mounted) return;
      setFillials(filialsRes.items || []);
      setMerchants(merchantsRes.items || []);
    }).catch(() => {
      if (!mounted) return;
      setFillials([]);
      setMerchants([]);
    });
    return () => { mounted = false; };
  }, [api]);

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-xl sm:text-2xl font-semibold dark:text-white">Operatorlar</h2>
      </div>
      
      {/* Mobile: Stack everything vertically */}
      <div className="flex flex-col gap-3 mb-4">
        {/* Search input - full width on mobile, limited on desktop */}
        <div className="relative w-full sm:w-80 lg:w-96">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 rounded-xl border border-gray-200 dark:border-navy-600 bg-white dark:bg-navy-700 px-4 pl-10 w-full text-sm font-medium text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 shadow-sm hover:shadow-md hover:border-brand-500 dark:hover:border-brand-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            placeholder="Ism yoki telefon bo'yicha qidirish"
          />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        
        {/* Buttons and filters row */}
        <div className="flex flex-wrap gap-2">
          <button onClick={() => { 
            if (location.pathname.startsWith('/demo')) {
              setEditInitial(null);
              setEditOpen(true);
            } else {
              setToastType("error");
              setToastMessage("Vaqtincha bu funksiya ishlamayapti");
              setToastOpen(true);
            }
          }} className="h-11 rounded-xl bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 px-4 text-white font-medium shadow-sm hover:shadow-md transition-all duration-200 text-sm whitespace-nowrap">
            <span className="hidden sm:inline">Operator Qo'shish</span>
            <span className="sm:hidden">+ Operator</span>
          </button>
          
          <CustomSelect
            value={String(selectedMerchantId)}
            onChange={(value) => {
              setSelectedMerchantId(value === "all" ? "all" : Number(value));
              setFillialFilter("all");
            }}
            options={[
              { value: "all", label: "Barcha merchantlar" },
              ...(Array.isArray(merchants) ? merchants : []).map((m) => ({ 
                value: String(m.id), 
                label: m.name || `Merchant #${m.id}` 
              }))
            ]}
            className="min-w-[120px] sm:min-w-[160px] flex-1 sm:flex-none"
          />
          
          <CustomSelect
            value={String(fillialFilter)}
            onChange={(value) => setFillialFilter(value === "all" ? "all" : Number(value))}
            options={[
              { value: "all", label: "Barcha filiallar" },
              ...(Array.isArray(fillials) ? fillials : [])
                .filter(f => selectedMerchantId === "all" || f.merchant_id === Number(selectedMerchantId))
                .map(f => ({ value: String(f.id), label: f.name }))
            ]}
            className="min-w-[120px] sm:min-w-[150px] flex-1 sm:flex-none"
          />
          
          <CustomSelect
            value={String(pageSize)}
            onChange={(value) => setPageSize(Number(value))}
            options={[
              { value: "5", label: "5 ta" },
              { value: "10", label: "10 ta" },
              { value: "25", label: "25 ta" },
              { value: "50", label: "50 ta" }
            ]}
            className="min-w-[100px] sm:min-w-[120px]"
          />
          
          <button
            onClick={async () => {
              const rows = filtered.map((u: any) => ({
                ID: u.id,
                "F.I.Sh": u.fullname,
                Telefon: u.phone ?? "",
                Filial: u.fillial?.name ?? "",
                Rol: u.role ?? "",
                Yaratildi: u.createdAt ?? "",
              }));
              exportSingleTable({ rows, title: "Operatorlar", dateLabel: "Barcha sanalar" });
            }}
            className="h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-3 sm:px-4 text-white inline-flex items-center gap-2 text-sm whitespace-nowrap"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <polyline points="7 10 12 15 17 10" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <line x1="12" y1="15" x2="12" y2="3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="hidden sm:inline">Yuklab olish</span>
            <span className="sm:hidden">Excel</span>
          </button>
          
          <button
            onClick={() => window.location.reload()}
            className="flex-shrink-0 h-11 rounded-xl bg-green-600 hover:bg-green-700 px-3 sm:px-4 text-white inline-flex items-center gap-2 text-sm whitespace-nowrap transition-all duration-200 active:scale-95"
            title="Sahifani yangilash"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4">
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="hidden sm:inline">Yangilash</span>
          </button>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-600">
        <table className="w-full table-auto min-w-[640px]">
          <thead className="bg-gray-50 dark:bg-navy-800 text-left text-xs sm:text-sm text-gray-600 dark:text-gray-300">
            <tr>
              <th className="px-3 sm:px-4 py-2 sm:py-3">ID</th>
              <th className="px-3 sm:px-4 py-2 sm:py-3">To'liq ismi</th>
              <th className="px-3 sm:px-4 py-2 sm:py-3 hidden md:table-cell">Filial</th>
              <th className="px-3 sm:px-4 py-2 sm:py-3">Telefon</th>
              <th className="px-3 sm:px-4 py-2 sm:py-3 hidden sm:table-cell">Holat</th>
              <th className="px-3 sm:px-4 py-2 sm:py-3 hidden lg:table-cell">Parol</th>
              <th className="px-3 sm:px-4 py-2 sm:py-3 hidden lg:table-cell">Yaratildi</th>
            </tr>
          </thead>
          <tbody className="text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-navy-800">
            {pageData.map((u) => (
              <tr
                key={u.id}
                className="border-t border-gray-200 dark:border-gray-600 cursor-pointer hover:bg-gray-50 dark:hover:bg-navy-700"
                onClick={() => {
                  setSelected(u);
                  setOpen(true);
                }}
              >
                <td className="px-3 sm:px-4 py-2 text-xs sm:text-sm">{u.id}</td>
                <td className="px-3 sm:px-4 py-2">
                  <AvatarName image={u.image ?? null} name={u.fullname} size="sm" />
                </td>
                <td className="px-3 sm:px-4 py-2 text-xs sm:text-sm hidden md:table-cell">{u.fillial?.name ?? "-"}</td>
                <td className="px-3 sm:px-4 py-2 text-xs sm:text-sm">{formatPhone(u.phone)}</td>
                <td className="px-3 sm:px-4 py-2 hidden sm:table-cell">
                  {(() => {
                    const b = statusBadge(u.work_status);
                    return <span className={b.className}>{b.label}</span>;
                  })()}
                </td>
                <td className="px-3 sm:px-4 py-2 hidden lg:table-cell">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm">{u.password ? `••••${u.password.slice(-3)}` : "-"}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!u.password) {
                          setToastType("error");
                          setToastMessage(`No password available for ${u.fullname}\nLogin: ${u.phone ?? "-"}`);
                          setToastOpen(true);
                          return;
                        }
                        const payload = `Fillial: ${u.fillial?.name ?? "-"}\nFullname: ${u.fullname}\nLogin: ${u.phone ?? "-"}\nPassword: ${u.password}`;
                        navigator.clipboard
                          .writeText(payload)
                          .then(() => {
                            // Show fullname, login (phone), fillial and password in the toast on separate lines (demo only)
                            setToastType('success');
                            setToastMessage(payload);
                            setToastOpen(true);
                          })
                          .catch(() => {
                            setToastType('error');
                            setToastMessage(`Copy failed for ${u.fullname}\nLogin: ${u.phone ?? "-"}`);
                            setToastOpen(true);
                          });
                      }}
                      className="rounded-md bg-gray-100 px-2 py-1 text-xs"
                      title="Copy fillial, fullname, login, password"
                      type="button"
                    >
                      Copy
                    </button>
                  </div>
                </td>
                <td className="px-3 sm:px-4 py-2 text-xs sm:text-sm hidden lg:table-cell">{formatDateShort(u.createdAt)}</td>
              </tr>
            ))}
            <DetailModal
              title={selected ? `User: ${selected.fullname}` : "User details"}
              isOpen={open}
              onClose={() => {
                setOpen(false);
                setSelected(null);
              }}
            >
              {selected ? (
                <div className="space-y-2">
                  <div><strong>Fullname:</strong> {selected.fullname}</div>
                  <div><strong>Phone:</strong> {formatPhone(selected.phone)}</div>
                  <div><strong>Fillial:</strong> {selected.fillial?.name ?? "-"}</div>
                  {/* Role removed — fixed to USER */}
                  <div><strong>Work status:</strong> {(() => { const b = statusBadge(selected.work_status); return <span className={b.className}>{b.label}</span>; })()}</div>
                  <div className="mt-4 flex gap-2">
                    <button className="rounded bg-blue-600 px-3 py-1 text-white" onClick={() => { 
                      if (location.pathname.startsWith('/demo')) {
                        setEditInitial(selected);
                        setEditOpen(true);
                        setOpen(false);
                      } else {
                        setToastType("error");
                        setToastMessage("Vaqtincha bu funksiya ishlamayapti");
                        setToastOpen(true);
                      }
                    }}>Tahrirlash</button>
                    <button className="rounded bg-yellow-500 px-3 py-1 text-white" onClick={() => { 
                      if (location.pathname.startsWith('/demo')) {
                        setPasswordOpen(true);
                        setOpen(false);
                      } else {
                        setToastType("error");
                        setToastMessage("Vaqtincha bu funksiya ishlamayapti");
                        setToastOpen(true);
                      }
                    }}>Parolni o'zgartirish</button>
                  </div>
                </div>
              ) : null}
            </DetailModal>
            <PasswordModal isOpen={passwordOpen} onClose={() => setPasswordOpen(false)} onSave={async (newPassword) => {
              if (!selected) return;
              if (location.pathname.startsWith('/demo')) {
                setPasswordOpen(false);
                setToastType('success');
                setToastMessage('Parol o\'zgartirildi (Demo)');
                setToastOpen(true);
                return;
              }
              await api.updateUser(selected.id, { password: newPassword });
              setToastType('success');
              setToastMessage("Password updated");
              setToastOpen(true);
            }} />
            <EditModal
              isOpen={editOpen}
              onClose={() => { setEditOpen(false); setEditInitial(null); }}
              initial={editInitial}
              type="user"
              onSave={async (payload) => {
                if (location.pathname.startsWith('/demo')) {
                  setEditOpen(false);
                  setEditInitial(null);
                  setToastType('success');
                  setToastMessage(editInitial ? 'Operator tahrirlandi (Demo)' : 'Operator qo\'shildi (Demo)');
                  setToastOpen(true);
                  return;
                }
                if (editInitial && editInitial.id) {
                  await api.updateUser(editInitial.id, payload);
                } else {
                  await api.createUser(payload);
                }
                const res = await api.listUsers({});
                setUsers(res.items || []);
                setToastType('success');
                setToastMessage("Saved");
                setToastOpen(true);
              }}
            />
            {pageData.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-sm text-gray-500">
                  No results
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">{`${total} dan ${pageData.length} ta ko'rsatilmoqda`}</div>
        <Pagination page={page} totalPages={totalPages} onPageChange={(p) => setPage(p)} />
      </div>
  <Toast message={toastMessage} isOpen={toastOpen} onClose={() => setToastOpen(false)} type={toastType} />
    </div>
  );
};

export default Users;
