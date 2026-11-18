<template>
  <p v-if="!groups.length" class="material-empty">
    还没有备料，点右上角「＋」添加
  </p>

  <div v-for="group in openGroups" :key="group.key" class="material-group">
    <div class="material-list">
      <SwipeRow
        v-for="item in group.items"
        :key="item.id"
        :label="item.name"
        :actions="rowActions(item)"
      >
        <div class="material-item" :class="'is-' + group.key">
          <button class="material-main" type="button" :aria-label="'编辑' + item.name" @click="emit('edit', item)">
            <span class="material-title">
              <b>{{ item.name }}</b>
              <span v-if="item.unitCost !== undefined" class="material-cost">{{ formatMoney(item.unitCost) }}</span>
            </span>
            <small class="material-related">{{ relatedSummary(item.id) }}</small>
          </button>
          <span class="material-stock">
            <strong>{{ item.num }}</strong>
            <small>{{ group.title }}</small>
          </span>
          <button class="material-restock" type="button" :aria-label="'为' + item.name + '补货'" @click="emit('restock', item)">补货</button>
        </div>
      </SwipeRow>
    </div>
  </div>

  <details v-if="foldedGroups.length" class="material-group">
    <summary class="material-group-summary">
      <span>其他备料 · {{ foldedCount }}</span>
      <el-icon class="summary-arrow"><ArrowDown /></el-icon>
    </summary>
    <section v-for="group in foldedGroups" :key="group.key" class="material-subgroup">
      <h4 class="material-subgroup-title">
        <i class="group-dot" :class="'dot-' + group.key"></i>{{ group.title }} · {{ group.items.length }}
      </h4>
      <div class="material-list">
        <SwipeRow
          v-for="item in group.items"
          :key="item.id"
          :label="item.name"
          :actions="rowActions(item)"
        >
          <div class="material-item" :class="'is-' + group.key">
            <button class="material-main" type="button" :aria-label="'编辑' + item.name" @click="emit('edit', item)">
              <span class="material-title">
                <b>{{ item.name }}</b>
                <span v-if="item.unitCost !== undefined" class="material-cost">{{ formatMoney(item.unitCost) }}</span>
              </span>
              <small class="material-related">{{ relatedSummary(item.id) }}</small>
            </button>
            <span class="material-stock">
              <strong>{{ item.num }}</strong>
              <small>库存</small>
            </span>
            <button class="material-restock" type="button" :aria-label="'为' + item.name + '补货'" @click="emit('restock', item)">补货</button>
          </div>
        </SwipeRow>
      </div>
    </section>
  </details>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { ArrowDown, Delete, Tickets } from "@element-plus/icons-vue";
import SwipeRow from "@/components/SwipeRow.vue";
import { formatMoney } from "@/utils/stockData";
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
  relatedSummary: (materialId: string) => string;
}>();

const emit = defineEmits<{
  edit: [item: Material];
  remove: [id: string];
  restock: [item: Material];
  history: [item: Material];
}>();

const groups = computed(() => {
  const visible = [...props.materials]
    .sort((a, b) => a.name.localeCompare(b.name));
  return GROUPS
    .map((group) => ({ ...group, items: visible.filter((item) => props.groupKey(item) === group.key) }))
    .filter((group) => group.items.length);
});
const openGroups = computed(() => groups.value.filter((group) => !group.folded));
const foldedGroups = computed(() => groups.value.filter((group) => group.folded));
const foldedCount = computed(() => foldedGroups.value.reduce((sum, group) => sum + group.items.length, 0));

function rowActions(item: Material) {
  return [
    { name: "流水", icon: Tickets, callback: () => emit("history", item) },
    { name: "删除", icon: Delete, tone: "danger" as const, callback: () => emit("remove", item.id) },
  ];
}
</script>

<style lang="scss" scoped>
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

.material-subgroup {
  margin-bottom: 4px;
}

.material-subgroup + .material-subgroup {
  margin-top: 14px;
}

.material-subgroup-title {
  margin: 2px 4px 8px;
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 600;
}

.material-list {
  display: grid;
  gap: 8px;
}

.material-item {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 56px;
  padding: 8px 10px 8px 14px;
  border-radius: 14px;
  background: var(--surface-soft);
}

.material-main {
  display: grid;
  flex: 1;
  gap: 3px;
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

.is-warning .material-stock strong,
.is-warning .material-stock small {
  color: var(--warning-text);
}

.is-danger .material-stock strong,
.is-danger .material-stock small {
  color: var(--danger-text);
}

.is-warning .material-stock small,
.is-danger .material-stock small {
  font-weight: 600;
}

.material-related {
  overflow: hidden;
  color: var(--text-subtle);
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.material-cost {
  flex-shrink: 0;
  padding: 1px 6px;
  border-radius: 6px;
  background: rgba(32, 55, 71, 0.06);
  color: var(--text-main);
  font-size: 11px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  line-height: 18px;
}

.material-stock {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
  min-width: 32px;
  line-height: 1.1;
}

.material-stock strong {
  color: var(--accent-strong);
  font-size: 18px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.material-stock small {
  margin-top: 2px;
  color: var(--text-muted);
  font-size: 11px;
}

.material-restock {
  flex-shrink: 0;
  height: 30px;
  padding: 0 12px;
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
