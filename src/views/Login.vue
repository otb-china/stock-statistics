<script setup lang="ts">
import {inject, type Ref, ref} from "vue";
import type {RSA} from "otb-toolkit/src/types/index.ts";
import {useRouter} from "vue-router";
import {ElMessage} from "element-plus";
import HForm from "otb-module-vue/src/components/HForm/index.vue"
import {type FormOptionItem} from "otb-module-vue/src/components/HForm/interface.ts"
import {LStorage} from "@/utils/localStorage.ts";

// 注入时声明类型（确保类型安全）
const screenState = inject<{ screenType: Ref<string>; }>('screenState')!;
const screenType = screenState.screenType;
const router = useRouter()

const form = ref({
  mobile: localStorage.getItem("phone") || '',
  pwd: undefined,
} as RSA);
const option = ref([
  {
    type: "text",
    content: "账号登录",
    textClassName: "FS30 bolder MB30 W100",
    className: "align-center W100",
    color: "#4a4a4a",
  },
  {
    type: "input",
    prop: "mobile",
    input: {
      placeholder: "账号",
      size: "large",
    }
  },
  {
    type: "input",
    prop: "pwd",
    input: {
      placeholder: "密码",
      size: "large",
    },
  },
  {
    type: "slot",
    slotName: "submit",
  }
] as FormOptionItem[]);

// 确认登录
const login = () => {
  const {mobile, pwd} = form.value;
  if (!mobile) return ElMessage.warning("请输入账号");

  if (mobile === "13190977615" && pwd === "112233") {
    LStorage.token.setter("1234567890");
    localStorage.setItem('phone', mobile);
    router.push('/');
  }
};
</script>

<template>
  <div class="flex-center" v-if="screenType === 'landscape'">
    <div class="align-center P20 shadow" style="margin-top: 20vh;width: 350px">
      <HForm :option="option" :form="form" item-width="200px W100" class-name="MT10 W100">

        <template #submit>
          <el-button
            type="primary" size="large" class="W100 MT40" :disabled="!form.mobile || !form.pwd" @click="login">
            确认登录
          </el-button>
        </template>
      </HForm>
    </div>
  </div>

  <div class="align-center PX24 box" style="margin-top: 20vh" v-if="screenType === 'portrait'">
    <h1>账号登录</h1>
    <van-field
      class="MT50"
      clickable
      v-model="form.mobile"
      placeholder="账号"
    />
    <van-field
      class="MT20 MB50"
      clickable
      v-model="form.pwd"
      placeholder="密码"
    />

    <van-button type="primary" class="W100" :disabled="!form.mobile || !form.pwd" @click="login">确认登录
    </van-button>
  </div>
</template>

<style lang="scss" scoped>
.van-field {
  background: #f7f8fa;
  border-radius: 8px;
}
</style>