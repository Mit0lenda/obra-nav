import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type ObraScopeContextType = {
  obra: string; // 'todas' | nome da obra
  setObra: (v: string) => void;
};

const ObraScopeContext = createContext<ObraScopeContextType | undefined>(undefined);
const LS_KEY = "nexium_obra_scope_v1";

export function ObraScopeProvider({ children }: { children: React.ReactNode }) {
  const [obra, setObraState] = useState<string>(() => localStorage.getItem(LS_KEY) || "todas");

  const setObra = (v: string) => {
    setObraState(v);
    try { localStorage.setItem(LS_KEY, v); } catch {}
  };

  const value = useMemo(() => ({ obra, setObra }), [obra]);

  // Sync across tabs (optional nice-to-have)
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === LS_KEY && typeof e.newValue === "string") {
        setObraState(e.newValue);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return <ObraScopeContext.Provider value={value}>{children}</ObraScopeContext.Provider>;
}

export function useObraScope() {
  const ctx = useContext(ObraScopeContext);
  if (!ctx) throw new Error("useObraScope deve ser usado dentro de ObraScopeProvider");
  return ctx;
}
