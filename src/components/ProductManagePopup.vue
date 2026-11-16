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

      <el-input v-model="search" class="manage-search" placeholder="搜索货品名称" aria-label="搜索货品名称" clearable />
      <div class="manage-list-scroll">
        <div v-if="!visibleProducts.length" class="manage-empty">
          <strong>{{ search.trim() ? "没有匹配的货品" : "还没有货品" }}</strong>
          <span v-if="!search.trim()">新增货品并配置配方后，订单会自动带出金额和备料扣减。</span>
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
                <span class="product-count">可制 {{ craftableCountForProduct(product) }}</span>
              </span>
              <small>默认单价 ¥{{ product.defaultValue || 0 }}</small>
              <small>{{ recipePreview(product) }}</small>
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
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 12px;
  align-items: center;
  padding: 12px;
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


</style>
