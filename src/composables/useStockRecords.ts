import { ref } from "vue";
import { toastError } from "@/utils/toast";
import { readStoredValue, StorageConflictError, storageKeys, writeStoredValues } from "@/utils/toolStorage";
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

const storageKey = storageKeys.records;

function withDefaultCosts<T extends StockData>(data: T): T {
  return {
    ...data,
    products: data.products.map(({ defaultCost: _legacyCost, ...product }) => product),
    orders: data.orders.map((order) => order.cost == null ? { ...order, cost: 0 } : order),
  };
}

export function useStockRecords() {
  const storedValue = readStoredValue(storageKey);
  let saving = false;
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

  async function save(next: StoredRecords) {
    if (saving) return false;
    saving = true;
    try {
      await writeStoredValues({ [storageKey]: JSON.stringify(next) });
      records.value = next;
      return true;
    } catch (error) {
      if (error instanceof DOMException && error.name === "QuotaExceededError") {
        toastError("站点存储空间不足，本次改动未保存。请先备份已保存的数据");
      } else {
        toastError(error instanceof StorageConflictError ? error.message : "数据保存失败，请检查浏览器存储空间后重试");
      }
      return false;
    } finally {
      saving = false;
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
        if ((next ?? previous)?.untracked) continue;
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
