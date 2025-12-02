<script setup lang="ts">
import {ref, watch} from "vue";
import type {RSA} from "otb-toolkit/src/types/index.ts";
import dayjs from 'dayjs'

const startDateDisplay = ref();
const endDateDisplay = ref();
const showStartPicker = ref(false);
const showEndPicker = ref(false);
const startDate = ref(dayjs().startOf("day").format("YYYY-MM-DD").split("-"));
const endDate = ref(dayjs().endOf("day").format("YYYY-MM-DD").split("-"));

// 确认选择开始日期
const onConfirmStartDate = (value: RSA) => {
  startDate.value = value.selectedValues;
  startDateDisplay.value = value.selectedValues.join("-");
  showStartPicker.value = false;
  setterDate();
};
// 确认选择结束日期
const onConfirmEndDate = (value: RSA) => {
  endDate.value = value.selectedValues;
  endDateDisplay.value = value.selectedValues.join("-");
  showEndPicker.value = false;
  setterDate();
};
const emit = defineEmits(['dateChange'])
const setterDate = () => {
  if (startDateDisplay.value && endDateDisplay.value) {
    if (startDateDisplay.value > endDateDisplay.value) {
      [startDate.value, endDate.value] = [endDate.value, startDate.value];
      [startDateDisplay.value, endDateDisplay.value] = [endDateDisplay.value, startDateDisplay.value];
    }
  }
  emit('dateChange', [startDateDisplay.value, endDateDisplay.value]);
};

// props 默认值
export interface FormProps {
  defaultDate?: string[];
  clearable?: boolean;
}

const props = withDefaults(defineProps<FormProps>(), {
  clearable: false,
})

watch(() => props.defaultDate, () => {
  const {defaultDate} = props
  if (defaultDate && defaultDate.length === 2) {
    startDate.value = (defaultDate[0] || dayjs().startOf("day").format("YYYY-MM-DD")).split("-");
    endDate.value = (defaultDate[1] || dayjs().startOf("day").format("YYYY-MM-DD")).split("-");
    startDateDisplay.value = defaultDate[0];
    endDateDisplay.value = defaultDate[1];
  }
}, {immediate: true})

const clearStratValue = () => {
  startDate.value = dayjs().startOf("day").format("YYYY-MM-DD").split("-");
  startDateDisplay.value = "";
  setterDate();
};
const clearEndValue = () => {
  endDate.value = dayjs().endOf("day").format("YYYY-MM-DD").split("-");
  endDateDisplay.value = "";
  setterDate();
};
</script>

<template>
  <div class="PX12">
    <!-- 开始日期选择 -->
    <van-field
      readonly
      clickable
      v-model="startDateDisplay"
      label="开始日期"
      placeholder="开始日期"
      :right-icon="clearable && startDateDisplay ? 'cross' : ''"
      @click-input="showStartPicker = true"
      @click-right-icon="clearStratValue"
    />
    <van-popup v-model:show="showStartPicker" position="bottom">
      <van-date-picker
        v-model="startDate"
        @confirm="onConfirmStartDate"
        @cancel="showStartPicker = false"
      />
    </van-popup>

    <!-- 结束日期选择 -->
    <van-field
      readonly
      clickable
      v-model="endDateDisplay"
      label="结束日期"
      placeholder="结束日期"
      :right-icon="clearable && endDateDisplay ? 'cross' : ''"
      @click-input="showEndPicker = true"
      @click-right-icon="clearEndValue"
    />
    <van-popup v-model:show="showEndPicker" position="bottom">
      <van-date-picker
        v-model="endDate"
        @confirm="onConfirmEndDate"
        @cancel="showEndPicker = false"
      />
    </van-popup>
  </div>
</template>

<style scoped lang="scss">
.van-field {
  margin-bottom: 10px;
  background: #f7f8fa;
  border-radius: 8px;
}
</style>