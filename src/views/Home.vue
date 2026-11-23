<template>
  <div class="home-page" :style="themeStyle">
    <header class="page-header" :class="{ scrolled: isScrolled }">
      <div class="brand">
        <img class="brand-logo" src="@/assets/logo.svg" alt="" />
        <div>
          <h1>备料统计</h1>
          <p>{{ todayText }}</p>
        </div>
      </div>
      <div class="header-actions">
        <button v-if="showScrollTop" class="header-icon" type="button" aria-label="返回顶部" @click="scrollToTop">
          <el-icon><Top /></el-icon>
        </button>
        <button class="header-icon" type="button" aria-label="更多操作" @click="settingsPopup = true">
          <el-icon><Setting /></el-icon>
        </button>
      </div>
    </header>

    <main class="page-main">
      <section class="stats-card" aria-label="收入统计">
        <div class="stats-top">
          <span class="stats-month">{{ currentMonthLabel }}</span>
          <span class="stats-orders">共 {{ orderInfo.data.length }} 单</span>
        </div>
        <div class="stats-main">
          <div class="stats-primary">
            <span class="stats-label">本月净收入</span>
            <strong class="stats-value"><small>¥</small>{{ formatMoney(currentMonthTotals.netIncome, "") }}</strong>
          </div>
          <div class="stats-secondary">
            <span class="stats-label">本月流水</span>
            <strong><small>¥</small>{{ formatMoney(currentMonthTotals.revenue, "") }}</strong>
          </div>
        </div>
        <div class="stats-foot">
          <div>
            <span>累计净收入</span>
            <strong>{{ formatMoney(orderTotals.netIncome) }}</strong>
          </div>
          <div>
            <span>累计流水</span>
            <strong>{{ formatMoney(orderTotals.revenue) }}</strong>
          </div>
        </div>
        <span class="stats-deco" aria-hidden="true"></span>
      </section>

      <section class="block" aria-labelledby="materials-title">
        <header class="block-head">
          <div class="block-title">
            <span class="block-icon materials"><el-icon><Box /></el-icon></span>
            <span class="block-text">
              <h2 id="materials-title">备料</h2>
              <small>
                <template v-if="data.length">
                  {{ materialsSummary.totalKinds }} 种
                  <template v-if="warningMaterials.length">
                    · <b :class="materialsSummary.dangerKinds ? 'is-danger' : 'is-warning'">{{ materialsSummary.footerText }}</b>
                  </template>
                  <template v-else> · 库存充足</template>
                </template>
                <template v-else>暂无备料</template>
              </small>
            </span>
          </div>
          <button class="block-add" type="button" aria-label="新增备料" @click="openMaterialEditor()">
            <el-icon><Plus /></el-icon>
          </button>
        </header>

        <MaterialList
          :materials="data"
          :group-key="materialGroupKey"
          :related-summary="materialRelatedSummary"
          @edit="openMaterialEditor"
          @remove="removeMaterial"
          @restock="openRestock"
          @history="openStockHistory"
        />
      </section>

      <section class="block" aria-labelledby="products-title">
        <header class="block-head">
          <div class="block-title">
            <span class="block-icon products"><el-icon><Goods /></el-icon></span>
            <span class="block-text">
              <h2 id="products-title">货品</h2>
              <small>{{ activeProductsCount }} 款在售<template v-if="products.length > activeProductsCount"> · {{ products.length - activeProductsCount }} 款停产</template></small>
            </span>
          </div>
          <button class="block-add" type="button" aria-label="新增货品" @click="openProductEditor()">
            <el-icon><Plus /></el-icon>
          </button>
        </header>

        <ProductList
          :products="productsList"
          :materials="data"
          :craftable-count-for-product="craftableCountForProduct"
          @edit="openProductEditor"
          @order="openCreateOrder"
          @toggle-status="toggleProductStatus"
          @remove="removeProduct"
        />
      </section>

      <section class="block" aria-labelledby="orders-title">
        <header class="block-head">
          <div class="block-title">
            <span class="block-icon orders"><el-icon><Tickets /></el-icon></span>
            <span class="block-text">
              <h2 id="orders-title">订单</h2>
              <small>
                <template v-if="orderInfo.checkedMonth">筛选出 {{ OrderData.length }} 单</template>
                <template v-else>共 {{ orderInfo.data.length }} 单</template>
              </small>
            </span>
          </div>
          <button class="block-add" type="button" aria-label="记单" @click="openCreateOrder()">
            <el-icon><Plus /></el-icon>
          </button>
        </header>

        <div class="month-filter" v-if="orderInfo.monthData.length">
          <button
            class="month-chip"
            :class="{ active: !orderInfo.checkedMonth }"
            :aria-pressed="!orderInfo.checkedMonth"
            type="button"
            @click="monthChange('')"
          >
            <span>全部</span>
            <strong>{{ formatMoney(orderTotals.netIncome) }}</strong>
          </button>
          <button
            v-for="item in orderInfo.monthData"
            :key="item.month"
            class="month-chip"
            :class="{ active: orderInfo.checkedMonth === item.month }"
            :aria-pressed="orderInfo.checkedMonth === item.month"
            type="button"
            @click="monthChange(item.month)"
          >
            <span>{{ formatMonth(item.month) }}</span>
            <strong>{{ formatMoney(item.netIncome) }}</strong>
          </button>
        </div>

        <div v-if="OrderData.length" ref="orderListRef" class="order-list" :class="{ scrollable: OrderData.length > ORDER_VISIBLE_ROWS }">
          <SwipeRow
            v-for="item in OrderData"
            :key="item.id"
            class="order-swipe"
            :label="item.title + '订单'"
            :actions="[{ name: '删除', icon: Delete, tone: 'danger', callback: () => del(item) }]"
            swipe-to-trigger
          >
            <button class="order-edit" type="button" @click="beforeUpd(item)">
              <span class="order-avatar" aria-hidden="true">{{ item.title.slice(0, 1) }}</span>
              <span class="order-info">
                <strong>{{ item.title }}</strong>
                <small>{{ formatOrderDate(item.orderDate) }} · {{ item.quantity }} 件</small>
              </span>
              <span class="order-amount">
                <strong>{{ formatOrderIncome(item) }}</strong>
                <small>收入</small>
              </span>
            </button>
          </SwipeRow>

        </div>

        <div v-else class="orders-empty">
          <span class="orders-empty-icon"><el-icon><Tickets /></el-icon></span>
          <strong>{{ orderInfo.checkedMonth ? "没有匹配的订单" : "还没有订单记录" }}</strong>
          <span v-if="!orderInfo.data.length">
            {{
              !data.length
                ? "先配置备料，再配置货品，之后就可以记录订单。"
                : (products.length ? "记单后，这里会按月份汇总收入。" : "先配置货品，再开始记录订单。")
            }}
          </span>
          <button v-if="!orderInfo.data.length" class="ghost-btn" type="button" @click="openImportExport">导入备份</button>
        </div>
      </section>
    </main>

    <MaterialEditorPopup
      v-model:show="materialEditor.show"
      :type="materialEditor.type"
      :form="materialEditor.form"
      :products="activeProducts"
      :product-links="materialEditor.productLinks"
      @select-products="setMaterialLinkedProducts"
      @submit="submitMaterialEditor"
      @history="openStockHistory"
    />

    <van-popup v-model:show="restock.show" position="bottom" round destroy-on-close>
      <form v-if="restockMaterial" class="popup-body" @submit.prevent="submitRestock">
        <div class="popup-head">
          <div class="popup-title">
            <span class="popup-icon"><el-icon><Plus /></el-icon></span>
            <div>
              <h3>补库存</h3>
              <p>{{ restockMaterial.name }}</p>
            </div>
          </div>
        </div>
        <div class="restock-preview" aria-live="polite">
          <div>
            <small>当前库存</small>
            <strong>{{ restockMaterial.num }}</strong>
          </div>
          <el-icon><Right /></el-icon>
          <div :class="{ ready: restockTotal !== null }">
            <small>补货后</small>
            <strong>{{ restockTotal ?? restockMaterial.num }}</strong>
          </div>
        </div>
        <div class="form-field restock-field">
          <span class="form-label">本次补货数量</span>
          <el-input-number id="restock-quantity" v-model="restock.quantity" :min="0" aria-label="本次补货数量" />
        </div>
        <div class="restock-steps">
          <button v-for="step in [2, 5, 10]" :key="step" type="button" @click="restock.quantity = (restock.quantity || 0) + step">+{{ step }}</button>
        </div>
        <div class="popup-footer">
          <el-button class="submit-button" type="primary" native-type="submit" :disabled="restockTotal === null">确认补库存</el-button>
        </div>
      </form>
    </van-popup>

    <StockHistoryPopup
      v-model:show="history.show"
      :name="historyMaterial?.name ?? ''"
      :balance="historyMaterial?.num ?? 0"
      :movements="historyMovements"
    />

    <ProductEditorPopup
      v-model:show="productEditor.show"
      :type="productEditor.type"
      :form="productEditor.form"
      :limiting-materials="limitingMaterials(productEditor.form)"
      :shared-materials="sharedMaterials(productEditor.form)"
      :materials="data"
      @set-recipe-materials="setRecipeMaterials"
      @remove-recipe="removeRecipeItem"
      @submit="submitProductEditor"
    />

    <SettingsPopup
      v-model:show="settingsPopup"
      :theme-options="themeOptions"
      :current-theme="currentTheme"
      :current-theme-name="currentThemeOption.name"
      :last-export="lastExport"
      :recovery-summary="recoverySummary"
      @set-theme="setTheme"
      @export="exportAllData"
      @open-import="openImportExport"
      @reset="resetAllData"
      @restore="restoreRecovery"
    />

    <ImportDataPopup
      v-model:show="importShow"
      :summary="importExportSummary"
      :file-name="importInfo.fileName"
      :preview="importPreview"
      :error="importInfo.error"
      @file-loaded="onImportFileLoaded"
      @file-error="onImportFileError"
      @import="importData"
    />

    <OrderEditorPopup
      v-model:show="orderInfo.show"
      v-model:calculation="calculation"
      :type="orderInfo.type"
      :form="orderInfo.form"
      :show-product-picker="orderInfo.showProductPicker"
      :requires-manual-cost="requiresManualCost"
      :products="activeOrderProducts"
      :can-sync-calculation="canSyncCalculation"
      :deduction-message="deductionMessage"
      :craftable-count-for-product="craftableCountForProduct"
      @product-change="onProductChange"
      @sync-amounts="syncOrderAmounts"
      @date-change="setOrderDate"
      @quantity-change="setOrderQuantity"
      @value-change="setOrderValue"
      @cost-change="setOrderCost"
      @submit="orderSubmit"
    />
    <van-popup v-model:show="deleteOrderShow" class="confirm-dialog" round destroy-on-close>
      <span class="confirm-dialog-icon danger"><el-icon><Delete /></el-icon></span>
      <h3 class="confirm-dialog-title">删除「{{ deletingOrder?.title ?? "" }}」订单</h3>
      <p class="confirm-dialog-message">{{ deleteOrderDescription }}</p>
      <div class="confirm-dialog-actions" :class="{ stacked: deleteOrderActions.length > 1 }">
        <button
          v-for="(action, index) in deleteOrderActions"
          :key="action.name"
          class="confirm-dialog-button"
          :class="index === 0 ? 'danger' : 'danger-soft'"
          type="button"
          @click="action.callback()"
        >{{ action.name }}</button>
        <button class="confirm-dialog-button" type="button" @click="deleteOrderShow = false">取消</button>
      </div>
    </van-popup>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import SwipeRow from "@/components/SwipeRow.vue";
