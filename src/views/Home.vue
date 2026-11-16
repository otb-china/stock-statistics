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
      <section class="overview">
        <div class="income-card">
          <span class="income-label">本月收入</span>
          <strong class="income-value"><small>¥</small>{{ currentMonthIncome }}</strong>
          <span class="income-meta">
            <span>累计 ¥{{ orderTotal }}</span>
            <span class="income-dot"></span>
            <span>共 {{ orderInfo.data.length }} 单</span>
          </span>
          <span class="income-deco" aria-hidden="true"></span>
        </div>

        <div class="overview-stats">
          <StatCard
            title="备料"
            :value="materialsSummary.totalKinds"
            unit="种"
            :footer="materialsSummary.footerText || (data.length ? '库存充足' : '去配置备料')"
            :alert="materialsSummary.dangerKinds > 0 ? 'danger' : (materialsSummary.warningKinds > 0 ? 'warning' : undefined)"
            variant="materials"
            @click="openMaterialsPopup('materials')"
          />
          <StatCard
            title="货品"
            :value="products.length"
            unit="款"
            :footer="productsSummary.footerText || '去配置货品'"
            variant="goods"
            @click="openMaterialsPopup('products')"
          />
        </div>
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

      <section class="panel">
        <div class="panel-head">
          <h2><span class="panel-mark"></span>可制作货品</h2>
          <span class="panel-count">{{ craftableProducts.length }} 种</span>
        </div>

        <div v-if="craftableProducts.length" class="craftable-list">
          <button
            v-for="product in craftableProducts"
            :key="product.id"
            class="craftable-row"
            type="button"
            @click="openProductEditor(product)"
          >
            <span class="craftable-main">
              <span class="craftable-name">{{ product.name }}</span>
              <small v-if="sharedMaterials(product)">共用 {{ sharedMaterials(product) }}</small>
              <span class="craftable-bar">
                <i :style="{ width: craftableRatio(product) }"></i>
              </span>
            </span>
            <span class="craftable-count">
              <strong>{{ craftableCountForProduct(product) }}</strong>
              <small>可制</small>
            </span>
          </button>
          <p v-if="craftableProducts.some(sharedMaterials)" class="panel-note">
            可制数量按单款计算，共用备料的货品会消耗同一份库存。
          </p>
        </div>
        <div v-else class="panel-empty">
          {{ !data.length ? "还没有配置备料" : (products.length ? "当前没有可制作的正常货品" : "还没有配置货品") }}
        </div>
      </section>

      <section class="panel orders-panel">
        <div class="panel-head">
          <h2>
            <span class="panel-mark"></span>订单记录
            <span class="panel-count">{{ OrderData.length }} 条</span>
          </h2>
          <button class="order-add-btn" type="button" @click="openCreateOrder">
            <el-icon><Plus /></el-icon>
            <span>新增订单</span>
          </button>
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
            <strong>¥{{ orderTotal }}</strong>
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
            <strong>¥{{ item.value }}</strong>
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
          <div v-for="item in visibleOrders" :key="item.id" class="order-row record-row">
            <button class="order-edit record-edit" type="button" @click="beforeUpd(item)">
              <span class="order-avatar" aria-hidden="true">{{ item.title.slice(0, 1) }}</span>
              <span class="order-info">
                <strong>{{ item.title }}<em>× {{ item.quantity }}</em></strong>
                <small>{{ item.orderDate }}</small>
              </span>
              <span class="order-amount">¥{{ item.value }}</span>
            </button>
            <RowActions :label="item.title + '订单'" :actions="[
              { name: '删除订单', color: '#c63535', callback: () => del(item) },
            ]" />
          </div>

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
          <strong>{{ orderSearch.trim() ? "没有匹配的订单" : "还没有订单记录" }}</strong>
          <span v-if="!orderSearch.trim()">
            {{
              !data.length
                ? "先配置备料，再配置货品，之后就可以记录订单。"
                : (products.length ? "新增订单后，这里会按月份汇总收入。" : "先配置货品，再开始记录订单。")
            }}
          </span>
          <button v-if="!orderInfo.data.length" class="ghost-btn" type="button" @click="openImportExport">导入备份</button>
        </div>
      </section>
    </main>

    <MaterialManagePopup
      v-if="materialsPopup.tab === 'materials'"
      v-model:show="materialsPopup.show"
      :description="materialsPopupDescription"
      :create-text="materialsPopupCreateText"
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

    <ProductManagePopup
      v-else
      v-model:show="materialsPopup.show"
      :description="materialsPopupDescription"
      :create-text="materialsPopupCreateText"
      :products="productsList"
      :product-status-class="productStatusClass"
      :craftable-count-for-product="craftableCountForProduct"
      :recipe-preview="recipePreview"
      @create="openProductEditor"
      @toggle-status="toggleProductStatus"
      @edit="openProductEditor"
      @remove="removeProduct"
    />

    <MaterialEditorPopup
      v-model:show="materialEditor.show"
      :type="materialEditor.type"
      :form="materialEditor.form"
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
      :products="activeOrderProducts"
      :can-sync-calculation="canSyncCalculation"
      :deduction-message="deductionMessage"
      :craftable-count-for-product="craftableCountForProduct"
      @product-change="onProductChange"
      @date-change="setOrderDate"
      @quantity-change="setOrderQuantity"
      @value-change="setOrderValue"
      @submit="orderSubmit"
    />
    <van-action-sheet
      v-model:show="deleteOrderShow"
      :title="`删除「${deletingOrder?.title ?? ''}」订单`"
      :description="deleteOrderDescription"
      :actions="deleteOrderActions"
      cancel-text="取消"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import RowActions from "@/components/RowActions.vue";
