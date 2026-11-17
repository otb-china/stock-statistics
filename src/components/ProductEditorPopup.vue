<template>
  <van-popup v-model:show="popupShow" position="bottom" round destroy-on-close>
    <div class="popup-body">
      <div class="popup-head">
        <div class="popup-title">
          <span class="popup-icon"><el-icon><Goods /></el-icon></span>
          <div>
            <h3>{{ type === "add" ? "新增货品" : "编辑货品" }}</h3>
            <p>单件售价和成本会自动带入新订单。</p>
          </div>
        </div>
      </div>

      <div class="form-stack">
        <label class="form-field">
          <span class="form-label">货品名称</span>
          <el-input v-model="form.name" placeholder="例如：珍珠手链" maxlength="30" clearable />
        </label>

        <div class="form-row">
          <label class="form-field">
            <span class="form-label">单件售价</span>
            <el-input-number
              :model-value="form.defaultValue"
              :min="0"
              :max="100000"
              :precision="2"
              :controls="false"
              placeholder="输入售价"
              aria-label="单件售价"
              @update:model-value="form.defaultValue = $event ?? undefined"
            >
              <template #prefix>¥</template>
            </el-input-number>
          </label>
          <label class="form-field">
            <span class="form-label">单件成本</span>
            <el-input-number
              :model-value="form.defaultCost"
              :min="0"
              :precision="2"
              :controls="false"
              placeholder="输入成本"
              aria-label="单件成本"
              @update:model-value="form.defaultCost = $event ?? undefined"
            >
              <template #prefix>¥</template>
            </el-input-number>
          </label>
        </div>
        <div class="form-field">
          <span class="form-label">预警阈值 <small>可制件数小于或等于此值时预警</small></span>
          <el-input-number
            :model-value="form.warningThreshold"
            :min="0"
            :precision="0"
            aria-label="预警阈值"
            @update:model-value="form.warningThreshold = $event ?? undefined"
          />
        </div>
      </div>

      <div v-if="type === 'edit' && limitingMaterials" class="info-tip">
        <el-icon><InfoFilled /></el-icon>
        <div>
          <p>限制产量的备料：{{ limitingMaterials }}</p>
          <p v-if="sharedMaterials">与其他在售货品共用：{{ sharedMaterials }}</p>
        </div>
      </div>

      <div class="form-section-head">
        <strong>配方 <small>{{ form.recipe.length }}</small></strong>
        <button v-if="form.recipe.length" class="pill-button" type="button" @click="openPicker">
          <el-icon><Plus /></el-icon>选择备料
        </button>
      </div>

      <div v-if="form.recipe.length" class="recipe-list">
        <div v-for="(item, index) in form.recipe" :key="item.materialId || index" class="recipe-row">
          <span class="recipe-info">
            <b>{{ materialName(item.materialId) }}</b>
            <small>库存 {{ materialStock(item.materialId) }} · 每件用量</small>
          </span>
          <el-input-number
            v-model="item.quantity"
            :min="1"
            :max="1000"
            class="recipe-quantity"
            :aria-label="materialName(item.materialId) + '每件用量'"
          />
          <button class="recipe-delete" type="button" :aria-label="'移除' + materialName(item.materialId)" @click="emit('remove-recipe', index)">
            <el-icon><Close /></el-icon>
          </button>
        </div>
      </div>
      <button v-else class="recipe-empty" type="button" @click="openPicker">
        <span class="empty-icon"><el-icon><Plus /></el-icon></span>
        <strong>选择配方备料</strong>
        <span>勾选做一件需要用到的备料，再填写用量</span>
      </button>

      <div class="popup-footer">
        <el-button
          type="primary"
          size="large"
          class="submit-button"
          :disabled="!canSubmit"
          @click="emit('submit')"
        >
          {{ type === "add" ? "添加货品" : "保存修改" }}
        </el-button>
      </div>
    </div>
  </van-popup>

  <van-popup v-model:show="picker.show" position="bottom" round teleport="body" :z-index="2100">
    <div class="popup-body picker-body">
      <div class="picker-head">
        <h3>选择备料</h3>
        <span>已选 {{ picker.selected.length }}</span>
      </div>
      <el-input
        v-if="materials.length > 6 || picker.search"
        v-model="picker.search"
        class="manage-search picker-search"
        placeholder="搜索备料名称"
        aria-label="搜索备料名称"
        :prefix-icon="Search"
        clearable
      />
      <div class="picker-list">
        <button
          v-for="material in pickerMaterials"
          :key="material.id"
          class="picker-item"
          :class="{ checked: picker.selected.includes(material.id) }"
          type="button"
          :aria-pressed="picker.selected.includes(material.id)"
          @click="togglePick(material.id)"
        >
          <span class="picker-check"><el-icon><Check /></el-icon></span>
          <span class="picker-name">{{ material.name }}</span>
          <small>库存 {{ material.num }}</small>
        </button>
        <p v-if="!pickerMaterials.length" class="picker-empty">没有匹配的备料</p>
      </div>
      <div class="popup-footer">
        <el-button type="primary" size="large" class="submit-button" @click="confirmPicker">
          确定{{ picker.selected.length ? "（" + picker.selected.length + "）" : "" }}
        </el-button>
      </div>
    </div>
  </van-popup>
</template>

