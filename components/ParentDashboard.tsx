
import React, { useState, useEffect, useMemo } from 'react';
import { MenuItem, Order, User, OrderItem } from '../types';
import { getHealthTip } from '../services/geminiService';

interface ParentDashboardProps {
  menuItems: MenuItem[];
  orders: Order[];
  onAddOrder: (order: Order) => void;
  currentUser: User;
  showToast?: (msg: string, type?: 'success' | 'info') => void;
  onTrigger404?: () => void;
}

const ParentDashboard: React.FC<ParentDashboardProps> = ({ menuItems, orders, onAddOrder, currentUser, showToast, onTrigger404 }) => {
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [selectedChild, setSelectedChild] = useState('Mateo');
  
  // Función para obtener la fecha mínima permitida (mañana)
  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const [selectedDate, setSelectedDate] = useState(getMinDate());
  const [healthTip, setHealthTip] = useState('');
  const [view, setView] = useState<'browse' | 'orders' | 'nutrition' | 'profile'>('browse');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [selectedItemForModal, setSelectedItemForModal] = useState<MenuItem | null>(null);
  const [modalNotes, setModalNotes] = useState<string>('');
  const [isCartOpenOnMobile, setIsCartOpenOnMobile] = useState(false);

  useEffect(() => {
    const fetchTip = async () => {
      const tip = await getHealthTip(menuItems[0]?.name || "Almuerzo");
      setHealthTip(tip);
    };
    fetchTip();
  }, [menuItems]);

  const categories = ['Todos', 'Desayuno', 'Almuerzo', 'Snack', 'Bebida'];

  const filteredItems = menuItems.filter(item => {
    return selectedCategory === 'Todos' || item.category === selectedCategory;
  });

  // Cálculo del balance nutricional basado en los pedidos activos del hijo seleccionado
  const nutritionalSummary = useMemo(() => {
    const childOrders = orders.filter(o => o.childName === selectedChild && o.status !== 'Cancelado');
    const totals = { calories: 0, protein: 0, carbs: 0, fat: 0 };

    childOrders.forEach(order => {
      order.items.forEach(cartItem => {
        const itemDetail = menuItems.find(m => m.id === cartItem.menuItemId);
        if (itemDetail) {
          totals.calories += (itemDetail.calories || 0) * cartItem.quantity;
          totals.protein += (itemDetail.protein || 0) * cartItem.quantity;
          totals.carbs += (itemDetail.carbs || 0) * cartItem.quantity;
          totals.fat += (itemDetail.fat || 0) * cartItem.quantity;
        }
      });
    });

    return [
      { label: 'Calorías', current: totals.calories, goal: 3500, unit: 'kcal', color: 'bg-amber-500' },
      { label: 'Proteína', current: totals.protein, goal: 150, unit: 'g', color: 'bg-emerald-500' },
      { label: 'Carbohidratos', current: totals.carbs, goal: 450, unit: 'g', color: 'bg-indigo-500' },
      { label: 'Grasas', current: totals.fat, goal: 100, unit: 'g', color: 'bg-rose-500' },
    ];
  }, [orders, selectedChild, menuItems]);

  const addToCart = (item: MenuItem, notes?: string) => {
    setCart(prev => {
      const existing = prev.find(i => i.menuItemId === item.id && i.notes === notes);
      if (existing) {
        return prev.map(i => (i.menuItemId === item.id && i.notes === notes) ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { menuItemId: item.id, quantity: 1, notes: notes }];
    });
    setSelectedItemForModal(null);
    setModalNotes('');
    if (showToast) showToast(`${item.name} añadido al carrito`);
  };

  const updateQuantity = (menuItemId: string, notes: string | undefined, delta: number) => {
    setCart(prev => {
      const existing = prev.find(i => i.menuItemId === menuItemId && i.notes === notes);
      if (!existing) return prev;
      const newQty = existing.quantity + delta;
      if (newQty <= 0) return prev.filter(i => !(i.menuItemId === menuItemId && i.notes === notes));
      return prev.map(i => (i.menuItemId === menuItemId && i.notes === notes) ? { ...i, quantity: newQty } : i);
    });
  };

  const totalCost = cart.reduce((acc, item) => {
    const menuItem = menuItems.find(m => m.id === item.menuItemId);
    return acc + (menuItem?.price || 0) * item.quantity;
  }, 0);

  const handleCheckout = () => {
    if (cart.length === 0) return;
    
    const todayStr = new Date().toISOString().split('T')[0];
    if (selectedDate <= todayStr) {
      if (showToast) showToast("Los pedidos deben realizarse con al menos 24h de antelación.", "info");
      return;
    }

    const newOrder: Order = {
      id: Math.random().toString(36).substr(2, 9).toUpperCase(),
      parentId: currentUser.id,
      childName: selectedChild,
      items: [...cart],
      total: totalCost,
      status: 'Pendiente',
      scheduledDate: selectedDate,
      createdAt: new Date().toISOString()
    };
    onAddOrder(newOrder);
    setCart([]);
    setIsCartOpenOnMobile(false);
    setView('orders');
  };

  return (
    <div className="flex flex-col lg:grid lg:grid-cols-4 gap-8 pb-32 lg:pb-0">
      
      {/* NAVEGACIÓN MOBILE */}
      <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] w-[90%] bg-[#0f172a] text-white rounded-[2.5rem] shadow-2xl p-2 flex items-center justify-around border border-white/10 backdrop-blur-md">
        {[
          { id: 'browse', icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z', label: 'Menú' },
          { id: 'orders', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2', label: 'Pedidos' },
          { id: 'nutrition', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', label: 'Salud' },
          { id: 'profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', label: 'Perfil' }
        ].map(item => (
          <button 
            key={item.id}
            onClick={() => setView(item.id as any)}
            className={`flex flex-col items-center p-4 rounded-[1.8rem] transition-all ${view === item.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500'}`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} /></svg>
            <span className="text-[8px] font-black uppercase tracking-widest mt-1">{item.label}</span>
          </button>
        ))}
      </div>

      {/* Sidebar Desktop */}
      <nav className="hidden lg:block lg:col-span-1 space-y-6">
        <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 p-8">
          <h3 className="text-2xl font-handwritten text-indigo-600 mb-8">EduEat Bar</h3>
          <div className="space-y-3">
            {[
              { id: 'browse', label: '🍴 Explorar Menú' },
              { id: 'orders', label: '📋 Mis Pedidos' },
              { id: 'nutrition', label: '📊 Monitor Salud' },
              { id: 'profile', label: '👤 Mi Perfil' }
            ].map(v => (
              <button 
                key={v.id}
                onClick={() => setView(v.id as any)}
                className={`w-full text-left px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${view === v.id ? 'bg-slate-900 text-white shadow-2xl' : 'hover:bg-slate-50 text-slate-500'}`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>
        <div className="bg-indigo-600 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform"></div>
          <h4 className="text-2xl font-handwritten mb-4">Consejo Saludable</h4>
          <p className="text-indigo-100 text-sm leading-relaxed italic opacity-90">"{healthTip}"</p>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="lg:col-span-2 space-y-8 px-2 sm:px-0">
        
        {/* VISTA: MI PERFIL */}
        {view === 'profile' && (
          <div className="animate-fadeIn space-y-8 pb-10">
            <header>
              <h2 className="text-4xl font-handwritten text-slate-900">Mi Perfil</h2>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Configuración de cuenta y familia</p>
            </header>

            {/* Card de Usuario Principal */}
            <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-8">
               <div className="w-24 h-24 rounded-[2rem] bg-indigo-600 flex items-center justify-center text-white text-4xl font-bold shadow-xl">
                  {currentUser.name.charAt(0)}
               </div>
               <div className="text-center md:text-left flex-1">
                  <h3 className="text-2xl font-bold text-slate-900">{currentUser.name}</h3>
                  <p className="text-slate-500 text-sm">{currentUser.email}</p>
                  <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-2">
                     <span className="bg-indigo-50 text-indigo-600 text-[9px] font-black uppercase px-3 py-1 rounded-xl tracking-widest">Representante</span>
                     <span className="bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase px-3 py-1 rounded-xl tracking-widest">Miembro Premium</span>
                  </div>
               </div>
               <button className="bg-slate-50 hover:bg-slate-100 p-4 rounded-2xl text-slate-400 transition-all">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
               </button>
            </div>

            {/* Sección de Hijos */}
            <div className="space-y-6">
               <div className="flex justify-between items-center px-4">
                  <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Mis Hijos (Alumnos)</h4>
                  <button className="text-indigo-600 text-[9px] font-black uppercase tracking-widest hover:underline">+ Agregar Hijo</button>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { name: 'Mateo', grade: '4to de Básica B', allergies: 'Ninguna', favorite: 'Combo Almuerzo' },
                    { name: 'Sofía', grade: '1ero de Básica A', allergies: 'Lactosa', favorite: 'Bowl de Frutas' }
                  ].map((child, i) => (
                    <div key={i} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                       <div className="flex items-center justify-between mb-6">
                          <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-indigo-600 font-bold group-hover:bg-indigo-600 group-hover:text-white transition-all">
                             {child.name.charAt(0)}
                          </div>
                          <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{child.grade}</span>
                       </div>
                       <h5 className="text-xl font-bold text-slate-900 mb-2">{child.name}</h5>
                       <div className="space-y-2">
                          <p className="text-[9px] font-black text-slate-400 uppercase">Alergias: <span className="text-rose-500">{child.allergies}</span></p>
                          <p className="text-[9px] font-black text-slate-400 uppercase">Favorito: <span className="text-indigo-600">{child.favorite}</span></p>
                       </div>
                    </div>
                  ))}
               </div>
            </div>

            {/* Ajustes de Cuenta */}
            <div className="bg-white p-10 rounded-[4rem] border border-slate-100 shadow-sm space-y-6">
               <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">Preferencias de Cuenta</h4>
               <div className="space-y-4">
                  {[
                    { label: 'Notificaciones de Pedido', desc: 'Recibir avisos cuando el pedido esté listo', active: true },
                    { label: 'Resumen Semanal de Salud', desc: 'Email con el balance nutricional de tus hijos', active: true },
                    { label: 'Alertas de Stock', desc: 'Avisar cuando sus platos favoritos se agoten', active: false }
                  ].map((pref, i) => (
                    <div key={i} className="flex items-center justify-between p-6 bg-slate-50 rounded-[2.5rem]">
                       <div className="pr-4">
                          <p className="text-sm font-bold text-slate-900">{pref.label}</p>
                          <p className="text-[10px] text-slate-400">{pref.desc}</p>
                       </div>
                       <div className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${pref.active ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${pref.active ? 'left-7' : 'left-1'}`}></div>
                       </div>
                    </div>
                  ))}
               </div>
               <div className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button className="w-full py-5 bg-slate-900 text-white rounded-[1.8rem] text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all active:scale-95">Cambiar Contraseña</button>
                  <button className="w-full py-5 bg-rose-50 text-rose-600 rounded-[1.8rem] text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all active:scale-95">Cerrar Sesión</button>
               </div>
            </div>
          </div>
        )}

        {/* VISTA DE NUTRICIÓN */}
        {view === 'nutrition' && (
          <div className="animate-fadeIn space-y-8">
            <header>
              <h2 className="text-4xl font-handwritten text-slate-900">Balance Semanal</h2>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Estado nutricional de {selectedChild}</p>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
               {nutritionalSummary.map((stat, i) => {
                 const percentage = Math.min(100, (stat.current / stat.goal) * 100);
                 return (
                   <div key={i} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</span>
                        <span className="text-xs font-bold text-slate-900">{stat.current} / {stat.goal} {stat.unit}</span>
                      </div>
                      <div className="h-4 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                        <div className={`h-full ${stat.color} transition-all duration-1000`} style={{ width: `${percentage}%` }}></div>
                      </div>
                      <p className="text-[8px] font-black text-slate-300 uppercase mt-4 text-right">Progreso: {percentage.toFixed(0)}%</p>
                   </div>
                 );
               })}
            </div>

            <div className="bg-[#0f172a] p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden">
               <div className="relative z-10">
                  <h3 className="text-2xl font-handwritten mb-4">Analista de Nutrición AI</h3>
                  <p className="text-slate-400 text-sm leading-relaxed mb-6">
                    {nutritionalSummary[1].current < 80 ? 
                      `Aún falta proteína en la dieta semanal de ${selectedChild}. Considera agregar el Combo Almuerzo Criollo mañana.` :
                      `¡Excelente! ${selectedChild} está recibiendo todos los nutrientes necesarios para su crecimiento.`
                    }
                  </p>
               </div>
               <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-white/5 rounded-full"></div>
            </div>
          </div>
        )}

        {view === 'browse' && (
          <>
            <header className="bg-white p-8 rounded-[3.5rem] border border-slate-100 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Para:</label>
                <select value={selectedChild} onChange={(e) => setSelectedChild(e.target.value)} className="w-full bg-slate-50 font-bold px-6 py-4 rounded-2xl border-none focus:ring-4 focus:ring-indigo-100 outline-none">
                  <option value="Mateo">Mateo (4to B)</option>
                  <option value="Sofía">Sofía (1ero A)</option>
                </select>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Fecha de Entrega:</label>
                <input 
                  type="date" 
                  value={selectedDate} 
                  min={getMinDate()} // RESTRICCIÓN: Solo días posteriores
                  onChange={(e) => setSelectedDate(e.target.value)} 
                  className="w-full bg-slate-50 font-bold px-6 py-4 rounded-2xl border-none focus:ring-4 focus:ring-indigo-100 outline-none" 
                />
              </div>
            </header>

            <div className="flex space-x-3 overflow-x-auto pb-4 scrollbar-hide">
              {categories.map(cat => (
                <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${selectedCategory === cat ? 'bg-slate-900 text-white shadow-xl scale-105' : 'bg-white text-slate-400 border border-slate-100 hover:border-indigo-200'}`}>{cat}</button>
              ))}
            </div>

            <section className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {filteredItems.map(item => (
                <article key={item.id} className="bg-white rounded-[3.5rem] border border-slate-100 overflow-hidden flex flex-col group shadow-sm hover:shadow-2xl transition-all duration-500">
                  <div className="relative h-56 overflow-hidden cursor-pointer" onClick={() => setSelectedItemForModal(item)}>
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute top-6 right-6 bg-white/95 backdrop-blur-md px-4 py-2 rounded-2xl text-xs font-black text-indigo-600 shadow-xl border border-white">
                      ${item.price.toFixed(2)}
                    </div>
                    <div className="absolute bottom-4 left-6 flex space-x-2">
                       <span className="bg-slate-900/60 backdrop-blur-md text-white text-[8px] font-black uppercase px-2 py-1 rounded-lg">{(item.calories || 0)} kcal</span>
                       <span className="bg-emerald-500/60 backdrop-blur-md text-white text-[8px] font-black uppercase px-2 py-1 rounded-lg">{(item.protein || 0)}g Prot</span>
                    </div>
                  </div>
                  <div className="p-10 flex flex-col flex-1">
                    <h3 className="font-bold text-slate-900 text-xl mb-3">{item.name}</h3>
                    <p className="text-slate-500 text-xs line-clamp-2 mb-8 leading-relaxed">{item.description}</p>
                    <button onClick={() => addToCart(item)} className="mt-auto w-full bg-indigo-600 text-white font-black py-4.5 rounded-2xl active:scale-95 transition-all text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-100">
                      Añadir al Ticket
                    </button>
                  </div>
                </article>
              ))}
            </section>
          </>
        )}

        {view === 'orders' && (
          <div className="animate-fadeIn space-y-6">
            <h2 className="text-4xl font-handwritten text-slate-900">Mis Tickets Agendados</h2>
            {orders.length === 0 ? (
              <div className="bg-white p-20 rounded-[4rem] text-center border-2 border-slate-100 border-dashed">
                 <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Aún no hay pedidos programados</p>
              </div>
            ) : (
              orders.map(order => (
                <div key={order.id} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all">
                  <div className="flex justify-between items-start mb-6">
                     <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg self-start">PEDIDO: {order.id.slice(-6)}</span>
                        <p className="text-xl font-bold text-slate-900 mt-2">{order.childName}</p>
                     </div>
                     <span className={`text-[9px] font-black uppercase px-4 py-2 rounded-2xl shadow-sm ${
                        order.status === 'Listo' ? 'bg-emerald-500 text-white' : 
                        order.status === 'Pendiente' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400'
                     }`}>{order.status}</span>
                  </div>
                  <div className="flex items-center text-xs font-bold text-slate-500 mb-6 bg-slate-50 p-4 rounded-2xl">
                    <svg className="w-4 h-4 mr-3 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    Fecha: {order.scheduledDate}
                  </div>
                  <div className="flex flex-wrap gap-2 pt-6 border-t border-slate-50">
                     {order.items.map((it, idx) => (
                       <span key={idx} className="text-[8px] font-black bg-white border border-slate-100 px-4 py-2 rounded-xl text-slate-600 uppercase">
                         {it.quantity}x {menuItems.find(m => m.id === it.menuItemId)?.name}
                       </span>
                     ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>

      {/* Cart Aside Desktop */}
      <aside className={`hidden lg:block lg:col-span-1 ${view === 'profile' ? 'opacity-0 pointer-events-none' : ''}`}>
        <div className="bg-white rounded-[4rem] shadow-2xl border border-slate-100 p-10 sticky top-24">
          <h3 className="text-2xl font-handwritten text-slate-900 mb-8">Mi Carrito</h3>
          <div className="space-y-6 mb-12 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {cart.length === 0 ? (
              <p className="text-center text-slate-300 py-10 text-[10px] font-black uppercase tracking-widest">Vacío</p>
            ) : (
              cart.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center group">
                  <div className="flex-1 min-w-0 pr-4">
                    <p className="font-bold text-slate-800 text-xs truncate">{menuItems.find(m => m.id === item.menuItemId)?.name}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <button onClick={() => updateQuantity(item.menuItemId, item.notes, -1)} className="w-6 h-6 rounded-lg bg-slate-50 text-slate-400 hover:bg-rose-500 hover:text-white transition-all text-xs flex items-center justify-center font-black">-</button>
                      <span className="text-[10px] font-black text-indigo-600">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.menuItemId, item.notes, 1)} className="w-6 h-6 rounded-lg bg-slate-50 text-slate-400 hover:bg-emerald-500 hover:text-white transition-all text-xs flex items-center justify-center font-black">+</button>
                    </div>
                  </div>
                  <span className="font-black text-slate-900 text-xs">${((menuItems.find(m => m.id === item.menuItemId)?.price || 0) * item.quantity).toFixed(2)}</span>
                </div>
              ))
            )}
          </div>
          <div className="pt-8 border-t-2 border-slate-50 border-dashed">
            <div className="flex justify-between items-center mb-8 px-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</span>
              <span className="text-3xl font-handwritten text-indigo-600">${totalCost.toFixed(2)}</span>
            </div>
            <button onClick={handleCheckout} disabled={cart.length === 0} className="w-full bg-[#0f172a] text-white font-black py-5 rounded-[2rem] hover:bg-indigo-600 transition-all shadow-xl disabled:opacity-20 uppercase tracking-[0.2em] text-[9px]">
              Confirmar Reserva
            </button>
          </div>
        </div>
      </aside>

      {/* MODAL DETALLE NUTRICIONAL */}
      {selectedItemForModal && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-slate-900/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-white w-full max-w-lg rounded-t-[4rem] sm:rounded-[4rem] overflow-hidden animate-slideUp p-10 sm:p-14 relative">
            <button onClick={() => setSelectedItemForModal(null)} className="absolute top-10 right-10 text-slate-300 hover:text-slate-900 transition-colors"><svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
            <img src={selectedItemForModal.image} className="w-full h-64 object-cover rounded-[3rem] mb-8 shadow-xl" />
            <h2 className="text-4xl font-handwritten text-slate-900 mb-2">{selectedItemForModal.name}</h2>
            
            <div className="grid grid-cols-4 gap-4 mb-8">
               <div className="text-center bg-slate-50 p-2 rounded-2xl">
                  <p className="text-[8px] font-black text-slate-400 uppercase">Kcal</p>
                  <p className="text-xs font-black text-slate-800">{selectedItemForModal.calories}</p>
               </div>
               <div className="text-center bg-slate-50 p-2 rounded-2xl">
                  <p className="text-[8px] font-black text-slate-400 uppercase">Proteína</p>
                  <p className="text-xs font-black text-slate-800">{selectedItemForModal.protein}g</p>
               </div>
               <div className="text-center bg-slate-50 p-2 rounded-2xl">
                  <p className="text-[8px] font-black text-slate-400 uppercase">Carbos</p>
                  <p className="text-xs font-black text-slate-800">{selectedItemForModal.carbs}g</p>
               </div>
               <div className="text-center bg-slate-50 p-2 rounded-2xl">
                  <p className="text-[8px] font-black text-slate-400 uppercase">Grasas</p>
                  <p className="text-xs font-black text-slate-800">{selectedItemForModal.fat}g</p>
               </div>
            </div>

            <p className="text-slate-500 text-xs mb-8 leading-relaxed font-medium">"{selectedItemForModal.description}"</p>
            
            <div className="space-y-3 mb-10">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">¿Deseas personalizar algo?</label>
              <textarea value={modalNotes} onChange={(e) => setModalNotes(e.target.value)} placeholder="Ej: Sin sal, bajo en azúcar..." className="w-full bg-slate-50 rounded-3xl p-5 text-xs font-bold outline-none h-24 resize-none border border-slate-100 focus:border-indigo-600 transition-all" />
            </div>
            <button onClick={() => addToCart(selectedItemForModal, modalNotes)} className="w-full bg-[#0f172a] text-white font-black py-6 rounded-[2rem] shadow-2xl uppercase text-[10px] tracking-[0.3em] active:scale-95 transition-all">
              Añadir por ${selectedItemForModal.price.toFixed(2)}
            </button>
          </div>
        </div>
      )}

      {/* MOBILE FULL-SCREEN CART */}
      {isCartOpenOnMobile && (
        <div className="fixed inset-0 z-[100] lg:hidden flex flex-col bg-white animate-slideUp">
          <header className="p-10 border-b border-slate-100 flex justify-between items-center">
            <h3 className="text-3xl font-handwritten text-slate-900">Tu Ticket</h3>
            <button onClick={() => setIsCartOpenOnMobile(false)} className="p-4 bg-slate-50 rounded-2xl text-slate-400"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
          </header>
          <div className="flex-1 overflow-y-auto p-10 space-y-8 scrollbar-hide">
             {cart.map((item, idx) => (
                 <div key={idx} className="flex justify-between items-center border-b border-slate-50 pb-8">
                   <div className="flex-1 pr-6">
                     <p className="font-bold text-slate-900 text-lg mb-3">{menuItems.find(m => m.id === item.menuItemId)?.name}</p>
                     <div className="flex items-center space-x-8">
                       <button onClick={() => updateQuantity(item.menuItemId, item.notes, -1)} className="w-14 h-14 rounded-2xl bg-slate-50 text-slate-900 font-bold active:scale-90 shadow-sm">-</button>
                       <span className="font-black text-2xl text-indigo-600">{item.quantity}</span>
                       <button onClick={() => updateQuantity(item.menuItemId, item.notes, 1)} className="w-14 h-14 rounded-2xl bg-slate-50 text-slate-900 font-bold active:scale-90 shadow-sm">+</button>
                     </div>
                   </div>
                   <span className="font-black text-2xl text-slate-900">${((menuItems.find(m => m.id === item.menuItemId)?.price || 0) * item.quantity).toFixed(2)}</span>
                 </div>
               ))
             }
          </div>
          <div className="p-10 bg-white border-t border-slate-100 rounded-t-[4rem] shadow-2xl">
             <div className="flex justify-between items-center mb-8 px-2">
                <span className="text-[12px] font-black text-slate-400 uppercase tracking-widest">Total</span>
                <span className="text-4xl font-handwritten text-indigo-600">${totalCost.toFixed(2)}</span>
             </div>
             <button onClick={handleCheckout} className="w-full bg-[#0f172a] text-white font-black py-7 rounded-[2.5rem] shadow-2xl uppercase text-[11px] tracking-[0.3em] active:scale-95 transition-all">
               Finalizar Reserva
             </button>
          </div>
        </div>
      )}

      {/* Floating Cart Button Mobile */}
      {cart.length > 0 && view === 'browse' && (
        <button 
          onClick={() => setIsCartOpenOnMobile(true)} 
          className="lg:hidden fixed bottom-32 right-6 z-50 bg-indigo-600 text-white w-20 h-20 rounded-full shadow-2xl flex items-center justify-center animate-bounce-short border-4 border-white active:scale-90 transition-all"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
          <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-black w-8 h-8 rounded-full flex items-center justify-center border-4 border-white shadow-lg">{cart.length}</span>
        </button>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out; }
        .animate-slideUp { animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default ParentDashboard;
