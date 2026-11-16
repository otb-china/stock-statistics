<template>
  <div class="home-page" :style="themeStyle">
    <header ref="headerSection" class="page-header">
      <div>
        <p class="hero-tag">Stock Statistics</p>
        <h1>备料统计</h1>
      </div>
      <div class="header-actions">
        <el-button class="create-order-btn" round size="small" @click="openCreateOrder">新增订单</el-button>
        <button v-if="showScrollTop" class="header-icon" type="button" aria-label="返回顶部" @click="scrollToTop">
          <el-icon><Top /></el-icon>
        </button>
        <button class="header-icon" type="button" aria-label="更多操作" @click="settingsPopup = true">
          <el-icon><Setting /></el-icon>
        </button>
      </div>
    </header>

    <section class="hero-card">
      <div class="hero-main">
        <div>
          <p class="hero-tag">Overview</p>
        </div>
      </div>

      <div class="hero-stats">
        <StatCard
          title="收入"
          :value="`¥${orderTotal}`"
          :footer="`共 ${orderInfo.data.length} 单`"
          variant="income"
          @click="scrollToOrders"
        />
        <StatCard
          title="备料"
          :value="materialsSummary.totalKinds"
          :footer="materialsSummary.footerText"
          variant="materials"
          @click="openMaterialsPopup('materials')"
        />
        <StatCard
          title="货品"
          :value="products.length"
          :footer="productsSummary.footerText"
          variant="goods"
          @click="openMaterialsPopup('products')"
        />
      </div>

      <div class="craftable-card">
        <div class="craftable-head">
          <strong>可制作货品</strong>
          <span>{{ craftableProducts.length }}种</span>
        </div>

        <div class="craftable-list" v-if="craftableProducts.length">
          <button v-for="product in craftableProducts" :key="product.id" class="craftable-row record-edit" type="button" @click="openProductEditor(product)">
            <span class="bolder">{{ product.name }}</span>
            <small v-if="sharedMaterials(product)">共用 {{ sharedMaterials(product) }}</small>
            <strong>可制 {{ craftableCountForProduct(product) }}</strong>
          </button>
          <p v-if="craftableProducts.some(sharedMaterials)" class="shared-stock-note">可制数量按单款计算。共用备料的货品会消耗同一份库存。</p>
        </div>
        <div v-else class="craftable-empty">
          {{ !data.length ? "还没有配置备料" : (products.length ? "当前没有可制作的正常货品" : "还没有配置货品") }}
        </div>
      </div>

      <div class="craftable-card warning-materials-card">
        <div class="craftable-head">
          <strong>预警备料</strong>
          <span>{{ warningMaterials.length }}项</span>
        </div>

        <div class="warning-materials-list" v-if="warningMaterials.length">
          <button
            v-for="item in warningMaterials"
            :key="item.id"
            class="warning-material-row"
            type="button"
            @click="openRestock(item)"
          >
            <span class="warning-material-title">
              <b>{{ item.name }}</b>
              <small class="restock-label">补库存</small>
            </span>
            <div class="warning-material-meta">
              <small>库存 {{ item.num }}</small>
              <strong :class="materialStatusClass(item)">
                {{ materialStatus(item) === "danger" ? "缺货" : "预警" }}
              </strong>
            </div>
          </button>
        </div>
        <div v-else class="craftable-empty">当前没有预警或缺货备料</div>
      </div>
    </section>

    <section ref="ordersSection" class="orders-panel">
      <div class="section-row">
        <div>
          <p class="section-tag">Orders</p>
          <h2>订单记录</h2>
        </div>
        <div class="orders-head-actions">
          <el-button class="create-order-btn" round size="small" @click="openCreateOrder">新增订单</el-button>
        </div>
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
          <span>{{ item.month }}</span>
          <strong>¥{{ item.value }}</strong>
        </button>
      </div>

      <el-input
        v-if="orderInfo.data.length"
        v-model="orderSearch"
        class="order-search"
        placeholder="按货品名称筛选订单"
        aria-label="按货品名称筛选订单"
        clearable
      />
      <van-cell-group inset v-if="OrderData.length">
        <van-cell class="summary-cell">
          <template #title>
            <span class="summary-title">货品订单</span>
          </template>
          <template #value>
            <div class="summary-actions">
              <span class="summary-count">{{ OrderData.length }}条</span>
            </div>
          </template>
        </van-cell>

        <div v-for="item in visibleOrders" :key="item.id" class="order-record-row record-row">
          <button class="order-record-edit record-edit" type="button" @click="beforeUpd(item)">
            <span>
              <strong>{{ item.title }} × {{ item.quantity }}</strong>
              <small>{{ item.orderDate }}</small>
            </span>
            <span>¥{{ item.value }}</span>
          </button>
          <RowActions :label="item.title + '订单'" :actions="[
            { name: '删除订单', color: '#c63535', callback: () => del(item) },
          ]" />
        </div>

        <van-cell v-if="OrderData.length > orderPreviewLimit" class="orders-toggle-cell" center>
          <button class="orders-toggle-btn" type="button" @click="ordersExpanded = !ordersExpanded">
            {{ ordersExpanded ? "收起订单" : `展开剩余 ${collapsedOrdersCount} 条` }}
          </button>
        </van-cell>
      </van-cell-group>

      <div v-else class="orders-empty">
        <strong>{{ orderSearch.trim() ? "没有匹配的订单" : "还没有订单记录" }}</strong>
        <span v-if="!orderSearch.trim()">
          {{
            !data.length
              ? "先配置备料，再配置货品，之后就可以记录订单。"
              : (products.length ? "新增订单后，这里会按月份汇总收入。" : "先配置货品，再开始记录订单。")
          }}
        </span>
        <button v-if="!orderInfo.data.length" class="orders-toggle-btn" type="button" @click="openImportExport">导入备份</button>
      </div>
    </section>

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
          <div>
            <h3>补库存</h3>
            <p>{{ restockMaterial.name }}</p>
          </div>
        </div>
        <div class="restock-fields">
          <label for="restock-quantity">本次补货数量</label>
          <el-input-number id="restock-quantity" v-model="restock.quantity" :min="0" />
          <p aria-live="polite">
            当前库存 {{ restockMaterial.num }}
            <strong v-if="restockTotal !== null"> → 补货后 {{ restockTotal }}</strong>
          </p>
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
} from "@/types/stock";
import { Setting, Top } from "@element-plus/icons-vue";

