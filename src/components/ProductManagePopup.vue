<template>
  <van-popup v-model:show="popupShow" position="bottom" round destroy-on-close>
    <div class="popup-body manage-popup-body">
      <div class="popup-head MB12">
        <div>
          <h3>货品管理</h3>
          <p>{{ description }}</p>
        </div>
        <button class="popup-create-btn" type="button" @click="emit('create')">
          <el-icon><Plus /></el-icon>
          <span>{{ createText }}</span>
        </button>
      </div>

      <div class="manage-list-scroll">
        <van-swipe-cell v-for="product in products" :key="product.id" class="manage-swipe-cell">
          <div class="product-row">
            <div class="product-main">
              <div class="product-title-row">
                <div class="product-title-block">
                  <strong>{{ product.name }}</strong>
                  <button
                    class="product-status"
                    :class="productStatusClass(product.status)"
                    type="button"
                    @click.stop="emit('toggle-status', product)"
                  >
                    {{ product.status === "active" ? "正常" : "停产" }}
                  </button>
                </div>
                <span class="product-count">可制 {{ craftableCountForProduct(product) }}</span>
              </div>
              <p>收入金额 ¥{{ product.defaultValue || 0 }}</p>
              <small>{{ recipePreview(product) }}</small>
            </div>
          </div>
          <template #right>
            <van-button square type="primary" class="swipe-btn" text="编辑" @click="emit('edit', product)" />
            <van-button square type="danger" class="swipe-btn" text="删除" @click="emit('remove', product.id)" />
          </template>
        </van-swipe-cell>
      </div>
    </div>
  </van-popup>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { Plus } from "@element-plus/icons-vue";
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

const popupShow = computed({
  get: () => props.show,
  set: (value: boolean) => emit("update:show", value),
});
</script>

<style lang="scss" scoped>
.popup-body {
  max-height: 82vh;
  padding: 18px 16px 22px;
  overflow-x: hidden;
  overflow-y: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.popup-body::-webkit-scrollbar {
  width: 0;
  height: 0;
  display: none;
}

.popup-head {
  display: flex;
  justify-content: space-between;
  gap: 10px;
}

.popup-head h3 {
  margin: 0;
  color: var(--text-strong);
}

.popup-head p {
  margin: 0;
  color: var(--text-subtle);
  font-size: 12px;
}

.popup-create-btn {
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  gap: 4px;
  flex: 0 0 auto;
  margin-top: 2px;
  padding: 6px 9px;
  border: 1px solid var(--divider);
  border-radius: 999px;
  background: var(--surface);
  color: var(--accent);
  font-size: 10px;
  font-weight: 600;
  line-height: 1;
  box-shadow: 0 4px 10px rgba(38, 56, 88, 0.06);
}

.popup-create-btn .el-icon {
  font-size: 11px;
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
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.manage-list-scroll::-webkit-scrollbar {
  width: 0;
  height: 0;
  display: none;
}

.swipe-btn {
  height: 100%;
  min-width: 60px;
  border: 0;
  color: #ffffff;
  font-weight: 700;
}

.swipe-btn.van-button--primary {
  background: var(--swipe-edit-bg);
}

.swipe-btn.van-button--danger {
  background: var(--swipe-delete-bg);
}

.manage-swipe-cell {
  flex: 0 0 auto;
  overflow: hidden;
  border-radius: 10px;
  background: var(--surface-soft);
}

.product-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto auto;
  gap: 12px;
  align-items: center;
  padding: 14px 16px;
  border: 0;
  border-radius: 10px;
  background: var(--surface-soft);
}

.product-main {
  min-width: 0;
}

.product-main strong {
  display: block;
  color: var(--text-main);
  font-size: 16px;
  line-height: 1.2;
}

.product-main p,
.product-main small {
  display: block;
  margin-top: 4px;
  color: var(--text-subtle);
  font-size: 12px;
}

.product-main small {
  text-align: justify;
  text-justify: inter-ideograph;
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
  font-size: 12px;
  font-weight: 600;
  line-height: 1.2;
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
  color: var(--accent-strong);
  font-size: 12px;
  font-weight: 600;
}

@media (max-width: 720px) {
  .product-row {
    grid-template-columns: minmax(0, 1fr) auto auto;
  }
}
</style>
