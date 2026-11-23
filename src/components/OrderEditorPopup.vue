<template>
  <van-popup v-model:show="popupShow" position="bottom" destroy-on-close round>
    <div class="popup-body order-popup">
      <div class="popup-head">
        <div class="popup-title">
          <span class="popup-icon"><el-icon><Tickets /></el-icon></span>
          <div>
            <h3>{{ type === "add" ? "新增订单" : "编辑订单" }}</h3>
            <p v-if="!showProductPicker">{{ form.title }}</p>
          </div>
        </div>
        <el-button v-if="type === 'upd'" size="small" round :icon="Refresh" aria-label="同步订单金额" @click="emit('sync-amounts')">同步</el-button>
      </div>

      <template v-if="showProductPicker">
        <div class="form-section-head first">
          <strong>选择货品</strong>
        </div>
        <div class="order-product-list">
          <button
            v-for="product in products"
            :key="product.id"
            class="order-product-card"
            :class="{ active: form.title === product.name, empty: craftableCountForProduct(product) <= 0 }"
            type="button"
            :aria-pressed="form.title === product.name"
            @click="emit('product-change', product.name)"
          >
            <span class="product-check"><el-icon><Check /></el-icon></span>
            <strong>{{ product.name }}</strong>
            <em>{{ formatMoney(product.defaultValue || 0) }} · 可制 {{ craftableCountForProduct(product) }}</em>
          </button>
        </div>
      </template>

      <div class="form-stack order-fields">
        <div class="form-row">
          <div class="form-field">
            <span class="form-label">件数</span>
            <el-input-number
              :model-value="form.quantity || undefined"
              :min="1"
              :step="1"
              aria-label="件数"
              @update:model-value="emit('quantity-change', $event ?? 0)"
            />
          </div>
          <div class="form-field">
            <span class="form-label">下单日期</span>
            <DatePicker
              class-name="date-control"
              placeholder="选择下单日期"
              :default-date="form.orderDate"
              @date-change="emit('date-change', $event)"
            />
          </div>
        </div>

        <div class="form-row">
          <label class="form-field">
            <span class="form-label">总售价</span>
            <van-field
              :model-value="Number.isFinite(form.value) ? form.value : ''"
              type="number"
              placeholder="实收金额"
              aria-label="总售价"
              clearable
              @update:model-value="emit('value-change', $event)"
            >
              <template #left-icon><span class="currency">¥</span></template>
            </van-field>
          </label>
          <label class="form-field">
            <span class="form-label">总成本</span>
            <van-field
              :model-value="Number.isFinite(form.cost) ? form.cost : ''"
              type="number"
              :placeholder="requiresManualCost ? '请输入成本，无成本填 0' : '留空按 0 元'"
              aria-label="总成本"
              clearable
              @update:model-value="emit('cost-change', $event)"
            >
              <template #left-icon><span class="currency">¥</span></template>
            </van-field>
          </label>
        </div>

        <div v-if="form.shippingFee !== undefined" class="order-amount">
          <span>运费</span>
          <strong>{{ formatMoney(form.shippingFee) }}</strong>
        </div>
        <div class="order-amount" aria-live="polite">
          <span>净收入</span>
          <strong>{{ netIncome === undefined ? '待计算' : formatMoney(netIncome) }}</strong>
        </div>
      </div>

      <div v-if="type === 'add'" class="sync-card" :class="{ active: calculationModel }">
        <div>
          <strong>扣减备料库存</strong>
          <span>{{ deductionMessage }}</span>
        </div>
        <el-switch v-model="calculationModel" :disabled="!canSyncCalculation" aria-label="扣减备料库存" />
      </div>
      <div v-else-if="form.deductedMaterials?.length" class="info-tip">
        <el-icon><InfoFilled /></el-icon>
        <p>已扣料的订单无法更换货品。修改件数时，会按原扣料明细补扣或返还备料。</p>
      </div>
      <div v-else-if="form.deductedMaterials === undefined" class="info-tip warning">
        <el-icon><WarningFilled /></el-icon>
        <p>历史订单缺少扣料明细，修改件数只更新订单记录。</p>
      </div>

      <div class="popup-footer">
        <el-button
          type="primary"
          size="large"
          class="submit-button"
          :disabled="!form.title || !isValidAmount(form.value) || !hasValidCost || !Number.isSafeInteger(form.quantity) || form.quantity < 1 || !form.orderDate"
          @click="emit('submit')"
        >
          {{ type === "upd" ? "保存修改" : (calculationModel ? "记单并扣料" : "仅记订单") }}
        </el-button>
      </div>
    </div>
  </van-popup>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import DatePicker from "@/components/Date.vue";
