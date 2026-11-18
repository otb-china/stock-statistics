import type { RSA } from "otb-toolkit/src/types";
import { sort } from "otb-toolkit/src/utils/data.ts";
import { stockMovementLabels } from "@/types/stock";
import type {
  BackupData,
  Material,
  Order,
  Product,
  ProductEditorForm,
  ProductRecipe,
  ResolvedBackupData,
  StockMovement,
} from "@/types/stock";

export const createId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const legacyMaterialId = (name: string) => `material-${encodeURIComponent(name)}`;

export function recipeQuantities(recipe: ProductRecipe[]) {
  const quantities = new Map<string, number>();
  for (const item of recipe) {
    if (!item.materialId || !Number.isFinite(item.quantity) || item.quantity <= 0) return new Map<string, number>();
    quantities.set(item.materialId, Number(((quantities.get(item.materialId) ?? 0) + item.quantity).toPrecision(15)));
  }
  return quantities;
}

export function createEmptyMaterialForm(): Material {
  return {
    id: "",
    name: "",
    num: 0,
    unitCost: 0,
  };
}

export function createEmptyProductForm(): ProductEditorForm {
  return {
    id: "",
    name: "",
    status: "active",
    freeShipping: true,
    shippingFee: 0,
    warningThreshold: DEFAULT_WARNING_THRESHOLD,
    recipe: [],
  };
}

export const DEFAULT_WARNING_THRESHOLD = 1;

