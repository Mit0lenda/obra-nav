import { useContext } from "react";

import { ObraScopeContext } from "./context";

export function useObraScope() {
  const context = useContext(ObraScopeContext);
  if (!context) {
    throw new Error("useObraScope deve ser usado dentro de ObraScopeProvider");
  }
  return context;
}
