<template>
  <van-popup v-model:show="popupShow" position="bottom" round destroy-on-close>
    <div class="popup-body">
      <div class="popup-head">
        <div class="popup-title">
          <span class="popup-icon"><el-icon><Box /></el-icon></span>
          <div>
            <h3>{{ type === "add" ? "新增备料" : "编辑备料" }}</h3>
            <p>{{ type === "add" ? "录入备料名称和当前库存。" : "修改库存会记录为盘点调整。" }}</p>
          </div>
        </div>
      </div>

      <div class="form-stack">
        <label class="form-field">
          <span class="form-label">备料名称</span>
          <el-input v-model="form.name" placeholder="例如：珍珠、包装盒" maxlength="30" clearable />
        </label>

        <div class="form-field">
          <span class="form-label">
            库存数量
            <small v-if="type === 'edit' && originalNum !== null && form.num !== originalNum">
              原库存 {{ originalNum }} → {{ form.num }}
            </small>
          </span>
          <el-input-number v-model="form.num" :min="0" :max="100000" aria-label="库存数量" />
          <div class="quick-steps">
            <button v-for="step in quickSteps" :key="step" type="button" @click="addStock(step)">+{{ step }}</button>
          </div>
        </div>
      </div>

      <div v-if="type === 'add' && products.length" class="form-stack product-links">
        <div class="form-field">
          <span class="form-label">关联货品 <small>选填</small></span>
          <el-select
            ref="productSelect"
            :model-value="productLinks.map((link) => link.productId)"
            multiple
            clearable
            placeholder="请选择货品"
            aria-label="关联货品"
            @update:model-value="emit('select-products', $event)"
          >
            <el-option
              v-for="product in products"
              :key="product.id"
              :label="product.name"
              :value="product.id"
            />
            <template #footer>
              <el-button class="product-select-done" type="primary" @click="productSelect?.blur()">
                完成
              </el-button>
            </template>
          </el-select>
        </div>
        <div v-if="productLinks.length">
          <span class="form-label">每件用量</span>
          <div v-for="link in productLinks" :key="link.productId" class="product-link-row">
            <span>{{ productNames.get(link.productId) }}</span>
            <el-input-number
              v-model="link.quantity"
              :min="1"
              :max="1000"
              :aria-label="`${productNames.get(link.productId)}每件用量`"
            />
          </div>
        </div>
      </div>

      <button v-if="type === 'edit'" class="link-row" type="button" @click="emit('history', form)">
        <el-icon><Tickets /></el-icon>
        <span>查看库存流水</span>
        <el-icon><ArrowRight /></el-icon>
      </button>

      <el-button
        type="primary"
        size="large"
        class="submit-button"
        :disabled="!form.name.trim()"
        @click="emit('submit')"
      >
        {{ type === "add" ? "添加备料" : "保存修改" }}
      </el-button>
    </div>
  </van-popup>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from "vue";
import { ArrowRight, Box, Tickets } from "@element-plus/icons-vue";
import type { SelectInstance } from "element-plus";
import type { EditorType, Material, MaterialProductLink, Product } from "@/types/stock";

const props = defineProps<{
  show: boolean;
  type: EditorType;
  form: Material;
  products: Product[];
  productLinks: MaterialProductLink[];
}>();

const emit = defineEmits<{
  "update:show": [value: boolean];
  submit: [];
  history: [item: Material];
  "select-products": [productIds: string[]];
}>();

const quickSteps = [1, 5, 10, 50];
const originalNum = ref<number | null>(null);
const productSelect = ref<SelectInstance>();
const productNames = computed(() => new Map(props.products.map((product) => [product.id, product.name])));

watch(() => props.show, (show) => {
  if (show) originalNum.value = props.type === "edit" ? props.form.num : null;
}, { immediate: true });

const popupShow = computed({
  get: () => props.show,
  set: (value: boolean) => emit("update:show", value),
});

function addStock(step: number) {
  props.form.num = Math.min(100000, Number(((props.form.num || 0) + step).toPrecision(15)));
}
</script>

<style lang="scss" scoped>
.product-links {
  margin-top: 16px;
}

.product-links :deep(.el-select) {
  width: 100%;
}

.product-select-done {
  width: 100%;
}

.product-link-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 116px;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
  color: var(--text-main);
  font-size: 14px;
  overflow-wrap: anywhere;
}

.quick-steps {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}

.quick-steps button {
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

.quick-steps button:active {
  background: var(--header-icon-bg);
  color: var(--accent-strong);
}
</style>
