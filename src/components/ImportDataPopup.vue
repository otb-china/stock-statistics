<template>
  <van-popup v-model:show="popupShow" position="bottom" destroy-on-close round>
    <div class="popup-body import-export-popup">
      <div class="popup-head">
        <div>
          <p class="section-tag">Data</p>
          <h3>导入总数据</h3>
          <p>导入会覆盖当前数据。覆盖前的数据会保留在最近可恢复备份中。</p>
        </div>
      </div>

      <div class="import-export-card">
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
          <em>支持导出的 .json 备份文件</em>
        </span>
      </button>
      <div v-if="preview" class="import-export-card" aria-live="polite">
        <div>
          <strong>备份文件内容</strong>
          <span>{{ preview }}</span>
        </div>
      </div>
      <p v-if="error" class="import-error" role="alert">{{ error }}</p>

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
  </van-popup>
</template>

<script lang="ts" setup>
import { computed, ref } from "vue";
import { Upload } from "@element-plus/icons-vue";

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
.import-error {
  color: var(--danger-text);
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

</style>
