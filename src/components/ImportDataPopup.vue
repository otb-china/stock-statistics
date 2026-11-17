<template>
  <van-popup v-model:show="popupShow" position="bottom" destroy-on-close round>
    <div class="popup-body import-export-popup">
      <div class="popup-head">
        <div class="popup-title">
          <span class="popup-icon"><el-icon><Upload /></el-icon></span>
          <div>
            <h3>导入总数据</h3>
            <p>用备份文件覆盖当前全部数据</p>
          </div>
        </div>
      </div>

      <input
        ref="fileInput"
        class="file-input"
        type="file"
        accept="application/json,.json"
        @change="onFileChange"
      />

      <button class="file-upload-card" :class="{ selected: fileName }" type="button" @click="selectFile">
        <span class="empty-icon"><el-icon><component :is="fileName ? Document : Upload" /></el-icon></span>
        <strong>{{ fileName || "点击选择备份文件" }}</strong>
        <em>{{ fileName ? "点击重新选择" : "支持导出的 .json 备份文件" }}</em>
      </button>

      <div class="compare-card">
        <div class="compare-item">
          <small>当前数据</small>
          <span>{{ summary }}</span>
        </div>
        <el-icon class="compare-arrow"><Bottom /></el-icon>
        <div class="compare-item" :class="{ ready: preview }">
          <small>导入后</small>
          <span>{{ preview || "选择文件后在这里预览" }}</span>
        </div>
      </div>

      <p v-if="error" class="info-tip warning import-error" role="alert">
        <el-icon><WarningFilled /></el-icon>{{ error }}
      </p>
      <div v-else class="info-tip">
        <el-icon><InfoFilled /></el-icon>
        <p>导入会覆盖当前数据，覆盖前的数据会保留为最近可恢复备份。</p>
      </div>

      <div class="popup-footer">
        <el-button
          type="primary"
          size="large"
          class="submit-button"
          :disabled="!preview || reading"
          @click="emit('import')"
        >
          覆盖并导入
        </el-button>
      </div>
    </div>
  </van-popup>
</template>

<script lang="ts" setup>
import { computed, ref } from "vue";
import { Bottom, Document, InfoFilled, Upload, WarningFilled } from "@element-plus/icons-vue";

const props = defineProps<{
  show: boolean;
  summary: string;
  fileName: string;
  preview: string;
  error: string;
}>();

const emit = defineEmits<{
  "update:show": [value: boolean];
  "file-loaded": [payload: { dataStr: string; fileName: string }];
  "file-error": [message: string];
  import: [];
}>();

const fileInput = ref<HTMLInputElement | null>(null);
const reading = ref(false);
let selection = 0;

const popupShow = computed({
  get: () => props.show,
  set: (value: boolean) => {
    if (!value) {
      selection++;
      reading.value = false;
    }
    emit("update:show", value);
  },
});

const selectFile = () => {
  fileInput.value?.click();
};

const onFileChange = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];

  if (!file) return;
  const currentSelection = ++selection;
  input.value = "";
  reading.value = false;

  const isJsonFile = file.type === "application/json" || file.name.toLowerCase().endsWith(".json");
  if (!isJsonFile) {
    emit("file-error", "请选择 JSON 备份文件");
    return;
  }

  try {
    reading.value = true;
    const dataStr = await file.text();
    if (currentSelection === selection && props.show) emit("file-loaded", { dataStr, fileName: file.name });
  } catch {
    if (currentSelection === selection && props.show) emit("file-error", "文件读取失败");
  } finally {
    if (currentSelection === selection) reading.value = false;
  }
};
</script>

<style lang="scss" scoped>
.file-input {
  display: none;
}

.file-upload-card {
  display: grid;
  place-items: center;
  gap: 6px;
  width: 100%;
  padding: 22px 14px;
  border: 1.5px dashed var(--accent-border);
  border-radius: 16px;
  background: var(--surface-soft);
  font: inherit;
  text-align: center;
  cursor: pointer;
}

.file-upload-card.selected {
  border-style: solid;
  background: var(--header-icon-bg);
}

.file-upload-card strong {
  max-width: 100%;
  margin-top: 4px;
  overflow: hidden;
  color: var(--text-strong);
  font-size: 15px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-upload-card em {
  color: var(--text-muted);
  font-size: 12px;
  font-style: normal;
}

.compare-card {
  display: grid;
  gap: 6px;
  margin-top: 14px;
  padding: 12px;
  border: 1px solid var(--divider);
  border-radius: 16px;
}

.compare-item {
  padding: 10px 12px;
  border-radius: 12px;
  background: var(--surface-soft);
}

.compare-item small,
.compare-item span {
  display: block;
}

.compare-item small {
  color: var(--text-muted);
  font-size: 11px;
}

.compare-item span {
  margin-top: 3px;
  color: var(--text-main);
  font-size: 13px;
  font-weight: 600;
  line-height: 1.45;
}

.compare-item.ready {
  background: var(--header-icon-bg);
}

.compare-item.ready span {
  color: var(--accent-strong);
}

.compare-item:not(.ready):last-child span {
  color: var(--text-subtle);
  font-weight: 400;
}

.compare-arrow {
  justify-self: center;
  color: var(--text-subtle);
}

.import-error {
  align-items: center;
}
</style>
