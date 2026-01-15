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
        <div class="align-right">
          <el-tag v-if="!save" type="success" class="P6 FS16">{{ item.num }}</el-tag>

          <template v-if="save">
            <el-input-number class="MT6 W100" v-model="item.num" :min="0" :max="10000"/>
            <el-input-number class="MT6 W100" v-model="item.warnNum" :min="0" :max="10000"/>
          </template>
        </div>
      </div>
    </div>

    <div class="flex-row" style="width: 98%;margin:10px 1%" v-if="save">
      <el-button type="success" style="flex: 1" @click="copy(data,'备料')">复制备料数据</el-button>
      <el-button type="success" style="flex: 1" @click="copy(orderInfo.data,'订单')">复制订单数据</el-button>
    </div>

    <div class="flex-row" style="width: 98%;margin:10px 1%" v-if="save">
      <el-button type="primary" style="flex: 1" @click="beforeImport('备料')">导入备料数据</el-button>
      <el-button type="primary" style="flex: 1" @click="beforeImport('订单')">导入订单数据</el-button>
    </div>

    <el-button style="width: 98%;margin:20px 1%" size="large" :type="save ? 'primary' : 'success'" @click="saveData">
      {{ save ? "保存" : "调整" }}
    </el-button>

    <div class="shadow" style="margin: 1%">
      <div class="flex-row P6">
        <el-check-tag
          v-for="item in orderInfo.monthData"
          :key="item.month"
          :checked="orderInfo.checkedMonth === item.month"
          class="M6 P6"
          @change="monthChange(item.month)"
        >
          <div class="MX6 FS15">{{ item.month }}</div>
          <div class="align-center MT10 FS14">{{ item.value }}</div>
        </el-check-tag>
      </div>

      <van-cell-group>
        <van-cell :value="`合计 ${SumMoney(OrderData)}`">
          <template #title>
            <el-button size="small" type="primary" text bg @click="orderInfo.show = true">新增</el-button>
          </template>
        </van-cell>

        <van-swipe-cell v-for="(item,index) in OrderData" :key="index">
          <van-cell
            :title="`${OrderData.length-index}：吸尘器${item.title}`"
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
      <el-radio-group v-model="orderInfo.form.title" class="MB15" @change="typeChange">
        <el-radio-button label="2.0" value="2.0"/>
        <el-radio-button label="3.0" value="3.0"/>
      </el-radio-group>
      <van-field v-model="orderInfo.form.value" type="digit" placeholder="收入" clearable/>
      <date-picker
        class="MT15"
        placeholder="下单日期"
        :default-date="orderInfo.form.orderDate"
        @date-change="setOrderDate"
      />
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

  <van-popup v-model:show="importInfo.show" position="bottom" destroy-on-close>
    <div class="P24">
      <el-input
        v-model="importInfo.dataStr"
        :placeholder="`请导入${importInfo.placeholder}数据`"
        :rows="6"
        type="textarea"
      />

      <el-button
        type="primary"
        size="large"
        style="width: 100%"
        @click="importData"
        class="MT50"
        :disabled="!(importInfo.dataStr)"
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
import {showToast} from "vant";
import {sort} from "otb-toolkit/src/utils/data.ts"

// 是否编辑备料
const save = ref(false);
// 备料数据
const data = ref([] as RSA[]);
// 导入数据
const importInfo = ref({
  show: false,
  dataStr: "",
  placeholder: "",
});

const beforeImport = (s: string) => {
  importInfo.value.placeholder = s;
  importInfo.value.show = true;
};
const importData = () => {
  const importData = JSON.parse(importInfo.value.dataStr);
  if (importInfo.value.placeholder === "备料") {
    LStorage.data.setter(importData);
  }
  if (importInfo.value.placeholder === "订单") {
    LStorage.orderData.setter(importData);
  }
  init();
  importInfo.value.show = false;
  save.value = false;
};

// 订单
interface Order {
  title: string;
  value: number;
  orderDate: string;
}

interface OrderMonth {
  month: string;
  value: number;
}

