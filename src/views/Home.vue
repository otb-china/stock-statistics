<template>
  <div class="P12">
    <div class="flex-wrap space-between">
      <div class="shadow MB12 P12" v-for="item in data" :key="item.index" :style="Style(item)">
        <h3 class="back-gauge MB10">{{ item.name }}</h3>
        <el-input-number :readonly="!save" v-model="item.num" :min="0" :max="1000"/>
        <br>
        <el-input-number class="MT10" v-if="save" v-model="item.warnNum" :min="0" :max="1000"/>
      </div>
    </div>

    <el-button style="width: 100%" size="large" :type="save ? 'primary' : 'success'" @click="saveData">
      {{ save ? "保存" : "调整" }}
    </el-button>
  </div>
</template>

<script lang="ts" setup>
import {computed, ref} from "vue";
import type {RSA} from "otb-toolkit/src/types";
import {LStorage} from "@/utils/localStorage.ts";

const save = ref(false);

const data = ref([
  {name: "风扇", num: 0, warnNum: 2},
  {name: "塑料盒", num: 0, warnNum: 5},
  {name: "钢丝软管", num: 0, warnNum: 4},
  {name: "直法兰", num: 0, warnNum: 2},
  {name: "花瓶", num: 0, warnNum: 1},
  {name: "90度弯头", num: 0, warnNum: 3},
  {name: "45度弯头", num: 0, warnNum: 1},
  {name: "50管", num: 0, warnNum: 1},
  {name: "内50软管", num: 0, warnNum: 1},
] as RSA[]);

const Style = computed(() => {
  return (item: RSA) => {
    if (item.num === 0) return {backgroundColor: "#E47471", color: "#ffffff"};
    if (item.num > 0 && item.num <= item.warnNum) return {backgroundColor: "#DCA551", color: "#ffffff"};
    return {};
  };
})


const saveData = () => {
  if (save.value) LStorage.data.setter(data.value);
  save.value = !save.value;
};

if (LStorage.data.getter()) data.value = LStorage.data.getter();
</script>

<style lang="scss" scoped>

</style>