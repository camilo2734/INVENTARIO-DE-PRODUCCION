
import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Package, ScrollText, AlertTriangle, Flame, ChefHat } from 'lucide-react';

export const Layout: React.FC = () => {
  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/production', icon: ChefHat, label: 'Producción' },
    { to: '/sales', icon: ShoppingCart, label: 'Ventas' },
    { to: '/inventory', icon: Package, label: 'Inventario' },
    { to: '/recipes', icon: ScrollText, label: 'Catálogo & Recetas' },
    { to: '/alerts', icon: AlertTriangle, label: 'Alertas' },
  ];

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-50">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 border-r border-slate-800 text-white">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-2xl font-bold text-primary-500 flex items-center gap-2">
            <Flame size={28} fill="#FF6B2B" />
            <span className="bg-gradient-to-r from-primary-500 to-primary-400 bg-clip-text text-transparent">Umami Fénix</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">Gestión de Costos</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive
                    ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30 font-bold'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <item.icon size={20} />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50">
        <div className="max-w-7xl mx-auto pb-20 md:pb-0">
          <Outlet />
        </div>
      </main>

      {/* Mobile Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 flex justify-around p-3 z-50">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                isActive ? 'text-primary-500' : 'text-slate-500'
              }`
            }
          >
            <item.icon size={20} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
};
