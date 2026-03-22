export interface PriceList {
  id: string;
  code: string;
  name: string;
  margin_percent: number;
  active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ProductPrice {
  id: string;
  product_id: string;
  price_list_id: string;
  cost_price: number;
  margin_percent: number;
  final_price: number;
  is_fixed: boolean;
  fixed_price: number | null;
  exclude_from_mass_update: boolean;
  created_at: string;
  updated_at: string;
  price_lists?: PriceList;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  wholesale_price: number;
  image_url: string | null;
  rubro: string | null;
  marca: string | null;
  stock: number;
  estado: string | null;
  en_promo: boolean | null;
  vendidos: number | null;
  arqueo: number | null;
  costo: number | null;
  minimo: number | null;
  es_fraccionable: boolean;
  factor_fraccionamiento: number | null;
  created_at: string;
  updated_at: string;
  barcode: string | null;
  external_pk: string | null;
  product_prices?: ProductPrice[];
}

export interface Promotion {
  id: string;
  name: string;
  discount_percentage: number;
  type: 'percentage' | 'fijo';
  vigencia_type: 'date' | 'stock';
  applies_to: 'global' | 'rubro' | 'producto';
  applies_to_price_list: 'all' | 'lista_1' | 'lista_2' | 'lista_3';
  target_value: string | null;
  start_date: string | null;
  end_date: string | null;
  promo_stock_limit: number | null;
  promo_stock_sold: number;
  created_at: string;
  updated_at: string;
  products?: Product[];
}

export interface Sale {
  id: string;
  codigo_venta: string;
  cliente_id: string | null;
  caja_id: string | null;
  total: number;
  estado: 'completada' | 'pendiente' | 'presupuesto';
  metodo_pago: 'efectivo' | 'digital' | 'mixto';
  tipo_digital: 'mercadopago' | 'transferencia' | 'tarjeta' | null;
  cuotas: number | null;
  monto_efectivo: number | null;
  monto_digital: number | null;
  tipo_descuento: 'ninguno' | 'porcentaje' | 'fijo' | null;
  valor_descuento: number | null;
  price_list: 'minorista' | 'mayorista' | null;
  total_productos: number;
  fecha: string;
  creado_en: string;
  actualizado_en: string;
}

export interface SaleItem {
  id: number;
  sale_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
  original_price: number;
  price_list: 'minorista' | 'mayorista' | null;
  discount_type: 'ninguno' | 'porcentaje' | 'fijo' | null;
  discount_value: number | null;
  discount_amount: number | null;
  created_at: string;
}

export interface CartItem {
  product: Product;
  priceType: 'lista_1' | 'lista_2' | 'lista_3';
  price: number;
  originalPrice: number;
  quantity: number;
  subtotal: number;
  discountType?: 'none' | 'percent' | 'amount' | 'ninguno' | 'porcentaje' | 'fijo';
  discountValue?: number;
  discountAmount?: number;
}

export interface Supplier {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Purchase {
  id: string;
  supplier_id: string | null;
  supplier_name: string | null;
  date: string;
  total: number;
  paid_cash: number | null;
  paid_digital: number | null;
  debt: number | null;
  created_at: string;
  updated_at: string;
}

export interface PurchaseItem {
  id: number;
  purchase_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
  expiration_date: string | null;
  created_at: string;
}