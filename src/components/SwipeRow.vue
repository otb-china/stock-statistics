<template>
  <div
    class="swipe-row"
    :class="{ open: offset !== 0, dragging, armed }"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="onPointerUp"
    @click.capture="onClickCapture"
  >
    <div
      ref="actionsRef"
      class="swipe-actions"
      :style="triggerMode && offset < 0 ? { minWidth: `${-offset}px` } : undefined"
      :aria-hidden="offset === 0"
    >
      <button
        v-for="action in actions"
        :key="action.name"
        class="swipe-action"
        :class="action.tone ?? 'default'"
        type="button"
        :tabindex="offset === 0 ? -1 : 0"
        :aria-label="label + action.name"
        @click.stop="runAction(action)"
      >
        <el-icon v-if="action.icon"><component :is="action.icon" /></el-icon>
        <span>{{ action.name }}</span>
      </button>
    </div>
    <div class="swipe-content" :style="{ transform: offset ? `translateX(${offset}px)` : undefined }">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, type Component } from "vue";

export interface SwipeAction {
  name: string;
  icon?: Component;
  tone?: "default" | "warning" | "danger";
  callback: () => void;
}

const props = defineProps<{
  label: string;
  actions: SwipeAction[];
  swipeToTrigger?: boolean;
}>();

const DECIDE_DISTANCE = 8;

const actionsRef = ref<HTMLElement>();
const offset = ref(0);
const dragging = ref(false);
const armed = ref(false);
const triggerMode = computed(() => props.swipeToTrigger && props.actions.length === 1);

let startX = 0;
let startY = 0;
let startOffset = 0;
let startTime = 0;
let tracking = false;
let horizontal = false;
let moved = false;
let pointerId = -1;
let lastX = 0;
let movingRight = false;

let activeClose: (() => void) | null = null;

function actionsWidth() {
  return actionsRef.value?.offsetWidth ?? 0;
}

function rowWidth() {
  return actionsRef.value?.parentElement?.offsetWidth ?? 0;
}

function close() {
  offset.value = 0;
  document.removeEventListener("pointerdown", onOutsidePointer, true);
  if (activeClose === close) activeClose = null;
}

function open() {
  if (activeClose && activeClose !== close) activeClose();
  activeClose = close;
  offset.value = -actionsWidth();
  document.addEventListener("pointerdown", onOutsidePointer, true);
}

function onOutsidePointer(event: PointerEvent) {
  const root = actionsRef.value?.parentElement;
  if (root && !root.contains(event.target as Node)) close();
}

function onPointerDown(event: PointerEvent) {
  if (event.button !== 0 || (event.target as HTMLElement).closest(".swipe-actions")) return;
  tracking = true;
  horizontal = false;
  moved = false;
  pointerId = event.pointerId;
  startX = event.clientX;
  startY = event.clientY;
  startOffset = offset.value;
  startTime = Date.now();
}

function onPointerMove(event: PointerEvent) {
  if (!tracking || event.pointerId !== pointerId) return;
  const deltaX = event.clientX - startX;
  const deltaY = event.clientY - startY;

  if (!horizontal) {
    if (Math.abs(deltaX) < DECIDE_DISTANCE && Math.abs(deltaY) < DECIDE_DISTANCE) return;
    if (Math.abs(deltaY) >= Math.abs(deltaX)) {
      tracking = false;
      return;
    }
    horizontal = true;
    moved = true;
    dragging.value = true;
    startX = event.clientX;
    lastX = event.clientX;
    movingRight = false;
    (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
  }

  if (event.clientX !== lastX) movingRight = event.clientX > lastX;
  lastX = event.clientX;

  let next = startOffset + (event.clientX - startX);
  if (next > 0) next = next * 0.25;

  if (triggerMode.value) {
    const width = rowWidth();
    next = Math.max(next, -width);
    offset.value = next;
    armed.value = !movingRight && next < -width / 2;
    return;
  }

  const width = actionsWidth();
  if (next < -width) next = -width + (next + width) * 0.25;
  offset.value = next;
}

function onPointerUp(event: PointerEvent) {
  if (!tracking || event.pointerId !== pointerId) return;
  tracking = false;
  if (!horizontal) return;
  dragging.value = false;

  if (triggerMode.value) {
    const shouldTrigger = armed.value;
    armed.value = false;
    if (shouldTrigger) runAction(props.actions[0]);
    else close();
    return;
  }

  const width = actionsWidth();
  const velocity = (offset.value - startOffset) / Math.max(1, Date.now() - startTime);
  const shouldOpen = velocity < -0.4 || (velocity <= 0.4 && offset.value < -width / 2);
  if (shouldOpen) open();
  else close();
}

function onClickCapture(event: MouseEvent) {
  if ((event.target as HTMLElement).closest(".swipe-actions")) return;
  if (moved || offset.value !== 0) {
    event.preventDefault();
    event.stopPropagation();
    moved = false;
    if (offset.value !== 0) close();
  }
}

function runAction(action: SwipeAction) {
  close();
  action.callback();
}

onBeforeUnmount(close);
</script>

<style scoped>
.swipe-row {
  position: relative;
  overflow: hidden;
  border-radius: 14px;
  touch-action: pan-y;
  user-select: none;
  -webkit-user-select: none;
}

.swipe-actions {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: stretch;
  gap: 6px;
  padding: 6px 4px 6px 8px;
}

.swipe-action {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  min-width: 60px;
  padding: 0 8px;
  border: 0;
  border-radius: 12px;
  color: #ffffff;
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
  transition: transform 0.15s ease, filter 0.15s ease;
  -webkit-tap-highlight-color: transparent;
}

.swipe-actions .swipe-action {
  flex: 1;
  transition: transform 0.15s ease, filter 0.15s ease, background-color 0.15s ease;
}

.armed .swipe-action {
  filter: brightness(0.9);
}

.armed .swipe-action .el-icon {
  transform: scale(1.15);
}

.swipe-action .el-icon {
  transition: transform 0.15s ease;
}

.swipe-action:active {
  transform: scale(0.95);
  filter: brightness(0.94);
}

.swipe-action .el-icon {
  font-size: 18px;
}

.swipe-action.default {
  background: var(--accent, #1f6b7b);
}

.swipe-action.warning {
  background: #e0a03a;
}

.swipe-action.danger {
  background: #e05252;
}

.swipe-content {
  position: relative;
  z-index: 1;
  background: var(--surface, #ffffff);
  transition: transform 0.28s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.dragging .swipe-content {
  transition: none;
  will-change: transform;
}
</style>
