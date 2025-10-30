import React from "react";
import DetailModal from "components/modal/DetailModalNew";
import Toast from "components/toast/Toast";
import EditModal from "components/modal/EditModal";
import AvatarName from "components/AvatarName";
import Pagination from "components/pagination";
import PasswordModal from "components/PasswordModal";
import CustomSelect from "components/dropdown/CustomSelect";
import api from "lib/api";
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
  const [users, setUsers] = React.useState<User[]>([]);
  const [search, setSearch] = React.useState("");
  const [fillials, setFillials] = React.useState<any[]>([]);
  const [fillialFilter, setFillialFilter] = React.useState<number | "all">("all");
  
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
  const [toastType, setToastType] = React.useState<"main" | "success" | "error">("main");

  // Filter users
  const filtered = React.useMemo(() => {
    const s = search.trim().toLowerCase();
    const usersList = Array.isArray(users) ? users : [];
    return usersList.filter((u) => {
      const matchesSearch = !s || 
        u.fullname?.toLowerCase().includes(s) || 
        u.phone?.toLowerCase().includes(s);
      const matchesFillial = fillialFilter === "all" || u.fillial?.id === fillialFilter;
      return matchesSearch && matchesFillial;
    });
  }, [users, search, fillialFilter]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setPage(1);
  }, [search, fillialFilter]);

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
        console.log('Fetching users from API...');
        const res = await api.listUsers({});
        if (!mounted || abortController.signal.aborted) return;
        
        console.log('Users response:', res);
        setUsers(res.items || []);
      } catch (err: any) {
        if (!mounted || abortController.signal.aborted) return;
        if (err.name === 'AbortError') return;
        
        console.error("Error fetching users:", err);
        console.error("Error details:", {
          message: err.message,
          status: err.status,
          body: err.body
        });
        setUsers([]);
      }
    }, 150);

    return () => {
      mounted = false;
      abortController.abort();
      clearTimeout(timeoutId);
    };
  }, []);

  React.useEffect(() => {
    let mounted = true;
    api.listFillials({}).then((res) => {
      if (!mounted) return;
      setFillials(res.items || []);
    });
    return () => { mounted = false; };
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold dark:text-white">Operatorlar</h2>
        </div>
          <div className="flex gap-3">
          <div className="relative">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-11 rounded-xl border border-gray-200 dark:border-navy-600 bg-white dark:bg-navy-700 px-4 pl-10 w-80 text-sm font-medium text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 shadow-sm hover:shadow-md hover:border-brand-500 dark:hover:border-brand-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              placeholder="Ism yoki telefon bo'yicha qidirish"
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <button onClick={() => { setEditInitial(null); setEditOpen(true); }} className="h-11 rounded-xl bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 px-4 text-white font-medium shadow-sm hover:shadow-md transition-all duration-200">Operator Qo'shish</button>
          <CustomSelect
            value={String(fillialFilter)}
            onChange={(value) => setFillialFilter(value === "all" ? "all" : Number(value))}
            options={[
              { value: "all", label: "Barcha filiallar" },
              ...(Array.isArray(fillials) ? fillials : []).map(f => ({ value: String(f.id), label: f.name }))
            ]}
            className="min-w-[150px]"
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
            className="min-w-[120px]"
          />
          
          <button
            onClick={async () => {
              const res = await api.listUsers({});
              const rows = (res.items ?? []).map((u: any) => ({
                ID: u.id,
                Fullname: u.fullname,
                Phone: u.phone ?? "",
                Fillial: u.fillial?.name ?? "",
                Role: u.role ?? "",
                Created: u.createdAt ?? "",
              }));
              exportSingleTable({ rows, title: "Users", dateLabel: "All dates" });
            }}
            className="h-10 rounded bg-indigo-600 hover:bg-indigo-700 px-3 text-white"
          >
            Operatorlarni Eksport Qilish
          </button>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-600">
        <table className="w-full table-auto min-w-[640px]">
          <thead className="bg-gray-50 dark:bg-navy-800 text-left text-sm text-gray-600 dark:text-gray-300">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">To'liq ismi</th>
              <th className="px-4 py-3">Filial</th>
              <th className="px-4 py-3">Telefon</th>
              <th className="px-4 py-3">Holat</th>
              <th className="px-4 py-3">Parol</th>
              <th className="px-4 py-3">Yaratildi</th>
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
                <td className="px-4 py-2">{u.id}</td>
                <td className="px-4 py-2">
                  <AvatarName image={u.image ?? null} name={u.fullname} size="sm" />
                </td>
                <td className="px-4 py-2">{u.fillial?.name ?? "-"}</td>
                <td className="px-4 py-2">{formatPhone(u.phone)}</td>
                <td className="px-4 py-2">
                  {(() => {
                    const b = statusBadge(u.work_status);
                    return <span className={b.className}>{b.label}</span>;
                  })()}
                </td>
                <td className="px-4 py-2">
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
                            setToastType("main");
                            setToastMessage(payload);
                            setToastOpen(true);
                          })
                          .catch(() => {
                            setToastType("error");
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
                <td className="px-4 py-2">{formatDateShort(u.createdAt)}</td>
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
                    <button className="rounded bg-blue-600 px-3 py-1 text-white" onClick={() => { setEditInitial(selected); setEditOpen(true); }}>Edit</button>
                    <button className="rounded bg-yellow-500 px-3 py-1 text-white" onClick={(e) => { e.stopPropagation(); setPasswordOpen(true); }}>Change password</button>
                  </div>
                </div>
              ) : null}
            </DetailModal>
            <PasswordModal isOpen={passwordOpen} onClose={() => setPasswordOpen(false)} onSave={async (newPassword) => {
              if (!selected) return;
              await api.updateUser(selected.id, { password: newPassword });
              setToastType("success");
              setToastMessage("Password updated");
              setToastOpen(true);
            }} />
            <EditModal
              isOpen={editOpen}
              onClose={() => { setEditOpen(false); setEditInitial(null); }}
              initial={editInitial}
              type="user"
              onSave={async (payload) => {
                if (editInitial && editInitial.id) {
                  await api.updateUser(editInitial.id, payload);
                } else {
                  await api.createUser(payload);
                }
                const res = await api.listUsers({});
                setUsers(res.items || []);
                setToastType("success");
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

      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-gray-600 dark:text-gray-400">{`${total} dan ${pageData.length} ta ko'rsatilmoqda`}</div>
        <Pagination page={page} totalPages={totalPages} onPageChange={(p) => setPage(p)} />
      </div>
  <Toast message={toastMessage} isOpen={toastOpen} onClose={() => setToastOpen(false)} type={toastType} />
    </div>
  );
};

export default Users;
