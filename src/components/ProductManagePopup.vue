<template>
  <van-popup v-model:show="popupShow" position="bottom" round destroy-on-close>
    <div class="popup-body manage-popup-body">
      <div class="popup-head MB12">
        <div class="popup-title">
          <span class="popup-icon"><el-icon><Goods /></el-icon></span>
          <div>
            <h3>货品管理</h3>
            <p>{{ description }}</p>
          </div>
        </div>
        <button class="popup-create-btn" type="button" @click="emit('create')">
          <el-icon><Plus /></el-icon>
          <span>{{ createText }}</span>
        </button>
      </div>

      <el-input v-model="search" class="manage-search" placeholder="搜索货品名称" aria-label="搜索货品名称" :prefix-icon="Search" clearable />
      <div class="manage-list-scroll">
        <div v-if="!visibleProducts.length" class="manage-empty">
          <span class="empty-icon"><el-icon><component :is="search.trim() ? Search : Goods" /></el-icon></span>
          <strong>{{ search.trim() ? "没有匹配的货品" : "还没有货品" }}</strong>
          <span v-if="!search.trim()">新增货品并配置配方后，订单会自动带出金额和备料扣减。</span>
          <button v-if="!search.trim()" class="pill-button" type="button" @click="emit('create')">
            <el-icon><Plus /></el-icon>{{ createText }}
          </button>
        </div>

        <div v-else v-for="product in visibleProducts" :key="product.id" class="record-row">
          <button class="product-row record-edit" type="button" @click="emit('edit', product)">
            <span class="product-main">
              <span class="product-title-row">
                <span class="product-title-block">
                  <strong>{{ product.name }}</strong>
                  <span class="product-status" :class="productStatusClass(product.status)">
                    {{ product.status === "active" ? "正常" : "停产" }}
                  </span>
                </span>
                <span class="product-count" :class="{ zero: craftableCountForProduct(product) <= 0 }">
                  <strong>{{ craftableCountForProduct(product) }}</strong>可制
                </span>
              </span>
              <span class="product-meta">
                <b>售价 ¥{{ product.defaultValue || 0 }} · {{ product.defaultCost === undefined ? '待填成本' : `成本 ¥${product.defaultCost}` }}</b>
                <small>{{ recipePreview(product) }}</small>
              </span>
            </span>
          </button>
          <RowActions :label="product.name" :actions="[
            { name: product.status === 'active' ? '设为停产' : '恢复销售', callback: () => emit('toggle-status', product) },
            { name: '删除货品', color: '#c63535', callback: () => emit('remove', product.id) },
          ]" />
        </div>
      </div>
    </div>
  </van-popup>
</template>

<script lang="ts" setup>
import { computed, ref } from "vue";
import RowActions from "@/components/RowActions.vue";
import { Goods, Plus, Search } from "@element-plus/icons-vue";
import type { Product } from "@/types/stock";

const props = defineProps<{
  show: boolean;
  description: string;
  createText: string;
  products: Product[];
  productStatusClass: (status: Product["status"]) => string;
  craftableCountForProduct: (product: Product) => number;
  recipePreview: (product: Product) => string;
}>();

const emit = defineEmits<{
  "update:show": [value: boolean];
  create: [];
  "toggle-status": [product: Product];
  edit: [product: Product];
  remove: [id: string];
}>();

const search = ref("");
const visibleProducts = computed(() => {
  const query = search.value.trim().toLowerCase();
  return props.products.filter((product) => product.name.toLowerCase().includes(query));
});

const popupShow = computed({
  get: () => props.show,
  set: (value: boolean) => emit("update:show", value),
});
</script>

<style lang="scss" scoped>
.product-row {
  padding: 14px 4px 14px 14px;
  border: 0;
  border-radius: 14px;
  background: transparent;
}

.product-main {
  display: block;
  min-width: 0;
}

.product-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.product-title-block {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.product-title-block strong {
  overflow: hidden;
  color: var(--text-strong);
  font-size: 15px;
  line-height: 1.3;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-status {
  flex: 0 0 auto;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  line-height: 1.5;
}

.product-status.status-active {
  color: var(--accent);
  background: var(--header-icon-bg);
}

.product-status.status-inactive {
  color: var(--warning-text);
  background: var(--warning-bg);
}

.product-count {
  display: inline-flex;
  align-items: baseline;
  gap: 3px;
  flex: 0 0 auto;
  color: var(--text-muted);
  font-size: 11px;
}

.product-count strong {
  color: var(--accent-strong);
  font-size: 18px;
  font-variant-numeric: tabular-nums;
}

.product-count.zero strong {
  color: var(--danger-text);
}

.product-meta {
  display: grid;
  gap: 3px;
  margin-top: 6px;
  min-width: 0;
}

.product-meta b {
  color: var(--text-main);
  font-size: 13px;
}

.product-meta small {
  overflow: hidden;
  color: var(--text-subtle);
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
