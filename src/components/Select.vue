<script setup lang="ts">
import {computed, ref, watch} from "vue";
import type {RSA} from "otb-toolkit/src/types/index.ts";
import {type} from "otb-toolkit/src/utils/data.ts"

const emit = defineEmits(['confirm'])
const showPicker = ref(false);
const valueDisplay = ref();

const onConfirm = () => {
  showPicker.value = false;
  if (selectedItems.value.length) {
    // 单选
    if (!props.multiple) {
      valueDisplay.value = type(selectedItems.value[0]) === "String" ? selectedItems.value[0] : (selectedItems.value[0] as RSA)[props.props.text as string];
    }
    // 多选
    if (type(selectedItems.value[0]) === "String") {
      valueDisplay.value = selectedItems.value.join("，");
    }
    if (type(selectedItems.value[0]) === 'Object') {
      valueDisplay.value = selectedItems.value.map((o: any) => o[props.props.text as string]).join("，");
    }
  } else {
    valueDisplay.value = "";
  }

  let resultData = [] as string[] | RSA[];
  if (selectedItems.value.length > 0) {
    if (props.valueType === "Object") resultData = selectedItems.value;
    if (props.valueType === "String" && type(selectedItems.value[0]) === "String") resultData = selectedItems.value;
    if (props.valueType === "String" && type(selectedItems.value[0]) === "Object") resultData = selectedItems.value.map((o: any) => o[props.props.value as string]);
  }
  emit("confirm", props.multiple ? resultData : resultData[0]);
};

// props 默认值
export interface FormProps {
  props?: { text?: string, value?: string, children?: string },
  option: RSA[];
  label?: string;
  placeholder?: string;
  valueType?: 'Object' | 'String';
  multiple?: boolean;
  clearable?: boolean;
  disabled?: boolean;
  filterable?: boolean;
  inputStyle?: boolean;
  className?: string;
  defaultValue?: string | number | string[] | number[] | RSA[];
}

const props = withDefaults(defineProps<FormProps>(), {
  props: () => {
    return {text: 'text', value: 'value', children: 'children'};
  },
  valueType: 'String',
  multiple: false,
  clearable: false,
  filterable: false,
  disabled: false,
  inputStyle: true,
  className: 'PX12',
})

const selectedItems = ref([] as string[] | RSA[]);

const toggleItem = (item: any) => {
  // 单选
  if (!props.multiple) return selectedItems.value = [item];
  // 多选
  if (type(item) === "String") {
    selectedItems.value = selectedItems.value.includes(item)
      ? selectedItems.value.filter(i => i !== item)
      : [...selectedItems.value, item];
  }
  if (type(item) === 'Object') {
    selectedItems.value = selectedItems.value.some((o: any) => o[props.props.value as string] === item[props.props.value as string])
      ? selectedItems.value.filter((o: any) => o[props.props.value as string] !== item[props.props.value as string])
      : [...selectedItems.value, item];
  }
};

const Item = computed(() => {
  return (item: string | RSA, key: string) => {
    if (type(item) === "String") return item;
    return (item as RSA)[key];
  };
})
const isSelected = computed(() => {
  return (item: any) => {
    if (type(item) === "String") return selectedItems.value.includes(item);
    return selectedItems.value.some((o: any) => o[props.props.value as string] === item[props.props.value as string])
  };
})
const filterOption = computed(() => {
  return (msg: string) => {
    if (msg) {
      return props.option.filter((o: string | RSA) => {
        if (type(o) === "String" && o.indexOf(msg) !== -1) return o;
        if (type(o) === "Object" && (o as RSA)[props.props.text as string].indexOf(msg) !== -1) return o;
      });
    }
    return props.option;
  };
})

const setDefaultValue = () => {
  const {defaultValue, option} = props;
  if (defaultValue && option.length) {
    if ((type(option[0]) === "String" || type(option[0]) === "Number") && (type(defaultValue) === "String" || type(defaultValue) === "Number")) {
      selectedItems.value = [defaultValue as string];
      valueDisplay.value = selectedItems.value.join("，");
    }
    if (type(option[0]) === "Object") {
      if (type(defaultValue) === "String" || type(defaultValue) === "Number") {
        const defaultValueItem = option.find(o => o[props.props.value as string] === defaultValue);
        selectedItems.value = defaultValueItem ? [defaultValueItem] : [];
      }
      if (type(defaultValue) === "Array") {
        const res = [];
        for (let o of option) {
          for (let vo of defaultValue as any) {
            if (type(vo) === "Object") {
              if (vo[props.props.value as string] === o[props.props.value as string]) {
                res.push(o);
              }
            }
            if (type(vo) === "Number" || type(vo) === "String") {
              if (vo === o[props.props.value as string]) {
                res.push(o);
              }
            }
          }
        }
        selectedItems.value = res;
      }

      valueDisplay.value = selectedItems.value.map((o: any) => o[props.props.text as string]).join("，");
    }
  }
};

watch(() => props.option, () => setDefaultValue(), {immediate: true})

const clearValue = () => {
  selectedItems.value = [];
  valueDisplay.value = "";
  onConfirm();
};

const openPicker = () => {
  if (props.disabled) return;
  setDefaultValue();
  showPicker.value = true
};

const filterMsg = ref("");
</script>

<template>
  <div :class="className">
    <van-field
      v-if="inputStyle"
      readonly
      clickable
      v-model="valueDisplay"
      :label="label"
      :placeholder="placeholder || `请选择${label || ''}`"
      :right-icon="clearable && valueDisplay && !disabled ? 'cross' : ''"
      @click-input="openPicker"
      @click-right-icon="clearValue"
    />
    <van-button v-else size="small" type="primary" plain @click="openPicker" :disabled="disabled">选择</van-button>
    <van-popup v-model:show="showPicker" position="bottom">
      <div class="van-picker__toolbar">
        <button type="button" class="van-picker__cancel van-haptics-feedback" @click="showPicker = false">取消</button>
        <button type="button" class="van-picker__confirm van-haptics-feedback" @click="onConfirm">确认</button>
      </div>

      <div class="P12" v-if="filterable">
        <van-field
          clickable
          v-model="filterMsg"
          placeholder="筛选"
          :right-icon="clearable && filterMsg ? 'cross' : ''"
          @click-right-icon="filterMsg = ''"
        />
      </div>

      <div style="height: 280px;overflow: auto">
        <van-cell-group>
          <van-cell
            v-for="item in filterOption(filterMsg)"
            :key="Item(item,props.props.value as string)"
            :title="Item(item,props.props.text as string)"
            clickable
            @click="toggleItem(item)"
            :style="{ color:isSelected(item) ? '#5A9CF8' : '' }"
          >
            <template #right-icon>
              <van-icon name="success" v-if="isSelected(item)"/>
            </template>
          </van-cell>
        </van-cell-group>
      </div>
    </van-popup>
  </div>
</template>

<style scoped lang="scss">
.van-field {
  background: #f7f8fa;
  border-radius: 8px;
}

.van-cell {
  align-items: center;
}
</style>