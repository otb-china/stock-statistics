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
        <button class="order-add-btn" type="button" @click="openCreateOrder()">记单</button>
        <button v-if="showScrollTop" class="header-icon" type="button" aria-label="返回顶部" @click="scrollToTop">
          <el-icon><Top /></el-icon>
        </button>
        <button class="header-icon" type="button" aria-label="更多操作" @click="settingsPopup = true">
          <el-icon><Setting /></el-icon>
        </button>
      </div>
    </header>

    <main class="page-main">
      <section class="overview">
        <div class="income-card">
          <div class="income-metrics">
            <div>
              <span class="income-label">本月流水</span>
              <strong class="income-value"><small>¥</small>{{ currentMonthTotals.revenue }}</strong>
            </div>
            <div>
              <span class="income-label">本月净收入</span>
              <strong class="income-value"><small>¥</small>{{ currentMonthTotals.netIncome }}</strong>
            </div>
          </div>
          <span class="income-meta">
            <span>累计流水 ¥{{ orderTotals.revenue }}</span>
            <span>累计净收入 ¥{{ orderTotals.netIncome }}</span>
            <span>共 {{ orderInfo.data.length }} 单</span>
          </span>
          <span class="income-deco" aria-hidden="true"></span>
        </div>

        <StatCard
          title="备料"
          :value="materialsSummary.totalKinds"
          unit="种"
          :footer="materialsSummary.footerText || (data.length ? '库存充足' : '去配置备料')"
          :alert="materialsSummary.dangerKinds > 0 ? 'danger' : (materialsSummary.warningKinds > 0 ? 'warning' : undefined)"
          @click="materialsPopup = true"
        />
      </section>

      <section v-if="warningMaterials.length" class="panel warning-panel">
        <div class="panel-head">
          <h2><span class="panel-mark is-danger"></span>库存预警</h2>
          <span class="panel-count">{{ warningMaterials.length }} 项</span>
        </div>
        <div class="warning-list">
          <button
            v-for="item in warningMaterials"
            :key="item.id"
            class="warning-item"
            :class="materialStatusClass(item)"
            type="button"
            @click="openRestock(item)"
          >
            <span class="warning-info">
              <b>{{ item.name }}</b>
              <small>库存 {{ item.num }} · {{ materialStatus(item) === "danger" ? "缺货" : "预警" }}</small>
            </span>
            <span class="warning-action">
              <el-icon><Plus /></el-icon>补货
            </span>
          </button>
        </div>
      </section>

      <section class="panel" aria-labelledby="products-title">
        <div class="panel-head">
          <h2 id="products-title"><span class="panel-mark"></span>货品</h2>
          <button class="popup-create-btn" type="button" @click="openProductEditor()">
            <el-icon><Plus /></el-icon>
            <span>新增货品</span>
          </button>
        </div>

        <ProductList
          :products="productsList"
          :craftable-count-for-product="craftableCountForProduct"
          :recipe-preview="recipePreview"
          :shared-materials="sharedMaterials"
          @edit="openProductEditor"
          @order="openCreateOrder"
          @toggle-status="toggleProductStatus"
          @remove="removeProduct"
        />
      </section>

      <section class="panel" aria-labelledby="orders-title">
        <div class="panel-head">
          <h2 id="orders-title">
            <span class="panel-mark"></span>订单记录
            <span class="panel-count">{{ OrderData.length }} 条</span>
          </h2>
        </div>

        <div class="month-filter" v-if="orderInfo.monthData.length">
          <button
            class="month-chip"
            :class="{ active: !orderInfo.checkedMonth }"
            :aria-pressed="!orderInfo.checkedMonth"
            type="button"
            @click="monthChange('')"
          >
            <span>全部</span>
            <strong>收入 ¥{{ orderTotals.netIncome }}</strong>
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
            <strong>收入 ¥{{ item.netIncome }}</strong>
          </button>
        </div>

        <el-input
          v-if="orderInfo.data.length"
          v-model="orderSearch"
          class="order-search"
          placeholder="按货品名称筛选订单"
          aria-label="按货品名称筛选订单"
          :prefix-icon="Search"
          clearable
        />

        <div v-if="OrderData.length" class="order-list">
          <SwipeRow
            v-for="item in visibleOrders"
            :key="item.id"
            class="order-swipe"
            :label="item.title + '订单'"
            :actions="[{ name: '删除', icon: Delete, tone: 'danger', callback: () => del(item) }]"
          >
          <div class="order-row record-row">
            <button class="order-edit record-edit" type="button" @click="beforeUpd(item)">
              <span class="order-avatar" aria-hidden="true">{{ item.title.slice(0, 1) }}</span>
              <span class="order-info">
                <strong>{{ item.title }}<em>× {{ item.quantity }}</em></strong>
                <small>{{ item.orderDate }}</small>
              </span>
              <span class="order-amount">收入 {{ formatOrderIncome(item) }}</span>
            </button>
          </div>
          </SwipeRow>

          <button
            v-if="OrderData.length > orderPreviewLimit"
            class="orders-toggle-btn"
            type="button"
            @click="ordersExpanded = !ordersExpanded"
          >
            {{ ordersExpanded ? "收起订单" : `展开剩余 ${collapsedOrdersCount} 条` }}
            <el-icon :class="{ flipped: ordersExpanded }"><ArrowDown /></el-icon>
          </button>
        </div>

        <div v-else class="orders-empty">
          <span class="orders-empty-icon"><el-icon><Tickets /></el-icon></span>
          <strong>{{ orderSearch.trim() || orderInfo.checkedMonth ? "没有匹配的订单" : "还没有订单记录" }}</strong>
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

    <MaterialManagePopup
      v-model:show="materialsPopup"
      description="管理库存数量和预警状态。"
      create-text="新增备料"
      :groups="materialManageGroups"
      :material-status-class="materialStatusClass"
      :material-status-text="materialStatusText"
      :material-related-summary="materialRelatedSummary"
      :material-craftable-count="materialCraftableCount"
      @create="openMaterialEditor"
      @toggle-group="toggleMaterialGroup"
      @edit="openMaterialEditor"
      @remove="removeMaterial"
      @restock="openRestock"
      @history="openStockHistory"
    />

    <MaterialEditorPopup
      v-model:show="materialEditor.show"
      :type="materialEditor.type"
      :form="materialEditor.form"
      :products="products"
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
          <button v-for="step in [5, 10, 20, 50]" :key="step" type="button" @click="restock.quantity = (restock.quantity || 0) + step">+{{ step }}</button>
        </div>
        <el-button class="submit-button" type="primary" native-type="submit" :disabled="restockTotal === null">确认补库存</el-button>
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
      :available-materials-for-recipe="availableMaterialsForRecipe"
      @add-recipe="addRecipeItem"
      @recipe-material-change="onRecipeMaterialChange"
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
      :products="activeOrderProducts"
      :can-sync-calculation="canSyncCalculation"
      :deduction-message="deductionMessage"
      :craftable-count-for-product="craftableCountForProduct"
      @product-change="onProductChange"
      @date-change="setOrderDate"
      @quantity-change="setOrderQuantity"
      @value-change="setOrderValue"
      @cost-change="setOrderCost"
      @submit="orderSubmit"
    />
    <van-popup v-model:show="deleteOrderShow" class="confirm-dialog" round>
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
          @click="deleteOrderShow = false; action.callback()"
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
import { LStorage } from "@/utils/localStorage.ts";
import { orderNetIncomeCents, summarizeOrders } from "@/utils/stockData";
import ImportDataPopup from "@/components/ImportDataPopup.vue";
import MaterialEditorPopup from "@/components/MaterialEditorPopup.vue";
import MaterialManagePopup from "@/components/MaterialManagePopup.vue";
import OrderEditorPopup from "@/components/OrderEditorPopup.vue";
import ProductEditorPopup from "@/components/ProductEditorPopup.vue";
import ProductList from "@/components/ProductList.vue";
import SettingsPopup from "@/components/SettingsPopup.vue";
import StatCard from "@/components/StatCard.vue";
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
import { ArrowDown, Delete, Plus, Right, Search, Setting, Tickets, Top } from "@element-plus/icons-vue";
import dayjs from "dayjs";

