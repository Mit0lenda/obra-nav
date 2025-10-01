import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import { ObraScopeContext, obraScopeStorageKey, type ObraScopeContextType } from "./context";

function readStoredScope(): string {
  if (typeof window === "undefined") {
    return "todas";
  }

  try {
    return localStorage.getItem(obraScopeStorageKey) ?? "todas";
  } catch (error) {
    console.warn("Falha ao ler escopo da obra armazenado", error);
    return "todas";
  }
}

export function ObraScopeProvider({ children }: { children: ReactNode }) {
  const [obra, setObraState] = useState<string>(readStoredScope);

  const setObra = useCallback<ObraScopeContextType["setObra"]>((value) => {
    setObraState(value);
    try {
      localStorage.setItem(obraScopeStorageKey, value);
    } catch (error) {
      console.warn("Falha ao persistir escopo da obra", error);
    }
  }, []);

  const value = useMemo<ObraScopeContextType>(() => ({ obra, setObra }), [obra, setObra]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === obraScopeStorageKey && typeof event.newValue === "string") {
        setObraState(event.newValue);
      }
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return <ObraScopeContext.Provider value={value}>{children}</ObraScopeContext.Provider>;
}
