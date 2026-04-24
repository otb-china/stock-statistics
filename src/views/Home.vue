<template>
  <div class="home-page">
    <header ref="headerSection" class="page-header">
      <div>
        <p class="hero-tag">Stock Statistics</p>
        <h1>备料统计</h1>
      </div>
      <div class="header-actions">
        <button v-if="showScrollTop" class="header-icon" type="button" @click="scrollToTop">
          <el-icon><Top /></el-icon>
        </button>
        <button class="header-icon" type="button" @click="settingsPopup = true">
          <el-icon><Setting /></el-icon>
        </button>
        <button class="header-icon danger" type="button" @click="loginOut">
          <el-icon><SwitchButton /></el-icon>
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
        <button class="stat-item income stat-button" type="button" @click="scrollToOrders">
          <span class="MB8">收入</span>
          <strong>¥{{ SumMoney(orderInfo.data) }}</strong>
          <small class="MT8 align-right">共 {{ orderInfo.data.length }} 单</small>
        </button>
        <button class="stat-item stat-button materials-stat" type="button" @click="openMaterialsPopup('materials')">
          <span class="MB8">备料</span>
          <strong>{{ materialsSummary.totalKinds }}</strong>
          <small class="MT8 align-right">{{ materialsSummary.footerText }}</small>
        </button>
        <button class="stat-item stat-button goods" type="button" @click="openMaterialsPopup('products')">
          <span class="MB8">货品</span>
          <strong>{{ products.length }}</strong>
          <small class="MT8 align-right">{{ productsSummary.footerText }}</small>
        </button>
      </div>

      <div class="craftable-card">
        <div class="craftable-head">
          <strong>可制作货品</strong>
          <span>{{ craftableProducts.length }}种</span>
        </div>

        <div class="craftable-list" v-if="craftableProducts.length">
          <div v-for="product in craftableProducts" :key="product.id" class="craftable-row">
            <span class="bolder">{{ product.name }}</span>
            <strong>可制 {{ craftableCountForProduct(product) }}</strong>
          </div>
        </div>
        <div v-else class="craftable-empty">当前没有正常状态的货品</div>
      </div>

      <div class="craftable-card warning-materials-card">
        <div class="craftable-head">
          <strong>预警备料</strong>
          <span>{{ warningMaterials.length }}项</span>
        </div>

        <div class="warning-materials-list" v-if="warningMaterials.length">
          <div v-for="item in warningMaterials" :key="item.id" class="warning-material-row">
            <span class="bolder MB6">{{ item.name }}</span>
            <div class="warning-material-meta">
              <small>库存 {{ item.num }}</small>
              <strong :class="materialStatusClass(item)">
                {{ materialStatus(item) === "danger" ? "缺货" : "预警" }}
              </strong>
            </div>
          </div>
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
          v-for="item in orderInfo.monthData"
          :key="item.month"
          class="month-chip"
          :class="{ active: orderInfo.checkedMonth === item.month }"
          @click="monthChange(item.month)"
        >
          <span>{{ item.month }}</span>
          <strong>¥{{ item.value }}</strong>
        </button>
      </div>

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

        <van-swipe-cell v-for="item in visibleOrders" :key="item.id">
          <van-cell
            class="order-cell"
            :title="item.title"
            :label="item.orderDate"
            :value="`¥${item.value}`"
          />
          <template #right>
            <van-button square type="primary" class="swipe-btn" text="编辑" @click="beforeUpd(item)" />
            <van-button square type="danger" class="swipe-btn" text="删除" @click="del(item.id)" />
          </template>
        </van-swipe-cell>

        <van-cell v-if="OrderData.length > 15" class="orders-toggle-cell" center>
          <button class="orders-toggle-btn" type="button" @click="ordersExpanded = !ordersExpanded">
            {{ ordersExpanded ? "收起订单" : "展开更多订单" }}
          </button>
        </van-cell>
      </van-cell-group>

      <el-empty v-else description="还没有订单记录" :image-size="84" />
    </section>

    <van-popup v-model:show="materialsPopup.show" position="bottom" round destroy-on-close>
      <div class="popup-body manage-popup-body">
        <div class="popup-head MB12">
          <div>
            <h3>{{ materialsPopup.tab === "materials" ? "备料管理" : "货品管理" }}</h3>
            <p>
              {{
                materialsPopup.tab === "materials"
                  ? "管理库存数量和预警状态。"
                  : "管理货品配方、价格和消耗规则。"
              }}
            </p>
          </div>
          <button
            class="popup-create-btn"
            type="button"
            @click="materialsPopup.tab === 'materials' ? openMaterialEditor() : openProductEditor()"
          >
            <el-icon><Plus /></el-icon>
            <span>{{ materialsPopup.tab === "materials" ? "新增备料" : "新增货品" }}</span>
          </button>
        </div>

        <template v-if="materialsPopup.tab === 'materials'">
          <div class="manage-list-scroll">
            <section
              v-for="group in materialManageGroups"
              :key="group.key"
              class="material-group"
              :class="{ collapsed: group.collapsed }"
            >
              <button
                class="material-group-head"
                type="button"
                @click="toggleMaterialGroup(group.key)"
              >
                <span>{{ group.title }}</span>
                <small>{{ group.items.length }}项</small>
              </button>

              <div v-if="!group.collapsed" class="material-group-list">
                <van-swipe-cell
                  v-for="item in group.items"
                  :key="item.id"
                  class="manage-swipe-cell"
                >
                  <div
                    class="material-row"
                    :class="materialStatusClass(item)"
                  >
                    <div class="material-info">
                      <div class="material-title-row">
                        <strong>{{ item.name }}</strong>
                        <span class="material-status" :class="materialStatusClass(item)">
                          {{ materialStatusText(item) }}
                        </span>
                      </div>
                      <small>{{ materialRelatedSummary(item.id) }}</small>
                    </div>

                    <div class="material-metrics">
                      <div class="material-metric">
                        <span>{{ item.num }}</span>
                        <small>库存</small>
                      </div>
                      <div class="material-metric">
                        <strong>{{ materialCraftableCount(item.id) }}</strong>
                        <small>可制</small>
                      </div>
                    </div>
                  </div>
                  <template #right>
                    <van-button square type="primary" class="swipe-btn" text="编辑" @click="openMaterialEditor(item)" />
                    <van-button square type="danger" class="swipe-btn" text="删除" @click="removeMaterial(item.id)" />
                  </template>
                </van-swipe-cell>
              </div>
            </section>
          </div>
        </template>

        <template v-else>
          <div class="manage-list-scroll">
            <van-swipe-cell v-for="product in productsList" :key="product.id" class="manage-swipe-cell">
              <div class="product-row">
                <div class="product-main">
                  <div class="product-title-row">
                    <div class="product-title-block">
                      <strong>{{ product.name }}</strong>
                      <button
                        class="product-status"
                        :class="productStatusClass(product.status)"
                        type="button"
                        @click.stop="toggleProductStatus(product)"
                      >
                        {{ product.status === "active" ? "正常" : "停产" }}
                      </button>
                    </div>
                    <span class="product-count">可制 {{ craftableCountForProduct(product) }}</span>
                  </div>
                  <p>默认价格 ¥{{ product.defaultValue || 0 }}</p>
                  <small>{{ recipePreview(product) }}</small>
                </div>
              </div>
              <template #right>
                <van-button square type="primary" class="swipe-btn" text="编辑" @click="openProductEditor(product)" />
                <van-button square type="danger" class="swipe-btn" text="删除" @click="removeProduct(product.id)" />
              </template>
            </van-swipe-cell>
          </div>
        </template>
      </div>
    </van-popup>

    <van-popup v-model:show="materialEditor.show" position="bottom" round destroy-on-close>
      <div class="popup-body">
        <div class="popup-head MB12">
          <div>
            <h3>{{ materialEditor.type === "add" ? "新增备料" : "编辑备料" }}</h3>
          </div>
        </div>

        <el-input v-model="materialEditor.form.name" placeholder="备料名称" />
        <el-input-number v-model="materialEditor.form.num" :min="0" :max="100000" class="editor-number MT15 W100" />

        <el-button
          type="primary"
          size="large"
          class="submit-button"
          @click="submitMaterialEditor"
          :disabled="!materialEditor.form.name"
        >
          提交
        </el-button>
      </div>
    </van-popup>

    <van-popup v-model:show="productEditor.show" position="bottom" round destroy-on-close>
      <div class="popup-body">
        <div class="popup-head">
          <div>
            <h3>{{ productEditor.type === "add" ? "新增货品" : "编辑货品" }}</h3>
          </div>
        </div>

        <div class="product-editor-grid">
          <label class="editor-field">
            <span>货品名称</span>
            <el-input v-model="productEditor.form.name" placeholder="货品名称" />
          </label>

          <label class="editor-field">
            <span>默认价格</span>
            <el-input-number
              v-model="productEditor.form.defaultValue"
              :min="0"
              :max="100000"
              controls-position="right"
              class="editor-number W100"
            />
          </label>
        </div>

        <div class="recipe-header MT12">
          <strong>配方</strong>
          <el-button size="small" plain @click="addRecipeItem">新增关联</el-button>
        </div>

        <div class="recipe-list">
          <div v-for="(item, index) in productEditor.form.recipe" :key="index" class="recipe-row">
            <el-select
              v-model="item.materialId"
              placeholder="选择备料"
              class="recipe-select"
              @change="onRecipeMaterialChange(index, $event)"
            >
              <el-option
                v-for="material in availableMaterialsForRecipe(index)"
                :key="material.id"
                :label="material.name"
                :value="material.id"
              />
            </el-select>
            <el-input-number
              v-model="item.quantity"
              :min="1"
              :max="1000"
              controls-position="right"
              class="recipe-quantity"
            />
            <button class="mini-action danger recipe-delete icon-only" @click="removeRecipeItem(index)">
              <el-icon><Delete /></el-icon>
            </button>
          </div>
        </div>

        <el-button
          type="primary"
          size="large"
          class="submit-button"
          @click="submitProductEditor"
          :disabled="!productEditor.form.name || !productEditor.form.recipe.length"
        >
          提交
        </el-button>
      </div>
    </van-popup>

    <van-popup v-model:show="settingsPopup" position="bottom" round destroy-on-close>
      <div class="popup-body">
        <div class="popup-head">
          <div>
            <h3>更多操作</h3>
          </div>
        </div>

        <div class="settings-grid">
          <button class="settings-item settings-item-feature" @click="exportAllData">
            <span class="settings-item-icon">
              <el-icon><Download /></el-icon>
            </span>
            <span>
              <strong>导出总数据</strong>
              <em>复制备料、货品和订单完整 JSON</em>
            </span>
          </button>

          <button class="settings-item settings-item-feature" @click="openImportExport">
            <span class="settings-item-icon">
              <el-icon><Upload /></el-icon>
            </span>
            <span>
              <strong>导入总数据</strong>
              <em>粘贴完整 JSON 后恢复全部数据</em>
            </span>
          </button>
        </div>
      </div>
    </van-popup>

    <van-popup v-model:show="importExportInfo.show" position="bottom" destroy-on-close round>
      <div class="popup-body import-export-popup">
        <div class="popup-head">
          <div>
            <p class="section-tag">Data</p>
            <h3>导入总数据</h3>
            <p>粘贴导出的完整 JSON，会同时覆盖备料、货品和订单。</p>
          </div>
        </div>

        <div class="import-export-card">
          <div>
            <strong>完整备份</strong>
            <span>{{ importExportSummary }}</span>
          </div>
        </div>

        <el-input
          v-model="importInfo.dataStr"
          placeholder="粘贴总数据 JSON，提交后会覆盖当前数据"
          :rows="7"
          type="textarea"
        />

        <el-button
          type="primary"
          size="large"
          class="submit-button"
          @click="importData"
          :disabled="!(importInfo.dataStr)"
        >
          导入总数据
        </el-button>
      </div>
    </van-popup>

    <van-popup v-model:show="orderInfo.show" position="bottom" destroy-on-close round>
      <div class="popup-body order-popup">
        <div class="popup-head order-popup-head">
          <div>
            <p class="section-tag">Order</p>
            <h3>{{ orderInfo.type === "add" ? "新增订单" : "编辑订单" }}</h3>
            <p>{{ orderInfo.type === "add" ? "选择货品后会自动带出默认价格。" : "调整订单信息后保存。" }}</p>
          </div>
        </div>

        <div class="order-product-list">
          <button
            v-for="product in products.filter((item) => item.status === 'active')"
            :key="product.id"
            class="order-product-card"
            :class="{ active: orderInfo.form.title === product.name }"
            @click="onProductChange(product.name)"
          >
            <span>
              <strong>{{ product.name }}</strong>
            </span>
            <em>可制 {{ craftableCountForProduct(product) }}</em>
          </button>
        </div>

        <div class="order-form-card">
          <label class="order-field">
            <span>收入金额</span>
            <van-field v-model="orderInfo.form.value" type="digit" placeholder="收入" clearable />
          </label>

          <label class="order-field">
            <span>下单日期</span>
            <date-picker
              placeholder="下单日期"
              :default-date="orderInfo.form.orderDate"
              @date-change="setOrderDate"
            />
          </label>
        </div>

        <div v-if="orderInfo.type === 'add'" class="sync-card" :class="{ active: calculation }">
          <div>
            <strong>同步计算备料</strong>
            <span>
              {{
                canSyncCalculation
                  ? (calculation ? "提交后自动扣减所选货品库存" : "仅记录订单，不扣减库存")
                  : "当前货品可制 0，不能同步计算备料"
              }}
            </span>
          </div>
          <el-switch v-model="calculation" :disabled="!canSyncCalculation" />
        </div>

        <el-button
          type="primary"
          size="large"
          class="submit-button"
          @click="orderSubmit"
          :disabled="!(orderInfo.form.title && orderInfo.form.value)"
        >
          提交
        </el-button>
      </div>
    </van-popup>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, onUnmounted, ref } from "vue";
