import { computed, ref, type Ref } from "vue";
import dayjs from "dayjs";
import { showConfirmDialog } from "vant";
import { toastSuccess } from "@/utils/toast";
import {
  assertValidBackupData,
  normalizeMaterials,
  normalizeOrders,
  normalizeProducts,
  resolveBackupData,
} from "@/utils/stockData";
import type { BackupData, StockBackup, StockData } from "@/types/stock";
import type { useStockRecords } from "./useStockRecords";

export function useBackupActions(
  storage: ReturnType<typeof useStockRecords>,
  settingsPopup: Ref<boolean>,
  onDataReplaced: () => void,
) {
  const importShow = ref(false);
  const importInfo = ref<{ fileName: string; data: StockData | null; createdAt: string; error: string }>({
    fileName: "", data: null, createdAt: "", error: "",
  });
  const describeData = (data: StockData) =>
    `${data.materials.length} 项备料 · ${data.products.length} 个货品 · ${data.orders.length} 条订单 · ${data.movements.length} 条库存流水`;
  const describeDate = (date?: string) => date ? dayjs(date).format("YYYY-MM-DD HH:mm") : "日期未知";
  const importExportSummary = computed(() => describeData(storage.records.value.data));
  const importPreview = computed(() => {
    const { data, createdAt } = importInfo.value;
    return data ? `${describeDate(createdAt)} · ${describeData(data)}` : "";
  });
  const recoverySummary = computed(() => {
    const recovery = storage.records.value.recovery;
    return recovery ? `${describeDate(recovery.createdAt)} · ${describeData(recovery)}` : "";
  });
  const lastExport = computed(() => {
    const date = storage.records.value.lastExportAt;
    return date ? `最近导出 ${describeDate(date)}` : "还没有导出记录";
  });

  function openImportExport() {
    settingsPopup.value = false;
    importInfo.value = { fileName: "", data: null, createdAt: "", error: "" };
    importShow.value = true;
  }

  function exportAllData() {
    const backup = storage.snapshot();
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `stock-statistics-backup-${dayjs(backup.createdAt).format("YYYY-MM-DD-HHmmss")}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    if (storage.recordExport(backup.createdAt)) toastSuccess("已发起备份下载");
  }

  function onImportFileError(error: string) {
    importInfo.value = { fileName: "", data: null, createdAt: "", error };
  }

  function onImportFileLoaded({ dataStr, fileName }: { dataStr: string; fileName: string }) {
    try {
      const parsed = JSON.parse(dataStr) as BackupData;
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("备份格式有误");
      const resolved = resolveBackupData(parsed);
      assertValidBackupData(resolved);
      importInfo.value = {
        fileName,
        createdAt: typeof parsed.createdAt === "string" && Number.isFinite(Date.parse(parsed.createdAt))
          ? parsed.createdAt : "",
        data: {
          materials: normalizeMaterials(resolved.materials),
          products: normalizeProducts(resolved.products),
          orders: normalizeOrders(resolved.orders),
          movements: resolved.movements,
        },
        error: "",
      };
    } catch (error) {
      onImportFileError(error instanceof SyntaxError ? "无法读取 JSON，请检查备份文件" : "备份数据格式有误");
    }
  }

  function replace(data: StockData, message: string) {
    if (!storage.replaceData(data)) return;
    onDataReplaced();
    settingsPopup.value = false;
    importShow.value = false;
    toastSuccess(message);
  }

  function resetAllData() {
    showConfirmDialog({
      title: "清空数据",
      message: "清空全部数据？清空前的数据会保留在最近可恢复备份中。",
      confirmButtonText: "确认清空",
      className: "danger-dialog",
    }).then(() => replace({ materials: [], products: [], orders: [], movements: [] }, "数据已清空，可在设置中恢复"))
      .catch(() => {});
  }

  function restoreRecovery() {
    const recovery = storage.records.value.recovery;
    if (!recovery) return;
    showConfirmDialog({
      title: "恢复最近备份",
      message: `将恢复 ${recoverySummary.value}。恢复前的当前数据也会保留为可恢复备份。`,
      confirmButtonText: "确认恢复",
    }).then(() => {
      const { materials, products, orders, movements }: StockBackup = recovery;
      replace({ materials, products, orders, movements }, "已恢复备份");
    }).catch(() => {});
  }

  function importData() {
    const data = importInfo.value.data;
    if (!data) return;
    replace(data, "已导入备份，可在设置中恢复覆盖前的数据");
  }

  return {
    importShow, importInfo, importPreview, importExportSummary, recoverySummary, lastExport,
    openImportExport, exportAllData, onImportFileLoaded, onImportFileError, resetAllData, restoreRecovery, importData,
  };
}