const DATE_FORMAT = "YYYY-MM-DD";
const SCROLL_TOP_THRESHOLD = 240;
const ORDER_PREVIEW_LIMIT = 10;

const MATERIAL_GROUP_META = [
  { key: "danger", title: "缺货" },
  { key: "warning", title: "预警" },
  { key: "safe", title: "正常" },
  { key: "unlinked", title: "未关联" },
] as const satisfies { key: MaterialGroupKey; title: string }[];

const MATERIAL_GROUP_RANK: Record<MaterialGroupKey, number> = {
  danger: 0,
  warning: 1,
  safe: 2,
  unlinked: 3,
};

const showScrollTop = ref(false);
const isScrolled = ref(false);
const ordersExpanded = ref(false);
const orderPreviewLimit = ORDER_PREVIEW_LIMIT;
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
const materialsPopup = ref(false);
const materialGroupCollapsed = ref<Record<MaterialGroupKey, boolean>>({
  danger: false,
  warning: false,
  safe: false,
  unlinked: true,
});

const themeStorage = LStorage.new("stockStatisticsTheme");
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
  themeStorage.setter(theme);
};

const {
  activeProducts,
  craftableCountForProduct,
  materialCraftableCount,
  limitingMaterials,
  sharedMaterials,
  materialStatus,
  materialGroupKey,
  materialRelatedSummary,
  materialStatusText,
  materialStatusClass,
  recipePreview,
} = useMaterialStatus(data, products);

