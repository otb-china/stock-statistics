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

      <section class="editor-section">
        <div class="form-stack">
          <label class="form-field">
            <span class="form-label">备料名称</span>
            <el-input v-model="form.name" placeholder="例如：珍珠、包装盒" maxlength="30" clearable />
          </label>

          <label class="form-field">
            <span class="form-label">单位成本 <small>按 1 个库存计量单位填写</small></span>
            <el-input-number
              :model-value="form.unitCost"
              :min="0"
              :controls="false"
              aria-label="单位成本"
              @update:model-value="form.unitCost = $event ?? undefined"
            >
              <template #prefix>¥</template>
            </el-input-number>
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
      </section>

      <section v-if="type === 'add' && products.length" class="editor-section">
        <div class="form-section-head">
          <strong>关联货品 <small v-if="productLinks.length">{{ productLinks.length }}</small></strong>
          <span class="section-optional">选填</span>
        </div>
        <div class="form-stack">
          <button
            class="product-picker-trigger"
            :class="{ selected: productLinks.length }"
            type="button"
            aria-label="关联货品"
            aria-haspopup="dialog"
            :aria-expanded="productPickerShow"
            data-no-swipe-close
            @click="openProductPicker"
          >
            <span>{{ selectedProductsText || "请选择货品" }}</span>
            <el-icon aria-hidden="true"><ArrowDown /></el-icon>
          </button>
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
      </section>

      <button v-if="type === 'edit'" class="link-row" type="button" @click="emit('history', form)">
        <el-icon><Tickets /></el-icon>
        <span>查看库存流水</span>
        <el-icon><ArrowRight /></el-icon>
      </button>

      <div class="popup-footer">
        <el-button
          type="primary"
          size="large"
          class="submit-button"
          :disabled="!form.name.trim() || !isValidAmount(form.unitCost)"
          @click="emit('submit')"
        >
          {{ type === "add" ? "添加备料" : "保存修改" }}
        </el-button>
      </div>
    </div>
  </van-popup>

  <van-popup v-model:show="productPickerShow" position="bottom" round destroy-on-close aria-label="关联货品">
    <div class="popup-body">
      <div class="popup-head">
        <div class="popup-title"><h3>关联货品</h3></div>
      </div>
      <van-checkbox-group v-model="selectedProductIds" class="product-options" data-no-swipe-close>
        <van-checkbox v-for="product in products" :key="product.id" :name="product.id">
          {{ product.name }}
        </van-checkbox>
      </van-checkbox-group>
      <div class="popup-footer">
        <el-button class="submit-button" type="primary" @click="productPickerShow = false">完成</el-button>
      </div>
    </div>
  </van-popup>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from "vue";
import { ArrowDown, ArrowRight, Box, Tickets } from "@element-plus/icons-vue";
import { isValidAmount } from "@/utils/stockData";
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

const quickSteps = [2, 5, 10];
const originalNum = ref<number | null>(null);
const productPickerShow = ref(false);
const productNames = computed(() => new Map(props.products.map((product) => [product.id, product.name])));
const selectedProductIds = computed({
  get: () => props.productLinks.map((link) => link.productId),
  set: (ids: string[]) => emit("select-products", ids),
});
const selectedProductsText = computed(() => selectedProductIds.value.map((id) => productNames.value.get(id)).filter(Boolean).join("、"));

watch(() => props.show, (show) => {
  if (show) originalNum.value = props.type === "edit" ? props.form.num : null;
  else productPickerShow.value = false;
}, { immediate: true });

const popupShow = computed({
  get: () => props.show,
  set: (value: boolean) => emit("update:show", value),
});

function addStock(step: number) {
  props.form.num = Math.min(100000, Number(((props.form.num || 0) + step).toPrecision(15)));
}

function openProductPicker() {
  const focused = document.activeElement;
  if (focused instanceof HTMLInputElement) focused.blur();
  productPickerShow.value = true;
}
</script>

<style lang="scss" scoped>
.editor-section {
  padding: 14px;
  border-radius: 18px;
  background: var(--surface-muted);
}

.editor-section + .editor-section {
  margin-top: 12px;
}

.editor-section .form-section-head {
  margin: 0 0 14px;
}

.editor-section :deep(.el-input__wrapper) {
  background: var(--surface);
}

.editor-section :deep(.el-input-number__decrease),
.editor-section :deep(.el-input-number__increase) {
  background: var(--surface-muted);
  box-shadow: none;
}

.editor-section :deep(.el-input-number__decrease.is-disabled),
.editor-section :deep(.el-input-number__increase.is-disabled) {
  background: transparent;
}

.editor-section .product-picker-trigger {
  background: var(--surface);
}

.editor-section .form-section-head strong small {
  background: var(--surface);
}

.section-optional {
  color: var(--text-muted);
  font-size: 12px;
}

.product-picker-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  min-height: 46px;
  padding: 8px 14px;
  border: 0;
  border-radius: 12px;
  background: var(--field-bg);
  color: var(--text-muted);
  font: inherit;
  text-align: left;
  cursor: pointer;
  touch-action: manipulation;
}

.product-picker-trigger.selected {
  color: var(--text-strong);
}

.product-picker-trigger span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-picker-trigger .el-icon {
  flex-shrink: 0;
}


.product-options :deep(.van-checkbox) {
  min-height: 44px;
  padding: 6px 0;
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
