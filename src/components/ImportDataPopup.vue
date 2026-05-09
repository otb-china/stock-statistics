<template>
  <van-popup v-model:show="popupShow" position="bottom" destroy-on-close round>
    <div class="popup-body import-export-popup">
      <div class="popup-head">
        <div>
          <p class="section-tag">Data</p>
          <h3>导入总数据</h3>
          <p>选择导出的备份文件，会同时覆盖备料、货品和订单。</p>
        </div>
      </div>

      <div v-if="hasOverwriteData" class="import-export-card">
        <div>
          <strong>当前数据</strong>
          <span>{{ summary }}</span>
        </div>
      </div>

      <input
        ref="fileInput"
        class="file-input"
        type="file"
        accept="application/json,.json"
        @change="onFileChange"
      />

      <button class="file-upload-card" type="button" @click="selectFile">
        <span class="settings-item-icon">
          <el-icon><Upload /></el-icon>
        </span>
        <span>
          <strong>{{ fileName || "选择备份文件" }}</strong>
          <em>{{ hasFile ? "文件已读取，点击下方按钮导入" : "支持导出的 .json 备份文件" }}</em>
        </span>
      </button>

      <el-button
        type="primary"
        size="large"
        class="submit-button"
        :disabled="!hasFile"
        @click="emit('import')"
      >
        导入总数据
      </el-button>
    </div>
  </van-popup>
</template>

<script lang="ts" setup>
import { computed, ref } from "vue";
import { Upload } from "@element-plus/icons-vue";

const props = defineProps<{
  show: boolean;
  hasOverwriteData: boolean;
  summary: string;
  fileName: string;
  hasFile: boolean;
}>();

const emit = defineEmits<{
  "update:show": [value: boolean];
  "file-loaded": [payload: { dataStr: string; fileName: string }];
  "file-error": [message: string];
  import: [];
}>();

const fileInput = ref<HTMLInputElement | null>(null);

const popupShow = computed({
  get: () => props.show,
  set: (value: boolean) => emit("update:show", value),
});

const selectFile = () => {
  fileInput.value?.click();
};

const onFileChange = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];

  if (!file) return;

  const isJsonFile = file.type === "application/json" || file.name.toLowerCase().endsWith(".json");
  if (!isJsonFile) {
    input.value = "";
    emit("file-error", "请选择 JSON 备份文件");
    return;
  }

  try {
    const dataStr = await file.text();
    emit("file-loaded", { dataStr, fileName: file.name });
  } catch {
    input.value = "";
    emit("file-error", "文件读取失败");
  }
};
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

.section-tag {
  margin: 0 0 4px;
  color: var(--text-muted);
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.file-input {
  display: none;
}

.file-upload-card {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  margin-top: 14px;
  padding: 14px;
  border: 1px dashed var(--divider);
  border-radius: 12px;
  background: var(--surface-soft);
  text-align: left;
}

.file-upload-card > span:last-child {
  min-width: 0;
}

.file-upload-card strong,
.file-upload-card em {
  display: block;
}

.file-upload-card strong {
  color: var(--text-main);
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-upload-card em {
  margin-top: 4px;
  color: var(--text-muted);
  font-size: 12px;
  font-style: normal;
  line-height: 1.35;
}

.settings-item-icon {
  display: inline-flex !important;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 42px;
  height: 42px;
  border-radius: 10px;
  background: var(--surface);
  color: var(--accent);
  box-shadow: 0 8px 18px rgba(31, 107, 123, 0.1);
}

.import-export-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 14px 0 12px;
  padding: 14px;
  border-radius: 10px;
  background: var(--stat-income-bg);
  color: #ffffff;
}

.import-export-card strong,
.import-export-card span {
  display: block;
}

.import-export-card strong {
  font-size: 16px;
}

.import-export-card span {
  margin-top: 4px;
  font-size: 12px;
  opacity: 0.8;
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