const {
  calculation,
  orderInfo,
  OrderData,
  orderSearch,
  visibleOrders,
  collapsedOrdersCount,
  orderTotals,
  activeOrderProducts,
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
  ordersExpanded,
  orderPreviewLimit,
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
  orderSearch.value = "";
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
  addRecipeItem,
  toggleProductStatus,
  availableMaterialsForRecipe,
  onRecipeMaterialChange,
  removeRecipeItem,
  submitProductEditor,
  removeProduct,
} = useProductEditor(data, products, stock.commit, {
  openMaterialEditor: () => openMaterialEditor(),
});

const productsList = computed(() => {
  return [...products.value].sort((a, b) => craftableCountForProduct(b) - craftableCountForProduct(a));
});

const materialsList = computed(() => {
  return [...data.value].sort((a, b) => {
    const statusDiff = MATERIAL_GROUP_RANK[materialGroupKey(a)] - MATERIAL_GROUP_RANK[materialGroupKey(b)];
    if (statusDiff !== 0) return statusDiff;
    return a.name.localeCompare(b.name);
  });
});

const materialManageGroups = computed(() => {
  return MATERIAL_GROUP_META
    .map((group) => ({
      ...group,
      collapsed: materialGroupCollapsed.value[group.key],
      items: materialsList.value.filter((item) => materialGroupKey(item) === group.key),
    }))
    .filter((group) => group.items.length > 0);
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
    warningKinds,
    dangerKinds,
    footerText: footer.join(" · "),
  };
});

const currentMonth = dayjs().format("YYYY-MM");
const currentMonthTotals = computed(() => orderInfo.value.monthData.find((item) => item.month === currentMonth) ?? summarizeOrders([]));

function formatOrderIncome(order: Parameters<typeof orderNetIncomeCents>[0]) {
  const cents = orderNetIncomeCents(order);
  return cents === undefined ? "—" : `¥${cents / 100}`;
}

const todayText = dayjs().format("M月D日") + " · " + ["周日", "周一", "周二", "周三", "周四", "周五", "周六"][dayjs().day()];

function formatMonth(month: string) {
  const [year, value] = month.split("-");
  return year === dayjs().format("YYYY") ? `${Number(value)}月` : `${year}.${value}`;
}

const warningMaterials = computed(() => {
  return materialsList.value.filter((item) => {
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

function toggleMaterialGroup(key: MaterialGroupKey) {
  materialGroupCollapsed.value[key] = !materialGroupCollapsed.value[key];
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
watch(orderSearch, () => { ordersExpanded.value = false; });

onMounted(() => {
  updateScrollTopVisibility();
  window.addEventListener("scroll", updateScrollTopVisibility, { passive: true });
});

onUnmounted(() => {
  window.removeEventListener("scroll", updateScrollTopVisibility);
});
</script>

<style lang="scss" scoped>
.home-page {
  position: relative;
  min-height: 100vh;
  overflow-x: clip;
  padding-bottom: calc(24px + env(safe-area-inset-bottom));
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

/* overview */
.overview {
  display: grid;
  gap: 10px;
}

.income-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  overflow: hidden;
  padding: 18px 18px 16px;
  border-radius: 20px;
  background: var(--stat-income-bg);
  color: var(--stat-income-text);
  box-shadow: var(--submit-btn-shadow);
}


.income-metrics {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  width: 100%;
}

.income-label {
  font-size: 13px;
  opacity: 0.82;
}

.income-value {
  display: block;
  margin-top: 8px;
  overflow-wrap: anywhere;
  font-size: clamp(24px, 7vw, 36px);
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.01em;
  font-variant-numeric: tabular-nums;
}

.income-value small {
  margin-right: 3px;
  font-size: 20px;
  font-weight: 600;
}

.income-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 14px;
  padding: 5px 10px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.16);
  font-size: 12px;
}

.income-deco {
  position: absolute;
  top: -40px;
  right: -30px;
  width: 150px;
  height: 150px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0) 70%);
  pointer-events: none;
}

.income-deco::after {
  content: "";
  position: absolute;
  right: 40px;
  bottom: -70px;
  width: 90px;
  height: 90px;
  border: 14px solid rgba(255, 255, 255, 0.08);
  border-radius: 50%;
}

/* panels */
.panel {
  padding: 16px;
  border-radius: 18px;
  background: var(--surface);
  box-shadow: var(--shadow);
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 12px;
}

.panel-head h2 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  color: var(--text-strong);
  font-size: 16px;
  font-weight: 700;
}

