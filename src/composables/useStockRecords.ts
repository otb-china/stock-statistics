import { ref } from "vue";
import { showToast } from "vant";
import { LStorage } from "@/utils/localStorage";
import { createId, normalizeMaterials, normalizeOrders, normalizeProducts } from "@/utils/stockData";
import type { Order, StockBackup, StockData, StockMovement, StockMovementReason } from "@/types/stock";

interface StoredRecords {
  data: StockData;
  recovery?: StockBackup;
  lastExportAt?: string;
}

interface MovementContext {
  reason: StockMovementReason;
  order?: Order;
}

const storageKey = "stockStatisticsRecords";

function withDefaultCosts<T extends StockData>(data: T): T {
  return {
    ...data,
    products: data.products.map((product) => product.defaultCost == null ? { ...product, defaultCost: 0 } : product),
    orders: data.orders.map((order) => order.cost == null ? { ...order, cost: 0 } : order),
  };
}

export function useStockRecords() {
  let storedValue = localStorage.getItem(storageKey);
  const storedRecords: StoredRecords | undefined = storedValue ? JSON.parse(storedValue) : undefined;
  const records = ref<StoredRecords>(storedRecords ? {
    ...storedRecords,
    data: withDefaultCosts(storedRecords.data),
    recovery: storedRecords.recovery && withDefaultCosts(storedRecords.recovery),
  } : {
    data: {
      materials: normalizeMaterials(LStorage.data.getter()),
      products: normalizeProducts(LStorage.productData.getter()),
      orders: normalizeOrders(LStorage.orderData.getter()),
      movements: [],
    },
  });

  function save(next: StoredRecords) {
    try {
      if (localStorage.getItem(storageKey) !== storedValue) {
        showToast("数据已在其他页面更新，请刷新后重试");
        return false;
      }
      const serialized = JSON.stringify(next);
      localStorage.setItem(storageKey, serialized);
      storedValue = serialized;
      records.value = next;
      return true;
    } catch {
      showToast("数据保存失败，请检查浏览器存储空间后重试");
      return false;
    }
  }

  function commit(changes: Partial<StockData>, context?: MovementContext) {
    const current = records.value.data;
    const data = { ...current, ...changes };
    if (changes.materials && context) {
      const before = new Map(current.materials.map((item) => [item.id, item]));
      const after = new Map(data.materials.map((item) => [item.id, item]));
      const timestamp = new Date().toISOString();
      const movements: StockMovement[] = [];
      for (const id of new Set([...before.keys(), ...after.keys()])) {
        const previous = before.get(id);
        const next = after.get(id);
        const balance = next?.num ?? 0;
        const delta = Number((balance - (previous?.num ?? 0)).toPrecision(15));
        if (!delta) continue;
        movements.push({
          id: createId("movement"),
          materialId: id,
          materialName: next?.name ?? previous?.name ?? id,
          timestamp,
          reason: context.reason,
          delta,
          balance,
          orderId: context.order?.id,
          orderTitle: context.order?.title,
        });
      }
      data.movements = [...movements, ...current.movements];
    }
    return save({ ...records.value, data });
  }

  function snapshot(): StockBackup {
    return { ...records.value.data, createdAt: new Date().toISOString() };
  }

  function replaceData(data: StockData) {
    return save({ ...records.value, data, recovery: snapshot() });
  }

  function recordExport(createdAt: string) {
    return save({ ...records.value, lastExportAt: createdAt });
  }

  return { records, commit, snapshot, replaceData, recordExport };
}