import StockHistoryPopup from "@/components/StockHistoryPopup.vue";
import { useStockRecords } from "@/composables/useStockRecords";
import { storageKeys } from "@/utils/toolStorage";
import { LStorage, reportSaveError } from "@/utils/localStorage.ts";
import { formatMoney, orderNetIncomeCents, summarizeOrders } from "@/utils/stockData";
import ImportDataPopup from "@/components/ImportDataPopup.vue";
import MaterialEditorPopup from "@/components/MaterialEditorPopup.vue";
import MaterialList from "@/components/MaterialList.vue";
import OrderEditorPopup from "@/components/OrderEditorPopup.vue";
import ProductEditorPopup from "@/components/ProductEditorPopup.vue";
import ProductList from "@/components/ProductList.vue";
import SettingsPopup from "@/components/SettingsPopup.vue";
import { DEFAULT_THEME, isThemeKey, themeOptions } from "@/config/themes";
import { useBackupActions } from "@/composables/useBackupActions";
import { useMaterialEditor } from "@/composables/useMaterialEditor";
import { useMaterialStatus } from "@/composables/useMaterialStatus";
import { useOrderActions } from "@/composables/useOrderActions";
import { useProductEditor } from "@/composables/useProductEditor";
import type { ThemeKey } from "@/config/themes";
import type {
  Material,
  MaterialGroupKey,
} from "@/types/stock";
import { Box, Delete, Goods, Plus, Right, Setting, Tickets, Top } from "@element-plus/icons-vue";
import dayjs from "dayjs";