<script lang="ts" setup>
import { computed, ref } from "vue";
import { Check, Close, Goods, InfoFilled, Plus, Search } from "@element-plus/icons-vue";
import { isValidAmount, isValidWarningThreshold } from "@/utils/stockData";
import type { EditorType, Material, ProductEditorForm } from "@/types/stock";

const props = defineProps<{
  show: boolean;
  type: EditorType;
  form: ProductEditorForm;
  limitingMaterials: string;
  sharedMaterials: string;
  materials: Material[];
}>();

const emit = defineEmits<{
  "update:show": [value: boolean];
  "set-recipe-materials": [materialIds: string[]];
  "remove-recipe": [index: number];
  submit: [];
}>();

const popupShow = computed({
  get: () => props.show,
  set: (value: boolean) => emit("update:show", value),
});

const picker = ref({ show: false, search: "", selected: [] as string[] });

const pickerMaterials = computed(() => {
  const query = picker.value.search.trim().toLowerCase();
  return props.materials.filter((material) => material.name.toLowerCase().includes(query));
});

function materialName(id: string) {
  return props.materials.find((material) => material.id === id)?.name ?? "未知备料";
}

function materialStock(id: string) {
  return props.materials.find((material) => material.id === id)?.num ?? 0;
}

function openPicker() {
  picker.value = {
    show: true,
    search: "",
    selected: props.form.recipe.map((item) => item.materialId).filter(Boolean),
  };
}

function togglePick(id: string) {
  const selected = picker.value.selected;
  const index = selected.indexOf(id);
  if (index >= 0) selected.splice(index, 1);
  else selected.push(id);
}

function confirmPicker() {
  emit("set-recipe-materials", [...picker.value.selected]);
  picker.value.show = false;
}

const canSubmit = computed(() => {
  const { name, recipe, defaultValue, defaultCost, warningThreshold } = props.form;
  return Boolean(name.trim() && recipe.length && isValidAmount(defaultValue) && isValidWarningThreshold(warningThreshold)
    && (props.type === "edit" && defaultCost === undefined || isValidAmount(defaultCost)));
});
</script>

<style lang="scss" scoped>
.recipe-list {
  display: grid;
  gap: 8px;
}

.recipe-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 6px 10px 14px;
  border-radius: 14px;
  background: var(--surface-soft);
}

.recipe-info {
  flex: 1;
  min-width: 0;
}

.recipe-info b,
.recipe-info small {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.recipe-info b {
  color: var(--text-strong);
  font-size: 15px;
  font-weight: 600;
}

.recipe-info small {
  margin-top: 2px;
  color: var(--text-muted);
  font-size: 12px;
}

.popup-body .recipe-row .recipe-quantity {
  flex: 0 0 116px;
  width: 116px;
  height: 40px;
  line-height: 40px;
}

.recipe-row :deep(.el-input__wrapper) {
  background: var(--surface);
}

.recipe-row :deep(.el-input-number .el-input__wrapper) {
  padding: 0 38px;
}

.recipe-row :deep(.el-input-number__decrease),
.recipe-row :deep(.el-input-number__increase) {
  top: 4px;
  bottom: 4px;
  width: 30px;
  background: var(--surface-soft);
  box-shadow: none;
}

.recipe-row :deep(.el-input-number__decrease) {
  left: 4px;
}

.recipe-row :deep(.el-input-number__increase) {
  right: 4px;
}

.recipe-delete {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--text-subtle);
  font-size: 15px;
  cursor: pointer;
}

.recipe-delete:active {
  background: var(--danger-bg);
  color: var(--danger-text);
}

.recipe-empty {
  display: grid;
  place-items: center;
  gap: 6px;
  width: 100%;
  padding: 22px 12px;
  border: 1.5px dashed var(--accent-border);
  border-radius: 16px;
  background: var(--surface-soft);
  font: inherit;
  text-align: center;
  cursor: pointer;
}

.recipe-empty .empty-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  font-size: 18px;
}

.recipe-empty strong {
  color: var(--text-strong);
  font-size: 14px;
}

.recipe-empty > span:last-child {
  color: var(--text-muted);
  font-size: 12px;
}

.picker-body {
  display: flex;
  flex-direction: column;
}

.picker-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 14px;
}

.picker-head h3 {
  margin: 0;
  color: var(--text-strong);
  font-size: 18px;
}

.picker-head span {
  color: var(--text-muted);
  font-size: 13px;
}

.picker-search {
  flex-shrink: 0;
  margin-bottom: 10px;
}

.picker-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.picker-item {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  column-gap: 8px;
  padding: 10px 12px;
  border: 1.5px solid transparent;
  border-radius: 14px;
  background: var(--surface-soft);
  color: var(--text-main);
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.15s ease, background-color 0.15s ease;
}

.picker-item small {
  grid-column: 2;
  color: var(--text-muted);
  font-size: 11px;
}

.picker-check {
  display: inline-flex;
  grid-row: span 2;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border: 1.5px solid var(--divider);
  border-radius: 50%;
  background: var(--surface);
  color: transparent;
  font-size: 12px;
}

.picker-name {
  overflow: hidden;
  color: var(--text-strong);
  font-size: 14px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.picker-item.checked {
  border-color: var(--accent);
  background: var(--surface);
}

.picker-item.checked .picker-check {
  border-color: var(--accent);
  background: var(--accent);
  color: #ffffff;
}

.picker-empty {
  grid-column: 1 / -1;
  margin: 0;
  padding: 16px 0;
  color: var(--text-muted);
  font-size: 13px;
  text-align: center;
}
</style>
