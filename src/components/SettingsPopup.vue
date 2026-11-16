<template>
  <van-popup v-model:show="popupShow" position="bottom" round destroy-on-close>
    <div class="popup-body">
      <div class="popup-head">
        <div class="popup-title">
          <span class="popup-icon"><el-icon><Setting /></el-icon></span>
          <div>
            <h3>设置</h3>
            <p>界面主题与数据备份</p>
          </div>
        </div>
      </div>

      <div class="settings-section">
        <div class="settings-section-head">
          <strong>界面主题</strong>
          <span>{{ currentThemeName }}</span>
        </div>
        <div class="theme-options">
          <button
            v-for="theme in themeOptions"
            :key="theme.key"
            class="theme-option"
            :class="{ active: currentTheme === theme.key }"
            :aria-pressed="currentTheme === theme.key"
            type="button"
            @click="emit('set-theme', theme.key)"
          >
            <span class="theme-preview" :style="{ background: theme.swatch }">
              <span class="theme-check"><el-icon><Check /></el-icon></span>
            </span>
            <strong>{{ theme.name }}</strong>
            <em>{{ theme.caption }}</em>
          </button>
        </div>
      </div>

      <div class="settings-section">
        <div class="settings-section-head">
          <strong>数据管理</strong>
          <span class="muted">数据仅保存在本机浏览器</span>
        </div>
        <div class="settings-list">
          <button class="settings-row" type="button" @click="emit('export')">
            <span class="settings-row-icon"><el-icon><Download /></el-icon></span>
            <span class="settings-row-text">
              <strong>导出总数据</strong>
              <em>{{ lastExport }}</em>
            </span>
            <el-icon class="settings-row-arrow"><ArrowRight /></el-icon>
          </button>

          <button class="settings-row" type="button" @click="emit('open-import')">
            <span class="settings-row-icon"><el-icon><Upload /></el-icon></span>
            <span class="settings-row-text">
              <strong>导入总数据</strong>
              <em>上传备份文件后恢复全部数据</em>
            </span>
            <el-icon class="settings-row-arrow"><ArrowRight /></el-icon>
          </button>

          <button v-if="recoverySummary" class="settings-row" type="button" @click="emit('restore')">
            <span class="settings-row-icon"><el-icon><RefreshLeft /></el-icon></span>
            <span class="settings-row-text">
              <strong>恢复最近备份</strong>
              <em>{{ recoverySummary }}</em>
            </span>
            <el-icon class="settings-row-arrow"><ArrowRight /></el-icon>
          </button>
        </div>
      </div>

      <button class="settings-row danger-row" type="button" @click="emit('reset')">
        <span class="settings-row-icon"><el-icon><Delete /></el-icon></span>
        <span class="settings-row-text">
          <strong>重置数据</strong>
          <em>清空备料、货品、订单和库存流水</em>
        </span>
        <el-icon class="settings-row-arrow"><ArrowRight /></el-icon>
      </button>
    </div>
  </van-popup>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { ArrowRight, Check, Delete, Download, RefreshLeft, Setting, Upload } from "@element-plus/icons-vue";
import type { ThemeKey, ThemeOption } from "@/config/themes";

const props = defineProps<{
  show: boolean;
  themeOptions: ThemeOption[];
  currentTheme: ThemeKey;
  currentThemeName: string;
  lastExport: string;
  recoverySummary: string;
}>();

const emit = defineEmits<{
  "update:show": [value: boolean];
  "set-theme": [theme: ThemeKey];
  export: [];
  "open-import": [];
  reset: [];
  restore: [];
}>();

const popupShow = computed({
  get: () => props.show,
  set: (value: boolean) => emit("update:show", value),
});
</script>

<style lang="scss" scoped>
.settings-section + .settings-section {
  margin-top: 20px;
}

.settings-section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
}

.settings-section-head strong {
  color: var(--text-strong);
  font-size: 15px;
}

.settings-section-head span {
  color: var(--accent);
  font-size: 12px;
  font-weight: 600;
}

.settings-section-head span.muted {
  color: var(--text-subtle);
  font-weight: 400;
}

.theme-options {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.theme-option {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-width: 0;
  padding: 8px 8px 10px;
  border: 1.5px solid var(--divider);
  border-radius: 16px;
  background: var(--surface);
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.theme-option.active {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-ring);
}

.theme-preview {
  position: relative;
  display: block;
  width: 100%;
  height: 54px;
  border-radius: 10px;
}

.theme-check {
  position: absolute;
  right: 6px;
  bottom: 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #ffffff;
  color: var(--accent);
  font-size: 12px;
  opacity: 0;
  transform: scale(0.6);
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.theme-option.active .theme-check {
  opacity: 1;
  transform: scale(1);
}

.theme-option strong {
  margin: 8px 2px 0;
  color: var(--text-strong);
  font-size: 14px;
}

.theme-option em {
  margin: 2px 2px 0;
  color: var(--text-muted);
  font-size: 11px;
  font-style: normal;
}

.settings-list {
  overflow: hidden;
  border-radius: 16px;
  background: var(--surface-soft);
}

.settings-row {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 14px;
  border: 0;
  background: transparent;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.settings-list .settings-row + .settings-row {
  border-top: 1px solid var(--divider);
}

.settings-row:active {
  background: var(--surface-muted);
}

.settings-row-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 38px;
  height: 38px;
  border-radius: 12px;
  background: var(--surface);
  color: var(--accent);
  font-size: 18px;
  box-shadow: 0 1px 3px rgba(20, 40, 60, 0.06);
}

.settings-row-text {
  flex: 1;
  min-width: 0;
}

.settings-row-text strong,
.settings-row-text em {
  display: block;
}

.settings-row-text strong {
  color: var(--text-strong);
  font-size: 14px;
}

.settings-row-text em {
  margin-top: 3px;
  overflow: hidden;
  color: var(--text-muted);
  font-size: 12px;
  font-style: normal;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.settings-row-arrow {
  flex: 0 0 auto;
  color: var(--text-subtle);
}

.danger-row {
  margin-top: 12px;
  border-radius: 16px;
  background: var(--danger-bg);
}

.danger-row .settings-row-icon {
  color: var(--danger-text);
}

.danger-row .settings-row-text strong {
  color: var(--danger-text);
}
</style>
