<template>
  <p v-if="!groups.length" class="product-empty">
    还没有货品
  </p>

  <component
    :is="group.inactive ? 'details' : 'div'"
    v-for="group in groups"
    :key="String(group.inactive)"
    class="product-group"
   
  >
    <summary v-if="group.inactive" class="product-group-summary">
      <span>停产货品 · {{ group.items.length }}</span>
      <el-icon class="summary-arrow"><ArrowDown /></el-icon>
    </summary>
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
      <div class="product-item" :class="{ inactive: group.inactive }">
        <button class="product-main" type="button" :aria-label="'编辑' + product.name" @click="emit('edit', product)">
          <span class="product-title">{{ product.name }}</span>
          <span class="product-meta">
            <b
              v-if="productProfit(product) !== undefined"
              class="product-profit"
              :class="{ 'is-loss': productProfit(product)! < 0 }"
            >利润 {{ formatMoney(productProfit(product)!) }}</b>
            <small>{{ product.recipe.length ? product.recipe.length + " 种备料" : "未配置备料" }}</small>
          </span>
        </button>
        <template v-if="!group.inactive">
          <span class="product-count" :class="'is-' + craftableStatus(craftableCountForProduct(product), product.warningThreshold)">
            <strong>{{ craftableCountForProduct(product) }}</strong>
            <small>可制</small>
          </span>
          <button class="product-order" type="button" :aria-label="'为' + product.name + '记单'" @click="emit('order', product)">记单</button>
        </template>
        <span v-else class="product-paused">已停产</span>
      </div>
      </SwipeRow>
    </div>
  </component>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { ArrowDown, Delete, RefreshLeft, VideoPause } from "@element-plus/icons-vue";
import SwipeRow from "@/components/SwipeRow.vue";
import { craftableStatus, orderNetIncomeCents, recipeUnitCost } from "@/utils/stockData";
import type { Material, Product } from "@/types/stock";

const props = defineProps<{
  products: Product[];
  materials: Material[];
  craftableCountForProduct: (product: Product) => number;
}>();

const emit = defineEmits<{
  edit: [product: Product];
  order: [product: Product];
  "toggle-status": [product: Product];
  remove: [id: string];
}>();

function productProfit(product: Product) {
  const cost = recipeUnitCost(product.recipe, props.materials);
  if (cost === undefined) return undefined;
  const shippingFee = product.freeShipping === false ? undefined : product.shippingFee;
  const cents = orderNetIncomeCents({ value: product.defaultValue, cost, shippingFee });
  return cents === undefined ? undefined : cents / 100;
}

function formatMoney(value: number) {
  return (value < 0 ? "-¥" : "¥") + Math.abs(value).toFixed(2);
}

const groups = computed(() => {
  const visible = props.products;
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
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 4px;
  color: var(--text-muted);
  font-size: 13px;
  cursor: pointer;
  list-style: none;
}

.product-group-summary::-webkit-details-marker {
  display: none;
}

.summary-arrow {
  transition: transform 0.2s ease;
}

details[open] .summary-arrow {
  transform: rotate(180deg);
}

.product-list {
  display: grid;
  gap: 8px;
}

.product-item {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 56px;
  padding: 8px 10px 8px 14px;
  border-radius: 14px;
  background: var(--surface-soft);
}

.product-item.inactive {
  opacity: 0.72;
}

.product-main {
  display: grid;
  flex: 1;
  gap: 3px;
  min-width: 0;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.product-title {
  overflow: hidden;
  color: var(--text-strong);
  font-size: 15px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;

  small {
    overflow: hidden;
    color: var(--text-muted);
    font-size: 12px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.product-profit {
  flex-shrink: 0;
  padding: 1px 6px;
  border-radius: 6px;
  background: rgba(34, 160, 107, 0.1);
  color: #23885a;
  font-size: 11px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  line-height: 18px;

  &.is-loss {
    background: var(--danger-bg);
    color: var(--danger-text);
  }
}

.product-count {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
  min-width: 40px;
  line-height: 1.1;
}

.product-count strong {
  color: var(--accent-strong);
  font-size: 18px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.product-count small {
  margin-top: 2px;
  color: var(--text-muted);
  font-size: 11px;
}

.product-count.is-warning strong {
  color: var(--warning-text);
}

.product-count.is-danger strong {
  color: var(--danger-text);
}

.product-order {
  flex-shrink: 0;
  height: 34px;
  padding: 0 14px;
  border: 0;
  border-radius: 999px;
  background: var(--surface);
  color: var(--accent-strong);
  box-shadow: 0 0 0 1px var(--accent-border) inset;
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.product-order:active {
  transform: scale(0.95);
}

.product-paused {
  flex-shrink: 0;
  padding: 3px 8px;
  border-radius: 999px;
  background: var(--surface-muted);
  color: var(--text-muted);
  font-size: 11px;
}

.product-empty {
  margin: 8px 0 0;
  color: var(--text-muted);
  font-size: 12px;
}

.product-empty {
  padding: 8px 0;
  text-align: center;
}
</style>