const orderInfo = ref({
  type: "add" as "add" | "upd",
  show: false,
  form: {} as Order,
  data: [] as Order[],
  monthData: [] as OrderMonth[],
  index: 0,
  checkedMonth: "",
});
const OrderData = computed(() => {
  const checkedMonth = orderInfo.value.checkedMonth;
  if (checkedMonth) return orderInfo.value.data.filter((o: RSA) => o.orderDate.substring(0, 7) === checkedMonth);
  return orderInfo.value.data;
})
const typeChange = (type: string) => {
  // 设置价格
  switch (type) {
    case "2.0":
      orderInfo.value.form.value = 70;
      break;
    case "3.0":
      orderInfo.value.form.value = 80;
      break;
  }
  // 默认今日
  orderInfo.value.form.orderDate = dayjs(new Date()).format("YYYY-MM-DD");
};
const monthChange = (s: string) => orderInfo.value.checkedMonth = orderInfo.value.checkedMonth === s ? "" : s;
// 设置日期
const setOrderDate = (date: string) => {
  orderInfo.value.form.orderDate = date;
};
// 复制
const copy = (data: RSA[], name: string) => {
  navigator.clipboard.writeText(JSON.stringify(data));
  showToast(`${name}数据复制成功`);
}
// 初始化分析数据
const initOrderMonthData = () => {
  const months = {} as Record<string, number>

  for (let o of orderInfo.value.data) {
    if (o.orderDate) {
      const month = o.orderDate.substring(0, 7);
      if (months[month]) {
        months[month] += Number(o.value);
      } else {
        months[month] = Number(o.value);
      }
    }
  }

  const monthData = [] as OrderMonth[];
  for (let key in months) {
    monthData.push({
      month: key,
      value: months[key]
    })
  }
  orderInfo.value.monthData = monthData;
};
// 合计金额
const SumMoney = computed(() => {
  return (data: Order[]) => {
    return data.reduce((total, item) => total + Number(item.value), 0);
  }
})
// 备料预警样式
const Style = computed(() => {
  return (item: RSA) => {
    if (item.num - item.warnNum < 0) return {backgroundColor: "#E47471", color: "#ffffff"};
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
      if (orderInfo.value.form.title === "2.0") {
        data.value.forEach((item: RSA) => {
          if (item.name === "风扇") item.num -= 1;
          if (item.name === "塑料盒") item.num -= 2;
          if (item.name === "钢丝软管") item.num -= 2;
          if (item.name === "直法兰") item.num -= 1;
          if (item.name === "2.0包装箱") item.num -= 1;
          if (item.name === "2.0饮料瓶") item.num -= 1;
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
          if (item.name === "3.0矿泉水桶") item.num -= 1;
          if (item.name === "3.0吸管") item.num -= 1;
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
  orderInfo.value.form = {} as Order;

  initOrderMonthData();
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
  initOrderMonthData();
}
// 初始化缓存数据
const init = () => {
  // 备料
  if (LStorage.data.getter()) data.value = LStorage.data.getter();
  if (!data.value.some(o => o.name === "风扇")) data.value.push({name: "风扇", num: 0, warnNum: 2})
  if (!data.value.some(o => o.name === "塑料盒")) data.value.push({name: "塑料盒", num: 0, warnNum: 5})
  if (!data.value.some(o => o.name === "钢丝软管")) data.value.push({name: "钢丝软管", num: 0, warnNum: 4})
  if (!data.value.some(o => o.name === "直法兰")) data.value.push({name: "直法兰", num: 0, warnNum: 2})
  if (!data.value.some(o => o.name === "2.0包装箱")) data.value.push({name: "2.0包装箱", num: 0, warnNum: 2})
  if (!data.value.some(o => o.name === "2.0饮料瓶")) data.value.push({name: "2.0饮料瓶", num: 0, warnNum: 2})
  if (!data.value.some(o => o.name === "花瓶")) data.value.push({name: "花瓶", num: 0, warnNum: 1})
  if (!data.value.some(o => o.name === "6型号盖")) data.value.push({name: "6型号盖", num: 0, warnNum: 1})
  if (!data.value.some(o => o.name === "90度弯头")) data.value.push({name: "90度弯头", num: 0, warnNum: 3})
  if (!data.value.some(o => o.name === "45度弯头")) data.value.push({name: "45度弯头", num: 0, warnNum: 1})
  if (!data.value.some(o => o.name === "50管")) data.value.push({name: "50管", num: 0, warnNum: 1})
  if (!data.value.some(o => o.name === "内50软管")) data.value.push({name: "内50软管", num: 0, warnNum: 1})
  if (!data.value.some(o => o.name === "3.0矿泉水桶")) data.value.push({name: "3.0矿泉水桶", num: 0, warnNum: 1})
  if (!data.value.some(o => o.name === "3.0吸管")) data.value.push({name: "3.0吸管", num: 0, warnNum: 1})
  // 订单
  if (LStorage.orderData.getter()) orderInfo.value.data = sort(LStorage.orderData.getter(), "desc", 'orderDate');
  initOrderMonthData()
};
init();
</script>

<style lang="scss" scoped>
.van-field {
  background: #f7f8fa;
  border-radius: 8px;
}
</style>