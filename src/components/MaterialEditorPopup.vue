<template>
  <van-popup v-model:show="popupShow" position="bottom" round destroy-on-close>
    <div class="popup-body">
      <div class="popup-head MB12">
        <div>
          <h3>{{ type === "add" ? "新增备料" : "编辑备料" }}</h3>
        </div>
      </div>

      <div class="editor-card material-editor-card">
        <label class="editor-field">
          <span>备料名称</span>
          <el-input v-model="form.name" placeholder="备料名称" />
        </label>

        <label class="editor-field">
          <span>库存数量</span>
          <el-input-number v-model="form.num" :min="0" :max="100000" class="editor-number" />
        </label>
      </div>

      <el-button
        type="primary"
        size="large"
        class="submit-button"
        :disabled="!form.name"
        @click="emit('submit')"
      >
        提交
      </el-button>
    </div>
  </van-popup>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import type { EditorType, Material } from "@/types/stock";

const props = defineProps<{
  show: boolean;
  type: EditorType;
  form: Material;
}>();

const emit = defineEmits<{
  "update:show": [value: boolean];
  submit: [];
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

.editor-card {
  margin-top: 14px;
  padding: 12px;
  border: 1px solid var(--divider);
  border-radius: 14px;
  background: var(--surface-soft);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.42);
}

.material-editor-card {
  display: grid;
  gap: 12px;
}

.editor-field {
  display: block;
}

.editor-field > span {
  display: block;
  margin-bottom: 6px;
  color: var(--text-muted);
  font-size: 12px;
}

.editor-number {
  width: 100%;
}

.editor-card :deep(.el-input__wrapper) {
  border: 1px solid var(--divider);
  background: var(--surface);
  box-shadow: none;
}

.editor-card :deep(.el-input__wrapper.is-focus),
.editor-card :deep(.el-input__wrapper:hover),
.editor-card :deep(.el-input__wrapper:focus-within) {
  border-color: var(--divider);
  box-shadow: none;
}

.editor-card :deep(.el-input__wrapper) {
  min-height: 38px;
  border-radius: 10px;
}

.editor-card :deep(.el-input-number) {
  height: 38px;
  border: 1px solid var(--divider);
  border-radius: 10px;
  background: var(--surface);
  overflow: hidden;
}

.editor-card :deep(.el-input-number .el-input__wrapper) {
  height: 100%;
  border: 0;
  border-radius: 0;
  background: transparent;
}

.editor-card :deep(.el-input-number.is-focus),
.editor-card :deep(.el-input-number:hover),
.editor-card :deep(.el-input-number:focus-within) {
  border-color: var(--divider);
}

.editor-card :deep(.el-input-number .el-input__wrapper.is-focus),
.editor-card :deep(.el-input-number .el-input__wrapper:focus-within) {
  border-color: transparent;
  box-shadow: none !important;
}

.editor-card :deep(.el-input-number .el-input__inner:focus) {
  outline: none;
  box-shadow: none;
}

.editor-card :deep(.el-input-number__decrease),
.editor-card :deep(.el-input-number__increase) {
  border-color: var(--divider);
  background: var(--surface-soft);
  color: var(--text-muted);
}

.editor-card :deep(.el-input__inner) {
  color: var(--text-main);
  font-weight: 600;
}

.submit-button {
  width: 100%;
  margin-top: 28px;
  border: 0;
  color: #ffffff;
  background: var(--submit-btn-bg);
  box-shadow: var(--submit-btn-shadow);
}

.submit-button:hover,
.submit-button:focus {
  color: #ffffff;
  background: var(--submit-btn-bg);
}

.submit-button.is-disabled,
.submit-button.is-disabled:hover,
.submit-button.is-disabled:focus {
  border: 0;
  color: rgba(255, 255, 255, 0.72);
  background: var(--submit-btn-bg);
  box-shadow: none;
  opacity: 0.48;
}
</style>
