import { Outlet, NavLink } from "react-router-dom";

export default function InventoryLayout() {
  const links = [
    { to: "/inventory", label: "Estoque" },
    { to: "/inventory/entrada-xml", label: "Entrada XML" },
    { to: "/inventory/baixa-manual", label: "Baixa Manual" },
    { to: "/inventory/relatorios", label: "Relatórios" },
  ];

  return (
    <div className="space-y-4">
      <header className="rounded-lg border p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-md bg-primary/10 grid place-items-center text-primary font-bold">EW</div>
          <div>
            <div className="font-semibold">EstoqueWorks</div>
            <div className="text-xs text-muted-foreground">Módulo de Controle de Estoque</div>
          </div>
        </div>
        <nav className="flex gap-2">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end className={({ isActive }) => `text-sm px-3 py-1.5 rounded-md border ${isActive ? 'bg-muted' : 'hover:bg-muted/50'}`}>
              {l.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <Outlet />
    </div>
  );
}
