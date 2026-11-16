<template>
  <van-popup v-model:show="popupShow" position="bottom" round closeable destroy-on-close>
    <div class="popup-body stock-history">
      <div class="popup-head">
        <div class="popup-title">
          <span class="popup-icon"><el-icon><Tickets /></el-icon></span>
          <div>
            <h3>库存流水</h3>
            <p>{{ name }}</p>
          </div>
        </div>
      </div>

      <div class="balance-card">
        <span>当前库存</span>
        <strong>{{ balance }}</strong>
        <small>共 {{ movements.length }} 条记录</small>
      </div>

      <div v-if="!movements.length" class="manage-empty history-empty">
        <span class="empty-icon"><el-icon><Tickets /></el-icon></span>
        <strong>暂无流水</strong>
        <span>新的库存变动会在这里记录。</span>
      </div>
      <ol v-else class="history-list">
        <li v-for="item in movements.slice(0, limit)" :key="item.id">
          <span class="history-dot" :class="{ increase: item.delta > 0 }"></span>
          <div class="history-main">
            <strong>{{ stockMovementLabels[item.reason] }}<em v-if="item.orderTitle"> · {{ item.orderTitle }}</em></strong>
            <small>{{ dayjs(item.timestamp).format("YYYY-MM-DD HH:mm") }}</small>
          </div>
          <div class="history-amount">
            <strong :class="{ increase: item.delta > 0 }">{{ item.delta > 0 ? "+" : "" }}{{ item.delta }}</strong>
            <small>余 {{ item.balance }}</small>
          </div>
        </li>
      </ol>
      <button v-if="movements.length > limit" class="history-load" type="button" @click="limit += 30">加载更多</button>
    </div>
  </van-popup>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import dayjs from "dayjs";
import { Tickets } from "@element-plus/icons-vue";
import { stockMovementLabels, type StockMovement } from "@/types/stock";

const props = defineProps<{ show: boolean; name: string; balance: number; movements: StockMovement[] }>();
const emit = defineEmits<{ "update:show": [value: boolean] }>();
const popupShow = computed({ get: () => props.show, set: (show) => emit("update:show", show) });
const limit = ref(30);
watch(() => props.show, (show) => { if (show) limit.value = 30; });
</script>

<style scoped>
.stock-history .popup-head { padding-right: 40px; }

.balance-card {
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding: 14px 16px;
  border-radius: 16px;
  background: var(--stat-income-bg);
  color: var(--stat-income-text);
}

.balance-card span { font-size: 13px; opacity: 0.85; }
.balance-card strong { font-size: 26px; font-variant-numeric: tabular-nums; }
.balance-card small { margin-left: auto; font-size: 12px; opacity: 0.8; }

.history-empty { min-height: 180px; margin-top: 14px; }

.history-list {
  position: relative;
  margin: 14px 0 0;
  padding: 0;
  list-style: none;
}

.history-list li {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0 12px 22px;
  color: var(--text-main);
}

.history-list li + li { border-top: 1px solid var(--divider); }

.history-list li::before {
  content: "";
  position: absolute;
  top: 0;
  bottom: 0;
  left: 4px;
  width: 2px;
  background: var(--surface-muted);
}

.history-list li:first-child::before { top: 50%; }
.history-list li:last-child::before { bottom: 50%; }

.history-dot {
  position: absolute;
  top: 50%;
  left: 0;
  z-index: 1;
  width: 10px;
  height: 10px;
  border: 2px solid var(--surface);
  border-radius: 50%;
  background: var(--danger-text);
  transform: translateY(-50%);
  box-sizing: border-box;
}

.history-dot.increase { background: var(--accent); }

.history-main { flex: 1; min-width: 0; }

.history-main strong {
  display: block;
  overflow: hidden;
  color: var(--text-strong);
  font-size: 14px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-main em { color: var(--text-muted); font-style: normal; font-weight: 400; }

.history-list small {
  display: block;
  margin-top: 3px;
  color: var(--text-muted);
  font-size: 12px;
}

.history-amount { flex-shrink: 0; text-align: right; }
.history-amount strong { color: var(--danger-text); font-size: 16px; font-variant-numeric: tabular-nums; }
.history-amount .increase { color: var(--accent-strong); }

.history-load {
  width: 100%;
  margin-top: 8px;
  padding: 11px;
  border: 0;
  border-radius: 12px;
  background: var(--surface-soft);
  color: var(--accent-strong);
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}
</style>
