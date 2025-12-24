import React, { useState, useMemo } from 'react';
import { MenuItem, Order, User, InventoryItem, WasteRecord, Supplier } from '../types';

interface StaffDashboardProps {
  menuItems: MenuItem[];
  orders: Order[];
  onUpdateMenu: (items: MenuItem[]) => void;
  onUpdateOrder: (order: Order) => void;
  currentUser: User;
}

const StaffDashboard: React.FC<StaffDashboardProps> = ({ menuItems, orders, onUpdateMenu, onUpdateOrder, currentUser }) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'kanban' | 'menu' | 'inventory' | 'suppliers' | 'bi'>('summary');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [isWasteModalOpen, setIsWasteModalOpen] = useState(false);

  // --- MOCK DATA INVENTORY ---
  const [inventory, setInventory] = useState<InventoryItem[]>([
    { id: 'i1', name: 'Leche Entera 1L', category: 'Lácteos', stock: 5, minStock: 15, unit: 'unidades', cost: 0.95, expiryDate: '2024-05-20', supplierId: 's1' },
    { id: 'i2', name: 'Pan Brioche', category: 'Panadería', stock: 45, minStock: 20, unit: 'unidades', cost: 0.25, expiryDate: '2024-05-12', supplierId: 's2' },
    { id: 'i3', name: 'Pechuga Pollo', category: 'Proteínas', stock: 12, minStock: 10, unit: 'kg', cost: 4.50, expiryDate: '2024-05-11', supplierId: 's1' },
    { id: 'i4', name: 'Naranjas Pack', category: 'Frutas/Verduras', stock: 8, minStock: 12, unit: 'kg', cost: 1.20, expiryDate: '2024-05-15', supplierId: 's3' },
    { id: 'i5', name: 'Detergente Multiusos', category: 'Limpieza', stock: 2, minStock: 5, unit: 'galones', cost: 8.00, expiryDate: '2025-10-01', supplierId: 's4' },
  ]);

  const [suppliers] = useState<Supplier[]>([
    { id: 's1', name: 'Lácteos Andes', phone: '0991234567', email: 'ventas@andes.com', category: 'Lácteos', deliveryDays: ['Lun', 'Mie'] },
    { id: 's2', name: 'Panadería Central', phone: '0987654321', email: 'pedidos@central.com', category: 'Panadería', deliveryDays: ['Diario'] },
    { id: 's3', name: 'Fruver Fresh', phone: '0978889999', email: 'fresh@fruver.com', category: 'Frutas', deliveryDays: ['Jue', 'Sab'] },
  ]);

  const [wasteRecords, setWasteRecords] = useState<WasteRecord[]>([
    { id: 'w1', itemId: 'i1', itemName: 'Leche Entera 1L', quantity: 2, reason: 'Caducidad', date: '2024-05-01', lossValue: 1.90 },
    { id: 'w2', itemId: 'i2', itemName: 'Pan Brioche', quantity: 10, reason: 'Accidente', date: '2024-05-05', lossValue: 2.50 },
  ]);

  // --- CALCULATIONS ---
  const totalInventoryValue = useMemo(() => inventory.reduce((acc, i) => acc + (i.stock * i.cost), 0), [inventory]);
  const criticalItems = useMemo(() => inventory.filter(i => i.stock < i.minStock), [inventory]);
  const totalWasteMonth = useMemo(() => wasteRecords.reduce((acc, r) => acc + r.lossValue, 0), [wasteRecords]);
  const averageMargin = useMemo(() => {
    if (menuItems.length === 0) return 0;
    const margins = menuItems.map(m => ((m.price - m.cost) / m.price) * 100);
    return margins.reduce((a, b) => a + b, 0) / margins.length;
  }, [menuItems]);

  const filteredInventory = inventory.filter(i => {
    const matchesSearch = i.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'Todos' || i.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const getExpiryColor = (dateStr: string) => {
    const diff = (new Date(dateStr).getTime() - new Date().getTime()) / (1000 * 3600 * 24);
    if (diff < 0) return 'bg-rose-500'; 
    if (diff < 3) return 'bg-amber-500'; 
    return 'bg-emerald-500'; 
  };

  const updateStock = (id: string, delta: number) => {
    setInventory(prev => prev.map(i => i.id === id ? { ...i, stock: Math.max(0, i.stock + delta) } : i));
  };

  const navItems = [
    { id: 'summary', label: 'Escritorio', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { id: 'kanban', label: 'Cocina Live', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
    { id: 'inventory', label: 'Insumos Pro', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
    { id: 'suppliers', label: 'Proveedores', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
    { id: 'bi', label: 'Reportes BI', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' }
  ];

  return (
    <div className="flex flex-col lg:flex-row min-h-screen -mx-4 sm:-mx-6 lg:-mx-8 -my-8 bg-[#f8fafc] relative overflow-x-hidden">
      
      {/* SIDEBAR - REDISEÑO MINIMALISTA OSCURO */}
      <aside className={`fixed lg:relative inset-y-0 left-0 z-50 w-72 bg-[#0f172a] transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-10 flex flex-col h-full">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-white font-handwritten text-4xl">EduEat Bar</h2>
              <p className="text-indigo-400 text-[10px] font-black uppercase tracking-widest mt-2">Personal del Bar</p>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-white p-2 bg-white/10 rounded-2xl">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          
          <nav className="flex-1 space-y-3">
            {navItems.map(item => (
              <button 
                key={item.id} 
                onClick={() => { setActiveTab(item.id as any); setIsSidebarOpen(false); }} 
                className={`w-full flex items-center p-4 rounded-3xl transition-all ${activeTab === item.id ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-900/40' : 'text-slate-500 hover:bg-white/5 hover:text-slate-300'}`}
              >
                <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} /></svg>
                <span className="ml-4 text-[10px] font-black uppercase tracking-widest">{item.label}</span>
                {activeTab === item.id && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>}
              </button>
            ))}
          </nav>

          <div className="mt-auto pt-8 border-t border-slate-800">
             <div className="flex items-center space-x-4 p-4 bg-white/5 rounded-[2rem]">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">{currentUser.name.charAt(0)}</div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-white text-sm font-bold truncate">{currentUser.name}</p>
                  <p className="text-slate-500 text-[9px] font-black uppercase tracking-widest">Administrador</p>
                </div>
             </div>
          </div>
        </div>
      </aside>

      {/* MOBILE MENU TRIGGER */}
      {!isSidebarOpen && (
        <button 
          onClick={() => setIsSidebarOpen(true)} 
          className="lg:hidden fixed bottom-6 right-6 z-40 bg-slate-900 text-white p-5 rounded-full shadow-2xl active:scale-95 transition-all"
        >
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
      )}

      {/* ÁREA PRINCIPAL */}
      <main className="flex-1 p-6 sm:p-10 lg:p-14 pb-32 lg:pb-14 overflow-y-auto">
        
        {/* VIEW: ESCRITORIO / SUMMARY */}
        {activeTab === 'summary' && (
          <div className="animate-fadeIn space-y-10">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
              <div>
                <h1 className="text-5xl font-handwritten text-slate-900">Hola, {currentUser.name.split(' ')[0]}</h1>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-2">Control central de operaciones</p>
              </div>
              <div className="flex bg-white px-6 py-4 rounded-[2rem] border border-slate-100 shadow-sm items-center space-x-4">
                 <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
                 <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Sincronización en vivo</span>
              </div>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { label: 'Ventas de Hoy', value: `$${orders.reduce((acc, o) => acc + o.total, 0).toFixed(2)}`, icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2', color: 'bg-indigo-600' },
                { label: 'Órdenes Activas', value: orders.filter(o => o.status !== 'Entregado').length, icon: 'M12 8v4l3 3', color: 'bg-amber-500' },
                { label: 'Alerta de Stock', value: criticalItems.length, icon: 'M12 9v2m0 4h.01', color: 'bg-rose-500' },
                { label: 'Margen Global', value: `${averageMargin.toFixed(0)}%`, icon: 'M13 7h8m0 0v8', color: 'bg-emerald-500' }
              ].map((s, i) => (
                <div key={i} className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex items-center space-x-8 hover:shadow-xl transition-all group">
                  <div className={`${s.color} w-16 h-16 rounded-[1.8rem] flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}>
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={s.icon} /></svg>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{s.label}</p>
                    <p className="text-2xl font-bold text-slate-900">{s.value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
               <div className="lg:col-span-2 bg-[#0f172a] p-12 sm:p-16 rounded-[4rem] text-white shadow-2xl relative overflow-hidden flex flex-col justify-end min-h-[450px]">
                  <div className="absolute top-12 left-12 z-10">
                    <h3 className="text-4xl sm:text-5xl font-handwritten">Tráfico del Bar</h3>
                    <p className="text-indigo-400 text-[11px] font-black uppercase tracking-[0.2em] mt-3">Saturación de pedidos por hora</p>
                  </div>
                  <div className="flex items-end justify-between h-48 space-x-3 relative z-10">
                    {[20, 45, 80, 50, 95, 60, 30, 70, 40, 85, 55, 30, 60, 45].map((v, i) => (
                      <div key={i} className="flex-1 bg-white/10 rounded-t-3xl hover:bg-indigo-500 transition-all cursor-pointer group relative" style={{ height: `${v}%` }}>
                        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-indigo-600 text-[10px] font-black px-3 py-1.5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl">
                          {v} pedidos
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/10 rounded-full -mr-40 -mt-40"></div>
               </div>
               
               <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm flex flex-col">
                  <h3 className="text-3xl font-handwritten text-slate-900 mb-8">Alertas Almacén</h3>
                  <div className="space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                     {criticalItems.map(item => (
                       <div key={item.id} className="flex justify-between items-center p-5 bg-slate-50 rounded-[2.5rem] group hover:bg-rose-50 transition-all border border-transparent hover:border-rose-100">
                          <div className="flex items-center space-x-4">
                             <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-rose-500 shadow-sm"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg></div>
                             <div>
                                <p className="text-xs font-bold text-slate-800">{item.name}</p>
                                <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest">Quedan: {item.stock} {item.unit}</p>
                             </div>
                          </div>
                          <button className="text-[9px] font-black text-indigo-600 uppercase hover:underline">Pedir</button>
                       </div>
                     ))}
                  </div>
                  <button onClick={() => setActiveTab('inventory')} className="w-full mt-10 py-5 bg-slate-900 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl active:scale-95">Gestionar Todo</button>
               </div>
            </div>
          </div>
        )}

        {/* VIEW: KANBAN LIVE (REDISEÑO ESTILO TICKETS PADRES) */}
        {activeTab === 'kanban' && (
          <div className="animate-fadeIn space-y-10 h-full flex flex-col">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
              <div>
                <h1 className="text-4xl font-handwritten text-slate-900">Monitor Cocina</h1>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Preparación y despacho en vivo</p>
              </div>
              <div className="bg-amber-50 text-amber-600 px-6 py-3 rounded-[1.5rem] border border-amber-100 text-[10px] font-black uppercase tracking-widest flex items-center shadow-sm">
                 <div className="w-2.5 h-2.5 rounded-full bg-amber-500 mr-3 animate-pulse"></div>
                 {orders.filter(o => o.status === 'Pendiente').length} Nuevos ingresos
              </div>
            </header>
            
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8 overflow-hidden pb-10">
              {[
                { key: 'Pendiente', label: 'Tickets Pendientes', color: 'indigo', next: 'Preparando', btn: 'Iniciar Preparación' },
                { key: 'Preparando', label: 'En Fogón', color: 'amber', next: 'Listo', btn: 'Terminar Plato' },
                { key: 'Listo', label: 'Listo para Entrega', color: 'emerald', next: 'Entregado', btn: 'Confirmar Entrega' }
              ].map(col => (
                <div key={col.key} className="bg-slate-50/50 rounded-[3.5rem] p-8 flex flex-col border border-slate-100 h-full max-h-[75vh] lg:max-h-none shadow-inner">
                  <div className="flex justify-between items-center mb-8 px-4">
                    <h3 className={`text-[11px] font-black text-${col.color === 'indigo' ? 'indigo' : col.color === 'amber' ? 'amber' : 'emerald'}-600 uppercase tracking-widest`}>{col.label}</h3>
                    <span className="bg-white px-4 py-1.5 rounded-2xl text-[10px] font-black shadow-md border border-slate-100">{orders.filter(o => o.status === col.key).length}</span>
                  </div>
                  <div className="flex-1 space-y-6 overflow-y-auto pr-2 custom-scrollbar scrollbar-hide">
                    {orders.filter(o => o.status === col.key).map(order => (
                      <div key={order.id} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 animate-scaleUp hover:shadow-xl transition-all border-l-8" style={{ borderLeftColor: col.color === 'indigo' ? '#4f46e5' : col.color === 'amber' ? '#f59e0b' : '#10b981' }}>
                        <div className="flex justify-between items-start mb-5">
                          <div>
                            <span className="text-[10px] font-black text-slate-300">TICKET #{order.id.slice(-5)}</span>
                            <h4 className="text-xl font-bold text-slate-900 mt-1">{order.childName}</h4>
                          </div>
                          <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-xl uppercase tracking-widest">{order.scheduledDate.split('-').slice(1).reverse().join('/')}</span>
                        </div>
                        <div className="space-y-3 mb-8 pb-5 border-b border-slate-50">
                          {order.items.map((it, idx) => (
                            <div key={idx} className="flex justify-between items-center">
                              <p className="text-xs font-bold text-slate-700">· {it.quantity}x {menuItems.find(m => m.id === it.menuItemId)?.name || 'Ítem'}</p>
                              {it.notes && <span className="text-[8px] font-black text-rose-400 bg-rose-50 px-2 py-0.5 rounded uppercase">Nota: {it.notes}</span>}
                            </div>
                          ))}
                        </div>
                        <button 
                          onClick={() => onUpdateOrder({ ...order, status: col.next as any })} 
                          className={`w-full py-4.5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] shadow-lg active:scale-95 transition-all text-white ${
                            col.color === 'indigo' ? 'bg-indigo-600 shadow-indigo-100 hover:bg-indigo-700' : 
                            col.color === 'amber' ? 'bg-amber-500 shadow-amber-100 hover:bg-amber-600' : 
                            'bg-emerald-600 shadow-emerald-100 hover:bg-emerald-700'
                          }`}
                        >
                          {col.btn}
                        </button>
                      </div>
                    ))}
                    {orders.filter(o => o.status === col.key).length === 0 && (
                       <div className="flex flex-col items-center justify-center h-48 opacity-20 border-2 border-dashed border-slate-300 rounded-[2.5rem]">
                          <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                          <p className="text-[10px] font-black uppercase tracking-widest">Sin Pendientes</p>
                       </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW: INVENTORY PRO (REDISEÑO DE TABLAS A FILAS ELEGANTES) */}
        {activeTab === 'inventory' && (
          <div className="animate-fadeIn space-y-10">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
              <div>
                <h1 className="text-5xl font-handwritten text-slate-900">Almacén Inteligente</h1>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Control de insumos y activos</p>
              </div>
              <div className="flex space-x-3 w-full md:w-auto">
                <button onClick={() => setIsWasteModalOpen(true)} className="flex-1 md:flex-none bg-rose-50 text-rose-600 px-8 py-5 rounded-[2rem] text-[10px] font-black uppercase border border-rose-100 hover:bg-rose-600 hover:text-white transition-all shadow-sm active:scale-95">Registrar Merma</button>
                <button className="flex-1 md:flex-none bg-slate-900 text-white px-8 py-5 rounded-[2rem] text-[10px] font-black uppercase shadow-xl hover:bg-indigo-600 transition-all active:scale-95">+ Nuevo Ítem</button>
              </div>
            </header>

            <div className="bg-white p-6 rounded-[3.5rem] shadow-sm border border-slate-100 flex flex-col lg:flex-row gap-6">
              <div className="relative flex-1">
                <input 
                  type="text" 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                  placeholder="Buscar insumo (leche, pan, pollo)..." 
                  className="w-full bg-slate-50 border-none rounded-[2rem] py-5 pl-14 font-bold text-sm outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-600 transition-all"
                />
                <svg className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
              <div className="flex space-x-3 overflow-x-auto pb-2 lg:pb-0 scrollbar-hide">
                {['Todos', 'Lácteos', 'Panadería', 'Proteínas', 'Bebidas'].map(cat => (
                  <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-8 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border-2 ${selectedCategory === cat ? 'bg-slate-900 border-slate-900 text-white shadow-xl scale-105' : 'bg-white text-slate-400 border-slate-100 hover:border-indigo-100'}`}>{cat}</button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-[4rem] border border-slate-100 shadow-sm overflow-hidden">
               <div className="overflow-x-auto">
                 <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/50 border-b border-slate-100">
                      <tr>
                        <th className="px-12 py-8 text-[11px] font-black text-slate-400 uppercase tracking-widest">Insumo / Categoría</th>
                        <th className="px-12 py-8 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Nivel Stock</th>
                        <th className="px-12 py-8 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Costo Unit.</th>
                        <th className="px-12 py-8 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Caducidad</th>
                        <th className="px-12 py-8 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Ajuste</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filteredInventory.map(item => (
                        <tr key={item.id} className={`${item.stock < item.minStock ? 'bg-rose-50/30' : 'hover:bg-slate-50/30'} transition-colors group`}>
                          <td className="px-12 py-7">
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-900 text-lg">{item.name}</span>
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.category}</span>
                            </div>
                          </td>
                          <td className="px-12 py-7 text-center">
                            <div className="inline-flex flex-col items-center">
                               <span className={`px-5 py-2 rounded-full font-black text-[10px] uppercase shadow-sm ${item.stock < item.minStock ? 'bg-rose-500 text-white animate-pulse' : 'bg-slate-100 text-slate-500'}`}>
                                 {item.stock} / {item.minStock} {item.unit}
                               </span>
                               <div className="w-24 h-1.5 bg-slate-100 rounded-full mt-3 overflow-hidden border border-slate-50">
                                  <div className={`h-full ${item.stock < item.minStock ? 'bg-rose-500' : 'bg-indigo-500'} transition-all`} style={{ width: `${Math.min(100, (item.stock / item.minStock) * 50)}%` }}></div>
                               </div>
                            </div>
                          </td>
                          <td className="px-12 py-7 text-center font-black text-slate-900 text-base">${item.cost.toFixed(2)}</td>
                          <td className="px-12 py-7 text-center">
                            <div className="flex items-center justify-center space-x-3 bg-white/50 py-2 px-4 rounded-2xl border border-slate-50">
                              <div className={`w-3 h-3 rounded-full ${getExpiryColor(item.expiryDate)} shadow-sm`}></div>
                              <span className="font-black text-slate-600 text-[10px] tracking-widest">{item.expiryDate.split('-').reverse().join('/')}</span>
                            </div>
                          </td>
                          <td className="px-12 py-7 text-right">
                            <div className="flex justify-end space-x-3">
                              <button onClick={() => updateStock(item.id, -1)} className="w-12 h-12 rounded-2xl bg-white border border-slate-200 text-slate-900 font-bold hover:bg-slate-900 hover:text-white transition-all shadow-sm active:scale-90">-</button>
                              <button onClick={() => updateStock(item.id, 1)} className="w-12 h-12 rounded-2xl bg-slate-900 text-white font-bold hover:bg-indigo-600 transition-all shadow-sm active:scale-90">+</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                 </table>
               </div>
            </div>
          </div>
        )}

        {/* VIEW: SUPPLIERS - ALIADOS DEL BAR (REDISEÑO CARDS PREMIUM) */}
        {activeTab === 'suppliers' && (
          <div className="animate-fadeIn space-y-12">
            {/* HEADER DE SECCIÓN */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
              <div>
                <h1 className="text-5xl font-handwritten text-slate-900">Nuestros Aliados</h1>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.15em] mt-2">
                  Gestión de proveedores y logística
                </p>
              </div>
              <button className="bg-slate-900 text-white px-10 py-5 rounded-[2.5rem] text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-indigo-600 hover:shadow-indigo-200 transition-all active:scale-95 flex items-center space-x-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Nuevo Proveedor</span>
              </button>
            </header>

            {/* FILTRO DE DÍAS */}
            <div className="bg-white p-6 rounded-[3.5rem] border border-slate-100 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-4 ml-2">
                Filtrar por día de entrega
              </p>
              <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-hide">
                {['Todos', 'L', 'M', 'M', 'J', 'V', 'S'].map((day, index) => (
                  <button
                    key={day}
                    className={`min-w-[60px] h-14 rounded-[1.8rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all border-2 ${
                      index === 0
                        ? 'bg-slate-900 border-slate-900 text-white shadow-lg scale-105'
                        : 'bg-white text-slate-400 border-slate-100 hover:border-indigo-200 hover:text-indigo-600'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            {/* GRID DE PROVEEDORES */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {suppliers.map((supplier) => (
                <div
                  key={supplier.id}
                  className="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group"
                >
                  {/* HEADER DE LA CARD */}
                  <div className="p-8 pb-6 relative">
                    <div className="absolute top-8 right-8">
                      <span className="bg-indigo-50 text-indigo-600 text-[9px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-2xl">
                        {supplier.category}
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 pr-20">{supplier.name}</h3>
                    <div className="flex items-center space-x-2 mt-4">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                      <span className="text-[9px] font-black text-emerald-600 uppercase tracking-[0.15em]">
                        Contacto Activo
                      </span>
                    </div>
                  </div>

                  {/* CUERPO CON INFORMACIÓN */}
                  <div className="px-8 pb-8 space-y-6">
                    {/* TELÉFONO */}
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-600 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
                          Teléfono
                        </p>
                        <p className="font-bold text-slate-900">{supplier.phone}</p>
                      </div>
                    </div>

                    {/* EMAIL */}
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-600 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
                          Email
                        </p>
                        <p className="font-bold text-slate-900 truncate">{supplier.email}</p>
                      </div>
                    </div>

                    {/* DÍAS DE ENTREGA */}
                    <div className="bg-slate-50 rounded-3xl p-5">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-3">
                        Días de Entrega
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {supplier.deliveryDays.map((day) => (
                          <span
                            key={day}
                            className="bg-white px-4 py-2 rounded-2xl text-[10px] font-black text-slate-700 border border-slate-100"
                          >
                            {day}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* FOOTER CON BOTONES DE ACCIÓN */}
                  <div className="px-8 pb-8 pt-2 flex space-x-4">
                    <button className="flex-1 bg-white text-slate-600 border-2 border-slate-200 rounded-[1.8rem] py-4 text-[10px] font-black uppercase tracking-[0.15em] hover:bg-slate-50 hover:border-slate-300 transition-colors">
                      Historial
                    </button>
                    <button className="flex-1 bg-indigo-600 text-white rounded-[1.8rem] py-4 text-[10px] font-black uppercase tracking-[0.15em] shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:shadow-indigo-300 transition-all">
                      Hacer Pedido
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* ESTADÍSTICAS ADICIONALES */}
            <div className="bg-slate-50 rounded-[3.5rem] p-10 border border-slate-100">
              <h3 className="text-2xl font-handwritten text-slate-900 mb-6">
                Resumen de Aliados
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
                    Total Aliados
                  </p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">{suppliers.length}</p>
                </div>
                <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
                    Categorías
                  </p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">
                    {[...new Set(suppliers.map(s => s.category))].length}
                  </p>
                </div>
                <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
                    Entrega Diaria
                  </p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">
                    {suppliers.filter(s => s.deliveryDays.includes('Diario')).length}
                  </p>
                </div>
                <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
                    Contacto 24h
                  </p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">3</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW: BI / REPORTES */}
        {activeTab === 'bi' && (
          <div className="animate-fadeIn space-y-12">
            <header>
              <h1 className="text-5xl font-handwritten text-slate-900">Análisis del Bar</h1>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Inteligencia de negocio y rentabilidad</p>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
              {[
                { label: 'Margen Promedio', val: `${averageMargin.toFixed(0)}%`, color: 'indigo' },
                { label: 'Costo Insumos', val: `$${totalInventoryValue.toFixed(2)}`, color: 'amber' },
                { label: 'Utilidad Mensual', val: '$1,450', color: 'emerald' },
                { label: 'Impacto Mermas', val: `-$${totalWasteMonth.toFixed(2)}`, color: 'rose' }
              ].map((s, i) => (
                <div key={i} className={`p-10 rounded-[3.5rem] border border-slate-100 shadow-sm bg-white relative overflow-hidden group hover:shadow-2xl transition-all`}>
                  <div className={`absolute top-0 right-0 w-24 h-24 bg-${s.color === 'indigo' ? 'indigo' : s.color === 'emerald' ? 'emerald' : s.color === 'rose' ? 'rose' : 'amber'}-50 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform`}></div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 relative z-10">{s.label}</p>
                  <p className={`text-4xl font-bold relative z-10 ${s.color === 'rose' ? 'text-rose-500' : s.color === 'indigo' ? 'text-indigo-600' : s.color === 'emerald' ? 'text-emerald-500' : 'text-amber-500'}`}>{s.val}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
               <div className="bg-white p-12 sm:p-16 rounded-[4.5rem] border border-slate-100 shadow-sm flex flex-col">
                  <h3 className="text-3xl font-handwritten text-slate-900 mb-10">Rentabilidad por Receta</h3>
                  <div className="space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                     {menuItems.map(item => {
                        const margin = item.price - item.cost;
                        const marginP = (margin / item.price) * 100;
                        return (
                          <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-6 bg-slate-50/50 rounded-[2.5rem] hover:bg-indigo-50/50 transition-all group border border-transparent hover:border-indigo-100">
                             <div className="flex items-center space-x-5">
                                <img src={item.image} className="w-14 h-14 rounded-2xl object-cover shadow-md group-hover:scale-110 transition-transform" />
                                <div>
                                   <p className="font-bold text-slate-900 text-lg">{item.name}</p>
                                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Costo: ${item.cost.toFixed(2)}</p>
                                </div>
                             </div>
                             <div className="flex flex-col items-end mt-4 sm:mt-0">
                                <div className="flex items-center space-x-3">
                                   <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-3 py-1 rounded-xl shadow-sm">+${margin.toFixed(2)}</span>
                                   <span className="text-xl font-black text-slate-900">{marginP.toFixed(0)}%</span>
                                </div>
                                <div className="w-32 h-2 bg-slate-200 rounded-full mt-3 overflow-hidden border border-slate-50 shadow-inner">
                                   <div className="h-full bg-indigo-600 group-hover:bg-emerald-500 transition-all" style={{ width: `${marginP}%` }}></div>
                                </div>
                             </div>
                          </div>
                        );
                     })}
                  </div>
               </div>

               <div className="bg-[#0f172a] p-12 sm:p-16 rounded-[4.5rem] text-white shadow-2xl relative overflow-hidden flex flex-col">
                  <h3 className="text-4xl font-handwritten mb-4">Meta de Ventas Brutas</h3>
                  <p className="text-indigo-400 text-[11px] font-black uppercase tracking-[0.3em] mb-12">Progreso acumulado del mes</p>
                  
                  <div className="my-12 relative">
                     <div className="flex justify-between mb-6 items-end">
                        <div>
                           <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1">Recaudado</p>
                           <p className="text-6xl font-bold">$1,450</p>
                        </div>
                        <div className="text-right">
                           <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1">Objetivo: $2,000</p>
                           <p className="text-3xl font-black text-indigo-400">72.5%</p>
                        </div>
                     </div>
                     <div className="w-full h-8 bg-white/5 rounded-[1.5rem] overflow-hidden border border-white/5 shadow-inner p-1.5">
                        <div className="h-full bg-indigo-500 rounded-[1rem] shadow-[0_0_20px_rgba(99,102,241,0.5)] transition-all duration-1000" style={{ width: '72.5%' }}></div>
                     </div>
                  </div>
                  
                  <div className="mt-auto p-8 bg-white/5 rounded-[2.5rem] border border-white/5 text-center">
                     <p className="text-xs text-indigo-200 font-medium italic">"Análisis IA: Las ventas han subido un 12% respecto al mes pasado. El plato más rentable sigue siendo el Combo Almuerzo Criollo."</p>
                  </div>
                  
                  <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-indigo-600/5 rounded-full"></div>
               </div>
            </div>
          </div>
        )}

      </main>

      {/* MODAL: REGISTRAR MERMA (REDISEÑO ESTILO PADRES) */}
      {isWasteModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6 bg-slate-900/90 backdrop-blur-md animate-fadeIn">
          <div className="bg-white w-full max-w-lg rounded-t-[4rem] sm:rounded-[4rem] p-10 sm:p-14 relative animate-slideUp sm:animate-scaleUp shadow-2xl overflow-hidden">
            <button onClick={() => setIsWasteModalOpen(false)} className="absolute top-10 right-10 text-slate-300 hover:text-slate-900 transition-colors">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <h3 className="text-4xl font-handwritten text-slate-900 mb-2">Registro de Merma</h3>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mb-12">Auditoría de desperdicios y pérdidas</p>
            
            <form className="space-y-8 pb-10 sm:pb-0">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">¿Qué producto se perdió?</label>
                <select className="w-full bg-slate-50 border-none rounded-3xl p-6 font-bold text-sm outline-none focus:ring-4 focus:ring-indigo-50 transition-all appearance-none">
                  {inventory.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Cantidad</label>
                  <input type="number" placeholder="0" className="w-full bg-slate-50 border-none rounded-3xl p-6 font-bold text-sm outline-none focus:ring-4 focus:ring-indigo-50 transition-all" />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Causa Principal</label>
                  <select className="w-full bg-slate-50 border-none rounded-3xl p-6 font-bold text-sm outline-none focus:ring-4 focus:ring-indigo-50 transition-all appearance-none">
                    <option>Caducidad</option>
                    <option>Accidente</option>
                    <option>Mal estado</option>
                    <option>Otro</option>
                  </select>
                </div>
              </div>
              
              <button type="button" onClick={() => setIsWasteModalOpen(false)} className="w-full bg-rose-600 text-white py-6 rounded-[2.5rem] font-black uppercase text-xs tracking-[0.3em] shadow-2xl hover:bg-slate-900 transition-all active:scale-95 shadow-rose-200">
                Confirmar Registro
              </button>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-fadeIn { animation: fadeIn 0.5s ease-out; }
        @keyframes scaleUp { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .animate-scaleUp { animation: scaleUp 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-slideUp { animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
      `}</style>
    </div>
  );
};

export default StaffDashboard;