const DATE_FORMAT = "YYYY-MM-DD";
const SCROLL_TOP_THRESHOLD = 240;
const ORDER_VISIBLE_ROWS = 5;

const showScrollTop = ref(false);
const isScrolled = ref(false);
const orderListRef = ref<HTMLElement>();
const currentTheme = ref<ThemeKey>(DEFAULT_THEME);
const stock = useStockRecords();
const data = computed(() => stock.records.value.data.materials);
const products = computed(() => stock.records.value.data.products);
const orders = computed(() => stock.records.value.data.orders);
const history = ref({ show: false, materialId: "" });
const historyMaterial = computed(() => data.value.find((item) => item.id === history.value.materialId));
const historyMovements = computed(() => stock.records.value.data.movements
  .filter((item) => item.materialId === history.value.materialId)
  .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp)));

function openStockHistory(item: Material) {
  history.value = { show: true, materialId: item.id };
}
const settingsPopup = ref(false);

const themeStorage = LStorage.new(storageKeys.theme);
const currentThemeOption = computed(() => {
  return themeOptions.find((theme) => theme.key === currentTheme.value) || themeOptions[0];
});
const themeStyle = computed(() => currentThemeOption.value.variables);
watch(themeStyle, (variables) => {
  for (const [name, value] of Object.entries(variables)) {
    document.documentElement.style.setProperty(name, value);
  }
}, { immediate: true });
const setTheme = (theme: ThemeKey) => {
  currentTheme.value = theme;
  void themeStorage.setter(theme).catch(reportSaveError);
};

