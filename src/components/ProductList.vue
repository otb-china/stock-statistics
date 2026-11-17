<template>
  <el-input
    v-if="products.length > 1 || search"
    v-model="search"
    class="manage-search"
    placeholder="搜索货品名称"
    aria-label="搜索货品名称"
    :prefix-icon="Search"
    clearable
  />

  <p v-if="!groups.length" class="product-empty">
    {{ query ? "没有匹配的货品" : "还没有货品" }}
  </p>

  <component
    :is="group.inactive ? 'details' : 'div'"
    v-for="group in groups"
    :key="String(group.inactive)"
    class="product-group"
    :open="group.inactive && query ? true : undefined"
  >
    <summary v-if="group.inactive" class="product-group-summary">停产货品（{{ group.items.length }}）</summary>
    <div class="product-list">
      <SwipeRow
        v-for="product in group.items"
        :key="product.id"
        :label="product.name"
        :actions="[
          group.inactive
            ? { name: '恢复', icon: RefreshLeft, callback: () => emit('toggle-status', product) }
            : { name: '停产', icon: VideoPause, tone: 'warning', callback: () => emit('toggle-status', product) },
          { name: '删除', icon: Delete, tone: 'danger', callback: () => emit('remove', product.id) },
        ]"
      >
      <div class="record-row">
        <button class="product-row record-edit" type="button" :aria-label="`编辑${product.name}`" @click="emit('edit', product)">
          <span class="product-title">{{ product.name }}</span>
          <span class="product-prices">
            售价 ¥{{ product.defaultValue ?? 0 }}<template v-if="product.defaultCost !== undefined"> · 成本 ¥{{ product.defaultCost }}</template>
          </span>
          <small class="product-recipe">{{ recipePreview(product) }}</small>
        </button>
        <span v-if="!group.inactive" class="product-count">
          <strong>{{ craftableCountForProduct(product) }}</strong> 可制
        </span>
        <button v-if="!group.inactive" class="pill-button record-quick-action" type="button" :aria-label="`为${product.name}记单`" @click="emit('order', product)">
          记单
        </button>
      </div>
      </SwipeRow>
    </div>
    <p v-if="!group.inactive && group.items.some(sharedMaterials)" class="product-note">
      可制数量按单款计算，共用备料的货品会消耗同一份库存。
    </p>
  </component>
</template>

<script lang="ts" setup>
import { computed, ref } from "vue";
import { Delete, RefreshLeft, Search, VideoPause } from "@element-plus/icons-vue";
import SwipeRow from "@/components/SwipeRow.vue";
import type { Product } from "@/types/stock";

const props = defineProps<{
  products: Product[];
  craftableCountForProduct: (product: Product) => number;
  recipePreview: (product: Product) => string;
  sharedMaterials: (product: Product) => string;
}>();

const emit = defineEmits<{
  edit: [product: Product];
  order: [product: Product];
  "toggle-status": [product: Product];
  remove: [id: string];
}>();

const search = ref("");
const query = computed(() => search.value.trim().toLowerCase());
const groups = computed(() => {
  const visible = props.products.filter((product) => product.name.toLowerCase().includes(query.value));
  return [
    { inactive: false, items: visible.filter((product) => product.status === "active") },
    { inactive: true, items: visible.filter((product) => product.status === "inactive") },
  ].filter((group) => group.items.length);
});
</script>

<style lang="scss" scoped>
.product-group + .product-group {
  margin-top: 12px;
}

.product-group-summary {
  padding: 10px 0;
  color: var(--text-muted);
  font-size: 13px;
  cursor: pointer;
}

.product-list {
  display: grid;
  gap: 8px;
}

.product-row {
  display: grid;
  gap: 4px;
  padding: 10px 6px 10px 12px;
}

.product-title {
  color: var(--text-strong);
  font-size: 15px;
  font-weight: 700;
}

.product-prices,
.product-count,
.product-note,
.product-empty {
  font-size: 12px;
}

.product-count {
  align-self: center;
  flex-shrink: 0;
  margin-right: 6px;
  color: var(--text-muted);
  white-space: nowrap;
}

.product-count strong {
  color: var(--accent-strong);
  font-size: 16px;
}

.product-recipe {
  overflow: hidden;
  color: var(--text-subtle);
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-note,
.product-empty {
  margin: 8px 0 0;
  color: var(--text-muted);
}

.product-empty {
  padding: 8px 0;
  text-align: center;
}
</style>
