export const POST_STATUS = {
  pending: '待审',
  approved: '已通过',
  rejected: '已驳回'
};

export const REPORT_STATUS = {
  open: '未处理',
  resolved: '已处理'
};

export const OWNER_STATUS = {
  active: '正常',
  banned: '已封禁'
};

export const VISIBILITY = {
  public: '公开',
  followers: '关注可见',
  private: '仅自己可见'
};

export const TARGET_TYPE = {
  post: '帖子',
  pet: '宠物',
  owner: '用户',
  report: '举报',
  comment: '评论',
  settings: '配置'
};

export const ACTOR_TYPE = {
  admin: '管理员',
  owner: '用户',
  system: '系统'
};

export const AUDIT_ACTION = {
  approve_post: '通过内容',
  reject_post: '驳回内容',
  delete_post: '删除内容',
  ignore_report: '忽略举报',
  warn_owner: '警告用户',
  remove_content: '下架内容',
  ban_owner: '封禁用户',
  unban_owner: '解封用户',
  resolve_report: '处理举报',
  update_config: '修改配置'
};

export function labelOf(map, key) {
  return map[key] || key || '-';
}

export function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('zh-CN', { hour12: false });
}
