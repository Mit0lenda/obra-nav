import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const fmtDate = (d: Date | string | number, pattern = "dd/MM/yyyy") =>
  format(new Date(d), pattern, { locale: ptBR });

export const fmtDateTime = (d: Date | string | number) =>
  format(new Date(d), "dd/MM/yyyy HH:mm", { locale: ptBR });