const {
  activeProducts,
  craftableCountForProduct,
  limitingMaterials,
  sharedMaterials,
  materialGroupKey,
  materialRelatedSummary,
} = useMaterialStatus(data, products);

const {
  calculation,
  orderInfo,
  OrderData,
  orderTotals,
  activeOrderProducts,
  requiresManualCost,
  canSyncCalculation,
  deductionMessage,
  deletingOrder,
  deleteOrderShow,
  deleteOrderDescription,
  deleteOrderActions,
  initOrderMonthData,
  monthChange,
  setOrderDate,
  setOrderQuantity,
  setOrderValue,
  setOrderCost,
  onProductChange,
  syncOrderAmounts,
  openCreateOrder,
  orderSubmit,
  beforeUpd,
  del,
} = useOrderActions({
  materials: data,
  products,
  activeProducts,
  orders,
  commit: stock.commit,
  dateFormat: DATE_FORMAT,
  openMaterialEditor: () => openMaterialEditor(),
  openProductEditor: () => openProductEditor(),
});

const {
  importShow,
  importInfo,
  importPreview,
  importExportSummary,
  lastExport,
  recoverySummary,
  openImportExport,
  exportAllData,
  onImportFileLoaded,
  onImportFileError,
  resetAllData,
  restoreRecovery,
  importData,
} = useBackupActions(stock, settingsPopup, () => {
  monthChange("");
  initOrderMonthData();
});

const {
  materialEditor,
  restock,
  restockMaterial,
  restockTotal,
  openRestock,
  submitRestock,
  openMaterialEditor,
  setMaterialLinkedProducts,
  submitMaterialEditor,
  removeMaterial,
} = useMaterialEditor(data, products, stock.commit);

const {
  productEditor,
  openProductEditor,
  setRecipeMaterials,
  toggleProductStatus,
  removeRecipeItem,
  submitProductEditor,
  removeProduct,
} = useProductEditor(data, products, stock.commit, {
  openMaterialEditor: () => openMaterialEditor(),
});

const productsList = computed(() => {
  return [...products.value].sort((a, b) => craftableCountForProduct(b) - craftableCountForProduct(a));
});

