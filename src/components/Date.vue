<script setup lang="ts">
import {ref, watch} from "vue";
import type {RSA} from "otb-toolkit/src/types/index.ts";
import dayjs from 'dayjs'

const dateDisplay = ref();
const showPicker = ref(false);
const date = ref(dayjs(new Date()).format("YYYY-MM-DD").split("-"));
const emit = defineEmits(['dateChange'])

// props 默认值
export interface FormProps {
  defaultDate?: string;
  clearable?: boolean;
  className?: string;
  placeholder?: string;
}

const props = withDefaults(defineProps<FormProps>(), {
  clearable: false,
})

// 确认选择日期
const onConfirmStartDate = (value: RSA) => {
  date.value = value.selectedValues;
  dateDisplay.value = value.selectedValues.join("-");
  showPicker.value = false;
  emit('dateChange', dateDisplay.value);
};

watch(() => props.defaultDate, () => {
  const {defaultDate} = props
  if (defaultDate) {
    date.value = (defaultDate || dayjs(new Date()).format("YYYY-MM-DD")).split("-");
    dateDisplay.value = defaultDate;
  }
}, {immediate: true})

const clearStratValue = () => {
  date.value = dayjs(new Date()).format("YYYY-MM-DD").split("-");
  dateDisplay.value = "";
};
</script>

<template>
  <div :class="className">
    <van-field
      readonly
      clickable
      v-model="dateDisplay"
      :placeholder="placeholder"
      :right-icon="clearable && dateDisplay ? 'cross' : ''"
      @click-input="showPicker = true"
      @click-right-icon="clearStratValue"
    />
    <van-popup v-model:show="showPicker" position="bottom">
      <van-date-picker
        v-model="date"
        @confirm="onConfirmStartDate"
        @cancel="showPicker = false"
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