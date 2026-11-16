// 云服务客户端：唯一初始化点，供所有页面与组件共享
const { createMiniProgramWorkBuddyCloud } = require('@tencent-ai/workbuddy-cloud-sdk/miniprogram');
const { createDiagnosticWx } = require('./workbuddy-cloud-diagnostics');

// publicConfig 来自 workbuddy_cloud_service 激活结果，随应用发布保持不变
const publicConfig = {
  resourceId: 'wbcs_Qo3yk9cwpaMGVolZXxgxV1',
  endpoint: 'https://mp-api.app.workbuddy.host',
  oauthRelayBaseUrl: 'https://www.workbuddy.cn/v2/as/genie-baas/oauth',
  publishableKey: 'wbpk_MymX2OOHh613JQ0KfUjRfo_WHJApK0SAP8uOdXrQRYFOY1cSLnjo9OI',
  workBuddyOAuthClientId: 'cb_jq6QyEPkOkJXPcpz0JxS_wbapp_MymX2OOHh613JQ0KfUjRfo'
};

const cloud = createMiniProgramWorkBuddyCloud({
  endpoint: publicConfig.endpoint,
  publishableKey: publicConfig.publishableKey,
  workBuddyOAuthClientId: publicConfig.workBuddyOAuthClientId,
  wx: createDiagnosticWx(wx)
});

module.exports = { cloud, publicConfig };
