<template>
  <van-popup v-model:show="popupShow" position="bottom" round closeable destroy-on-close>
    <div class="popup-body stock-history">
      <div class="popup-head">
        <div>
          <h3>{{ name }}的库存流水</h3>
          <p>当前库存 {{ balance }}</p>
        </div>
      </div>
      <p v-if="!movements.length" class="history-empty">暂无流水。新的库存变动会在这里记录。</p>
      <ol v-else class="history-list">
        <li v-for="item in movements.slice(0, limit)" :key="item.id">
          <div>
            <strong>{{ stockMovementLabels[item.reason] }}</strong>
            <small>{{ dayjs(item.timestamp).format("YYYY-MM-DD HH:mm") }}</small>
            <small v-if="item.orderTitle">{{ item.orderTitle }}</small>
          </div>
          <div class="history-amount">
            <strong :class="{ increase: item.delta > 0 }">{{ item.delta > 0 ? "+" : "" }}{{ item.delta }}</strong>
            <small>变动后 {{ item.balance }}</small>
          </div>
        </li>
      </ol>
      <el-button v-if="movements.length > limit" class="history-load" @click="limit += 30">加载更多</el-button>
    </div>
  </van-popup>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import dayjs from "dayjs";
import { stockMovementLabels, type StockMovement } from "@/types/stock";

const props = defineProps<{ show: boolean; name: string; balance: number; movements: StockMovement[] }>();
const emit = defineEmits<{ "update:show": [value: boolean] }>();
const popupShow = computed({ get: () => props.show, set: (show) => emit("update:show", show) });
const limit = ref(30);
watch(() => props.show, (show) => { if (show) limit.value = 30; });
</script>

<style scoped>
.stock-history .popup-head { padding-right: 24px; }

.history-list {
  display: grid;
  gap: 8px;
  margin: 14px 0 0;
  padding: 0;
  list-style: none;
}

.history-list li {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  background: var(--surface-soft);
  color: var(--text-main);
  overflow-wrap: anywhere;
}

.history-list small {
  display: block;
  color: var(--text-muted);
}

.history-amount {
  flex-shrink: 0;
  text-align: right;
}

.history-amount strong { color: var(--danger-text); }
.history-amount .increase { color: var(--accent-strong); }
.history-empty { color: var(--text-muted); }
.history-load { margin-top: 12px; }
</style>