.panel-mark {
  width: 4px;
  height: 14px;
  border-radius: 4px;
  background: var(--accent);
}

.panel-mark.is-danger {
  background: var(--danger-text);
}

.panel-count {
  padding: 3px 9px;
  border-radius: 999px;
  background: var(--surface-muted);
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 600;
}

/* warning */
.warning-panel {
  background: linear-gradient(180deg, var(--danger-bg) 0%, var(--surface) 64px);
}

.warning-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 8px;
}

.warning-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
  padding: 10px 10px 10px 12px;
  border: 1px solid var(--divider);
  border-left: 3px solid var(--warning-text);
  border-radius: 12px;
  background: var(--surface);
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: transform 0.15s ease;
}

.warning-item.status-danger {
  border-left-color: var(--danger-text);
}

.warning-item:active {
  transform: scale(0.98);
}

.warning-info {
  min-width: 0;
}

.warning-info b,
.warning-info small {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.warning-info b {
  color: var(--text-strong);
  font-size: 14px;
}

.warning-info small {
  margin-top: 3px;
  color: var(--warning-text);
  font-size: 12px;
}

.warning-item.status-danger .warning-info small {
  color: var(--danger-text);
}

.warning-action {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
  padding: 5px 8px;
  border-radius: 999px;
  background: var(--header-icon-bg);
  color: var(--accent-strong);
  font-size: 12px;
  font-weight: 600;
}

/* orders */
.month-filter {
  display: flex;
  gap: 8px;
  margin: 0 -16px 12px;
  padding: 0 16px 2px;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.month-filter::-webkit-scrollbar {
  display: none;
}

.month-chip {
  flex: 0 0 auto;
  min-width: 84px;
  padding: 9px 12px;
  border: 1px solid var(--divider);
  border-radius: 14px;
  background: var(--surface);
  color: var(--text-main);
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
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
  margin-top: 3px;
  font-size: 15px;
  font-variant-numeric: tabular-nums;
}

.month-chip.active {
  border-color: transparent;
  background: var(--accent);
  color: #ffffff;
  box-shadow: 0 6px 14px var(--accent-ring);
}

.month-chip.active span {
  color: rgba(255, 255, 255, 0.78);
}

.order-search {
  margin-bottom: 10px;
}

.order-search :deep(.el-input__wrapper) {
  border-radius: 12px;
  background: var(--field-bg);
  box-shadow: none;
}

.order-search :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px var(--accent) inset;
}

.order-list {
  display: flex;
  flex-direction: column;
}

.order-row {
  border-radius: 0;
  background: transparent;
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
  padding: 12px 0;
}

.order-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 38px;
  height: 38px;
  border-radius: 12px;
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

.order-info em {
  margin-left: 6px;
  color: var(--text-muted);
  font-size: 13px;
  font-style: normal;
  font-weight: 500;
}

.order-info small {
  display: block;
  margin-top: 3px;
  color: var(--text-muted);
  font-size: 12px;
}

.order-amount {
  flex-shrink: 0;
  color: var(--text-strong);
  font-size: 16px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  text-align: right;
}

.orders-toggle-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  margin-top: 6px;
  padding: 10px;
  border: 0;
  border-radius: 12px;
  background: var(--surface-soft);
  color: var(--accent-strong);
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.orders-toggle-btn .el-icon {
  transition: transform 0.2s ease;
}

.orders-toggle-btn .el-icon.flipped {
  transform: rotate(180deg);
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

/* order add */
.order-add-btn {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 4px;
  padding: 7px 14px;
  border: 0;
  border-radius: 999px;
  background: var(--create-btn-bg);
  color: #ffffff;
  font: inherit;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: var(--create-btn-shadow);
  transition: transform 0.15s ease;
  -webkit-tap-highlight-color: transparent;
}

.order-add-btn:active {
  transform: scale(0.95);
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

  .header-actions .order-add-btn {
    padding-inline: 10px;
  }
}

@media (min-width: 640px) {
  .overview {
    grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
  }
}
</style>