import type { RSA } from "otb-toolkit/src/types";
import { LStorage } from "@/utils/localStorage.ts";
import DatePicker from "@/components/Date.vue";
import dayjs from "dayjs";
import { showConfirmDialog, showToast } from "vant";
import { sort } from "otb-toolkit/src/utils/data.ts";
import { useRouter } from "vue-router";
import { Delete, Download, Plus, Setting, SwitchButton, Top, Upload } from "@element-plus/icons-vue";

type ManageTab = "materials" | "products";
type MaterialGroupKey = "danger" | "warning" | "safe" | "unlinked";

interface Material extends RSA {
  id: string;
  name: string;
  num: number;
}

interface ProductRecipe extends RSA {
  materialId: string;
  quantity: number;
}

interface Product extends RSA {
  id: string;
  name: string;
  defaultValue: number;
  status: "active" | "inactive";
  recipe: ProductRecipe[];
}

interface Order extends RSA {
  id: string;
  title: string;
  value: number;
  orderDate: string;
}

interface OrderMonth {
  month: string;
  value: number;
}

interface BackupData extends RSA {
  materials?: RSA[];
  products?: RSA[];
  orders?: RSA[];
  data?: RSA[];
  productData?: RSA[];
  orderData?: RSA[];
}

const router = useRouter();
const headerSection = ref<HTMLElement | null>(null);
const ordersSection = ref<HTMLElement | null>(null);
const showScrollTop = ref(false);
const ordersExpanded = ref(false);
const data = ref([] as Material[]);
const products = ref([] as Product[]);
const calculation = ref(true);
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
const importExportInfo = ref({
  show: false,
});
const importInfo = ref({
  dataStr: "",
});
const materialEditor = ref({
  show: false,
  type: "add" as "add" | "edit",
  form: {
    id: "",
    name: "",
    num: 0,
  } as Material,
});
const productEditor = ref({
  show: false,
  type: "add" as "add" | "edit",
  form: {
    id: "",
    name: "",
    defaultValue: 0,
    recipe: [] as ProductRecipe[],
  } as Product,
});