const materialsSummary = computed(() => {
  const statusCount = countMaterialsByGroup();
  const warningKinds = statusCount.warning;
  const dangerKinds = statusCount.danger;
  const footer = [] as string[];
  if (warningKinds > 0) footer.push(`预警 ${warningKinds}`);
  if (dangerKinds > 0) footer.push(`缺货 ${dangerKinds}`);
  return {
    totalKinds: data.value.length,
    dangerKinds,
    footerText: footer.join(" · "),
  };
});

const today = ref(dayjs().startOf("day"));
let dateRefreshTimer: number | undefined;
const currentMonth = computed(() => today.value.format("YYYY-MM"));
const currentMonthTotals = computed(() => orderInfo.value.monthData.find((item) => item.month === currentMonth.value) ?? summarizeOrders([]));

function refreshToday() {
  const now = dayjs();
  if (!today.value.isSame(now, "day")) today.value = now.startOf("day");
  window.clearTimeout(dateRefreshTimer);
  dateRefreshTimer = window.setTimeout(refreshToday, now.add(1, "day").startOf("day").diff(now));
}

function formatOrderIncome(order: Parameters<typeof orderNetIncomeCents>[0]) {
  const cents = orderNetIncomeCents(order);
  return cents === undefined ? "—" : formatMoney(cents / 100);
}

const currentMonthLabel = computed(() => today.value.format("YYYY年M月"));
const activeProductsCount = computed(() => products.value.filter((item) => item.status === "active").length);

function formatOrderDate(date: string) {
  const value = dayjs(date);
  if (!value.isValid()) return date;
  if (value.isSame(today.value, "day")) return "今天";
  if (value.isSame(today.value.subtract(1, "day"), "day")) return "昨天";
  return value.isSame(today.value, "year") ? value.format("M月D日") : value.format("YYYY年M月D日");
}

const todayText = computed(() => today.value.format("M月D日") + " · " + ["周日", "周一", "周二", "周三", "周四", "周五", "周六"][today.value.day()]);

function formatMonth(month: string) {
  const [year, value] = month.split("-");
  return year === today.value.format("YYYY") ? `${Number(value)}月` : `${year}.${value}`;
}

const warningMaterials = computed(() => {
  return data.value.filter((item) => {
    const status = materialGroupKey(item);
    return status === "warning" || status === "danger";
  });
});

function countMaterialsByGroup() {
  return data.value.reduce<Record<MaterialGroupKey, number>>((result, item) => {
    result[materialGroupKey(item)] += 1;
    return result;
  }, {
    danger: 0,
    warning: 0,
    safe: 0,
    unlinked: 0,
  });
}

const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
};

const updateScrollTopVisibility = () => {
  showScrollTop.value = window.scrollY > SCROLL_TOP_THRESHOLD;
  isScrolled.value = window.scrollY > 2;
};

const storedTheme = themeStorage.getter();
currentTheme.value = isThemeKey(storedTheme) ? storedTheme : DEFAULT_THEME;
initOrderMonthData();
watch(() => orderInfo.value.checkedMonth, () => {
  orderListRef.value?.scrollTo({ top: 0 });
});

onMounted(() => {
  refreshToday();
  document.addEventListener("visibilitychange", refreshToday);
  updateScrollTopVisibility();
  window.addEventListener("scroll", updateScrollTopVisibility, { passive: true });
});

onUnmounted(() => {
  window.clearTimeout(dateRefreshTimer);
  document.removeEventListener("visibilitychange", refreshToday);
  window.removeEventListener("scroll", updateScrollTopVisibility);
});
</script>

<style lang="scss" scoped>
.home-page {
  position: relative;
  min-height: 100vh;
  overflow-x: clip;
  padding-bottom: calc(14px + env(safe-area-inset-bottom));
  background: var(--page-bg);
  color: var(--text-main);
  font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Helvetica Neue", "Microsoft YaHei", sans-serif;
  -webkit-font-smoothing: antialiased;
}

.page-main {
  display: flex;
  flex-direction: column;
  gap: 14px;
  max-width: 720px;
  margin: 0 auto;
  padding: calc(72px + env(safe-area-inset-top)) 14px 0;
}

.page-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  box-sizing: border-box;
  height: calc(68px + env(safe-area-inset-top));
  padding: env(safe-area-inset-top) max(16px, calc(50% - 344px)) 0;
  background: var(--page-bg);
  transition: box-shadow 0.2s ease;
}

