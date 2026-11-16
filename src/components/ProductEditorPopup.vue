<template>
  <van-popup v-model:show="popupShow" position="bottom" round destroy-on-close>
    <div class="popup-body">
      <div class="popup-head">
        <div class="popup-title">
          <span class="popup-icon"><el-icon><Goods /></el-icon></span>
          <div>
            <h3>{{ type === "add" ? "新增货品" : "编辑货品" }}</h3>
            <p>设置售价和配方，下单时会自动带出金额并扣减备料。</p>
          </div>
        </div>
      </div>

      <div class="form-row product-basic">
        <label class="form-field">
          <span class="form-label">货品名称</span>
          <el-input v-model="form.name" placeholder="例如：珍珠手链" maxlength="30" clearable />
        </label>

        <label class="form-field">
          <span class="form-label">单价</span>
          <el-input-number
            v-model="form.defaultValue"
            :min="0"
            :max="100000"
            :controls="false"
            aria-label="单价"
          >
            <template #prefix>¥</template>
          </el-input-number>
        </label>
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
        <button class="pill-button" type="button" @click="emit('add-recipe')">
          <el-icon><Plus /></el-icon>添加备料
        </button>
      </div>

      <div v-if="form.recipe.length" class="recipe-list">
        <div v-for="(item, index) in form.recipe" :key="index" class="recipe-row">
          <span class="recipe-index">{{ index + 1 }}</span>
          <el-select
            v-model="item.materialId"
            placeholder="选择备料"
            class="recipe-select"
            @change="emit('recipe-material-change', index, $event as string)"
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
            class="recipe-quantity"
            aria-label="每件用量"
          />
          <button class="recipe-delete" type="button" aria-label="移除该备料" @click="emit('remove-recipe', index)">
            <el-icon><Delete /></el-icon>
          </button>
        </div>
      </div>
      <button v-else class="recipe-empty" type="button" @click="emit('add-recipe')">
        <span class="empty-icon"><el-icon><Plus /></el-icon></span>
        <strong>还没有配方备料</strong>
        <span>添加每做一件需要消耗的备料和数量</span>
      </button>

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
  </van-popup>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { Delete, Goods, InfoFilled, Plus } from "@element-plus/icons-vue";
import type { EditorType, Material, Product } from "@/types/stock";

const props = defineProps<{
  show: boolean;
  type: EditorType;
  form: Product;
  limitingMaterials: string;
  sharedMaterials: string;
  availableMaterialsForRecipe: (index: number) => Material[];
}>();

const emit = defineEmits<{
  "update:show": [value: boolean];
  "add-recipe": [];
  "recipe-material-change": [index: number, materialId: string];
  "remove-recipe": [index: number];
  submit: [];
}>();

const popupShow = computed({
  get: () => props.show,
  set: (value: boolean) => emit("update:show", value),
});

const canSubmit = computed(() => props.form.name.trim() && props.form.recipe.length);
</script>

<style lang="scss" scoped>
.product-basic {
  grid-template-columns: minmax(0, 1fr) 120px;
}

.recipe-list {
  display: grid;
  gap: 8px;
}

.recipe-row {
  display: grid;
  grid-template-columns: 22px minmax(0, 1fr) 128px 34px;
  gap: 8px;
  align-items: center;
  padding: 8px;
  border-radius: 14px;
  background: var(--surface-soft);
}

.recipe-index {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--header-icon-bg);
  color: var(--accent-strong);
  font-size: 12px;
  font-weight: 700;
}

.recipe-row :deep(.el-select__wrapper),
.recipe-row :deep(.el-input__wrapper) {
  background: var(--surface);
}

.recipe-row :deep(.el-input-number__decrease),
.recipe-row :deep(.el-input-number__increase) {
  background: var(--surface-soft);
  box-shadow: none;
}

.recipe-row :deep(.el-input-number .el-input__wrapper) {
  padding: 0 40px;
}

.recipe-delete {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: var(--danger-text);
  font-size: 16px;
  cursor: pointer;
}

.recipe-delete:active {
  background: var(--danger-bg);
}

.recipe-empty {
  display: grid;
  place-items: center;
  gap: 6px;
  width: 100%;
  padding: 22px 12px;
  border: 1.5px dashed var(--divider);
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

@media (max-width: 400px) {
  .product-basic {
    grid-template-columns: minmax(0, 1fr) 104px;
  }

  .recipe-row {
    grid-template-columns: minmax(0, 1fr) 116px 30px;
  }

  .recipe-index {
    display: none;
  }
}
</style>
