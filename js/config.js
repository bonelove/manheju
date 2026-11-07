/**
 * 漫和居房源展示系统 —— 唯一需要改的配置文件
 * 已于 2026-11-06 填入正式 Supabase 连接（项目 uvivxbgvvhenkjurnygl）。
 * 注意：这里只能填 Publishable / anon key，绝对不要填 service_role / secret key！
 */
window.MANHEJU_CONFIG = {
  supabaseUrl: "https://uvivxbgvvhenkjurnygl.supabase.co",
  // 国内中转（腾讯云函数·广州）：后台的所有数据库请求先到这里再转巴黎，管理员不开 VPN 也能用。
  // 客户页面不走这里（读本站快照）。中转只做透明转发，鉴权仍由 Supabase 完成。
  apiBase: "https://1424222315-en4v5xjivl.ap-guangzhou.tencentscf.com",
  supabaseAnonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2aXZ4Ymd2dmhlbmtqdXJueWdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMzNzIzNzIsImV4cCI6MjEwODk0ODM3Mn0.9n1o7RCyK_oKLgMC2gdU-5XB5ajcu-cBhaRbBzcUqqs",
  siteName: "漫和居公寓",
  // 部署后的正式网址（可留空，系统会用当前网址自动拼门店链接）
  siteBaseUrl: "https://manheju.github.io/manheju"
};