.page-header.scrolled {
  box-shadow: 0 1px 0 var(--divider), 0 6px 16px rgba(20, 40, 60, 0.06);
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.brand-logo {
  width: 38px;
  height: 38px;
  border-radius: 11px;
  box-shadow: 0 6px 14px rgba(20, 40, 60, 0.14);
}

.brand h1 {
  margin: 0;
  color: var(--text-strong);
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 0.02em;
  line-height: 1.2;
}

.brand p {
  margin: 2px 0 0;
  color: var(--text-muted);
  font-size: 12px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border: 1px solid var(--divider);
  border-radius: 12px;
  background: var(--surface);
  color: var(--text-strong);
  font-size: 17px;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(20, 40, 60, 0.04);
  transition: transform 0.15s ease;
}

.header-icon:active {
  transform: scale(0.94);
}

/* stats */
.stats-card {
  position: relative;
  overflow: hidden;
  padding: 18px 18px 14px;
  border-radius: 24px;
  background: var(--stat-income-bg);
  color: var(--stat-income-text);
  box-shadow: var(--submit-btn-shadow);
}

.stats-top {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
}

.stats-month {
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.16);
  font-weight: 600;
}

.stats-orders {
  opacity: 0.8;
}

.stats-main {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  margin-top: 16px;
}

.stats-label {
  display: block;
  font-size: 12px;
  opacity: 0.78;
}

.stats-value {
  display: block;
  margin-top: 6px;
  font-size: clamp(32px, 10vw, 42px);
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
  overflow-wrap: anywhere;
}

.stats-value small,
.stats-secondary small {
  margin-right: 2px;
  font-size: 0.5em;
  font-weight: 600;
}

.stats-secondary {
  flex-shrink: 0;
  text-align: right;
}

.stats-secondary strong {
  display: block;
  margin-top: 6px;
  font-size: 20px;
  font-weight: 700;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.stats-foot {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-top: 18px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.16);
}

.stats-foot > div + div {
  padding-left: 14px;
  border-left: 1px solid rgba(255, 255, 255, 0.16);
}

.stats-foot span {
  display: block;
  font-size: 11px;
  opacity: 0.72;
}

.stats-foot strong {
  display: block;
  margin-top: 3px;
  font-size: 15px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.stats-deco {
  position: absolute;
  top: -60px;
  right: -50px;
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0) 70%);
  pointer-events: none;
}

/* blocks */
.block {
  padding: 14px 14px 16px;
  border-radius: 22px;
  background: var(--surface);
  box-shadow: var(--shadow);
}

.block-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 12px;
}

.block-title {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
}

button.block-title {
  cursor: pointer;
}

.block-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 38px;
  height: 38px;
  border-radius: 12px;
  font-size: 19px;
}

.block-icon.materials {
  background: #e8f1fd;
  color: #2f6fd0;
}

.block-icon.products {
  background: #fdf1e4;
  color: #d9822b;
}

.block-icon.orders {
  background: #e7f6ef;
  color: #23955f;
}

.block-text {
  min-width: 0;
}

.block-text h2 {
  display: flex;
  align-items: center;
  gap: 2px;
  margin: 0;
  color: var(--text-strong);
  font-size: 17px;
  font-weight: 700;
  line-height: 1.25;
}

