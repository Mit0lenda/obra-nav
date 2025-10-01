import { createContext } from "react";

export type ObraScopeContextType = {
  obra: string;
  setObra: (value: string) => void;
};

export const obraScopeStorageKey = "nexium_obra_scope_v1";

export const ObraScopeContext = createContext<ObraScopeContextType | undefined>(
  undefined
);
