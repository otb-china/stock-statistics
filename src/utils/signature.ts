import crypto from 'crypto-js';
import type {RSA} from "otb-toolkit/src/types/index.ts";
import {type} from "otb-toolkit/src/utils/data.ts";
import qs from "qs";

const AccessKeyID = '1749009600';      // 替换为你的 AccessKey ID
const AccessKeySecret = '906000201aea31d1'; // 替换为你的 AccessKey Secret

export function generateSignature(method: string, path: string, params = {} as RSA, body = '') {
  // 1. 生成必要参数
  const timestamp = new Date().toISOString();
  const nonce = crypto.lib.WordArray.random(16).toString(); // 随机 16 字节 nonce
  const signatureMethod = 'HmacSHA256';
  const signatureHeaders = 'x-ca-key,x-ca-nonce,x-ca-signature-method,x-ca-timestamp'; // 按字母排序

  // 2. 拼接查询参数
  const queryString = Object.keys(params)
    .sort()
    .map(key => {
      if (type(params[key]) === "Array") {
        const obj = {} as RSA;
        obj[key] = params[key];

        return decodeURIComponent(qs.stringify(obj, {arrayFormat: 'brackets'}))
      }
      return `${key}=${params[key]}`
    })
    .join('&');

  // 3. 拼接待签名字符串
  let stringToSign = `${method}\n${path}\n${queryString}\n`;

  // 4. 拼接指定的请求头
  const headerKeys = signatureHeaders.split(',');
  headerKeys.forEach(key => {
    const value = key === 'x-ca-timestamp' ? timestamp :
      key === 'x-ca-key' ? AccessKeyID :
        key === 'x-ca-nonce' ? nonce :
          key === 'x-ca-signature-method' ? signatureMethod : '';
    stringToSign += `${key}:${value}\n`;
  });

  // 5. 拼接请求体（如果有）
  if (body) {
    stringToSign += typeof body === 'object' ? JSON.stringify(body) : body;
  }

  // 5.1 调试输出
  // console.log('待签名字符串:', stringToSign);

  // 6. 计算 HMAC-SHA256 签名
  const signature = crypto.HmacSHA256(stringToSign, AccessKeySecret).toString(crypto.enc.Base64);

  // 7. 返回签名头部
  return {
    'x-ca-key': AccessKeyID,
    'x-ca-timestamp': timestamp,
    'x-ca-nonce': nonce,
    'x-ca-signature-method': signatureMethod,
    'x-ca-signature-headers': signatureHeaders,
    'x-ca-signature': signature,
  };
}