import StockHistoryPopup from "@/components/StockHistoryPopup.vue";
import { useStockRecords } from "@/composables/useStockRecords";
import { LStorage } from "@/utils/localStorage.ts";
import ImportDataPopup from "@/components/ImportDataPopup.vue";
import MaterialEditorPopup from "@/components/MaterialEditorPopup.vue";
import MaterialManagePopup from "@/components/MaterialManagePopup.vue";
import OrderEditorPopup from "@/components/OrderEditorPopup.vue";
import ProductEditorPopup from "@/components/ProductEditorPopup.vue";
import ProductManagePopup from "@/components/ProductManagePopup.vue";
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
  ManageTab,
  Material,
  MaterialGroupKey,
  Product,
} from "@/types/stock";
import { ArrowDown, Plus, Right, Search, Setting, Tickets, Top } from "@element-plus/icons-vue";
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
const materialsPopup = ref({
  show: false,
  tab: "materials" as ManageTab,
});
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
  productStatusClass,
  recipePreview,
} = useMaterialStatus(data, products);

const {
  calculation,
  orderInfo,
  OrderData,
  orderSearch,
  visibleOrders,
  collapsedOrdersCount,
  orderTotal,
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

const productsSummary = computed(() => {
  const activeCount = activeProducts.value.length;
  const inactiveCount = products.value.length - activeCount;
  const footer = [] as string[];
  if (activeCount > 0) footer.push(`正常 ${activeCount}`);
  if (inactiveCount > 0) footer.push(`停产 ${inactiveCount}`);
  return {
    activeCount,
    inactiveCount,
    footerText: footer.join(" · "),
  };
});

const craftableProducts = computed(() => {
  return [...activeProducts.value]
    .filter((item) => craftableCountForProduct(item) > 0)
    .sort((a, b) => craftableCountForProduct(b) - craftableCountForProduct(a));
});

const maxCraftableCount = computed(() => {
  return Math.max(1, ...craftableProducts.value.map((item) => craftableCountForProduct(item)));
});

const currentMonthIncome = computed(() => {
  const month = dayjs().format("YYYY-MM");
  return orderInfo.value.monthData.find((item) => item.month === month)?.value ?? 0;
});

const todayText = dayjs().format("M月D日") + " · " + ["周日", "周一", "周二", "周三", "周四", "周五", "周六"][dayjs().day()];

function craftableRatio(product: Product) {
  return `${Math.round((craftableCountForProduct(product) / maxCraftableCount.value) * 100)}%`;
}

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

const materialsPopupDescription = computed(() => {
  return materialsPopup.value.tab === "materials"
    ? "管理库存数量和预警状态。"
    : "管理货品配方、价格和消耗规则。";
});

const materialsPopupCreateText = computed(() => {
  return materialsPopup.value.tab === "materials" ? "新增备料" : "新增货品";
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

const openMaterialsPopup = (tab: ManageTab = "materials") => {
  materialsPopup.value.tab = tab;
  materialsPopup.value.show = true;
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


.income-label {
  font-size: 13px;
  opacity: 0.82;
}

.income-value {
  margin-top: 8px;
  font-size: 36px;
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
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 14px;
  padding: 5px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.16);
  font-size: 12px;
}

.income-dot {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: currentColor;
  opacity: 0.6;
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

.overview-stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
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

.panel-note,
.panel-empty {
  margin: 4px 0 0;
  color: var(--text-muted);
  font-size: 12px;
  line-height: 1.5;
}

.panel-empty {
  padding: 18px 0 6px;
  text-align: center;
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

/* craftable */
.craftable-list {
  display: grid;
  gap: 8px;
}

.craftable-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 14px;
  border: 0;
  border-radius: 14px;
  background: var(--surface-soft);
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: transform 0.15s ease;
}

.craftable-row:active {
  transform: scale(0.985);
}

.craftable-main {
  flex: 1;
  min-width: 0;
}

.craftable-name {
  display: block;
  color: var(--text-strong);
  font-size: 15px;
  font-weight: 600;
}

.craftable-main small {
  display: block;
  margin-top: 2px;
  color: var(--text-muted);
  font-size: 12px;
}

.craftable-bar {
  display: block;
  height: 5px;
  margin-top: 8px;
  overflow: hidden;
  border-radius: 999px;
  background: var(--surface-muted);
}

.craftable-bar i {
  display: block;
  height: 100%;
  min-width: 6px;
  border-radius: inherit;
  background: var(--submit-btn-bg);
}

.craftable-count {
  flex-shrink: 0;
  min-width: 44px;
  text-align: center;
}

.craftable-count strong {
  display: block;
  color: var(--accent-strong);
  font-size: 22px;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.craftable-count small {
  display: block;
  margin-top: 3px;
  color: var(--text-muted);
  font-size: 11px;
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

.order-row + .order-row {
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
}

.order-row :deep(.row-actions-button) {
  min-width: 32px;
  margin-right: -6px;
  color: var(--text-muted);
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

.order-add-btn .el-icon {
  font-size: 15px;
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

@media (min-width: 640px) {
  .overview {
    grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
  }
}
</style>
