// 拦截器
import axios, {type AxiosInstance} from "axios"
import type {RSA} from "otb-toolkit/src/types/index.ts"
import {ElMessage} from "element-plus";
import {generateSignature} from "@/utils/signature.ts";
import {LStorage} from "@/utils/localStorage.ts";


// 创建axios实例
export const request: AxiosInstance = axios.create({
  baseURL: 'https://api.xintujing.online',
  // baseURL: 'http://192.168.35.207:6067',
  timeout: 1000 * 60
})

// 请求拦截器
request.interceptors.request.use(
  (config: any) => {
    // 删除空数据
    for (const key in config.params) {
      const value = config.params[key];
      if (
        value === "" ||
        (Array.isArray(value) && value.length === 0) ||
        value === null ||
        value === undefined
      ) delete config.params[key]
    }
    for (const key in config.data) {
      const value = config.data[key];
      if (
        value === "" ||
        (Array.isArray(value) && value.length === 0) ||
        value === null ||
        value === undefined
      ) delete config.data[key]
    }

    const signatureHeaders = generateSignature(config.method.toUpperCase(), config.url, config.params as any | {}, config.data as any | '');
    const Token = LStorage.token.getter();
    if (Token) config.headers = {...config.headers, Authorization: `Bearer ${Token}`, ...signatureHeaders};

    return config
  },
  (error: any) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  (response: any) => {
    return response.data
  },
  (error: RSA) => {
    // token过期重新登录
    if (error.response?.status === 403) {
      ElMessage.error("登录超时")
      localStorage.removeItem('token');
      window.location.hash = '/login';
    }

    return Promise.reject(error)
  }
)