const DATE_FORMAT = "YYYY-MM-DD";
const SCROLL_TOP_THRESHOLD = 240;
const TOP_SCROLL_GAP = 10;
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

const headerSection = ref<HTMLElement | null>(null);
const ordersSection = ref<HTMLElement | null>(null);
const showScrollTop = ref(false);
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
};

const scrollToOrders = () => {
  if (!ordersSection.value) return;
  const headerHeight = headerSection.value?.offsetHeight || 0;
  window.scrollTo({
    top: Math.max(0, ordersSection.value.getBoundingClientRect().top + window.scrollY - headerHeight - TOP_SCROLL_GAP),
    behavior: "smooth",
  });
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
  min-height: 100vh;
  padding: 10px;
  background: var(--page-bg);
  color: var(--text-main);
}

.page-header,
.hero-card,
.orders-panel {
  margin-bottom: 10px;
  background: var(--surface);
  border-radius: 12px;
  box-shadow: var(--shadow);
}

.home-page > section:last-of-type {
  margin-bottom: 0;
}

.page-header,
.hero-card,
.orders-panel {
  padding: 14px;
}

.page-header {
  position: sticky;
  top: 0;
  z-index: 20;
  backdrop-filter: blur(12px);
  border-radius: 0;
  margin: -10px -10px 10px;
  padding: 14px 14px 12px;
  box-shadow: var(--header-shadow);
}

.page-header,
.hero-main,
.section-row {
  display: flex;
  justify-content: space-between;
  gap: 10px;
}

.hero-tag,
.section-tag {
  margin: 0 0 4px;
  font-size: 11px;
  color: var(--text-muted);
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.page-header h1,
.hero-card h1,
.section-row h2 {
  margin: 0;
  color: var(--text-strong);
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
  width: 36px;
  height: 36px;
  border: 0;
  border-radius: 999px;
  background: var(--header-icon-bg);
  color: var(--accent);
}

.header-icon.danger {
  background: var(--danger-bg);
  color: var(--danger-text);
}

.hero-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin-top: 12px;
}

.craftable-card {
  margin-top: 10px;
  padding: 12px;
  border-radius: 10px;
  background: var(--surface-soft);
}

.craftable-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 10px;
}

.craftable-head strong {
  color: var(--text-strong);
}

.craftable-head span,
.craftable-empty {
  font-size: 12px;
  color: var(--text-muted);
}

.craftable-empty {
  line-height: 1.35;
}

.craftable-list {
  display: grid;
  gap: 8px;
}

.warning-materials-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.craftable-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 8px;
  background: var(--surface);
}

.craftable-row small {
  flex: 1;
  color: var(--text-muted);
}