import { Check, InfoFilled, Refresh, Tickets, WarningFilled } from "@element-plus/icons-vue";
import { formatMoney, isValidAmount, orderNetIncomeCents } from "@/utils/stockData";
import type { Order, OrderEditorType, Product } from "@/types/stock";

const props = defineProps<{
  show: boolean;
  type: OrderEditorType;
  form: Order;
  showProductPicker: boolean;
  requiresManualCost: boolean;
  products: Product[];
  calculation: boolean;
  canSyncCalculation: boolean;
  deductionMessage: string;
  craftableCountForProduct: (product: Product) => number;
}>();

const emit = defineEmits<{
  "update:show": [value: boolean];
  "update:calculation": [value: boolean];
  "product-change": [productName: string];
  "date-change": [date: string];
  "quantity-change": [quantity: number];
  "value-change": [value: string];
  "cost-change": [value: string];
  "sync-amounts": [];
  submit: [];
}>();

const popupShow = computed({
  get: () => props.show,
  set: (value: boolean) => emit("update:show", value),
});

const calculationModel = computed({
  get: () => props.calculation,
  set: (value: boolean) => emit("update:calculation", value),
});

const hasValidCost = computed(() => props.form.cost === undefined ? !props.requiresManualCost : isValidAmount(props.form.cost));

const netIncome = computed(() => {
  if (!hasValidCost.value) return undefined;
  const cents = orderNetIncomeCents(props.form);
  return cents === undefined ? undefined : cents / 100;
});
</script>

<style lang="scss" scoped>
.form-section-head.first {
  margin-top: 0;
}

.order-product-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  max-height: 228px;
  overflow-y: auto;
  scrollbar-width: none;
}

.order-product-list::-webkit-scrollbar {
  display: none;
}

.order-product-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  min-width: 0;
  padding: 12px 34px 12px 12px;
  border: 1.5px solid var(--divider);
  border-radius: 14px;
  background: var(--surface);
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.15s ease, background-color 0.15s ease;
}

.order-product-card strong {
  max-width: 100%;
  overflow: hidden;
  color: var(--text-strong);
  font-size: 14px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.order-product-card em {
  color: var(--text-muted);
  font-size: 12px;
  font-style: normal;
}

.order-product-card.empty em {
  color: var(--danger-text);
}

.product-check {
  position: absolute;
  top: 10px;
  right: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border: 1.5px solid var(--divider);
  border-radius: 50%;
  color: transparent;
  font-size: 11px;
}

.order-product-card.active {
  border-color: var(--accent);
  background: var(--header-icon-bg);
}

.order-product-card.active strong {
  color: var(--accent-strong);
}

.order-product-card.active .product-check {
  border-color: var(--accent);
  background: var(--accent);
  color: #ffffff;
}

.order-fields {
  margin-top: 18px;
}

.order-amount {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  color: var(--text-main);
  font-size: 14px;
  font-variant-numeric: tabular-nums;
}

.currency {
  margin-right: 2px;
  color: var(--text-muted);
  font-weight: 600;
}

.sync-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 16px;
  padding: 14px;
  border: 1.5px solid var(--divider);
  border-radius: 14px;
  background: var(--surface);
  transition: border-color 0.15s ease, background-color 0.15s ease;
}

.sync-card.active {
  border-color: var(--accent-border);
  background: var(--header-icon-bg);
}

.sync-card strong,
.sync-card span {
  display: block;
}

.sync-card strong {
  color: var(--text-strong);
  font-size: 14px;
}

.sync-card span {
  margin-top: 4px;
  color: var(--text-muted);
  font-size: 12px;
  line-height: 1.45;
}
</style>
