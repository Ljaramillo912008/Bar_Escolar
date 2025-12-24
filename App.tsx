import React, { useState, useEffect } from 'react';
import { User, MenuItem, Order } from './types';
import { INITIAL_MENU } from './constants';
import StaffDashboard from './components/StaffDashboard';
import ParentDashboard from './components/ParentDashboard';
import Login from './components/Login';

// --- CONFIGURACIÓN DE FIREBASE DIRECTA ---
import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  setDoc,
  query,
  orderBy 
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCwhy8QKTSoKdHPd1NmNO0qbUlwMYxJDrQ",
  authDomain: "sample-firebase-ai-app-145aa.firebaseapp.com",
  projectId: "sample-firebase-ai-app-145aa",
  storageBucket: "sample-firebase-ai-app-145aa.firebasestorage.app",
  messagingSenderId: "839030467840",
  appId: "1:839030467840:web:2f55342d3ead40a44b57e5"
};

// Inicialización de Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'info';
}

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [is404, setIs404] = useState(false);

  // EFECTO: Sincronización en tiempo real
  useEffect(() => {
    // 1. Escuchar Pedidos (Orders)
    const qOrders = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const unsubscribeOrders = onSnapshot(qOrders, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as Order[];
      setOrders(ordersData);
      setIsLoading(false); // Quitar loader cuando lleguen datos
    });

    // 2. Escuchar Menú (Menu)
    const unsubscribeMenu = onSnapshot(collection(db, "menu"), (snapshot) => {
      if (snapshot.empty) {
        // Si no hay menú en la nube, subir el inicial
        INITIAL_MENU.forEach(async (item) => {
          await setDoc(doc(db, "menu", item.id), item);
        });
      } else {
        const menuData = snapshot.docs.map(doc => doc.data()) as MenuItem[];
        setMenuItems(menuData);
      }
    });

    return () => {
      unsubscribeOrders();
      unsubscribeMenu();
    };
  }, []);

  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    showToast(`¡Hola, ${user.name.split(' ')[0]}!`, 'info');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIs404(false);
  };

  // ACTUALIZAR MENÚ EN LA NUBE
  const updateMenu = async (newMenu: MenuItem[]) => {
    try {
      for (const item of newMenu) {
        await setDoc(doc(db, "menu", item.id), item);
      }
      showToast("Catálogo sincronizado");
    } catch (e) {
      showToast("Error al sincronizar", "info");
    }
  };

  // AGREGAR PEDIDO A LA NUBE
  const addOrder = async (newOrder: Order) => {
    try {
      await addDoc(collection(db, "orders"), {
        ...newOrder,
        createdAt: new Date().toISOString()
      });
      showToast("¡Pedido enviado!");
    } catch (e) {
      showToast("Error de conexión", "info");
    }
  };

  // ACTUALIZAR ESTADO (STAFF)
  const updateOrder = async (updatedOrder: Order) => {
    try {
      const orderRef = doc(db, "orders", updatedOrder.id);
      await updateDoc(orderRef, { status: updatedOrder.status });
      showToast(`Pedido ${updatedOrder.status}`);
    } catch (e) {
      showToast("Error al actualizar", "info");
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-indigo-600 z-[100] flex flex-col items-center justify-center">
        <div className="relative w-20 h-24 border-4 border-white rounded-b-xl mb-6 overflow-hidden bg-white/10">
          <div className="absolute bottom-0 left-0 w-full bg-amber-400 loader-liquid"></div>
        </div>
        <h1 className="text-white text-3xl font-handwritten tracking-wider animate-pulse">EduEat Bar</h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Toasts */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] flex flex-col items-center space-y-2 w-full max-w-[280px] pointer-events-none">
        {toasts.map(toast => (
          <div key={toast.id} className={`pointer-events-auto px-6 py-3 rounded-full shadow-2xl text-white text-[10px] font-black uppercase tracking-widest flex items-center space-x-3 animate-slideDown ${toast.type === 'success' ? 'bg-emerald-500' : 'bg-slate-900'} border-2 border-white/20`}>
            <span>{toast.message}</span>
          </div>
        ))}
      </div>

      <nav className={`bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 transition-all ${currentUser?.role === 'STAFF' ? 'hidden lg:block' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setIs404(false)}>
              <div className="bg-indigo-600 w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">E</div>
              <span className="text-2xl font-handwritten text-slate-900">EduEat</span>
            </div>
            <div className="flex items-center space-x-4">
              {currentUser && (
                <button onClick={handleLogout} className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                  Salir
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className={`flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ${currentUser?.role === 'STAFF' ? 'lg:py-8' : 'py-6'}`}>
        {!currentUser ? (
          <Login onLogin={handleLogin} />
        ) : (
          currentUser.role === 'STAFF' ? (
            <StaffDashboard 
              menuItems={menuItems} 
              orders={orders} 
              onUpdateMenu={updateMenu}
              onUpdateOrder={updateOrder}
              currentUser={currentUser}
            />
          ) : (
            <ParentDashboard 
              menuItems={menuItems} 
              orders={orders.filter(o => o.parentId === currentUser.id)}
              onAddOrder={addOrder}
              currentUser={currentUser}
              showToast={showToast}
              onTrigger404={() => setIs404(true)}
            />
          )
        )}
      </main>

      {(!currentUser || currentUser.role === 'PARENT') && (
        <footer className="bg-slate-900 text-slate-500 py-12 px-4 border-t border-slate-800">
          <div className="max-w-7xl mx-auto text-center space-y-4">
            <h3 className="text-2xl font-handwritten text-white">EduEat Bar</h3>
            <p className="text-[10px] font-black uppercase tracking-[0.3em]">Nutriendo el Futuro</p>
          </div>
        </footer>
      )}

      <style>{`
        @keyframes slideDown { from { transform: translateY(-100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .animate-slideDown { animation: slideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
      `}</style>
    </div>
  );
};

export default App;