.craftable-row strong {
  flex-shrink: 0;
}

.shared-stock-note {
  margin: 2px 0 0;
  color: var(--text-muted);
  font-size: 12px;
}

.order-search {
  margin: 4px 0 12px;
}

.order-record-row {
  border-radius: 0;
  border-bottom: 1px solid var(--divider);
  background: var(--surface);
}

.order-record-edit {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
}

.order-record-edit small {
  display: block;
  color: var(--text-muted);
}

.craftable-row span {
  color: var(--text-main);
}

.craftable-row strong {
  color: var(--accent-strong);
}

.warning-materials-card {
  margin-top: 10px;
}

.warning-material-row {
  display: grid;
  gap: 10px;
  padding: 10px 12px;
  border: 0;
  border-radius: 8px;
  background: var(--surface);
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.warning-material-row span,
.warning-material-row small,
.warning-material-row strong {
  display: block;
}

.warning-material-row span {
  color: var(--text-main);
  line-height: 1.25;
}

.warning-material-row .warning-material-title {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  overflow-wrap: anywhere;
}

.warning-material-row .restock-label {
  flex-shrink: 0;
  color: var(--accent-strong);
}

.restock-fields {
  display: grid;
  gap: 10px;
  margin-top: 14px;
  color: var(--text-main);
}

.restock-fields p {
  margin: 0;
}

.restock-fields strong {
  color: var(--accent-strong);
}

.warning-material-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.warning-material-row small {
  font-size: 12px;
  color: var(--text-muted);
}

.warning-material-row strong {
  flex: 0 0 auto;
  padding: 4px 8px;
  border-radius: 999px;
  font-size: 12px;
  line-height: 1.2;
}

.warning-material-row strong.status-warning {
  color: var(--warning-text);
  background: var(--warning-bg);
}

.warning-material-row strong.status-danger {
  color: var(--danger-text);
  background: var(--danger-bg);
}

.orders-head-actions {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.create-order-btn {
  border: 0;
  color: #ffffff;
  background: var(--create-btn-bg);
  box-shadow: var(--create-btn-shadow);
}

.create-order-btn:hover,
.create-order-btn:focus {
  color: #ffffff;
  background: var(--create-btn-bg);
}

.orders-panel {
  padding-bottom: 0;
  overflow: hidden;
}

.month-filter {
  display: flex;
  gap: 8px;
  margin: 10px 0 12px;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.month-filter::-webkit-scrollbar {
  display: none;
}

.month-chip {
  flex: 0 0 auto;
  min-width: 88px;
  padding: 8px 10px;
  border: 0;
  border-radius: 10px;
  background: var(--surface-muted);
  text-align: left;
  color: var(--text-main);
}

.month-chip span,
.month-chip strong {
  display: block;
}

.month-chip span {
  font-size: 11px;
}

.month-chip strong {
  margin-top: 3px;
  font-size: 14px;
}

.month-chip.active {
  background: var(--accent);
  color: #ffffff;
}

.summary-cell :deep(.van-cell__value) {
  color: var(--accent);
  font-weight: 700;
}

.summary-actions {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.summary-toggle {
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--text-muted);
  font-size: 12px;
}

.summary-count {
  color: var(--accent);
  font-weight: 700;
}

.orders-toggle-cell :deep(.van-cell__value) {
  text-align: center;
}

.orders-toggle-btn {
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 600;
}

.orders-panel :deep(.van-cell-group--inset) {
  margin: 0;
  border-radius: 10px;
}

.orders-panel :deep(.van-cell-group) {
  margin-bottom: 0;
}

.orders-empty {
  display: grid;
  place-items: center;
  gap: 8px;
  padding: 24px 12px 28px;
  text-align: center;
}

.orders-empty strong {
  color: var(--text-strong);
  font-size: 15px;
}

.orders-empty span {
  color: var(--text-muted);
  font-size: 12px;
  line-height: 1.35;
}

.summary-title {
  font-weight: 600;
  color: var(--text-strong);
}

.van-field {
  background: var(--field-bg);
  border-radius: 12px;
}

.home-page :deep(.van-cell),
.home-page :deep(.van-cell-group) {
  background: var(--surface);
  color: var(--text-main);
}

.home-page :deep(.van-cell::after) {
  border-color: var(--divider);
}

.home-page :deep(.van-field__control),
.home-page :deep(.van-field__label) {
  color: var(--text-main);
}

.home-page :deep(.van-popup) {
  background: var(--surface);
  color: var(--text-main);
}

@media (max-width: 720px) {
  .hero-stats {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .warning-materials-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

}
</style>