.block-text small {
  display: block;
  margin-top: 2px;
  overflow: hidden;
  color: var(--text-muted);
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.block-text b {
  font-weight: 600;
}

.block-text .is-warning {
  color: var(--warning-text);
}

.block-text .is-danger {
  color: var(--danger-text);
}

.block-add {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border: 0;
  border-radius: 12px;
  background: var(--header-icon-bg);
  color: var(--accent-strong);
  font-size: 18px;
  cursor: pointer;
  transition: transform 0.15s ease;
}

.block-add:active {
  transform: scale(0.95);
}

/* orders */
.month-filter {
  display: flex;
  gap: 8px;
  margin: 0 0 10px;
  padding: 0 0 2px;
  border-radius: 12px;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.month-filter::-webkit-scrollbar {
  display: none;
}

.month-chip {
  flex: 0 0 auto;
  min-width: 76px;
  padding: 8px 12px;
  border: 0;
  border-radius: 12px;
  background: var(--surface-muted);
  color: var(--text-main);
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease;
}

.month-chip span,
.month-chip strong {
  display: block;
}

.month-chip span {
  color: var(--text-muted);
  font-size: 11px;
}

.month-chip strong {
  margin-top: 2px;
  font-size: 14px;
  font-variant-numeric: tabular-nums;
}

.month-chip.active {
  background: var(--accent);
  color: #ffffff;
}

.month-chip.active span {
  color: rgba(255, 255, 255, 0.78);
}

.order-list {
  --order-row-height: 66px;
  display: flex;
  flex-direction: column;
}

.order-list.scrollable {
  max-height: calc(var(--order-row-height) * 5 + 30px);
  margin-right: -6px;
  padding-right: 6px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--divider) transparent;
  -webkit-mask-image: linear-gradient(to bottom, #000 calc(100% - 28px), transparent);
  mask-image: linear-gradient(to bottom, #000 calc(100% - 28px), transparent);
}

.order-list.scrollable::-webkit-scrollbar {
  width: 4px;
}

.order-list.scrollable::-webkit-scrollbar-thumb {
  border-radius: 4px;
  background: var(--divider);
}

.order-swipe {
  flex-shrink: 0;
}

.order-swipe {
  border-radius: 0;
}

.order-swipe + .order-swipe {
  border-top: 1px solid var(--divider);
}

.order-edit {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  height: var(--order-row-height);
  padding: 0 2px;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.order-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--header-icon-bg);
  color: var(--accent-strong);
  font-size: 15px;
  font-weight: 700;
}

.order-info {
  flex: 1;
  min-width: 0;
}

.order-info strong {
  display: block;
  overflow: hidden;
  color: var(--text-strong);
  font-size: 15px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.order-info small {
  display: block;
  margin-top: 3px;
  color: var(--text-muted);
  font-size: 12px;
}

.order-amount {
  flex-shrink: 0;
  text-align: right;
}

.order-amount strong {
  display: block;
  color: var(--text-strong);
  font-size: 16px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.order-amount small {
  display: block;
  margin-top: 2px;
  color: var(--text-subtle);
  font-size: 11px;
}

.orders-empty {
  display: grid;
  place-items: center;
  gap: 8px;
  padding: 20px 12px 16px;
  text-align: center;
}

.orders-empty-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  border-radius: 16px;
  background: var(--header-icon-bg);
  color: var(--accent);
  font-size: 24px;
}

.orders-empty-icon .el-icon {
  font-size: 24px;
}

.orders-empty strong {
  color: var(--text-strong);
  font-size: 15px;
}

.orders-empty span {
  max-width: 260px;
  color: var(--text-muted);
  font-size: 12px;
  line-height: 1.5;
}

.ghost-btn {
  margin-top: 4px;
  padding: 7px 16px;
  border: 1px solid var(--accent-border);
  border-radius: 999px;
  background: transparent;
  color: var(--accent-strong);
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

/* restock popup */
.restock-preview {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 10px;
  padding: 14px;
  border-radius: 16px;
  background: var(--surface-soft);
}

.restock-preview > div {
  padding: 10px 12px;
  border-radius: 12px;
  background: var(--surface);
  text-align: center;
}

.restock-preview > div.ready {
  background: var(--stat-income-bg);
  color: #ffffff;
}

.restock-preview small,
.restock-preview strong {
  display: block;
}

.restock-preview small {
  color: var(--text-muted);
  font-size: 12px;
}

.restock-preview .ready small {
  color: rgba(255, 255, 255, 0.82);
}

.restock-preview strong {
  margin-top: 4px;
  color: var(--text-strong);
  font-size: 24px;
  font-variant-numeric: tabular-nums;
}

.restock-preview .ready strong {
  color: #ffffff;
}

.restock-preview > .el-icon {
  color: var(--text-subtle);
  font-size: 18px;
}

.restock-field {
  margin-top: 18px;
}

.restock-steps {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}

.restock-steps button {
  flex: 1;
  padding: 8px 0;
  border: 1px solid var(--divider);
  border-radius: 10px;
  background: var(--surface);
  color: var(--text-main);
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.home-page :deep(.van-popup) {
  background: var(--surface);
  color: var(--text-main);
}

@media (max-width: 360px) {
  .page-header,
  .header-actions {
    gap: 6px;
  }
}
</style>
