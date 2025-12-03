import React from "react";
import { useLocation } from "react-router-dom";
import DetailModal from "./DetailModalNew";
import apiReal from "lib/api";
import demoApi from "lib/demoApi";
import PhoneInput from "components/PhoneInput";
import CustomSelect from "components/dropdown/CustomSelect";
import CustomFileInput from "components/input/CustomFileInput";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: any) => Promise<void> | void;
  initial?: any;
  type: "user" | "fillial";
};

const REGIONS = [
  "ANDIJON",
  "BUXORO",
  "FARGONA",
  "JIZZAX",
  "XORAZM",
  "NAMANGAN",
  "NAVOIY",
  "QASHQADARYO",
  "QORAQALPOQ",
  "SAMARQAND",
  "SIRDARYO",
  "SURXONDARYO",
  "TOSHKENT",
  "TOSHKENT_SHAHAR",
];

export default function EditModal({ isOpen, onClose, onSave, initial, type }: Props) {
  const location = useLocation();
  const api = React.useMemo(() => {
    const isDemoMode = window.location.pathname.includes('/demo');
    return isDemoMode ? demoApi : apiReal;
  }, [location.pathname]);
  
  const [form, setForm] = React.useState<any>(initial ?? {});
  const [fillials, setFillials] = React.useState<any[]>([]);
  // focus flags removed — we keep input simple with separate prefix

  React.useEffect(() => {
    // Initialize form from initial and keep only the last 9 digits for phone fields (we store the local tail)
    const init = initial ?? {};
    const getTail9 = (v: any) => {
      const d = String(v ?? "").replace(/\D/g, "");
      return d ? (d.length > 9 ? d.slice(-9) : d) : "";
    };
  const formatted: any = { ...init };
    if (init.phone) formatted.phone = getTail9(init.phone);
    if (init.director_phone) formatted.director_phone = getTail9(init.director_phone);
    setForm(formatted);
  }, [initial]);

  React.useEffect(() => {
    let mounted = true;
    api.listFillials({ page: 1, pageSize: 200 }).then((r) => {
      if (!mounted) return;
      setFillials(r.items);
    });
    return () => {
      mounted = false;
    };
  }, [api]);

  const update = (key: string, value: any) => setForm((s: any) => ({ ...s, [key]: value }));

  const onFile = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const f = ev.target.files && ev.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => update("image", reader.result as string);
    reader.readAsDataURL(f);
  };

  // We store phone fields as the 9-digit local tail while editing; +998 is fixed on save.

  // No phone formatting — keep raw values for both user.phone and director_phone

  const submit = async () => {
    const payload = { ...form } as any;
    if (payload.phone) {
      const p = String(payload.phone).replace(/\D/g, "").slice(-9);
      payload.phone = p ? `+998${p}` : "";
    }
    if (payload.director_phone) {
      const d = String(payload.director_phone).replace(/\D/g, "").slice(-9);
      payload.director_phone = d ? `+998${d}` : "";
    }
    await onSave(payload);
    onClose();
  };

  return (
    <DetailModal title={initial ? `Edit ${type}` : `Add ${type}`} isOpen={isOpen} onClose={onClose}>
      <div className="space-y-4">
        {type === "user" ? (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700">Full name</label>
              <input value={form.fullname ?? ""} onChange={(e) => update("fullname", e.target.value)} className="mt-1 block w-full rounded-md border px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone</label>
              <div className="mt-1">
                <PhoneInput value={form.phone ?? ""} onChange={(v) => update("phone", v)} placeholder="901234567" />
              </div>
            </div>
            {initial ? (
              <div>
                <label className="block text-sm font-medium text-gray-700">Work status</label>
                <CustomSelect
                  value={form.work_status ?? "WORKING"}
                  onChange={(value) => update("work_status", value)}
                  options={[
                    { value: "WORKING", label: "WORKING" },
                    { value: "BLOCKED", label: "BLOCKED" }
                  ]}
                />
              </div>
            ) : null}
            {/* Password is managed via Change password modal; no inline password field here. */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Image (file)</label>
              <div className="mt-1">
                <CustomFileInput
                  onChange={onFile}
                  accept="image/*"
                  value={form.image}
                  placeholder="Choose image file"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Fillial</label>
              <CustomSelect
                value={form.fillial_id ?? (form.fillial?.id ?? "")}
                onChange={(value) => {
                  const v = value === "" ? null : Number(value);
                  const fillialsList = Array.isArray(fillials) ? fillials : [];
                  const f = fillialsList.find((x) => x.id === v) ?? null;
                  update("fillial_id", v);
                  update("fillial", f);
                }}
                options={[
                  { value: "", label: "-- select fillial --" },
                  ...(Array.isArray(fillials) ? fillials : []).map((f) => ({ value: f.id.toString(), label: f.name }))
                ]}
              />
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input value={form.name ?? ""} onChange={(e) => update("name", e.target.value)} className="mt-1 block w-full rounded-md border px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Address</label>
              <input value={form.address ?? ""} onChange={(e) => update("address", e.target.value)} className="mt-1 block w-full rounded-md border px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Region</label>
              <CustomSelect
                value={form.region ?? ""}
                onChange={(value) => update("region", value)}
                options={[
                  { value: "", label: "-- select region --" },
                  ...REGIONS.map((r) => ({ value: r, label: r }))
                ]}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">NDS</label>
              <input value={form.nds ?? ""} onChange={(e) => update("nds", e.target.value)} className="mt-1 block w-full rounded-md border px-3 py-2" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Hisob raqam</label>
                <input value={form.hisob_raqam ?? ""} onChange={(e) => update("hisob_raqam", e.target.value)} className="mt-1 block w-full rounded-md border px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Bank name</label>
                <input value={form.bank_name ?? ""} onChange={(e) => update("bank_name", e.target.value)} className="mt-1 block w-full rounded-md border px-3 py-2" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">MFO</label>
                <input value={form.mfo ?? ""} onChange={(e) => update("mfo", e.target.value)} className="mt-1 block w-full rounded-md border px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">INN</label>
                <input value={form.inn ?? ""} onChange={(e) => update("inn", e.target.value)} className="mt-1 block w-full rounded-md border px-3 py-2" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Director name</label>
                <input value={form.director_name ?? ""} onChange={(e) => update("director_name", e.target.value)} className="mt-1 block w-full rounded-md border px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Director phone</label>
                  <div className="mt-1">
                    <PhoneInput value={form.director_phone ?? ""} onChange={(v) => update("director_phone", v)} placeholder="901234567" />
                  </div>
              </div>
            </div>
            {initial ? (
              <div>
                <label className="block text-sm font-medium text-gray-700">Work status</label>
                <CustomSelect
                  value={form.work_status ?? "WORKING"}
                  onChange={(value) => update("work_status", value)}
                  options={[
                    { value: "WORKING", label: "WORKING" },
                    { value: "BLOCKED", label: "BLOCKED" }
                  ]}
                />
              </div>
            ) : null}
            <div>
              <label className="block text-sm font-medium text-gray-700">Image (file)</label>
              <div className="mt-1">
                <CustomFileInput
                  onChange={onFile}
                  accept="image/*"
                  value={form.image}
                  placeholder="Choose image file"
                />
              </div>
            </div>
          </>
        )}

        <div className="flex justify-end">
          <button onClick={onClose} className="mr-2 rounded bg-gray-200 px-4 py-2">Cancel</button>
          <button onClick={submit} className="rounded bg-blue-600 text-white px-4 py-2">Save</button>
        </div>
      </div>
    </DetailModal>
  );
}
