<template>
  <el-input
    v-if="materials.length > 3 || search"
    v-model="search"
    class="manage-search"
    placeholder="搜索备料名称"
    aria-label="搜索备料名称"
    :prefix-icon="Search"
    clearable
  />

  <p v-if="!groups.length" class="material-empty">
    {{ query ? "没有匹配的备料" : "还没有备料，点右上角「＋」添加" }}
  </p>

  <component
    :is="group.folded ? 'details' : 'div'"
    v-for="group in groups"
    :key="group.key"
    class="material-group"
    :open="group.folded && query ? true : undefined"
  >
    <summary v-if="group.folded" class="material-group-summary">
      <span><i class="group-dot" :class="'dot-' + group.key"></i>{{ group.title }} · {{ group.items.length }}</span>
      <el-icon class="summary-arrow"><ArrowDown /></el-icon>
    </summary>
    <div class="material-list">
      <SwipeRow
        v-for="item in group.items"
        :key="item.id"
        :label="item.name"
        :actions="[
          { name: '流水', icon: Tickets, callback: () => emit('history', item) },
          { name: '删除', icon: Delete, tone: 'danger', callback: () => emit('remove', item.id) },
        ]"
      >
        <div class="material-item" :class="'is-' + group.key">
          <button class="material-main" type="button" :aria-label="'编辑' + item.name" @click="emit('edit', item)">
            <span class="material-title">
              <b>{{ item.name }}</b>
              <em v-if="group.key === 'danger' || group.key === 'warning'" class="material-tag">{{ statusText(item) }}</em>
            </span>
            <small class="material-related">{{ relatedSummary(item.id) }}</small>
          </button>
          <div class="material-side">
            <span class="material-stock">库存 <strong>{{ item.num }}</strong></span>
            <button class="material-restock" type="button" :aria-label="'为' + item.name + '补货'" @click="emit('restock', item)">补货</button>
          </div>
        </div>
      </SwipeRow>
    </div>
  </component>
</template>

<script lang="ts" setup>
import { computed, ref } from "vue";
import { ArrowDown, Delete, Search, Tickets } from "@element-plus/icons-vue";
import SwipeRow from "@/components/SwipeRow.vue";
import type { Material, MaterialGroupKey } from "@/types/stock";

const GROUPS = [
  { key: "danger", title: "缺货", folded: false },
  { key: "warning", title: "预警", folded: false },
  { key: "safe", title: "库存正常", folded: true },
  { key: "unlinked", title: "未关联货品", folded: true },
] as const satisfies { key: MaterialGroupKey; title: string; folded: boolean }[];

const props = defineProps<{
  materials: Material[];
  groupKey: (item: Material) => MaterialGroupKey;
  statusText: (item: Material) => string;
  relatedSummary: (materialId: string) => string;
}>();

const emit = defineEmits<{
  edit: [item: Material];
  remove: [id: string];
  restock: [item: Material];
  history: [item: Material];
}>();

const search = ref("");
const query = computed(() => search.value.trim().toLowerCase());
const groups = computed(() => {
  const visible = props.materials
    .filter((item) => item.name.toLowerCase().includes(query.value))
    .sort((a, b) => a.name.localeCompare(b.name));
  return GROUPS
    .map((group) => ({ ...group, items: visible.filter((item) => props.groupKey(item) === group.key) }))
    .filter((group) => group.items.length);
});
</script>

<style lang="scss" scoped>
.manage-search {
  margin-bottom: 10px;
}

.material-group + .material-group {
  margin-top: 8px;
}

.material-group-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 4px;
  color: var(--text-muted);
  font-size: 13px;
  cursor: pointer;
  list-style: none;
}

.material-group-summary::-webkit-details-marker {
  display: none;
}

.group-dot {
  display: inline-block;
  width: 7px;
  height: 7px;
  margin-right: 8px;
  border-radius: 50%;
  vertical-align: middle;
}

.dot-safe {
  background: var(--accent);
}

.dot-unlinked {
  background: var(--text-subtle);
}

.summary-arrow {
  transition: transform 0.2s ease;
}

details[open] .summary-arrow {
  transform: rotate(180deg);
}

details[open] .material-list {
  margin-bottom: 4px;
}

.material-list {
  display: grid;
  gap: 8px;
}

.material-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 12px 12px 14px;
  border-radius: 14px;
  background: var(--surface-soft);
}

.material-item.is-danger {
  background: var(--danger-bg);
}

.material-item.is-warning {
  background: var(--warning-bg);
}

.material-main {
  display: grid;
  flex: 1;
  gap: 4px;
  min-width: 0;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.material-title {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.material-title b {
  overflow: hidden;
  color: var(--text-strong);
  font-size: 15px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.material-tag {
  flex-shrink: 0;
  padding: 1px 7px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.75);
  font-size: 11px;
  font-style: normal;
  font-weight: 600;
}

.is-danger .material-tag,
.is-danger .material-stock strong {
  color: var(--danger-text);
}

.is-warning .material-tag,
.is-warning .material-stock strong {
  color: var(--warning-text);
}

.material-related {
  overflow: hidden;
  color: var(--text-subtle);
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.material-side {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  flex-shrink: 0;
}

.material-stock {
  color: var(--text-muted);
  font-size: 12px;
  white-space: nowrap;
}

.material-stock strong {
  color: var(--accent-strong);
  font-size: 16px;
  font-variant-numeric: tabular-nums;
}

.material-restock {
  padding: 6px 14px;
  border: 0;
  border-radius: 999px;
  background: var(--surface);
  color: var(--accent-strong);
  box-shadow: 0 0 0 1px var(--accent-border) inset;
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.material-restock:active {
  transform: scale(0.95);
}

.material-empty {
  margin: 0;
  padding: 10px 0;
  color: var(--text-muted);
  font-size: 12px;
  text-align: center;
}
</style>
