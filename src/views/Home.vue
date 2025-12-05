<template>
  <div style="padding: 2%">
    <div class="flex-wrap">
      <div
        class="shadow BR5"
        v-for="item in data" :key="item.index"
        :style="Style(item)"
        style="width: 44%;margin: 1%;padding: 2%"
      >
        <h4 class="back-gauge">{{ item.name }}</h4>
        <el-input-number class="MT6 W100" :disabled="!save" v-model="item.num" :min="0" :max="10000"/>
        <el-input-number class="MT6 W100" v-if="save" v-model="item.warnNum" :min="0" :max="10000"/>
      </div>
    </div>

    <el-button style="width: 98%;margin:20px 1%" size="large" :type="save ? 'primary' : 'success'" @click="saveData">
      {{ save ? "保存" : "调整" }}
    </el-button>

    <div class="shadow" style="margin: 1%">
      <van-cell-group>
        <van-cell :value="`合计 ${SumMoney}`">
          <template #title>
            <el-button size="small" type="primary" plain @click="orderInfo.show = true">新增</el-button>
          </template>
        </van-cell>

        <van-swipe-cell v-for="(item,index) in orderInfo.data" :key="index">
          <van-cell
            :title="`${orderInfo.data.length-index}: 版本 ${item.title}`"
            :label="item.orderDate"
            :value="`收入 ${item.value}`"
          />
          <template #right>
            <van-button square type="primary" style="height: 100%" text="编辑" @click="beforeUpd(item,index)"/>
            <van-button square type="danger" style="height: 100%" text="删除" @click="del(index)"/>
          </template>
        </van-swipe-cell>
      </van-cell-group>
    </div>
  </div>

  <div style="height: 25vh"/>

  <van-popup v-model:show="orderInfo.show" position="bottom" destroy-on-close>
    <div class="P24">
      <el-radio-group v-model="orderInfo.form.title" class="MB15">
        <el-radio-button label="2.0" value="2.0"/>
        <el-radio-button label="2.1" value="2.1"/>
        <el-radio-button label="2.2" value="2.2"/>
        <el-radio-button label="3.0" value="3.0"/>
        <el-radio-button label="3.1" value="3.1"/>
      </el-radio-group>
      <van-field v-model="orderInfo.form.value" type="digit" placeholder="收入" clearable/>
      <date-picker class="MT15" placeholder="下单日期" :default-date="orderInfo.form.orderDate"
                   @date-change="setOrderDate"/>
      <el-switch v-if="orderInfo.type === 'add'" v-model="calculation" active-text="计算备料" class="MT15"/>

      <el-button
        type="primary"
        size="large"
        style="width: 100%"
        @click="orderSubmit"
        class="MT50"
        :disabled="!(orderInfo.form.title && orderInfo.form.value)"
      >
        提交
      </el-button>
    </div>
  </van-popup>
</template>

<script lang="ts" setup>
import {computed, ref} from "vue";
import type {RSA} from "otb-toolkit/src/types";
import {LStorage} from "@/utils/localStorage.ts";
import DatePicker from "@/components/Date.vue";
import dayjs from "dayjs";

// 是否编辑备料
const save = ref(false);
// 备料数据
const data = ref([] as RSA[]);

// 订单
interface Order {
  title: string;
  value: number;
  orderDate: string;
}