const orderInfo = ref({
  type: "add" as "add" | "upd",
  show: false,
  form: {} as Order,
  data: [] as Order[],
  monthData: [] as OrderMonth[],
  editingId: "",
  checkedMonth: "",
});

const defaultMaterialNames = [
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

const defaultProductConfigs = [
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

const createId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const legacyMaterialId = (name: string) => `material-${encodeURIComponent(name)}`;

const materialsMap = computed(() => {
  return new Map(data.value.map((item) => [item.id, item]));
});

const productsList = computed(() => {
  return [...products.value].sort((a, b) => craftableCountForProduct(b) - craftableCountForProduct(a));
});

const activeProducts = computed(() => {
  return products.value.filter((item) => item.status === "active");
});

const materialsList = computed(() => {
  return [...data.value].sort((a, b) => {
    const rank: Record<MaterialGroupKey, number> = { danger: 0, warning: 1, safe: 2, unlinked: 3 };
    const statusDiff = rank[materialGroupKey(a)] - rank[materialGroupKey(b)];
    if (statusDiff !== 0) return statusDiff;
    return a.name.localeCompare(b.name);
  });
});

const materialManageGroups = computed(() => {
  const groupMeta = [
    { key: "danger" as const, title: "缺货" },
    { key: "warning" as const, title: "预警" },
    { key: "safe" as const, title: "正常" },
    { key: "unlinked" as const, title: "未关联" },
  ];

  return groupMeta
    .map((group) => ({
      ...group,
      collapsed: materialGroupCollapsed.value[group.key],
      items: materialsList.value.filter((item) => materialGroupKey(item) === group.key),
    }))
    .filter((group) => group.items.length > 0);
});

const materialsSummary = computed(() => {
  const warningKinds = data.value.filter((item) => materialGroupKey(item) === "warning").length;
  const dangerKinds = data.value.filter((item) => materialGroupKey(item) === "danger").length;
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
  const activeCount = products.value.filter((item) => item.status === "active").length;
  const inactiveCount = products.value.filter((item) => item.status === "inactive").length;
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

const OrderData = computed(() => {
  const checkedMonth = orderInfo.value.checkedMonth;
  if (checkedMonth) {
    return orderInfo.value.data.filter((item) => item.orderDate?.substring(0, 7) === checkedMonth);
  }
  return orderInfo.value.data;
});

const visibleOrders = computed(() => {
  if (ordersExpanded.value || OrderData.value.length <= 15) return OrderData.value;
  return OrderData.value.slice(0, 15);
});

const SumMoney = computed(() => {
  return (list: Order[]) => list.reduce((total, item) => total + Number(item.value), 0);
});

const selectedOrderProduct = computed(() => productByName(orderInfo.value.form.title));

const canSyncCalculation = computed(() => {
  const product = selectedOrderProduct.value;
  if (!product) return false;
  return craftableCountForProduct(product) > 0;
});

const importExportSummary = computed(() => {
  return `${data.value.length} 项备料 · ${products.value.length} 个货品 · ${orderInfo.value.data.length} 条订单`;
});

function productByName(name: string) {
  return products.value.find((item) => item.name === name);
}

function craftableCountForProduct(product: Product) {
  if (!product.recipe.length) return 0;
  const counts = product.recipe.map((recipe) => {
    const material = materialsMap.value.get(recipe.materialId);
    if (!material || recipe.quantity <= 0) return 0;
    return Math.floor(Number(material.num || 0) / Number(recipe.quantity));
  });
  return Math.min(...counts);
}

function relatedProducts(materialId: string) {
  return products.value.filter((product) => product.recipe.some((item) => item.materialId === materialId));
}

function activeRelatedProducts(materialId: string) {
  return activeProducts.value.filter((product) => product.recipe.some((item) => item.materialId === materialId));
}

function materialCraftableCount(materialId: string) {
  const material = materialsMap.value.get(materialId);
  const list = activeRelatedProducts(materialId);
  if (!material || !list.length) return 0;
  const counts = list.map((product) => {
    const recipeItem = product.recipe.find((item) => item.materialId === materialId);
    if (!recipeItem || Number(recipeItem.quantity) <= 0) return 0;
    return Math.floor(Number(material.num || 0) / Number(recipeItem.quantity));
  });
  return Math.min(...counts);
}

function materialStatus(item: Material) {
  if (Number(item.num) <= 0) return "danger";
  const list = activeRelatedProducts(item.id);
  if (!list.length) return "safe";
  const count = materialCraftableCount(item.id);
  if (count <= 0) return "danger";
  if (count < 2) return "warning";
  return "safe";
}

function materialGroupKey(item: Material): MaterialGroupKey {
  if (!activeRelatedProducts(item.id).length) return "unlinked";
  return materialStatus(item);
}

function materialRelatedSummary(materialId: string) {
  const activeList = activeRelatedProducts(materialId);
  if (!activeList.length) return "未关联货品";
  return `关联 ${activeList.length} 个货品`;
}

function materialStatusText(item: Material) {
  const status = materialGroupKey(item);
  if (status === "unlinked") return "未关联";
  if (status === "danger") return "缺货";
  if (status === "warning") return `可制 ${materialCraftableCount(item.id)}`;
  return `可制 ${materialCraftableCount(item.id)}`;
}

function materialStatusClass(item: Material) {
  return `status-${materialGroupKey(item)}`;
}

function productStatusClass(status: Product["status"]) {
  return `status-${status}`;
}

function toggleMaterialGroup(key: MaterialGroupKey) {
  materialGroupCollapsed.value[key] = !materialGroupCollapsed.value[key];
}

function recipePreview(product: Product) {
  if (!product.recipe.length) return "未配置备料";
  return product.recipe
    .map((item) => `${materialsMap.value.get(item.materialId)?.name || "未知备料"} x${item.quantity}`)
    .join(" / ");
}

const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
};

const updateScrollTopVisibility = () => {
  showScrollTop.value = window.scrollY > 240;
};

const scrollToOrders = () => {
  if (!ordersSection.value) return;
  const headerHeight = headerSection.value?.offsetHeight || 0;
  const topGap = 10;
  window.scrollTo({
    top: Math.max(0, ordersSection.value.getBoundingClientRect().top + window.scrollY - headerHeight - topGap),
    behavior: "smooth",
  });
};

const loginOut = () => {
  showConfirmDialog({
    title: "提示",
    message: "确认退出吗？",
    width: "250px",
  }).then(() => {
    LStorage.token.remove();
    router.push("/login");
  }).catch(() => {
  });
};

const openMaterialsPopup = (tab: ManageTab = "materials") => {
  materialsPopup.value.tab = tab;
  materialsPopup.value.show = true;
};

const openImportExport = () => {
  settingsPopup.value = false;
  importInfo.value.dataStr = "";
  importExportInfo.value.show = true;
};

const createBackupData = () => ({
  materials: data.value,
  products: products.value,
  orders: orderInfo.value.data,
});

const exportAllData = () => {
  copy(createBackupData(), "总");
  settingsPopup.value = false;
};

const resolveBackupList = (parsedData: BackupData, primaryKey: keyof BackupData, legacyKey: keyof BackupData) => {
  const primaryValue = parsedData[primaryKey];
  const legacyValue = parsedData[legacyKey];
  if (Array.isArray(primaryValue)) return primaryValue;
  if (Array.isArray(legacyValue)) return legacyValue;
  return null;
};

const importData = () => {
  try {
    const parsedData = JSON.parse(importInfo.value.dataStr) as BackupData;
    if (!parsedData || typeof parsedData !== "object" || Array.isArray(parsedData)) {
      throw new Error("Invalid backup data");
    }
    const materials = resolveBackupList(parsedData, "materials", "data");
    const products = resolveBackupList(parsedData, "products", "productData");
    const orders = resolveBackupList(parsedData, "orders", "orderData");
    if (!materials || !products || !orders) {
      throw new Error("Incomplete backup data");
    }
    LStorage.data.setter(materials);
    LStorage.productData.setter(products);
    LStorage.orderData.setter(orders);
    init();
    importExportInfo.value.show = false;
    importInfo.value.dataStr = "";
    showToast("总数据导入成功");
  } catch {
    showToast("导入失败，请检查 JSON 格式");
  }
};

const monthChange = (month: string) => {
  orderInfo.value.checkedMonth = orderInfo.value.checkedMonth === month ? "" : month;
  ordersExpanded.value = false;
};

const setOrderDate = (date: string) => {
  orderInfo.value.form.orderDate = date;
};

const copy = (content: unknown, name: string) => {
  navigator.clipboard.writeText(JSON.stringify(content));
  showToast(`${name}数据复制成功`);
};

const initOrderMonthData = () => {
  const months = {} as Record<string, number>;

  for (const item of orderInfo.value.data) {
    if (item.orderDate) {
      const month = item.orderDate.substring(0, 7);
      months[month] = (months[month] || 0) + Number(item.value);
    }
  }

  orderInfo.value.monthData = Object.keys(months)
    .sort((a, b) => b.localeCompare(a))
    .map((month) => ({
      month,
      value: months[month],
    }));
};

const onProductChange = (productName: string) => {
  const product = productByName(productName);
  if (product) {
    orderInfo.value.form.title = product.name;
    orderInfo.value.form.value = product.defaultValue || 0;
    calculation.value = craftableCountForProduct(product) > 0;
  }
  if (!orderInfo.value.form.orderDate) {
    orderInfo.value.form.orderDate = dayjs(new Date()).format("YYYY-MM-DD");
  }
};

const openCreateOrder = () => {
  const activeProducts = products.value.filter((item) => item.status === "active");
  if (!activeProducts.length) {
    showToast("请先配置正常状态的货品");
    openMaterialsPopup("products");
    return;
  }
  const firstProduct = activeProducts[0];
  orderInfo.value.type = "add";
  orderInfo.value.form = {
    id: "",
    title: firstProduct.name,
    value: firstProduct.defaultValue || 0,
    orderDate: dayjs(new Date()).format("YYYY-MM-DD"),
  };
  calculation.value = true;
  orderInfo.value.show = true;
};

const orderSubmit = () => {
  const currentType = orderInfo.value.type;
  const product = productByName(orderInfo.value.form.title);

  if (currentType === "add") {
    if (calculation.value && product) {
      product.recipe.forEach((recipe) => {
        const material = data.value.find((item) => item.id === recipe.materialId);
        if (material) {
          material.num = Math.max(0, Number(material.num) - Number(recipe.quantity));
        }
      });
      saveMaterials();
    }

    orderInfo.value.data.unshift({
      ...orderInfo.value.form,
      id: createId("order"),
    });
  }

  if (currentType === "upd") {
    const index = orderInfo.value.data.findIndex((item) => item.id === orderInfo.value.editingId);
    if (index >= 0) {
      orderInfo.value.data.splice(index, 1, {
        ...orderInfo.value.form,
        id: orderInfo.value.editingId,
      });
    }
  }

  orderInfo.value.show = false;
  LStorage.orderData.setter(orderInfo.value.data);
  orderInfo.value.form = {} as Order;
  initOrderMonthData();
};

const beforeUpd = (item: Order) => {
  orderInfo.value.type = "upd";
  orderInfo.value.editingId = item.id;
  orderInfo.value.form = { ...item };
  calculation.value = false;
  orderInfo.value.show = true;
};

const del = (id: string) => {
  orderInfo.value.data = orderInfo.value.data.filter((item) => item.id !== id);
  LStorage.orderData.setter(orderInfo.value.data);
  initOrderMonthData();
  showToast("订单已删除");
};

const saveMaterials = () => {
  LStorage.data.setter(data.value);
};

const saveProducts = () => {
  LStorage.productData.setter(products.value);
};

const openMaterialEditor = (item?: Material) => {
  materialEditor.value.type = item ? "edit" : "add";
  materialEditor.value.form = item
    ? { ...item }
    : {
      id: "",
      name: "",
      num: 0,
    };
  materialEditor.value.show = true;
};

const submitMaterialEditor = () => {
  const name = materialEditor.value.form.name.trim();
  if (!name) {
    showToast("请输入备料名称");
    return;
  }

  const duplicated = data.value.some((item) => item.name === name && item.id !== materialEditor.value.form.id);
  if (duplicated) {
    showToast("备料名称已存在");
    return;
  }

  if (materialEditor.value.type === "add") {
    data.value.push({
      id: createId("material"),
      name,
      num: Number(materialEditor.value.form.num || 0),
    });
  } else {
    const index = data.value.findIndex((item) => item.id === materialEditor.value.form.id);
    if (index >= 0) {
      data.value.splice(index, 1, {
        ...data.value[index],
        name,
        num: Number(materialEditor.value.form.num || 0),
      });
    }
  }

  saveMaterials();
  materialEditor.value.show = false;
};

const removeMaterial = (id: string) => {
  showConfirmDialog({
    title: "提示",
    message: "删除备料后，相关货品配方也会移除该备料，确认继续吗？",
  }).then(() => {
    data.value = data.value.filter((item) => item.id !== id);
    products.value = products.value.map((product) => ({
      ...product,
      recipe: product.recipe.filter((item) => item.materialId !== id),
    }));
    saveMaterials();
    saveProducts();
    showToast("备料已删除");
  }).catch(() => {
  });
};

const openProductEditor = (product?: Product) => {
  productEditor.value.type = product ? "edit" : "add";
  productEditor.value.form = product
    ? {
      ...product,
      recipe: product.recipe.map((item) => ({ ...item })),
    }
    : {
      id: "",
      name: "",
      defaultValue: 0,
      status: "active",
      recipe: [],
    };
  productEditor.value.show = true;
};

const addRecipeItem = () => {
  const selectedIds = productEditor.value.form.recipe.map((item) => item.materialId).filter(Boolean);
  const nextMaterial = data.value.find((material) => !selectedIds.includes(material.id));
  if (!nextMaterial) {
    showToast("没有可选的备料了");
    return;
  }
  productEditor.value.form.recipe.push({
    materialId: nextMaterial.id,
    quantity: 1,
  });
};

const toggleProductStatus = (product: Product) => {
  const nextStatus = product.status === "active" ? "inactive" : "active";
  const index = products.value.findIndex((item) => item.id === product.id);
  if (index < 0) return;

  products.value.splice(index, 1, {
    ...products.value[index],
    status: nextStatus,
  });
  saveProducts();
  showToast(nextStatus === "active" ? "货品已设为正常" : "货品已设为停产");
};

const availableMaterialsForRecipe = (index: number) => {
  const selectedIds = productEditor.value.form.recipe
    .map((item, currentIndex) => currentIndex === index ? "" : item.materialId)
    .filter(Boolean);

  return data.value.filter((material) => {
    return !selectedIds.includes(material.id) || material.id === productEditor.value.form.recipe[index]?.materialId;
  });
};

const onRecipeMaterialChange = (index: number, materialId: string) => {
  const duplicated = productEditor.value.form.recipe.some((item, currentIndex) => {
    return currentIndex !== index && item.materialId === materialId;
  });

  if (duplicated) {
    showToast("该备料已经选择过了");
    productEditor.value.form.recipe[index].materialId = "";
  }
};

const removeRecipeItem = (index: number) => {
  productEditor.value.form.recipe.splice(index, 1);
};

const submitProductEditor = () => {
  const name = productEditor.value.form.name.trim();
  if (!name) {
    showToast("请输入货品名称");
    return;
  }

  const validRecipe = productEditor.value.form.recipe
    .filter((item) => item.materialId && Number(item.quantity) > 0)
    .map((item) => ({
      materialId: item.materialId,
      quantity: Number(item.quantity),
    }));

  if (!validRecipe.length) {
    showToast("请至少配置一个备料");
    return;
  }

  const duplicatedMaterial = new Set(validRecipe.map((item) => item.materialId));
  if (duplicatedMaterial.size !== validRecipe.length) {
    showToast("同一个备料请只配置一次");
    return;
  }

  const duplicated = products.value.some((item) => item.name === name && item.id !== productEditor.value.form.id);
  if (duplicated) {
    showToast("货品名称已存在");
    return;
  }

  const productPayload = {
    id: productEditor.value.form.id || createId("product"),
    name,
    defaultValue: Number(productEditor.value.form.defaultValue || 0),
    status: productEditor.value.form.status,
    recipe: validRecipe,
  };

  if (productEditor.value.type === "add") {
    products.value.push(productPayload);
  } else {
    const index = products.value.findIndex((item) => item.id === productEditor.value.form.id);
    if (index >= 0) {
      products.value.splice(index, 1, productPayload);
    }
  }

  saveProducts();
  productEditor.value.show = false;
};

const removeProduct = (id: string) => {
  showConfirmDialog({
    title: "提示",
    message: "确认删除这个货品吗？",
  }).then(() => {
    products.value = products.value.filter((item) => item.id !== id);
    saveProducts();
    showToast("货品已删除");
  }).catch(() => {
  });
};

const normalizeMaterials = (list: RSA[] | undefined) => {
  const source = Array.isArray(list) ? list : [];
  return source.map((item) => ({
    id: String(item.id || legacyMaterialId(String(item.name || ""))),
    name: String(item.name || ""),
    num: Number(item.num || 0),
  })).filter((item) => item.name);
};

const seedMissingMaterials = () => {
  defaultMaterialNames.forEach((name) => {
    if (!data.value.some((item) => item.name === name)) {
      data.value.push({
        id: legacyMaterialId(name),
        name,
        num: 0,
      });
    }
  });
};

const buildDefaultProducts = () => {
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
};

const normalizeProducts = (list: RSA[] | undefined) => {
  const source = Array.isArray(list) ? list : [];
  return source.map((item) => ({
    id: String(item.id || createId("product")),
    name: String(item.name || ""),
    defaultValue: Number(item.defaultValue || item.value || 0),
    status: item.status === "inactive" ? "inactive" : "active",
    recipe: Array.isArray(item.recipe)
      ? item.recipe
        .map((recipe: RSA) => ({
          materialId: String(recipe.materialId || ""),
          quantity: Number(recipe.quantity || 1),
        }))
        .filter((recipe) => recipe.materialId)
      : [],
  })).filter((item) => item.name);
};

const normalizeOrders = (list: RSA[] | undefined) => {
  const source = Array.isArray(list) ? list : [];
  return sort(source.map((item) => ({
    id: String(item.id || createId("order")),
    title: String(item.title || ""),
    value: Number(item.value || 0),
    orderDate: String(item.orderDate || ""),
  })), "desc", "orderDate");
};

const init = () => {
  data.value = normalizeMaterials(LStorage.data.getter());
  seedMissingMaterials();

  const storedProducts = normalizeProducts(LStorage.productData.getter());
  products.value = storedProducts.length ? storedProducts : buildDefaultProducts();

  orderInfo.value.data = normalizeOrders(LStorage.orderData.getter());
  initOrderMonthData();
  saveMaterials();
  saveProducts();
};

init();

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
  background: #f4f7fb;
}

.page-header,
.hero-card,
.orders-panel {
  margin-bottom: 10px;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(38, 56, 88, 0.06);
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
  box-shadow: 0 4px 16px rgba(38, 56, 88, 0.05);
}

.page-header,
.hero-main,
.section-row,
.popup-head {
  display: flex;
  justify-content: space-between;
  gap: 10px;
}

.hero-tag,
.section-tag {
  margin: 0 0 4px;
  font-size: 11px;
  color: #7d8a96;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.page-header h1,
.hero-card h1,
.section-row h2,
.popup-head h3 {
  margin: 0;
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
  background: #edf4fb;
  color: #1f6a79;
}

.header-icon.danger {
  background: #fff0ed;
  color: #d05f52;
}

.popup-head p {
  margin: 0;
  font-size: 12px;
  color: #72808c;
}

.popup-create-btn {
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  gap: 4px;
  flex: 0 0 auto;
  margin-top: 2px;
  padding: 6px 9px;
  border: 1px solid #d9e6f7;
  border-radius: 999px;
  background: #ffffff;
  color: #2f73da;
  font-size: 10px;
  font-weight: 600;
  line-height: 1;
  box-shadow: 0 4px 10px rgba(38, 56, 88, 0.06);
}

.popup-create-btn .el-icon {
  font-size: 11px;
}

.hero-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin-top: 12px;
}

.stat-item {
  padding: 10px;
  border-radius: 10px;
  color: #ffffff;
  text-align: left;
}

.stat-item.income {
  background: linear-gradient(135deg, #1b6c78 0%, #2f8d6f 100%);
}

.stat-item.materials-stat {
  background: linear-gradient(135deg, #f0f5fb 0%, #e7eef9 100%);
  color: #1f4763;
}

.stat-item.goods {
  background: linear-gradient(135deg, #fff5e9 0%, #fff0d8 100%);
  color: #8a5c07;
}

.stat-button {
  border: 0;
  -webkit-tap-highlight-color: transparent;
  transition: none;
}

.stat-button:active,
.stat-button:focus,
.stat-button:focus-visible {
  outline: none;
}

.stat-item.income:active,
.stat-item.income:focus,
.stat-item.income:focus-visible {
  background: linear-gradient(135deg, #1b6c78 0%, #2f8d6f 100%);
  color: #ffffff;
}

.stat-item.materials-stat:active,
.stat-item.materials-stat:focus,
.stat-item.materials-stat:focus-visible {
  background: linear-gradient(135deg, #f0f5fb 0%, #e7eef9 100%);
  color: #1f4763;
}

.stat-item.goods:active,
.stat-item.goods:focus,
.stat-item.goods:focus-visible {
  background: linear-gradient(135deg, #fff5e9 0%, #fff0d8 100%);
  color: #8a5c07;
}

.stat-item span,
.stat-item strong,
.stat-item small {
  display: block;
}

.stat-item span {
  font-size: 12px;
  opacity: 0.82;
}

.stat-item strong {
  margin-top: 6px;
  font-size: 24px;
  line-height: 1;
}

.stat-item small {
  font-size: 12px;
  opacity: 0.82;
}

.craftable-card {
  margin-top: 10px;
  padding: 12px;
  border-radius: 10px;
  background: #f7f9fc;
}

.craftable-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 10px;
}

.craftable-head strong {
  color: #223848;
}

.craftable-head span,
.craftable-empty {
  font-size: 12px;
  color: #7b8995;
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
  background: #ffffff;
}

.craftable-row span {
  color: #203747;
}

.craftable-row strong {
  color: #1f6780;
}

.warning-materials-card {
  margin-top: 10px;
}

.warning-material-row {
  display: grid;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  background: #ffffff;
}

.warning-material-row span,
.warning-material-row small,
.warning-material-row strong {
  display: block;
}

.warning-material-row span {
  color: #203747;
  line-height: 1.25;
}

.warning-material-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.warning-material-row small {
  font-size: 12px;
  color: #7b8995;
}

.warning-material-row strong {
  flex: 0 0 auto;
  padding: 4px 8px;
  border-radius: 999px;
  font-size: 12px;
  line-height: 1.2;
}

.warning-material-row strong.status-warning {
  color: #af770d;
  background: #fff4dd;
}

.warning-material-row strong.status-danger {
  color: #c6584c;
  background: #ffe9e6;
}

.orders-head-actions {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.create-order-btn {
  border: 0;
  color: #ffffff;
  background: linear-gradient(135deg, #ff8f3d 0%, #ff5f6d 100%);
  box-shadow: 0 10px 20px rgba(255, 111, 102, 0.22);
}

.create-order-btn:hover,
.create-order-btn:focus {
  color: #ffffff;
  background: linear-gradient(135deg, #ff8f3d 0%, #ff5f6d 100%);
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
  background: #f2f5f9;
  text-align: left;
  color: #445560;
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
  background: #1f6b7b;
  color: #ffffff;
}

.summary-cell :deep(.van-cell__value) {
  color: #1f6a79;
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
  color: #7b8995;
  font-size: 12px;
}

.summary-count {
  color: #1f6a79;
  font-weight: 700;
}

.orders-toggle-cell :deep(.van-cell__value) {
  text-align: center;
}

.orders-toggle-btn {
  padding: 0;
  border: 0;
  background: transparent;
  color: #7b8995;
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

.summary-title {
  font-weight: 600;
  color: #223848;
}

.order-cell :deep(.van-cell__title) {
  font-size: 14px;
  font-weight: 600;
  color: #203746;
}

.order-cell :deep(.van-cell__label) {
  margin-top: 2px;
  font-size: 12px;
  color: #75838e;
}

.order-cell :deep(.van-cell__value) {
  font-size: 14px;
  font-weight: 700;
  color: #1e6781;
}

.swipe-btn {
  height: 100%;
}

.popup-body {
  max-height: 82vh;
  padding: 18px 16px 22px;
  overflow-x: hidden;
  overflow-y: auto;
}

.manage-popup-body {
  display: flex;
  flex-direction: column;
  height: 75vh;
  overflow: hidden;
}

.manage-popup-body .popup-head {
  flex: 0 0 auto;
}

.manage-list-scroll {
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1 1 auto;
  min-height: 0;
  padding-right: 2px;
  overflow-x: hidden;
  overflow-y: auto;
}

.manage-tabs {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin-top: 16px;
}

.manage-tab {
  padding: 10px;
  border: 0;
  border-radius: 10px;
  background: #f2f5f9;
  color: #5a6f7c;
  font-weight: 600;
}

.manage-tab.active {
  background: #1f6b7b;
  color: #ffffff;
}

.materials-list,
.products-list,
.settings-grid,
.recipe-list {
  display: grid;
  gap: 10px;
}

.settings-grid {
  margin-top: 16px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.settings-item,
.product-row {
  padding: 14px 16px;
  border: 0;
  border-radius: 10px;
  background: #f7f9fc;
}

.settings-item {
  text-align: left;
}

.settings-item-feature {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  background: linear-gradient(135deg, #eff8f7 0%, #f7f9fc 58%, #fff5ea 100%);
}

.settings-item-icon {
  display: inline-flex !important;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 42px;
  height: 42px;
  border-radius: 10px;
  background: #ffffff;
  color: #1f6b7b;
  box-shadow: 0 8px 18px rgba(31, 107, 123, 0.1);
}

.settings-item strong,
.settings-item span {
  display: block;
}

.settings-item strong {
  font-size: 14px;
  color: #203747;
}

.settings-item span {
  margin-top: 4px;
  font-size: 12px;
  color: #7b8995;
}

.settings-item-feature > span:last-child {
  min-width: 0;
  margin-top: 0;
}

.settings-item-feature em {
  display: block;
  margin-top: 4px;
  color: #7b8995;
  font-size: 12px;
  font-style: normal;
  line-height: 1.35;
}

.import-export-popup :deep(.el-textarea__inner) {
  min-height: 150px !important;
  border: 0;
  border-radius: 12px;
  background: #f7f9fc;
  box-shadow: none;
}

.import-export-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 14px 0 12px;
  padding: 14px;
  border-radius: 10px;
  background: linear-gradient(135deg, #1b6c78 0%, #2f8d6f 100%);
  color: #ffffff;
}

.import-export-card strong,
.import-export-card span {
  display: block;
}

.import-export-card strong {
  font-size: 16px;
}

.import-export-card span {
  margin-top: 4px;
  font-size: 12px;
  opacity: 0.8;
}

.order-popup {
  background: linear-gradient(180deg, #ffffff 0%, #f5f8fb 100%);
}

.order-popup-head {
  align-items: flex-start;
  padding: 2px 2px 14px;
}

.order-popup-head > div:first-child {
  min-width: 0;
}

.order-product-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.order-product-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  min-height: 52px;
  padding: 10px 12px;
  border: 1px solid transparent;
  border-radius: 10px;
  background: #ffffff;
  text-align: left;
  box-shadow: 0 8px 18px rgba(38, 56, 88, 0.05);
}

.order-product-card span,
.order-product-card strong {
  display: block;
}

.order-product-card span {
  min-width: 0;
}

.order-product-card strong {
  color: #203747;
  font-size: 14px;
  line-height: 1.2;
}

.order-product-card em {
  flex: 0 0 auto;
  padding: 4px 8px;
  border-radius: 999px;
  background: #edf4fb;
  color: #1f6780;
  font-size: 11px;
  font-style: normal;
  font-weight: 700;
}

.order-product-card.active {
  border-color: rgba(31, 107, 123, 0.22);
  background: linear-gradient(135deg, #eff8f7 0%, #ffffff 100%);
}

.order-product-card.active strong {
  color: #1f6b7b;
}

.order-form-card,
.sync-card {
  margin-top: 12px;
  padding: 14px;
  border-radius: 10px;
  background: #ffffff;
  box-shadow: 0 8px 18px rgba(38, 56, 88, 0.05);
}

.order-field {
  display: block;
}

.order-field + .order-field {
  margin-top: 12px;
}

.order-field > span {
  display: block;
  margin-bottom: 7px;
  color: #7b8995;
  font-size: 12px;
}

.order-form-card :deep(.van-field) {
  margin-bottom: 0;
  padding: 12px 14px;
  border-radius: 10px;
  background: #f7f9fc;
}

.sync-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border: 1px solid transparent;
}

.sync-card.active {
  border-color: rgba(31, 107, 123, 0.18);
  background: #f2fbf8;
}

.sync-card strong,
.sync-card span {
  display: block;
}

.sync-card strong {
  color: #203747;
  font-size: 14px;
}

.sync-card span {
  margin-top: 4px;
  color: #7b8995;
  font-size: 12px;
  line-height: 1.35;
}

.material-row,
.product-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto auto;
  gap: 12px;
  align-items: center;
}

.material-row {
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px 12px;
  padding: 14px 16px;
  border-radius: 10px;
  background: #f8fbff;
}

.material-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.material-group-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 2px 4px;
  border: 0;
  background: transparent;
  color: #203747;
  font-size: 14px;
  font-weight: 700;
  text-align: left;
}

.material-group-head::after {
  content: "收起";
  color: #8a98a6;
  font-size: 11px;
  font-weight: 600;
}

.material-group.collapsed .material-group-head::after {
  content: "展开";
}

.material-group-head small {
  margin-left: auto;
  color: #75828e;
  font-size: 12px;
  font-weight: 600;
}

.material-group-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.manage-swipe-cell {
  flex: 0 0 auto;
  overflow: hidden;
  border-radius: 10px;
  background: #f8fbff;
}

.material-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.material-info strong,
.product-main strong {
  display: block;
  font-size: 16px;
  line-height: 1.2;
  color: #1f3040;
}

.material-status {
  display: inline-flex;
  align-items: center;
  width: fit-content;
  padding: 3px 8px;
  border-radius: 999px;
  background: #eef3f8;
  font-size: 12px;
  flex: 0 0 auto;
}

.material-status.status-safe {
  color: #1a7a67;
  background: #eaf7f2;
}

.material-status.status-warning {
  color: #af770d;
  background: #fff4dd;
}

.material-status.status-danger {
  color: #c6584c;
  background: #ffe9e6;
}

.material-status.status-unlinked {
  color: #607180;
  background: #eef3f8;
}

.material-info small,
.product-main p,
.product-main small {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: #75828e;
}

.material-metrics {
  display: flex;
  align-items: center;
  gap: 8px;
}

.material-metric {
  min-width: 48px;
  text-align: center;
}

.material-metric span,
.material-metric strong,
.material-metric small {
  display: block;
}

.material-metric span,
.material-metric strong {
  font-size: 18px;
  font-weight: 700;
  color: #1f6780;
  line-height: 1;
}

.material-metric small {
  margin-top: 3px;
  font-size: 11px;
  color: #75828e;
}

.material-metric:last-child span,
.material-metric:last-child strong {
  color: #5e7383;
}

.manage-actions {
  grid-column: 1 / -1;
  display: flex;
  justify-content: flex-start;
  gap: 6px;
}

.mini-action {
  min-width: 72px;
  padding: 5px 12px;
  border: 0;
  border-radius: 8px;
  background: #eaf1f9;
  color: #1f6780;
  font-size: 12px;
}

.mini-action.danger {
  background: #fff0ed;
  color: #d05f52;
}

.product-row {
  background: #f8fbff;
}

.product-main {
  min-width: 0;
}

.product-title-block {
  display: flex;
  align-items: center;
  gap: 8px;
}

.product-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.product-status {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 3px 8px;
  border: 0;
  border-radius: 999px;
  line-height: 1.2;
  font-size: 12px;
  font-weight: 600;
}

.product-status.status-active {
  color: #1a7a67;
  background: #eaf7f2;
}

.product-status.status-inactive {
  color: #a56700;
  background: #fff2d9;
}

.product-count {
  font-size: 12px;
  color: #1f6780;
  font-weight: 600;
}

.product-editor-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 160px;
  gap: 10px;
  margin-top: 10px;
}

.editor-field {
  display: block;
}

.editor-field > span {
  display: block;
  margin-bottom: 6px;
  font-size: 12px;
  color: #7b8995;
}

.recipe-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 16px 0 10px;
}

.recipe-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 110px 48px;
  gap: 8px;
  align-items: center;
}

.recipe-select,
.editor-number,
.recipe-quantity {
  width: 100%;
}

.recipe-delete {
  width: 100%;
  height: 32px;
  min-width: 48px;
  padding: 0;
  border-radius: 10px;
}

.recipe-quantity :deep(.el-input-number) {
  width: 100%;
}

.icon-only {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.material-edit {
  display: flex;
  gap: 8px;
}

.submit-button {
  width: 100%;
  margin-top: 28px;
}

.van-field {
  background: #f7f8fa;
  border-radius: 12px;
}

@media (max-width: 720px) {
  .hero-stats {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .order-product-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .warning-materials-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .settings-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .product-editor-grid {
    grid-template-columns: minmax(0, 1fr) 110px;
    align-items: end;
  }

  .material-row,
  .product-row {
    grid-template-columns: minmax(0, 1fr) auto auto;
  }

  .material-row {
    grid-template-columns: minmax(0, 1fr) auto;
  }

  .manage-actions {
    justify-content: flex-start;
    flex-wrap: wrap;
  }

  .recipe-row {
    grid-template-columns: minmax(0, 1fr) 96px 48px;
  }
}
</style>
