<template>
  <van-popup v-model:show="popupShow" position="bottom" round destroy-on-close>
    <div class="popup-body manage-popup-body">
      <div class="popup-head MB12">
        <div>
          <h3>备料管理</h3>
          <p>{{ description }}</p>
        </div>
        <button class="popup-create-btn" type="button" @click="emit('create')">
          <el-icon><Plus /></el-icon>
          <span>{{ createText }}</span>
        </button>
      </div>

      <el-input v-model="search" class="manage-search" placeholder="搜索备料名称" aria-label="搜索备料名称" clearable />
      <div class="manage-list-scroll">
        <div v-if="!visibleGroups.length" class="manage-empty">
          <strong>{{ search.trim() ? "没有匹配的备料" : "还没有备料" }}</strong>
          <span v-if="!search.trim()">新增备料后，可以在货品配方里选择并计算库存。</span>
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
            <span>{{ group.title }}</span>
            <small>{{ group.items.length }}项</small>
          </button>

          <div v-if="!group.collapsed" class="material-group-list">
            <div v-for="item in group.items" :key="item.id" class="record-row">
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
              <RowActions :label="item.name" :actions="[
                { name: '补库存', callback: () => emit('restock', item) },
                { name: '库存流水', callback: () => emit('history', item) },
                { name: '删除备料', color: '#c63535', callback: () => emit('remove', item.id) },
              ]" />
            </div>
          </div>
        </section>
      </div>
    </div>
  </van-popup>
</template>

<script lang="ts" setup>
import { computed, ref } from "vue";
import RowActions from "@/components/RowActions.vue";
import { Plus } from "@element-plus/icons-vue";
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
  createText: string;
  groups: MaterialManageGroup[];
  materialStatusClass: (item: Material) => string;
  materialStatusText: (item: Material) => string;
  materialRelatedSummary: (materialId: string) => string;
  materialCraftableCount: (materialId: string) => number;
}>();

const emit = defineEmits<{
  "update:show": [value: boolean];
  create: [];
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
  padding: 12px;
  border-radius: 10px;
  background: var(--surface-soft);
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
  color: var(--text-main);
  font-size: 16px;
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
  color: var(--accent-strong);
  font-size: 18px;
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
  color: var(--text-muted);
}

@media (max-width: 720px) {
  .material-row {
    grid-template-columns: minmax(0, 1fr) auto;
  }
}
</style>
