import { Outlet, NavLink } from "react-router-dom";

export default function InventoryLayout() {
  const links = [
    { to: "/inventory", label: "Estoque", icon: "📦" },
    { to: "/inventory/entrada-xml", label: "Entrada XML", icon: "📄" },
    { to: "/inventory/baixa-manual", label: "Baixa Manual", icon: "📝" },
    { to: "/inventory/relatorios", label: "Relatórios", icon: "📊" },
  ];

  return (
    <div className="space-y-6">
      <header className="rounded-lg border shadow-soft card-hover p-6 gradient-secondary text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-white/20 grid place-items-center text-white font-bold text-lg backdrop-blur-sm">
              EW
            </div>
            <div>
              <div className="font-semibold text-lg">EstoqueWorks</div>
              <div className="text-sm text-white/80">Módulo de Controle de Estoque</div>
            </div>
          </div>
          <nav className="flex gap-2">
            {links.map((l) => (
              <NavLink 
                key={l.to} 
                to={l.to} 
                end 
                className={({ isActive }) => 
                  `text-sm px-4 py-2 rounded-lg border backdrop-blur-sm transition-all flex items-center gap-2 ${
                    isActive 
                      ? 'bg-white/20 border-white/30 text-white font-medium' 
                      : 'border-white/20 text-white/80 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                <span className="text-base">{l.icon}</span>
                {l.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <Outlet />
    </div>
  );
}