const orderInfo = ref({
  type: "add" as "add" | "upd",
  show: false,
  form: {
    title: "2.2",
    value: 60,
    orderDate: dayjs(new Date()).format("YYYY-MM-DD")
  } as Order,
  data: [] as Order[],
  index: 0,
});
const setOrderDate = (date: string) => {
  orderInfo.value.form.orderDate = date;
};
// 合计金额
const SumMoney = computed(() => {
  return orderInfo.value.data.reduce((total, item) => total + Number(item.value), 0)
})
// 备料预警样式
const Style = computed(() => {
  return (item: RSA) => {
    if (item.num === 0) return {backgroundColor: "#E47471", color: "#ffffff"};
    if (item.num > 0 && item.num <= item.warnNum) return {backgroundColor: "#DCA551", color: "#ffffff"};
    return {};
  };
})
// 保存备料数据
const saveData = () => {
  if (save.value) LStorage.data.setter(data.value);
  save.value = !save.value;
};
// 是否计算备料
const calculation = ref(true);
// 新增/编辑
const orderSubmit = () => {
  const type = orderInfo.value.type;
  if (type === "add") {
    // 计入备料
    if (calculation.value) {
      if (orderInfo.value.form.title === "2.2") {
        data.value.forEach((item: RSA) => {
          if (item.name === "风扇") item.num -= 1;
          if (item.name === "塑料盒") item.num -= 2;
          if (item.name === "钢丝软管") item.num -= 2;
          if (item.name === "直法兰") item.num -= 1;
        })
      }
      if (orderInfo.value.form.title === "3.0") {
        data.value.forEach((item: RSA) => {
          if (item.name === "风扇") item.num -= 1;
          if (item.name === "塑料盒") item.num -= 1;
          if (item.name === "直法兰") item.num -= 1;
          if (item.name === "花瓶") item.num -= 1;
          if (item.name === "90度弯头") item.num -= 3;
          if (item.name === "45度弯头") item.num -= 1;
          if (item.name === "50管") item.num -= 1;
          if (item.name === "内50软管") item.num -= 1;
          if (item.name === "6型号盖") item.num -= 1;
        })
      }

      LStorage.data.setter(data.value);
    }

    orderInfo.value.data.unshift(orderInfo.value.form);
  }
  if (type === "upd") {
    const index = orderInfo.value.index
    if (index >= 0) orderInfo.value.data.splice(index, 1, orderInfo.value.form);
  }

  orderInfo.value.show = false;
  LStorage.orderData.setter(orderInfo.value.data);
  orderInfo.value.form = {
    title: "2.2",
    value: 60,
    orderDate: dayjs(new Date()).format("YYYY-MM-DD")
  } as Order;
}
// 预编辑
const beforeUpd = (item: Order, index: number) => {
  orderInfo.value.type = "upd"
  orderInfo.value.index = index
  orderInfo.value.form = {...item};
  orderInfo.value.show = true
};
// 删除
const del = (index: number) => {
  orderInfo.value.data.splice(index, 1);
  LStorage.orderData.setter(orderInfo.value.data);
}
// 初始化缓存数据
const init = () => {
  // 备料
  if (LStorage.data.getter()) data.value = LStorage.data.getter();
  if (!data.value.some(o => o.name === "风扇")) data.value.push({name: "风扇", num: 0, warnNum: 2})
  if (!data.value.some(o => o.name === "塑料盒")) data.value.push({name: "塑料盒", num: 0, warnNum: 5})
  if (!data.value.some(o => o.name === "钢丝软管")) data.value.push({name: "钢丝软管", num: 0, warnNum: 4})
  if (!data.value.some(o => o.name === "直法兰")) data.value.push({name: "直法兰", num: 0, warnNum: 2})
  if (!data.value.some(o => o.name === "花瓶")) data.value.push({name: "花瓶", num: 0, warnNum: 1})
  if (!data.value.some(o => o.name === "90度弯头")) data.value.push({name: "90度弯头", num: 0, warnNum: 3})
  if (!data.value.some(o => o.name === "45度弯头")) data.value.push({name: "45度弯头", num: 0, warnNum: 1})
  if (!data.value.some(o => o.name === "50管")) data.value.push({name: "50管", num: 0, warnNum: 1})
  if (!data.value.some(o => o.name === "内50软管")) data.value.push({name: "内50软管", num: 0, warnNum: 1})
  if (!data.value.some(o => o.name === "6型号盖")) data.value.push({name: "6型号盖", num: 0, warnNum: 1})
  // 订单
  if (LStorage.orderData.getter()) orderInfo.value.data = LStorage.orderData.getter();
};
init();
</script>

<style lang="scss" scoped>
.van-field {
  background: #f7f8fa;
  border-radius: 8px;
}
</style>