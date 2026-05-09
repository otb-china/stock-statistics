import type { RSA } from "otb-toolkit/src/types";
import { sort } from "otb-toolkit/src/utils/data.ts";
import type {
  BackupData,
  Material,
  Order,
  Product,
  ProductRecipe,
  ResolvedBackupData,
} from "@/types/stock";

export const defaultMaterialNames = [
  "风扇",
  "塑料盒",
  "钢丝软管",
  "直法兰",
  "2.0包装箱",
  "2.0饮料瓶",
  "花瓶",
  "6型号盖",
  "90度弯头",
  "45度弯头",
  "50管",
  "内50软管",
  "3.0包装箱",
  "3.0矿泉水桶",
  "3.0吸管",
];

export const defaultProductConfigs = [
  {
    name: "吸尘器 2.0",
    defaultValue: 45,
    recipe: [
      { name: "风扇", quantity: 1 },
      { name: "塑料盒", quantity: 2 },
      { name: "钢丝软管", quantity: 2 },
      { name: "直法兰", quantity: 1 },
      { name: "2.0包装箱", quantity: 1 },
      { name: "2.0饮料瓶", quantity: 1 },
    ],
  },
  {
    name: "吸尘器 3.0",
    defaultValue: 65,
    recipe: [
      { name: "风扇", quantity: 1 },
      { name: "塑料盒", quantity: 1 },
      { name: "直法兰", quantity: 1 },
      { name: "花瓶", quantity: 1 },
      { name: "90度弯头", quantity: 3 },
      { name: "45度弯头", quantity: 1 },
      { name: "50管", quantity: 1 },
      { name: "内50软管", quantity: 1 },
      { name: "6型号盖", quantity: 1 },
      { name: "3.0矿泉水桶", quantity: 1 },
      { name: "3.0吸管", quantity: 1 },
    ],
  },
];

export const createId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const legacyMaterialId = (name: string) => `material-${encodeURIComponent(name)}`;

export function createEmptyMaterialForm(): Material {
  return {
    id: "",
    name: "",
    num: 0,
  };
}

export function createEmptyProductForm(): Product {
  return {
    id: "",
    name: "",
    defaultValue: 0,
    status: "active",
    recipe: [],
  };
}

export function createEmptyOrderForm(): Order {
  return {
    id: "",
    title: "",
    value: 0,
    orderDate: "",
  };
}

export function sumOrderValue(list: Order[]) {
  return list.reduce((total, item) => total + Number(item.value), 0);
}

export function buildDefaultProducts(): Product[] {
  return defaultProductConfigs.map((product) => ({
    id: createId("product"),
    name: product.name,
    defaultValue: product.defaultValue,
    status: "active" as const,
    recipe: product.recipe.map((item) => ({
      materialId: legacyMaterialId(item.name),
      quantity: item.quantity,
    })),
  }));
}

export function normalizeMaterials(list: RSA[] | undefined): Material[] {
  const source = Array.isArray(list) ? list : [];
  return source.map((item) => ({
    id: String(item.id || legacyMaterialId(String(item.name || ""))),
    name: String(item.name || ""),
    num: Number(item.num || 0),
  })).filter((item) => item.name);
}

export function normalizeProducts(list: RSA[] | undefined): Product[] {
  const source = Array.isArray(list) ? list : [];
  return source.map((item): Product => {
    const status: Product["status"] = item.status === "inactive" ? "inactive" : "active";
    return {
      id: String(item.id || createId("product")),
      name: String(item.name || ""),
      defaultValue: Number(item.defaultValue || item.value || 0),
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
  return sort(source.map((item) => ({
    id: String(item.id || createId("order")),
    title: String(item.title || ""),
    value: Number(item.value || 0),
    orderDate: String(item.orderDate || ""),
  })), "desc", "orderDate");
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

  return { materials, products, orders };
}

export function assertValidBackupData({ materials, products, orders }: ResolvedBackupData) {
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
