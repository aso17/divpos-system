import React, { useState, useCallback, useRef } from "react";
import { Layers, Tag, Clock, PlusSquare } from "lucide-react";

import PackagesList from "../package/PackageList";
import CategoriesList from "../category/CategoryList";
import MasterServiceList from "../masterservice/MasterServiceList";

// ─── Konstanta di luar komponen ────────────────────────────────────────────────
// FIX: Tidak perlu useMemo — array statis, tidak bergantung state/props apapun.
// Menaruhnya di luar komponen = objek dibuat sekali saat module di-load, bukan
// setiap render.
const TABS = [
  {
    id: "packages",
    label: "Daftar Paket",
    addLabel: "Paket",
    icon: <Tag size={13} />,
  },
  {
    id: "categories",
    label: "Kategori Jasa",
    addLabel: "Kategori",
    icon: <Clock size={13} />,
  },
  {
    id: "services",
    label: "Layanan",
    addLabel: "Layanan",
    icon: <Layers size={13} />,
  },
];

const CatalogList = () => {
  const [activeTab, setActiveTab] = useState("packages");

  // FIX: mountedTabs — lazy mount pattern.
  // Set ini menyimpan tab yang PERNAH dikunjungi.
  // Komponen hanya dirender pertama kali user klik tab tersebut,
  // lalu tetap di DOM tapi disembunyikan (display:none via hidden).
  // Ini mencegah 3x fetch saat halaman pertama dibuka, sekaligus
  // mempertahankan state (search, pagination) jika user kembali ke tab.
  const [mountedTabs, setMountedTabs] = useState(() => new Set(["packages"]));

  const packageRef = useRef();
  const categoryRef = useRef();
  const serviceRef = useRef();

  const refMap = {
    packages: packageRef,
    categories: categoryRef,
    services: serviceRef,
  };

  // FIX: handleAddAction dengan lookup map — lebih bersih dari ternary 3 level
  const handleAddAction = useCallback(() => {
    refMap[activeTab]?.current?.openForm();
  }, [activeTab]);

  // FIX: activeTab langsung dipakai untuk lookup — tidak perlu useMemo
  const activeTabData = TABS.find((t) => t.id === activeTab);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    // Tandai tab ini sudah pernah dikunjungi → akan di-mount
    setMountedTabs((prev) => new Set(prev).add(tabId));
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-32 md:pb-10 font-sans">
      {/* ── Sticky Header ── */}
      <div className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-20">
        <div
          className="max-w-screen-xl mx-auto px-4 md:px-6 py-3.5
          flex items-center justify-between gap-4 flex-wrap"
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center
              shadow-sm shadow-emerald-200 flex-shrink-0"
            >
              <Layers size={16} strokeWidth={2.5} className="text-white" />
            </div>
            <div>
              <h1 className="text-sm md:text-base font-bold text-gray-900 leading-tight">
                Katalog Layanan
              </h1>
              <p className="text-[10px] text-gray-400 hidden sm:block mt-0.5 font-medium">
                Kelola paket, kategori, dan master jasa outlet Anda
              </p>
            </div>
          </div>

          {/* Tombol tambah desktop */}
          <button
            onClick={handleAddAction}
            className="hidden md:flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white
              rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all shadow-lg uppercase"
          >
            <PlusSquare size={18} />
            {/* FIX: lookup langsung dari data tab — tidak ada ternary bertingkat */}
            Tambah {activeTabData?.addLabel}
          </button>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 md:px-6 py-4 space-y-4">
        {/* ── Tab switcher ── */}
        <div className="flex px-1">
          <div
            className="flex bg-white border border-gray-200 rounded-xl p-1 gap-1
            shadow-sm overflow-x-auto w-fit max-w-full"
          >
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs
                  font-semibold transition-all duration-150 whitespace-nowrap
                  ${
                    activeTab === tab.id
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                  }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Konten tab ── */}
        <div
          className="bg-white rounded-2xl border border-gray-100 shadow-sm
          overflow-hidden min-h-[500px]"
        >
          {/* FIX: Lazy mount — render hanya jika sudah pernah dikunjungi,
              sembunyikan jika bukan tab aktif.
              Manfaat:
              1. Tidak ada fetch ganda saat halaman pertama dibuka
              2. State (search, pagination) tetap tersimpan saat pindah tab
              3. Animasi hanya terpicu saat tab pertama kali dibuka (key unik) */}

          {mountedTabs.has("packages") && (
            <div
              key="packages"
              className={`animate-in fade-in slide-in-from-bottom-2 duration-200
                ${activeTab !== "packages" ? "hidden" : ""}`}
            >
              <PackagesList ref={packageRef} />
            </div>
          )}

          {mountedTabs.has("categories") && (
            <div
              key="categories"
              className={`animate-in fade-in slide-in-from-bottom-2 duration-200
                ${activeTab !== "categories" ? "hidden" : ""}`}
            >
              <CategoriesList ref={categoryRef} />
            </div>
          )}

          {mountedTabs.has("services") && (
            <div
              key="services"
              className={`animate-in fade-in slide-in-from-bottom-2 duration-200
                ${activeTab !== "services" ? "hidden" : ""}`}
            >
              <MasterServiceList ref={serviceRef} />
            </div>
          )}
        </div>
      </div>

      {/* ── FAB Mobile ── */}
      <button
        onClick={handleAddAction}
        className="md:hidden fixed bottom-28 right-6 w-12 h-12 bg-emerald-600 text-white
          rounded-full shadow-2xl shadow-emerald-200 flex items-center justify-center z-40
          active:scale-90 border-4 border-white transition-all"
      >
        <PlusSquare size={20} />
      </button>
    </div>
  );
};

export default CatalogList;
