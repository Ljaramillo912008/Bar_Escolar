
export type Role = 'STAFF' | 'PARENT';

export interface User {
  id: string;
  name: string;
  role: Role;
  email: string;
  avatar?: string;
  phone?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: 'Lácteos' | 'Panadería' | 'Bebidas' | 'Limpieza' | 'Proteínas' | 'Frutas/Verduras';
  stock: number;
  minStock: number;
  unit: string;
  cost: number;
  expiryDate: string;
  supplierId: string;
  priceHistory?: { date: string; price: number }[];
}

export interface WasteRecord {
  id: string;
  itemId: string;
  itemName: string;
  quantity: number;
  reason: 'Caducidad' | 'Accidente' | 'Mal estado' | 'Robo/Extravío';
  date: string;
  lossValue: number;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  category: string;
  deliveryDays: string[];
  email: string;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  cost: number; 
  category: 'Desayuno' | 'Almuerzo' | 'Snack' | 'Bebida';
  available: boolean;
  image: string;
  nutritionalInfo?: string;
  ingredients?: string[];
  tags?: string[];
  rating?: number;
  isTopSeller?: boolean;
  customizations?: string[];
  // Información Nutricional
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface OrderItem {
  menuItemId: string;
  quantity: number;
  notes?: string;
}

export interface Order {
  id: string;
  parentId: string;
  childName: string;
  items: OrderItem[];
  total: number;
  status: 'Pendiente' | 'Preparando' | 'Listo' | 'Entregado' | 'Cancelado';
  scheduledDate: string;
  createdAt: string;
}
