<template>
  <van-popup v-model:show="popupShow" position="bottom" round destroy-on-close>
    <div class="popup-body manage-popup-body">
      <div class="popup-head MB12">
        <div class="popup-title">
          <span class="popup-icon"><el-icon><Box /></el-icon></span>
          <div>
            <h3>备料管理</h3>
            <p>{{ description }}</p>
          </div>
        </div>
      </div>

      <el-input v-model="search" class="manage-search" placeholder="搜索备料名称" aria-label="搜索备料名称" :prefix-icon="Search" clearable />
      <div class="manage-list-scroll">
        <div v-if="!visibleGroups.length" class="manage-empty">
          <span class="empty-icon"><el-icon><component :is="search.trim() ? Search : Box" /></el-icon></span>
          <strong>{{ search.trim() ? "没有匹配的备料" : "还没有备料" }}</strong>
          <span v-if="!search.trim()">点首页的「＋备料」录入。</span>
        </div>

        <section
          v-else
          v-for="group in visibleGroups"
          :key="group.key"
          class="material-group"
          :class="{ collapsed: group.collapsed }"
        >
          <div v-if="search.trim()" class="material-group-label">{{ group.title }} · {{ group.items.length }}项</div>
          <button v-else class="material-group-head" type="button" @click="emit('toggle-group', group.key)">
            <span class="group-dot" :class="`dot-${group.key}`"></span>
            <span>{{ group.title }}</span>
            <small>{{ group.items.length }}项</small>
          </button>

          <div v-if="!group.collapsed" class="material-group-list">
            <SwipeRow
              v-for="item in group.items"
              :key="item.id"
              :label="item.name"
              :actions="[
                { name: '流水', icon: Tickets, callback: () => emit('history', item) },
                { name: '删除', icon: Delete, tone: 'danger', callback: () => emit('remove', item.id) },
              ]"
            >
            <div class="record-row">
              <button class="material-row record-edit" :class="materialStatusClass(item)" type="button" @click="emit('edit', item)">
                <span class="material-info">
                  <span class="material-title-row">
                    <strong>{{ item.name }}</strong>
                    <span class="material-status" :class="materialStatusClass(item)">
                      {{ materialStatusText(item) }}
                    </span>
                  </span>
                  <small>{{ materialRelatedSummary(item.id) }}</small>
                </span>

                <span class="material-metrics">
                  <span class="material-metric">
                    <span>{{ item.num }}</span>
                    <small>库存</small>
                  </span>
                  <span class="material-metric">
                    <strong>{{ materialCraftableCount(item.id) }}</strong>
                    <small>可制</small>
                  </span>
                </span>
              </button>
              <button class="pill-button record-quick-action" type="button" :aria-label="`为${item.name}补货`" @click="emit('restock', item)">补货</button>
            </div>
            </SwipeRow>
          </div>
        </section>
      </div>
    </div>
  </van-popup>
</template>

<script lang="ts" setup>
import { computed, ref } from "vue";
import SwipeRow from "@/components/SwipeRow.vue";
import { Box, Delete, Search, Tickets } from "@element-plus/icons-vue";
import type { Material, MaterialGroupKey } from "@/types/stock";

interface MaterialManageGroup {
  key: MaterialGroupKey;
  title: string;
  collapsed: boolean;
  items: Material[];
}

const props = defineProps<{
  show: boolean;
  description: string;
  groups: MaterialManageGroup[];
  materialStatusClass: (item: Material) => string;
  materialStatusText: (item: Material) => string;
  materialRelatedSummary: (materialId: string) => string;
  materialCraftableCount: (materialId: string) => number;
}>();

const emit = defineEmits<{
  "update:show": [value: boolean];
  "toggle-group": [key: MaterialGroupKey];
  edit: [item: Material];
  remove: [id: string];
  restock: [item: Material];
  history: [item: Material];
}>();

const search = ref("");
const visibleGroups = computed(() => {
  const query = search.value.trim().toLowerCase();
  if (!query) return props.groups;
  return props.groups.map((group) => ({
    ...group,
    collapsed: false,
    items: group.items.filter((item) => item.name.toLowerCase().includes(query)),
  })).filter((group) => group.items.length);
});

const popupShow = computed({
  get: () => props.show,
  set: (value: boolean) => emit("update:show", value),
});
</script>

<style lang="scss" scoped>
.manage-popup-body .material-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px 12px;
  align-items: center;
  padding: 14px 4px 14px 14px;
  border-radius: 14px;
  background: transparent;
}

.material-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.material-group-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 2px 4px;
  border: 0;
  background: transparent;
  color: var(--text-main);
  font-size: 14px;
  font-weight: 700;
  text-align: left;
}

.material-group-head::after {
  content: "收起";
  color: var(--text-muted);
  font-size: 11px;
  font-weight: 600;
}

.material-group.collapsed .material-group-head::after {
  content: "展开";
}

.group-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--text-subtle);
}

.group-dot.dot-danger { background: var(--danger-text); }
.group-dot.dot-warning { background: var(--warning-text); }
.group-dot.dot-safe { background: var(--accent); }

.material-group-head {
  justify-content: flex-start !important;
  padding: 4px 4px 0 !important;
  font-size: 13px !important;
}

.material-group-head small {
  margin-left: auto;
  color: var(--text-subtle);
  font-size: 12px;
  font-weight: 600;
}

.material-group-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.material-group-label {
  color: var(--text-main);
  font-weight: 600;
}

.material-title-row {
  flex-wrap: wrap;
  overflow-wrap: anywhere;
}

.material-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.material-info strong {
  display: block;
  color: var(--text-strong);
  font-size: 15px;
  line-height: 1.2;
}

.material-info small {
  display: block;
  margin-top: 4px;
  color: var(--text-subtle);
  font-size: 12px;
}

.material-status {
  display: inline-flex;
  align-items: center;
  width: fit-content;
  padding: 3px 8px;
  border-radius: 999px;
  background: var(--surface-muted);
  flex: 0 0 auto;
  font-size: 12px;
}

.material-status.status-safe {
  color: var(--accent);
  background: var(--header-icon-bg);
}

.material-status.status-warning {
  color: var(--warning-text);
  background: var(--warning-bg);
}

.material-status.status-danger {
  color: var(--danger-text);
  background: var(--danger-bg);
}

.material-status.status-unlinked {
  color: var(--text-muted);
  background: var(--surface-muted);
}

.material-metrics {
  display: flex;
  align-items: center;
  gap: 8px;
}

.material-metric {
  min-width: 48px;
  text-align: center;
}

.material-metric span,
.material-metric strong,
.material-metric small {
  display: block;
}

.material-metric span,
.material-metric strong {
  color: var(--text-strong);
  font-size: 18px;
  font-variant-numeric: tabular-nums;
  font-weight: 700;
  line-height: 1;
}

.material-metric small {
  margin-top: 3px;
  color: var(--text-subtle);
  font-size: 11px;
}

.material-metric:last-child span,
.material-metric:last-child strong {
  color: var(--accent-strong);
}

.material-metrics {
  padding-left: 12px;
  border-left: 1px solid var(--divider);
}

@media (max-width: 420px) {
  .material-metrics {
    gap: 4px;
    padding-left: 6px;
  }

  .material-metric {
    min-width: 34px;
  }
}
</style>
