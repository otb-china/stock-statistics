// 接口文件
import {request} from "./request"

type Method = "get" | "post" | "put" | "delete";
const http = (url: string, method: Method, data?: any, loadingText?: string) => {
  if (method === "get") {
    return request({url, method, params: data, loadingText} as any);
  } else {
    return request({url, method, data, loadingText,} as any);
  }
};

export const Api = {
  // 短信发送与校验
  sendSms: (data?: any) => http("/cdp/user/sendSms", "post", data),
  checkSms: (data?: any) => http("/cdp/user/checkSms", "get", data),
  // 登录与校验
  login: (data?: any) => http("/statistics/login", "post", data),
  loginCheck: (data?: any) => http("/statistics/check_phone_exists", "post", data),
  // 分析-招生次数
  enrollmentNum: (data?: any) => http("/statistics/overview/admissions", "get", data),
  // 分析-招生人数
  enrollmentPeopleNum: (data?: any) => http("/statistics/overview/admissionsUv", "get", data),
  // 分析-收款总额
  payment: (data?: any) => http("/statistics/overview/amount_total", "get", data),
  // 分析-退款总额
  refundAmountTotal: (data?: any) => http("/statistics/overview/refund_amount_total", "get", data),
  // 分析-实收总额
  actualAmountTotal: (data?: any) => http("/statistics/overview/actual_amount_total", "get", data),
  // 分析-退费总数
  refundNum: (data?: any) => http("/statistics/overview/refund_total", "get", data),
  // 分析-试听招生
  listenEnrollmentNum: (data?: any) => http("/statistics/overview/admissions_trial", "get", data),
  // 分析-试听退费
  listenRefundNum: (data?: any) => http("/statistics/overview/refund_trial_total", "get", data),
  // 分析-升协议数
  upgradeAgreementNum: (data?: any) => http("/statistics/overview/upgrade_agreement", "get", data),
  // 分析-招生趋势分析
  dimAdmissionsCount: (data?: any) => http("/statistics/overview/dim_admissions_count", "get", data),
  // 分析-退款原因分析
  refundReason: (data?: any) => http("/statistics/overview/refund_reason", "get", data),
  // 分析-班级招生退款情况
  refundClass: (data?: any) => http("/statistics/overview/refund_class", "get", data),
  // 分析-项目招生退款情况
  projectAdmissions: (data?: any) => http("/statistics/overview/project_Admissions", "get", data),
  // 分析-公告发布与招生影响分析
  announcementAdmissions: (data?: any) => http("/statistics/overview/announcement_admissions", "get", data),
  // 分析-招生热力榜
  dimHeatList: (data?: any) => http("/statistics/overview/dim_heat_list", "get", data),
  // 分析-表单筛选列表
  getCourseList: (data?: any) => http("/statistics/overview/getCourse_list", "get", data),
}