export function isValidWarningThreshold(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

export function craftableStatus(count: number, threshold = DEFAULT_WARNING_THRESHOLD) {
  if (count <= 0) return "danger";
  return count <= threshold ? "warning" : "safe";
}

export function createEmptyOrderForm(): Order {
  return {
    id: "",
    title: "",
    value: 0,
    orderDate: "",
    quantity: 1,
  };
}

export function moneyCents(value: number) {
  return Math.round(Number((value * 100).toPrecision(15)));
}

export function isValidAmount(value: unknown): value is number {
  return typeof value === "number" && value >= 0 && Number.isSafeInteger(moneyCents(value));
}

export function recipeUnitCost(recipe: ProductRecipe[], materials: Material[]) {
  const quantities = recipeQuantities(recipe);
  if (!quantities.size) return undefined;

  const materialsById = new Map(materials.map((material) => [material.id, material]));
  let total = 0;
  for (const [materialId, quantity] of quantities) {
    const material = materialsById.get(materialId);
    if (!material) return undefined;
    total += (material.unitCost ?? 0) * quantity;
  }
  return isValidAmount(total) ? moneyCents(total) / 100 : undefined;
}

export function orderNetIncomeCents({ value, cost, shippingFee = 0 }: Pick<Order, "value" | "cost" | "shippingFee">) {
  const orderCost = cost ?? 0;
  if (!isValidAmount(value) || !isValidAmount(orderCost) || !isValidAmount(shippingFee)) return undefined;
  return moneyCents(value) - moneyCents(orderCost) - moneyCents(shippingFee);
}

export function summarizeOrders(orders: Order[]) {
  let revenue = 0;
  let netIncome = 0;
  for (const order of orders) {
    revenue += moneyCents(order.value);
    netIncome += orderNetIncomeCents(order) ?? 0;
  }
  return { revenue: revenue / 100, netIncome: netIncome / 100 };
}

export function normalizeMaterials(list: RSA[] | undefined): Material[] {
  const source = Array.isArray(list) ? list : [];
  return source.map((item) => ({
    id: String(item.id || legacyMaterialId(String(item.name || ""))),
    name: String(item.name || ""),
    num: Number(item.num || 0),
    unitCost: isValidAmount(item.unitCost) ? item.unitCost : 0,
  })).filter((item) => item.name);
}

export function normalizeProducts(list: RSA[] | undefined): Product[] {
  const source = Array.isArray(list) ? list : [];
  return source.map((item): Product => {
    const status: Product["status"] = item.status === "inactive" ? "inactive" : "active";
    const freeShipping = item.freeShipping !== false;
    return {
      id: String(item.id || createId("product")),
      name: String(item.name || ""),
      defaultValue: Number(item.defaultValue ?? item.value ?? 0),
      freeShipping,
      shippingFee: freeShipping && isValidAmount(item.shippingFee) ? moneyCents(item.shippingFee) / 100 : undefined,
      warningThreshold: isValidWarningThreshold(item.warningThreshold) ? item.warningThreshold : DEFAULT_WARNING_THRESHOLD,
      status,
      recipe: Array.isArray(item.recipe)
        ? item.recipe
          .map((recipe: RSA): ProductRecipe => ({
            materialId: String(recipe.materialId || ""),
            quantity: Number(recipe.quantity || 1),
          }))
          .filter((recipe) => recipe.materialId)
        : [],
    };
  }).filter((item) => item.name);
}

export function normalizeOrders(list: RSA[] | undefined): Order[] {
  const source = Array.isArray(list) ? list : [];
  return sort(source.map((item): Order => ({
    id: String(item.id || createId("order")),
    title: String(item.title || ""),
    value: Number(item.value || 0),
    cost: isValidAmount(item.cost) ? moneyCents(item.cost) / 100 : 0,
    shippingFee: isValidAmount(item.shippingFee) ? moneyCents(item.shippingFee) / 100 : undefined,
    orderDate: String(item.orderDate || ""),
    quantity: Number.isSafeInteger(item.quantity) && item.quantity > 0 ? item.quantity : 1,
    deductedMaterials: isValidDeduction(item.deductedMaterials) ? item.deductedMaterials : undefined,
  })), "desc", "orderDate");
}

function isValidDeduction(value: unknown): value is ProductRecipe[] {
  if (!Array.isArray(value)) return false;
  const materialIds = new Set<string>();
  for (const item of value) {
    if (
      !item || typeof item.materialId !== "string" || !item.materialId
      || materialIds.has(item.materialId) || !Number.isFinite(item.quantity) || item.quantity <= 0
    ) return false;
    materialIds.add(item.materialId);
  }
  return true;
}

export function resolveBackupList(parsedData: BackupData, primaryKey: keyof BackupData, legacyKey: keyof BackupData) {
  const primaryValue = parsedData[primaryKey];
  const legacyValue = parsedData[legacyKey];
  if (Array.isArray(primaryValue)) return primaryValue;
  if (Array.isArray(legacyValue)) return legacyValue;
  return null;
}

export function resolveBackupData(parsedData: BackupData): ResolvedBackupData {
  const materials = resolveBackupList(parsedData, "materials", "data");
  const products = resolveBackupList(parsedData, "products", "productData");
  const orders = resolveBackupList(parsedData, "orders", "orderData");

  if (!materials || !products || !orders) {
    throw new Error("备份数据不完整");
  }

  const movements: unknown = parsedData.movements ?? [];
  if (!Array.isArray(movements) || !movements.every(isStockMovement)) {
    throw new Error("库存流水格式有误");
  }
  return { materials, products, orders, movements };
}

function isStockMovement(value: unknown): value is StockMovement {
  if (!value || typeof value !== "object") return false;
  const item = value as StockMovement;
  return typeof item.id === "string" && typeof item.materialId === "string"
    && typeof item.materialName === "string" && typeof item.timestamp === "string"
    && Number.isFinite(Date.parse(item.timestamp))
    && Object.prototype.hasOwnProperty.call(stockMovementLabels, item.reason)
    && Number.isFinite(item.delta) && Number.isFinite(item.balance)
    && (item.orderId === undefined || typeof item.orderId === "string")
    && (item.orderTitle === undefined || typeof item.orderTitle === "string");
}

export function assertValidBackupData({ materials, products, orders }: ResolvedBackupData) {
  if (products.some((product) => product?.warningThreshold !== undefined && !isValidWarningThreshold(product.warningThreshold))) {
    throw new Error("货品预警阈值无效");
  }
  if (materials.some((material) => material?.unitCost != null && !isValidAmount(material.unitCost))
    || orders.some((order) => order?.cost != null && !isValidAmount(order.cost))) {
    throw new Error("成本金额无效");
  }
  if (products.some((product) => product?.freeShipping !== undefined && typeof product.freeShipping !== "boolean")
    || [...products, ...orders].some((item) => item?.shippingFee !== undefined && !isValidAmount(item.shippingFee))) {
    throw new Error("运费配置无效");
  }
  if (orders.some((order) => order?.deductedMaterials !== undefined && !isValidDeduction(order.deductedMaterials))) {
    throw new Error("订单扣料明细无效");
  }
  if (orders.some((order) => order?.quantity !== undefined && (!Number.isSafeInteger(order.quantity) || order.quantity <= 0))) {
    throw new Error("订单数量无效");
  }
  const normalizedMaterials = normalizeMaterials(materials);
  const normalizedProducts = normalizeProducts(products);
  const normalizedOrders = normalizeOrders(orders);

  if (
    normalizedMaterials.length !== materials.length
    || normalizedProducts.length !== products.length
    || normalizedOrders.length !== orders.length
  ) {
    throw new Error("备份字段不完整");
  }

  const materialIds = new Set(normalizedMaterials.map((item) => item.id));
  const hasInvalidRecipe = normalizedProducts.some((product) => {
    return product.recipe.some((recipe) => !materialIds.has(recipe.materialId));
  });

  if (hasInvalidRecipe) {
    throw new Error("货品配方引用了不存在的备料");
  }
}
