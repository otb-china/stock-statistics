import type { RSA } from "otb-toolkit/src/types";

export type MaterialGroupKey = "danger" | "warning" | "safe" | "unlinked";
export type EditorType = "add" | "edit";
export type OrderEditorType = "add" | "upd";

export interface Material extends RSA {
  id: string;
  name: string;
  num: number;
  unitCost?: number;
}

export interface ProductRecipe extends RSA {
  materialId: string;
  quantity: number;
}

export interface MaterialProductLink {
  productId: string;
  quantity: number | null | undefined;
}

export interface Product extends RSA {
  id: string;
  name: string;
  defaultValue: number;
  freeShipping?: boolean;
  shippingFee?: number;
  warningThreshold?: number;
  status: "active" | "inactive";
  recipe: ProductRecipe[];
}

export type ProductEditorForm = Pick<Product, "id" | "name" | "status" | "recipe" | "warningThreshold" | "shippingFee"> & {
  defaultValue?: number;
  freeShipping: boolean;
};

export interface Order extends RSA {
  id: string;
  title: string;
  value: number;
  cost?: number;
  shippingFee?: number;
  orderDate: string;
  quantity: number;
  deductedMaterials?: ProductRecipe[];
}

export const stockMovementLabels = {
  initial: "初始库存",
  restock: "补库存",
  adjustment: "盘点调整",
  deduction: "订单扣料",
  return: "订单返料",
  removal: "删除备料",
} as const;

export type StockMovementReason = keyof typeof stockMovementLabels;

export interface StockMovement {
  id: string;
  materialId: string;
  materialName: string;
  timestamp: string;
  reason: StockMovementReason;
  delta: number;
  balance: number;
  orderId?: string;
  orderTitle?: string;
}

export interface StockData {
  materials: Material[];
  products: Product[];
  orders: Order[];
  movements: StockMovement[];
}

export interface StockBackup extends StockData {
  createdAt: string;
}

export interface BackupData extends RSA {
  materials?: RSA[];
  products?: RSA[];
  orders?: RSA[];
  data?: RSA[];
  productData?: RSA[];
  orderData?: RSA[];
}

export interface ResolvedBackupData {
  materials: RSA[];
  products: RSA[];
  orders: RSA[];
  movements: StockMovement[];
}
