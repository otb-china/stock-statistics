<template>
  <button
    class="row-actions-button"
    type="button"
    :aria-label="`${label}的更多操作`"
    :aria-expanded="show"
    @click="show = true"
  >⋯</button>
  <van-action-sheet
    v-if="show"
    v-model:show="show"
    teleport="body"
    :title="label"
    :actions="actions"
    cancel-text="取消"
    close-on-click-action
  />
</template>

<script setup lang="ts">
import { ref } from "vue";

defineProps<{
  label: string;
  actions: { name: string; color?: string; callback: () => void }[];
}>();

const show = ref(false);
</script>

<style scoped>
.row-actions-button {
  flex-shrink: 0;
  align-self: center;
  min-width: 40px;
  min-height: 40px;
  padding: 0;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--text-main);
  font: inherit;
  font-size: 20px;
  font-weight: 700;
  cursor: pointer;
}
</style>
