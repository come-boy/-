const loginSection = document.getElementById('loginSection');
const dashboard = document.getElementById('dashboard');
const sectionTabs = document.getElementById('sectionTabs');
const sectionContent = document.getElementById('sectionContent');
const dashboardSidebar = document.getElementById('dashboardSidebar');
const navToggleBtn = document.getElementById('navToggleBtn');
const deviceStatus = document.getElementById('deviceStatus');
const currentSectionLabel = document.getElementById('currentSectionLabel');
const workspaceTitle = document.getElementById('workspaceTitle');
const workspaceHint = document.getElementById('workspaceHint');
const logoutButton = document.getElementById('logoutButton');
const switchAccountBtn = document.getElementById('switchAccountBtn');
const userStatus = document.getElementById('userStatus');
const greeting = document.getElementById('greeting');
const notificationBtn = document.getElementById('notificationBtn');
const notificationBadge = document.getElementById('notificationBadge');
const notificationModal = document.getElementById('notificationModal');
const closeNotificationBtn = document.getElementById('closeNotification');
const markAllNotificationsBtn = document.getElementById('markAllNotificationsBtn');
const notificationSummary = document.getElementById('notificationSummary');
const notificationList = document.getElementById('notificationList');
const notificationTabButtons = document.querySelectorAll('.notification-tabs .tab-btn');
const modalContainer = document.getElementById('modalContainer');
const toastContainer = document.getElementById('toastContainer');

const loginForm = document.getElementById('loginForm');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const leadImportInput = document.getElementById('leadImportInput');
const forgotPasswordLink = document.getElementById('forgotPasswordLink');
const registerLink = document.getElementById('registerLink');

const storageKeyBase = 'admissionsDashboardData';
const authKey = 'admissionsAuth';
const dataVersionKey = 'admissionsDashboardVersion';
const currentDataVersion = '2026-06-11-production-v1';

const sections = [
  { key: 'overview', label: '工作台', icon: '总览', hint: '查看总览、待办事项与关键提醒', roles: ['super', 'teacher'] },
  { key: 'team', label: '招生团队', icon: '团队', hint: '维护团队分组与基础资料', roles: ['super'] },
  { key: 'members', label: '团队成员', icon: '成员', hint: '管理成员信息与联系方式', roles: ['super'] },
  { key: 'schools', label: '招生学校', icon: '学校', hint: '整理学校分布与归属关系', roles: ['super'] },
  { key: 'leads', label: '线索跟进', icon: '线索', hint: '跟进学生咨询、联系记录与状态', roles: ['super', 'teacher'] },
  { key: 'connections', label: '对接关系', icon: '对接', hint: '维护班级、班主任和招生老师对应关系', roles: ['super'] },
  { key: 'monitor', label: '数据看板', icon: '看板', hint: '查看转化进度与团队效率分析', roles: ['super'] },
  { key: 'accounts', label: '账号审核', icon: '审核', hint: '审核招生老师注册信息，并维护团队负责人', roles: ['super'] },
  { key: 'profile', label: '个人中心', icon: '资料', hint: '查看并维护个人信息', roles: ['teacher', 'parent', 'student'] },
];

const notificationLabels = {
  system: '系统通知',
  team: '团队消息',
  parent: '家长回复',
};

const roleLabels = {
  super: '超级管理员',
  teacher: '招生老师',
  parent: '学生家长',
  student: '学生',
};

const leadImportColumnAliases = {
  name: ['学生姓名', '姓名', '学生', 'studentname', 'student', 'name'],
  grade: ['年级', '班级', '年级班级', 'grade', 'classname', 'class'],
  parent: ['家长姓名', '家长', '家长称呼', 'parent', 'parentname', 'guardian'],
  phone: ['家长电话', '联系电话', '手机号', '手机号码', '电话', 'phone', 'mobile', 'tel'],
  followUp: ['跟进内容', '跟进记录', '备注', '说明', 'followup', 'comment', 'remark', 'notes'],
  assignedTeacher: ['负责人', '招生老师', '跟进老师', '老师', 'assignedteacher', 'teacher', 'owner'],
  assignedTeacherId: ['负责人id', '招生老师id', '老师id', 'assignedteacherid', 'teacherid', 'ownerid'],
  enrollmentStatus: ['报名状态', '线索状态', '状态', 'enrollmentstatus', 'status'],
  priority: ['优先级', 'priority', 'level'],
  teamId: ['所属分组', '分组', '团队编号', 'teamid', 'team'],
  called: ['联系状态', '是否联系', '已联系', 'called', 'contacted'],
  lastContactTime: ['最近联系', '最近联系时间', '最后联系时间', 'lastcontacttime', 'contacttime'],
};

const initialData = {
  team: [],
  members: [],
  schools: [],
  leadStudents: [],
  connections: [],
  notifications: [],
};

const uiState = {
  activeSection: 'overview',
  notificationTab: 'system',
  filters: {
    teamSearch: '',
    memberSearch: '',
    schoolSearch: '',
    leadSearch: '',
    leadStatus: 'all',
    connectionSearch: '',
  },
};

function cloneInitialData() {
  return JSON.parse(JSON.stringify(initialData));
}

function getStorageKey(user) {
  const keyPart = user?.id || user?.username || 'public';
  return `${storageKeyBase}_${keyPart}`;
}

function safeParseJSON(value) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch (error) {
    return null;
  }
}

function escapeHTML(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function localizeDemoText(value) {
  const text = String(value ?? '').trim();
  return text;
}

function normalizePhone(value) {
  return String(value ?? '').replace(/[^\d+\-()\s]/g, '').trim();
}

function normalizeSearchText(value) {
  return String(value ?? '').trim().toLowerCase();
}

function normalizeColumnKey(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s_\-]+/g, '')
    .replace(/[()（）【】\[\].:：]/g, '');
}

function includesKeyword(values, keyword) {
  if (!keyword) return true;
  const normalizedKeyword = normalizeSearchText(keyword);
  return values.some(value => normalizeSearchText(value).includes(normalizedKeyword));
}

function isValidEmail(value) {
  if (!value) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim());
}

function isValidPhone(value) {
  if (!value) return true;
  const digits = String(value).replace(/\D/g, '');
  return digits.length >= 7;
}

function isDuplicateText(values, candidate, currentId, normalizer = normalizeSearchText) {
  const target = normalizer(candidate);
  if (!target) return false;
  return values.some(item => item.id !== currentId && normalizer(item.value) === target);
}

function getImportCell(row, aliases) {
  const entries = Object.entries(row || {});
  const aliasSet = new Set((aliases || []).map(normalizeColumnKey));
  for (const [key, value] of entries) {
    if (aliasSet.has(normalizeColumnKey(key))) {
      return String(value ?? '').trim();
    }
  }
  return '';
}

function isImportRowEmpty(row) {
  return !Object.values(row || {}).some(value => String(value ?? '').trim());
}

function parseImportedBoolean(value, fallback = false) {
  const text = normalizeSearchText(value);
  if (!text) return fallback;
  if (['是', '已联系', 'true', '1', 'yes', 'y'].includes(text)) return true;
  if (['否', '未联系', 'false', '0', 'no', 'n'].includes(text)) return false;
  return fallback;
}

function parseImportedTeamId(value, data) {
  const text = localizeDemoText(String(value ?? '').trim());
  if (!text) return null;
  const digitMatch = text.match(/\d+/);
  if (digitMatch) return Number(digitMatch[0]);

  const normalized = normalizeSearchText(text);
  const matchedTeam = data.team.find(team => {
    return normalizeSearchText(team.schoolName) === normalized
      || normalizeSearchText(getTeamLabel(team.teamId, data)) === normalized;
  });
  return matchedTeam ? matchedTeam.teamId : null;
}

function getImportSummaryMessage(summary) {
  const head = `成功新增 ${summary.created} 条，更新 ${summary.updated} 条，跳过 ${summary.skipped} 条。`;
  if (!summary.errors.length) return head;
  return `${head} 问题明细：${summary.errors.slice(0, 5).join('；')}${summary.errors.length > 5 ? '；其余问题请检查原始表格后重试。' : ''}`;
}

function mapEnrollmentStatus(value) {
  const text = localizeDemoText(value);
  const lower = String(value ?? '').toLowerCase();
  if (text.includes('待跟进') || lower.includes('pending')) return '待跟进';
  if (text.includes('已完成') || text.includes('已报名') || lower.includes('enrolled') || lower.includes('completed')) return '已报名';
  if (text.includes('搁置') || text.includes('暂停') || lower.includes('hold')) return '已搁置';
  if (text.includes('跟进') || lower.includes('progress')) return '跟进中';
  return '待跟进';
}

function mapPriority(value) {
  const text = String(value ?? '').trim().toLowerCase();
  if (value === '高' || text === 'high') return '高';
  if (value === '低' || text === 'low') return '低';
  return '中';
}

function mapNotificationCategory(value) {
  return ['system', 'team', 'parent'].includes(value) ? value : 'system';
}

function formatRoleLabel(role) {
  return roleLabels[role] || '招生成员';
}

function getSectionMeta(sectionKey) {
  return sections.find(section => section.key === sectionKey) || sections[0];
}

function generateId() {
  return Date.now() + Math.floor(Math.random() * 1000);
}

function formatNow() {
  const now = new Date();
  const pad = number => String(number).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

function getTimeGreeting() {
  const hour = new Date().getHours();
  if (hour < 6) return '凌晨好';
  if (hour < 12) return '上午好';
  if (hour < 18) return '下午好';
  return '晚上好';
}

function showToast(message, type = 'info') {
  if (!toastContainer) return;
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  toastContainer.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 220);
  }, 2600);
}

async function apiRequest(url, options = {}) {
  const response = await fetch(url, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(payload?.code || 'REQUEST_FAILED');
    error.code = payload?.code || 'REQUEST_FAILED';
    error.status = response.status;
    throw error;
  }
  return payload;
}

function normalizeData(data) {
  const seed = cloneInitialData();
  const source = data && typeof data === 'object' ? data : {};

  return {
    team: Array.isArray(source.team) && source.team.length ? source.team.map((item, index) => ({
      id: Number(item.id) || seed.team[index]?.id || generateId(),
      schoolName: localizeDemoText(item.schoolName || item.name || seed.team[index]?.schoolName || `团队${index + 1}`),
      role: '招生团队',
      contacts: String(item.contacts || seed.team[index]?.contacts || '').trim(),
      phone: normalizePhone(item.phone || seed.team[index]?.phone || ''),
      teamId: Number(item.teamId) || seed.team[index]?.teamId || index + 1,
      createdBy: String(item.createdBy || seed.team[index]?.createdBy || ''),
    })) : seed.team,
    members: Array.isArray(source.members) && source.members.length ? source.members.map((item, index) => ({
      id: Number(item.id) || seed.members[index]?.id || generateId(),
      name: localizeDemoText(item.name || seed.members[index]?.name || `成员${index + 1}`),
      title: localizeDemoText(item.title || seed.members[index]?.title || '招生顾问'),
      email: String(item.email || seed.members[index]?.email || '').trim(),
      phone: normalizePhone(item.phone || seed.members[index]?.phone || ''),
      teamId: Number(item.teamId) || seed.members[index]?.teamId || seed.team[0]?.teamId || 1,
      createdBy: String(item.createdBy || seed.members[index]?.createdBy || ''),
    })) : seed.members,
    schools: Array.isArray(source.schools) && source.schools.length ? source.schools.map((item, index) => ({
      id: Number(item.id) || seed.schools[index]?.id || generateId(),
      name: localizeDemoText(item.name || item.schoolName || seed.schools[index]?.name || `学校${index + 1}`),
      location: localizeDemoText(item.location || seed.schools[index]?.location || '未设置区域'),
      teamId: Number(item.teamId) || seed.schools[index]?.teamId || seed.team[0]?.teamId || 1,
      createdBy: String(item.createdBy || seed.schools[index]?.createdBy || ''),
    })) : seed.schools,
    leadStudents: Array.isArray(source.leadStudents) && source.leadStudents.length ? source.leadStudents.map((item, index) => ({
      id: Number(item.id) || seed.leadStudents[index]?.id || generateId(),
      name: localizeDemoText(item.name || seed.leadStudents[index]?.name || `线索${index + 1}`),
      grade: localizeDemoText(item.grade || seed.leadStudents[index]?.grade || '待定'),
      parent: localizeDemoText(item.parent || seed.leadStudents[index]?.parent || '家长'),
      phone: normalizePhone(item.phone || seed.leadStudents[index]?.phone || ''),
      called: Boolean(item.called),
      callOutcome: String(item.callOutcome || ''),
      followUp: localizeDemoText(item.followUp || seed.leadStudents[index]?.followUp || '待补充跟进内容'),
      assignedTeacher: localizeDemoText(item.assignedTeacher || seed.leadStudents[index]?.assignedTeacher || '未分配'),
      assignedTeacherId: Number(item.assignedTeacherId) || 0,
      enrollmentStatus: mapEnrollmentStatus(item.enrollmentStatus || seed.leadStudents[index]?.enrollmentStatus),
      teamId: Number(item.teamId) || seed.leadStudents[index]?.teamId || seed.team[0]?.teamId || 1,
      priority: mapPriority(item.priority || seed.leadStudents[index]?.priority),
      lastContactTime: String(item.lastContactTime || seed.leadStudents[index]?.lastContactTime || ''),
      createdBy: String(item.createdBy || seed.leadStudents[index]?.createdBy || ''),
      favorite: Boolean(item.favorite),
      nickname: String(item.nickname || ''),
      note: String(item.note || ''),
      wechatAdded: Boolean(item.wechatAdded),
      keep: Boolean(item.keep),
    })) : seed.leadStudents,
    connections: Array.isArray(source.connections) && source.connections.length ? source.connections.map((item, index) => ({
      id: Number(item.id) || seed.connections[index]?.id || generateId(),
      school: localizeDemoText(item.school || seed.connections[index]?.school || '未设置学校'),
      className: localizeDemoText(item.className || seed.connections[index]?.className || '未设置班级'),
      headTeacher: localizeDemoText(item.headTeacher || seed.connections[index]?.headTeacher || '未设置班主任'),
      recruitmentTeacher: localizeDemoText(item.recruitmentTeacher || seed.connections[index]?.recruitmentTeacher || '未分配'),
      recruitmentTeacherId: Number(item.recruitmentTeacherId) || 0,
      teamId: Number(item.teamId) || seed.connections[index]?.teamId || seed.team[0]?.teamId || 1,
      createdBy: String(item.createdBy || seed.connections[index]?.createdBy || ''),
    })) : seed.connections,
    notifications: Array.isArray(source.notifications) && source.notifications.length ? source.notifications.map((item, index) => ({
      id: Number(item.id) || seed.notifications[index]?.id || generateId(),
      category: mapNotificationCategory(item.category),
      title: localizeDemoText(item.title || seed.notifications[index]?.title || `通知${index + 1}`),
      body: localizeDemoText(item.body || seed.notifications[index]?.body || '暂无内容'),
      time: String(item.time || seed.notifications[index]?.time || formatNow()),
      read: Boolean(item.read),
    })) : seed.notifications,
  };
}

function repairData(data) {
  const repaired = normalizeData(data);
  const fallbackTeamId = repaired.team[0]?.teamId || 1;
  const teamIds = new Set(repaired.team.map(item => item.teamId));

  repaired.members = repaired.members.map((member, index) => ({
    ...member,
    id: Number(member.id) || generateId() + index,
    teamId: teamIds.has(member.teamId) ? member.teamId : fallbackTeamId,
    phone: normalizePhone(member.phone),
  }));

  repaired.schools = repaired.schools.map((school, index) => ({
    ...school,
    id: Number(school.id) || generateId() + index,
    teamId: teamIds.has(school.teamId) ? school.teamId : fallbackTeamId,
  }));

  const memberMap = new Map(repaired.members.map(member => [member.id, member]));
  const schoolMap = new Map(repaired.schools.map(school => [school.name, school]));

  repaired.leadStudents = repaired.leadStudents.map((lead, index) => {
    const teacher = memberMap.get(lead.assignedTeacherId);
    const resolvedTeamId = teacher?.teamId || (teamIds.has(lead.teamId) ? lead.teamId : fallbackTeamId);
    return {
      ...lead,
      id: Number(lead.id) || generateId() + index,
      teamId: resolvedTeamId,
      assignedTeacherId: teacher ? teacher.id : 0,
      assignedTeacher: teacher ? teacher.name : '未分配',
      followUp: lead.followUp || '待补充跟进内容',
      enrollmentStatus: mapEnrollmentStatus(lead.enrollmentStatus),
      priority: mapPriority(lead.priority),
      lastContactTime: lead.lastContactTime || '',
    };
  });

  repaired.connections = repaired.connections.map((connection, index) => {
    const teacher = memberMap.get(connection.recruitmentTeacherId);
    const linkedSchool = schoolMap.get(connection.school);
    const resolvedTeamId = teacher?.teamId || linkedSchool?.teamId || (teamIds.has(connection.teamId) ? connection.teamId : fallbackTeamId);
    return {
      ...connection,
      id: Number(connection.id) || generateId() + index,
      teamId: resolvedTeamId,
      recruitmentTeacherId: teacher ? teacher.id : 0,
      recruitmentTeacher: teacher ? teacher.name : '未分配',
      school: linkedSchool?.name || connection.school,
    };
  });

  repaired.notifications = repaired.notifications
    .map((notification, index) => ({
      ...notification,
      id: Number(notification.id) || generateId() + index,
      category: mapNotificationCategory(notification.category),
    }))
    .sort((left, right) => String(right.time).localeCompare(String(left.time)));

  return repaired;
}

function getData() {
  const user = getCurrentUser();
  const storageKey = getStorageKey(user);
  return repairData(safeParseJSON(localStorage.getItem(storageKey)));
}

function saveData(data) {
  const repaired = repairData(data);
  const user = getCurrentUser();
  const storageKey = getStorageKey(user);
  localStorage.setItem(storageKey, JSON.stringify(repaired));
  updateNotificationButton();
  updateGreeting();
}

function getAuth() {
  const auth = safeParseJSON(localStorage.getItem(authKey));
  return auth && auth.id && auth.role ? auth : null;
}

function saveAuth(user) {
  localStorage.setItem(authKey, JSON.stringify({
    id: user.id,
    username: user.username || '',
    role: user.type || user.role,
    name: user.name || '',
    phone: user.phone || '',
    employeeNo: user.employeeNo || '',
    teamId: user.teamId || '',
    linkedTeacherId: user.linkedTeacherId || '',
    approved: Boolean(user.approved),
    isTeamLead: Boolean(user.isTeamLead),
  }));
}

function getCurrentUser() {
  return getAuth();
}

function isSuperAdmin(user) {
  return user?.role === 'super';
}

function isTeamLead(user) {
  return Boolean(user?.isTeamLead);
}

function isTeamMember(user) {
  return user?.role === 'teacher';
}

function canEditTeam(team, user) {
  return isSuperAdmin(user) || team.createdBy === user?.id;
}

function canEditMember(member, user) {
  return isSuperAdmin(user) || member.createdBy === user?.id;
}

function canDeleteMember(member, user) {
  return isSuperAdmin(user) || member.createdBy === user?.id;
}

function canEditSchool(school, user) {
  return isSuperAdmin(user) || school.createdBy === user?.id;
}

function canEditLead(lead, user) {
  return isSuperAdmin(user) || lead.createdBy === user?.id;
}

function canEditConnection(connection, user) {
  return isSuperAdmin(user) || connection.createdBy === user?.id;
}

function getVisibleTeams(user, data) {
  if (isSuperAdmin(user)) return data.team;
  return data.team.filter(team => team.createdBy === user?.id);
}

function getVisibleMembers(user, data) {
  if (isSuperAdmin(user)) return data.members;
  return data.members.filter(member => member.createdBy === user?.id);
}

function getVisibleSchools(user, data) {
  if (isSuperAdmin(user)) return data.schools;
  return data.schools.filter(school => school.createdBy === user?.id);
}

function getVisibleLeads(user, data) {
  if (isSuperAdmin(user)) return data.leadStudents;
  return data.leadStudents.filter(lead => lead.createdBy === user?.id);
}

function getVisibleConnections(user, data) {
  if (isSuperAdmin(user)) return data.connections;
  return data.connections.filter(connection => connection.createdBy === user?.id);
}

function getAssignableMembers(user, data) {
  if (isSuperAdmin(user)) return data.members;
  if (isTeamLead(user)) return data.members.filter(member => member.teamId === user.teamId);
  return data.members.filter(member => member.id === user.memberId);
}

function getEditableTeams(user, data) {
  if (isSuperAdmin(user)) return data.team;
  return data.team.filter(team => team.teamId === user.teamId);
}

function getTeamLabel(teamId, data) {
  const team = data.team.find(item => item.teamId === teamId);
  return team ? `第 ${teamId} 组 · ${team.schoolName}` : `第 ${teamId} 组`;
}

function getMemberNameById(id, data = getData()) {
  return data.members.find(member => member.id === id)?.name || '未分配';
}

function getStatusClass(status) {
  if (status === '已报名') return 'status-success';
  if (status === '跟进中') return 'status-primary';
  if (status === '已搁置') return 'status-danger';
  return 'status-warning';
}

function getPriorityClass(priority) {
  if (priority === '高') return 'status-danger';
  if (priority === '低') return 'status-success';
  return 'status-neutral';
}

function getUnreadNotificationCount() {
  const data = getData();
  return data.notifications.filter(notification => !notification.read).length;
}

function updateNotificationButton() {
  const unread = getUnreadNotificationCount();
  if (!notificationBadge) return;
  notificationBadge.textContent = String(unread);
  notificationBadge.classList.toggle('hidden', unread === 0);
}

function updateGreeting() {
  const user = getCurrentUser();
  const data = getData();
  if (!greeting) return;

  if (!user) {
    greeting.textContent = '统一管理团队、线索、学校与数据看板，支持手机和桌面端自适应。';
    return;
  }

  const visibleLeads = getVisibleLeads(user, data);
  const pendingCount = visibleLeads.filter(lead => lead.enrollmentStatus === '待跟进').length;
  greeting.textContent = `${getTimeGreeting()}，当前有 ${pendingCount} 条待跟进线索需要关注。`;
}

function renderStatusPill(label, className) {
  return `<span class="status-pill ${className}">${escapeHTML(label)}</span>`;
}

function renderLeadMarkPills(lead) {
  const pills = [];
  if (lead.favorite) pills.push(renderStatusPill('收藏', 'status-primary'));
  if (lead.wechatAdded) pills.push(renderStatusPill('已加微', 'status-success'));
  if (lead.keep) pills.push(renderStatusPill('保留', 'status-warning'));
  if (lead.callOutcome) pills.push(renderStatusPill(lead.callOutcome, 'status-neutral'));
  return pills.length ? `<div class="lead-mark-pills">${pills.join('')}</div>` : '';
}

function renderActionButtons(buttons) {
  return `<div class="inline-actions">${buttons.filter(Boolean).join('')}</div>`;
}

function renderEmptyState(title, description) {
  return `
    <div class="empty-state">
      <h3>${escapeHTML(title)}</h3>
      <p>${escapeHTML(description)}</p>
    </div>
  `;
}

function renderSectionLayout({ title, description, actions = '', body = '', stats = '' }) {
  return `
    <div class="section-shell">
      <div class="section-top">
        <div class="section-copy">
          <h2 class="section-title">${escapeHTML(title)}</h2>
          <p class="small-text">${escapeHTML(description)}</p>
        </div>
        ${actions ? `<div class="section-actions">${actions}</div>` : ''}
      </div>
      ${stats}
      ${body}
    </div>
  `;
}

function getAccessibleSectionKeys(user) {
  if (user?.role === 'teacher' && !user.approved) return ['profile'];
  return sections.filter(section => section.roles.includes(user?.role)).map(section => section.key);
}

function updateWorkspaceSummary(sectionKey) {
  const section = getSectionMeta(sectionKey);
  if (currentSectionLabel) currentSectionLabel.textContent = section.label;
  if (workspaceTitle) workspaceTitle.textContent = section.label;
  if (workspaceHint) workspaceHint.textContent = section.hint;
}

function updateDeviceStatus() {
  const isMobile = window.innerWidth <= 1180;
  if (deviceStatus) deviceStatus.textContent = isMobile ? '移动端布局' : '桌面端布局';
  dashboardSidebar?.classList.toggle('is-mobile', isMobile);
  if (navToggleBtn) {
    const expanded = dashboard?.classList.contains('nav-open');
    navToggleBtn.textContent = isMobile
      ? (expanded ? '收起功能导航' : '展开功能导航')
      : '当前为桌面端导航';
    navToggleBtn.setAttribute('aria-expanded', String(Boolean(expanded)));
  }
}

function closeMobileNav() {
  if (window.innerWidth <= 1180) {
    dashboard?.classList.remove('nav-open');
  }
  updateDeviceStatus();
}

function renderTabs() {
  const user = getCurrentUser();
  sectionTabs.innerHTML = '';

  sections.forEach(section => {
    if (!section.roles.includes(user?.role)) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'tab-button';
    button.dataset.section = section.key;
    button.innerHTML = `
      <span class="tab-icon">${escapeHTML(section.icon)}</span>
      <span class="tab-copy">
        <span class="tab-title">${escapeHTML(section.label)}</span>
        <span class="tab-desc">${escapeHTML(section.hint)}</span>
      </span>
    `;
    button.addEventListener('click', () => setActiveSection(section.key));
    sectionTabs.appendChild(button);
  });
}

function setActiveSection(sectionKey) {
  const user = getCurrentUser();
  const visibleSections = getAccessibleSectionKeys(user);
  if (!visibleSections.includes(sectionKey)) {
    sectionKey = visibleSections[0] || 'overview';
  }

  uiState.activeSection = sectionKey;
  Array.from(sectionTabs.children).forEach(tab => {
    tab.classList.toggle('active', tab.dataset.section === sectionKey);
  });
  updateWorkspaceSummary(sectionKey);
  closeMobileNav();
  renderSection(sectionKey);
}

function renderOverviewSection(user, data) {
  const visibleTeams = getVisibleTeams(user, data);
  const visibleMembers = getVisibleMembers(user, data);
  const visibleLeads = getVisibleLeads(user, data);
  const visibleConnections = getVisibleConnections(user, data);
  const unreadCount = getUnreadNotificationCount();
  const pendingLeads = visibleLeads.filter(lead => lead.enrollmentStatus === '待跟进');
  const inProgressLeads = visibleLeads.filter(lead => lead.enrollmentStatus === '跟进中');
  const enrolledCount = visibleLeads.filter(lead => lead.enrollmentStatus === '已报名').length;
  const conversionRate = visibleLeads.length ? Math.round((enrolledCount / visibleLeads.length) * 100) : 0;

  const todos = [
    unreadCount ? { title: '处理未读消息', desc: `当前共有 ${unreadCount} 条未读消息等待查看。`, meta: '优先级高' } : null,
    pendingLeads[0] ? { title: `跟进 ${pendingLeads[0].name}`, desc: pendingLeads[0].followUp, meta: '待联系' } : null,
    inProgressLeads[0] ? { title: `推进 ${inProgressLeads[0].name} 报名进度`, desc: `当前状态：${inProgressLeads[0].enrollmentStatus}`, meta: '跟进中' } : null,
    !pendingLeads.length && !unreadCount ? { title: '今日任务已清空', desc: '当前没有待处理提醒，可以继续完善数据与复盘线索。', meta: '状态良好' } : null,
  ].filter(Boolean);

  const quickActions = [
    '<button type="button" class="quick-action-btn" data-add-lead="true">新增线索</button>',
    '<button type="button" class="quick-action-btn" data-switch-section="monitor">查看看板</button>',
    '<button type="button" class="quick-action-btn" data-open-notifications="true">打开消息</button>',
  ];

  if (isSuperAdmin(user) || isTeamLead(user)) {
    quickActions.splice(1, 0, '<button type="button" class="quick-action-btn" data-add-member="true">新增成员</button>');
  }

  const recentLeads = [...visibleLeads].sort((left, right) => right.id - left.id).slice(0, 4);
  const recentNotifications = data.notifications.slice(0, 4);

  return `
    <div class="section-shell">
      <div class="hero-card">
        <div class="hero-main">
          <div class="eyebrow">欢迎进入中文化重构版工作台</div>
          <h2>${escapeHTML(formatRoleLabel(user.role))}专属视图已就绪</h2>
          <p>页面已完成整体视觉升级、核心功能补齐、消息体系优化与手机端响应式适配，支持随时切换角色查看不同权限范围。</p>
          <div class="hero-tags">
            ${renderStatusPill(`未读消息 ${unreadCount}`, unreadCount ? 'status-warning' : 'status-success')}
            ${renderStatusPill(`待跟进 ${pendingLeads.length}`, pendingLeads.length ? 'status-danger' : 'status-success')}
            ${renderStatusPill(`转化率 ${conversionRate}%`, 'status-primary')}
          </div>
        </div>
        <div class="hero-side">
          <div class="hero-metric"><span>可见团队</span><strong>${visibleTeams.length}</strong></div>
          <div class="hero-metric"><span>负责成员</span><strong>${visibleMembers.length}</strong></div>
          <div class="hero-metric"><span>有效线索</span><strong>${visibleLeads.length}</strong></div>
        </div>
      </div>

      <div class="stats-grid">
        <div class="stats-card"><h3>待跟进线索</h3><p>${pendingLeads.length}</p></div>
        <div class="stats-card"><h3>跟进中线索</h3><p>${inProgressLeads.length}</p></div>
        <div class="stats-card"><h3>已报名人数</h3><p>${enrolledCount}</p></div>
        <div class="stats-card"><h3>对接关系数</h3><p>${visibleConnections.length}</p></div>
      </div>

      <div class="overview-grid">
        <section class="panel">
          <div class="panel-header">
            <div>
              <h3 class="panel-title">今日待办</h3>
              <p class="panel-caption">结合消息与线索状态自动生成。</p>
            </div>
          </div>
          <div class="todo-list">
            ${todos.map(item => `
              <div class="todo-item">
                <div class="todo-main">
                  <strong>${escapeHTML(item.title)}</strong>
                  <p>${escapeHTML(item.desc)}</p>
                </div>
                <span class="todo-meta">${escapeHTML(item.meta)}</span>
              </div>
            `).join('')}
          </div>
        </section>

        <section class="panel">
          <div class="panel-header">
            <div>
              <h3 class="panel-title">快捷操作</h3>
              <p class="panel-caption">常用入口直接直达。</p>
            </div>
          </div>
          <div class="quick-actions">${quickActions.join('')}</div>
        </section>

        <section class="panel">
          <div class="panel-header">
            <div>
              <h3 class="panel-title">最近线索</h3>
              <p class="panel-caption">优先查看新建或待跟进线索。</p>
            </div>
          </div>
          <div class="list-compact">
            ${recentLeads.length ? recentLeads.map(lead => `
              <div class="list-row">
                <div class="list-row-main">
                  <strong>${escapeHTML(lead.name)}</strong>
                  <p>${escapeHTML(lead.grade)} · ${escapeHTML(lead.parent)} · ${escapeHTML(lead.assignedTeacher)}</p>
                </div>
                ${renderStatusPill(lead.enrollmentStatus, getStatusClass(lead.enrollmentStatus))}
              </div>
            `).join('') : renderEmptyState('暂无线索', '当前角色下没有可查看的线索数据。')}
          </div>
        </section>

        <section class="panel">
          <div class="panel-header">
            <div>
              <h3 class="panel-title">最新公告</h3>
              <p class="panel-caption">系统通知与团队提醒汇总。</p>
            </div>
          </div>
          <div class="announcement-list">
            ${recentNotifications.map(notification => `
              <div class="announcement-item">
                <div class="announcement-head">
                  <strong>${escapeHTML(notification.title)}</strong>
                  ${renderStatusPill(notificationLabels[notification.category], 'status-neutral')}
                </div>
                <p>${escapeHTML(notification.body)}</p>
                <span class="announcement-meta">${escapeHTML(notification.time)}</span>
              </div>
            `).join('')}
          </div>
        </section>
      </div>
    </div>
  `;
}

function renderTeamSection(user, data) {
  const search = uiState.filters.teamSearch.trim();
  const visibleTeams = getVisibleTeams(user, data);
  const filteredTeams = visibleTeams.filter(team => includesKeyword([team.schoolName, team.contacts, team.phone], search));
  const contactFilled = filteredTeams.filter(team => team.contacts).length;

  const stats = `
    <div class="stats-grid compact-grid">
      <div class="stats-card"><h3>当前团队</h3><p>${filteredTeams.length}</p></div>
      <div class="stats-card"><h3>已配置联系人</h3><p>${contactFilled}</p></div>
      <div class="stats-card"><h3>分组编号</h3><p>${filteredTeams.map(team => team.teamId).join(' / ') || '无'}</p></div>
    </div>
  `;

  const body = `
    <div class="filter-bar">
      <input class="search-input" type="search" placeholder="搜索学校名称、联系人或电话" value="${escapeHTML(uiState.filters.teamSearch)}" data-filter-section="team" data-filter-key="teamSearch" />
    </div>
    ${filteredTeams.length ? `
      <div class="table-card">
        <table>
          <thead>
            <tr>
              <th>学校名称</th>
              <th>团队类型</th>
              <th>联系人邮箱</th>
              <th>联系电话</th>
              <th>分组</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            ${filteredTeams.map(team => `
              <tr>
                <td data-label="学校名称">${escapeHTML(team.schoolName)}</td>
                <td data-label="团队类型">${escapeHTML(team.role)}</td>
                <td data-label="联系人邮箱">${escapeHTML(team.contacts)}</td>
                <td data-label="联系电话">${escapeHTML(team.phone)}</td>
                <td data-label="分组">${escapeHTML(getTeamLabel(team.teamId, data))}</td>
                <td data-label="操作">
                  ${canEditTeam(team, user)
                    ? renderActionButtons([
                      `<button type="button" class="text-button" data-edit-team="${team.id}">编辑</button>`,
                      `<button type="button" class="text-button danger-text" data-delete-team="${team.id}">删除</button>`,
                    ])
                    : '<span class="muted-text">仅查看</span>'}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    ` : renderEmptyState('未找到团队数据', '请调整搜索条件，或新增团队信息。')}
  `;

  return renderSectionLayout({
    title: '招生团队',
    description: '统一维护招生团队分组、学校联系人和团队基础资料。',
    actions: isSuperAdmin(user) || isTeamLead(user)
      ? '<button type="button" class="primary-button" data-add-team="true">新增团队</button>'
      : '',
    stats,
    body,
  });
}

function renderMembersSection(user, data) {
  const search = uiState.filters.memberSearch.trim();
  const visibleMembers = getVisibleMembers(user, data);
  const filteredMembers = visibleMembers.filter(member => includesKeyword([member.name, member.title, member.email, member.phone], search));
  const leadCount = filteredMembers.filter(member => member.title.includes('负责人')).length;

  const stats = `
    <div class="stats-grid compact-grid">
      <div class="stats-card"><h3>可见成员</h3><p>${filteredMembers.length}</p></div>
      <div class="stats-card"><h3>负责人数量</h3><p>${leadCount}</p></div>
      <div class="stats-card"><h3>归属分组</h3><p>${[...new Set(filteredMembers.map(member => member.teamId))].length}</p></div>
    </div>
  `;

  const body = `
    <div class="filter-bar">
      <input class="search-input" type="search" placeholder="搜索姓名、岗位、邮箱或电话" value="${escapeHTML(uiState.filters.memberSearch)}" data-filter-section="members" data-filter-key="memberSearch" />
    </div>
    ${filteredMembers.length ? `
      <div class="table-card">
        <table>
          <thead>
            <tr>
              <th>姓名</th>
              <th>岗位</th>
              <th>邮箱</th>
              <th>电话</th>
              <th>所属团队</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            ${filteredMembers.map(member => `
              <tr>
                <td data-label="姓名">${escapeHTML(member.name)} ${member.id === user.memberId ? renderStatusPill('当前账号', 'status-neutral') : ''}</td>
                <td data-label="岗位">${escapeHTML(member.title)}</td>
                <td data-label="邮箱">${escapeHTML(member.email)}</td>
                <td data-label="电话"><a class="plain-link" href="tel:${escapeHTML(normalizePhone(member.phone))}">${escapeHTML(member.phone)}</a></td>
                <td data-label="所属团队">${escapeHTML(getTeamLabel(member.teamId, data))}</td>
                <td data-label="操作">
                  ${canEditMember(member, user)
                    ? renderActionButtons([
                      `<button type="button" class="text-button" data-edit-member="${member.id}">编辑</button>`,
                      canDeleteMember(member, user) ? `<button type="button" class="text-button danger-text" data-delete-member="${member.id}">删除</button>` : '',
                    ])
                    : '<span class="muted-text">仅查看</span>'}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    ` : renderEmptyState('没有匹配的成员', '请尝试调整关键词，或新增团队成员。')}
  `;

  return renderSectionLayout({
    title: '团队成员',
    description: '维护成员信息、所属分组和联系方式，支持负责人与老师分级管理。',
    actions: isSuperAdmin(user) || isTeamLead(user)
      ? '<button type="button" class="primary-button" data-add-member="true">新增成员</button>'
      : '',
    stats,
    body,
  });
}

function renderSchoolsSection(user, data) {
  const search = uiState.filters.schoolSearch.trim();
  const visibleSchools = getVisibleSchools(user, data);
  const filteredSchools = visibleSchools.filter(school => includesKeyword([school.name, school.location], search));

  const stats = `
    <div class="stats-grid compact-grid">
      <div class="stats-card"><h3>学校总数</h3><p>${filteredSchools.length}</p></div>
      <div class="stats-card"><h3>覆盖区域</h3><p>${[...new Set(filteredSchools.map(school => school.location))].length}</p></div>
      <div class="stats-card"><h3>已关联分组</h3><p>${[...new Set(filteredSchools.map(school => school.teamId))].length}</p></div>
    </div>
  `;

  const body = `
    <div class="filter-bar">
      <input class="search-input" type="search" placeholder="搜索学校名称或所在区域" value="${escapeHTML(uiState.filters.schoolSearch)}" data-filter-section="schools" data-filter-key="schoolSearch" />
    </div>
    ${filteredSchools.length ? `
      <div class="table-card">
        <table>
          <thead>
            <tr>
              <th>学校名称</th>
              <th>所在区域</th>
              <th>所属分组</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            ${filteredSchools.map(school => `
              <tr>
                <td data-label="学校名称">${escapeHTML(school.name)}</td>
                <td data-label="所在区域">${escapeHTML(school.location)}</td>
                <td data-label="所属分组">${escapeHTML(getTeamLabel(school.teamId, data))}</td>
                <td data-label="操作">
                  ${canEditSchool(school, user)
                    ? renderActionButtons([
                      `<button type="button" class="text-button" data-edit-school="${school.id}">编辑</button>`,
                      `<button type="button" class="text-button danger-text" data-delete-school="${school.id}">删除</button>`,
                    ])
                    : '<span class="muted-text">仅查看</span>'}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    ` : renderEmptyState('没有符合条件的学校', '请调整搜索条件，或新增学校资料。')}
  `;

  return renderSectionLayout({
    title: '招生学校',
    description: '记录学校基础信息、区域分布和所属团队，用于后续对接与复盘。',
    actions: isSuperAdmin(user) || isTeamLead(user)
      ? '<button type="button" class="primary-button" data-add-school="true">新增学校</button>'
      : '',
    stats,
    body,
  });
}

function renderLeadsSection(user, data) {
  const search = uiState.filters.leadSearch.trim();
  const leadStatus = uiState.filters.leadStatus;
  const visibleLeads = getVisibleLeads(user, data);
  const filteredLeads = visibleLeads.filter(lead => {
    const matchesSearch = includesKeyword([lead.name, lead.grade, lead.parent, lead.assignedTeacher, lead.followUp], search);
    const matchesStatus = leadStatus === 'all' ? true : lead.enrollmentStatus === leadStatus;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = filteredLeads.filter(lead => lead.enrollmentStatus === '待跟进').length;
  const calledCount = filteredLeads.filter(lead => lead.called).length;
  const enrolledCount = filteredLeads.filter(lead => lead.enrollmentStatus === '已报名').length;

  const stats = `
    <div class="stats-grid compact-grid">
      <div class="stats-card"><h3>可见线索</h3><p>${filteredLeads.length}</p></div>
      <div class="stats-card"><h3>已联系家长</h3><p>${calledCount}</p></div>
      <div class="stats-card"><h3>待跟进</h3><p>${pendingCount}</p></div>
      <div class="stats-card"><h3>已报名</h3><p>${enrolledCount}</p></div>
    </div>
  `;

  const body = `
    <div class="filter-bar">
      <div class="import-tip">支持复制粘贴批量导入、文件导入（.xlsx/.xls/.csv），并可对号码进行收藏、加微、保留等标记。</div>
      <input class="search-input" type="search" placeholder="搜索学生、家长、负责人或跟进内容" value="${escapeHTML(uiState.filters.leadSearch)}" data-filter-section="leads" data-filter-key="leadSearch" />
      <select data-filter-section="leads" data-filter-key="leadStatus">
        <option value="all"${uiState.filters.leadStatus === 'all' ? ' selected' : ''}>全部状态</option>
        <option value="待跟进"${uiState.filters.leadStatus === '待跟进' ? ' selected' : ''}>待跟进</option>
        <option value="跟进中"${uiState.filters.leadStatus === '跟进中' ? ' selected' : ''}>跟进中</option>
        <option value="已报名"${uiState.filters.leadStatus === '已报名' ? ' selected' : ''}>已报名</option>
        <option value="已搁置"${uiState.filters.leadStatus === '已搁置' ? ' selected' : ''}>已搁置</option>
      </select>
    </div>
    ${filteredLeads.length ? `
      <div class="table-card">
        <table>
          <thead>
            <tr>
              <th>学生信息</th>
              <th>家长电话</th>
              <th>联系状态</th>
              <th>优先级</th>
              <th>跟进内容</th>
              <th>负责人</th>
              <th>最近联系</th>
              <th>报名状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            ${filteredLeads.map(lead => `
              <tr>
                <td data-label="学生信息"><strong>${escapeHTML(lead.nickname || lead.name || '未命名')}</strong><br /><span class="muted-text">${escapeHTML([lead.grade, lead.parent].filter(Boolean).join(' · ') || (lead.note ? lead.note : ''))}</span></td>
                <td data-label="家长电话"><a class="plain-link" href="tel:${escapeHTML(normalizePhone(lead.phone))}">${escapeHTML(lead.phone)}</a></td>
                <td data-label="联系状态">
                  ${renderStatusPill(lead.called ? '已联系' : '未联系', lead.called ? 'status-success' : 'status-warning')}
                  ${renderLeadMarkPills(lead)}
                </td>
                <td data-label="优先级">${renderStatusPill(lead.priority, getPriorityClass(lead.priority))}</td>
                <td data-label="跟进内容">${escapeHTML(lead.followUp)}</td>
                <td data-label="负责人">${escapeHTML(lead.assignedTeacher)}</td>
                <td data-label="最近联系">${escapeHTML(lead.lastContactTime || '未记录')}</td>
                <td data-label="报名状态">${renderStatusPill(lead.enrollmentStatus, getStatusClass(lead.enrollmentStatus))}</td>
                <td data-label="操作">
                  ${canEditLead(lead, user)
                    ? renderActionButtons([
                      `<button type="button" class="text-button" data-favorite-lead="${lead.id}">${lead.favorite ? '取消收藏' : '收藏'}</button>`,
                      `<button type="button" class="text-button" data-wechat-lead="${lead.id}">加微</button>`,
                      `<button type="button" class="text-button" data-keep-lead="${lead.id}">${lead.keep ? '取消保留' : '保留'}</button>`,
                      `<button type="button" class="text-button" data-edit-lead="${lead.id}">编辑</button>`,
                      `<button type="button" class="text-button" data-call-lead="${lead.id}">${lead.called ? '更新联系' : '记录联系'}</button>`,
                      `<button type="button" class="text-button danger-text" data-delete-lead="${lead.id}">删除</button>`,
                    ])
                    : '<span class="muted-text">仅查看</span>'}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    ` : renderEmptyState('没有匹配的线索', '请修改筛选条件，或新增学生线索。')}
  `;

  return renderSectionLayout({
    title: '线索跟进',
    description: '管理家长咨询、联系记录、优先级和报名状态，提升跟进效率。',
    actions: `
      <button type="button" class="outline-button" data-show-lead-import-help="true">导入说明</button>
      <button type="button" class="secondary-button" data-import-leads-text="true">文本导入</button>
      <button type="button" class="secondary-button" data-import-leads-image="true">图片导入</button>
      <button type="button" class="secondary-button" data-import-leads-wechat="true">微信导入</button>
      <button type="button" class="secondary-button" data-import-leads="true">一键导入 Excel</button>
      <button type="button" class="primary-button" data-add-lead="true">新增线索</button>
    `,
    stats,
    body,
  });
}

function summarizeConnectionStatus(connection, leads) {
  const related = leads.filter(lead => lead.assignedTeacherId === connection.recruitmentTeacherId);
  if (!related.length) return '暂无线索';

  const summary = related.reduce((result, lead) => {
    result[lead.enrollmentStatus] = (result[lead.enrollmentStatus] || 0) + 1;
    return result;
  }, {});

  return Object.entries(summary).map(([status, count]) => `${status} ${count} 条`).join(' / ');
}

function renderConnectionsSection(user, data) {
  const search = uiState.filters.connectionSearch.trim();
  const visibleConnections = getVisibleConnections(user, data);
  const visibleLeads = getVisibleLeads(user, data);
  const filteredConnections = visibleConnections.filter(connection => includesKeyword([connection.school, connection.className, connection.headTeacher, connection.recruitmentTeacher], search));

  const stats = `
    <div class="stats-grid compact-grid">
      <div class="stats-card"><h3>对接关系</h3><p>${filteredConnections.length}</p></div>
      <div class="stats-card"><h3>覆盖班级</h3><p>${[...new Set(filteredConnections.map(connection => connection.className))].length}</p></div>
      <div class="stats-card"><h3>关联线索</h3><p>${visibleLeads.length}</p></div>
    </div>
  `;

  const body = `
    <div class="filter-bar">
      <input class="search-input" type="search" placeholder="搜索学校、班级、班主任或招生老师" value="${escapeHTML(uiState.filters.connectionSearch)}" data-filter-section="connections" data-filter-key="connectionSearch" />
    </div>
    ${filteredConnections.length ? `
      <div class="table-card">
        <table>
          <thead>
            <tr>
              <th>学校</th>
              <th>班级</th>
              <th>班主任</th>
              <th>招生老师</th>
              <th>分组</th>
              <th>线索进展</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            ${filteredConnections.map(connection => `
              <tr>
                <td data-label="学校">${escapeHTML(connection.school)}</td>
                <td data-label="班级">${escapeHTML(connection.className)}</td>
                <td data-label="班主任">${escapeHTML(connection.headTeacher)}</td>
                <td data-label="招生老师">${escapeHTML(connection.recruitmentTeacher)}</td>
                <td data-label="分组">${escapeHTML(getTeamLabel(connection.teamId, data))}</td>
                <td data-label="线索进展">${escapeHTML(summarizeConnectionStatus(connection, visibleLeads))}</td>
                <td data-label="操作">
                  ${canEditConnection(connection, user)
                    ? renderActionButtons([
                      `<button type="button" class="text-button" data-edit-connection="${connection.id}">编辑</button>`,
                      `<button type="button" class="text-button danger-text" data-delete-connection="${connection.id}">删除</button>`,
                    ])
                    : '<span class="muted-text">仅查看</span>'}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    ` : renderEmptyState('没有匹配的对接关系', '请调整关键词，或新增学校与班级对接关系。')}
  `;

  return renderSectionLayout({
    title: '对接关系',
    description: '维护学校、班级、班主任和招生老师之间的对应关系，方便线索归因与协同跟进。',
    actions: isSuperAdmin(user) || isTeamLead(user)
      ? '<button type="button" class="primary-button" data-add-connection="true">新增对接</button>'
      : '',
    stats,
    body,
  });
}

function renderMonitorSection(user, data) {
  const visibleLeads = getVisibleLeads(user, data);
  const visibleConnections = getVisibleConnections(user, data);
  const visibleMembers = isTeamMember(user) ? getVisibleMembers(user, data) : getAssignableMembers(user, data);

  const totalLeads = visibleLeads.length;
  const calledCount = visibleLeads.filter(lead => lead.called).length;
  const pendingCount = visibleLeads.filter(lead => lead.enrollmentStatus === '待跟进').length;
  const inProgressCount = visibleLeads.filter(lead => lead.enrollmentStatus === '跟进中').length;
  const enrolledCount = visibleLeads.filter(lead => lead.enrollmentStatus === '已报名').length;

  const recruiterStats = visibleMembers.map(member => {
    const memberLeads = visibleLeads.filter(lead => lead.assignedTeacherId === member.id);
    const called = memberLeads.filter(lead => lead.called).length;
    const enrolled = memberLeads.filter(lead => lead.enrollmentStatus === '已报名').length;
    const callRate = memberLeads.length ? Math.round((called / memberLeads.length) * 100) : 0;
    const enrollRate = memberLeads.length ? Math.round((enrolled / memberLeads.length) * 100) : 0;
    return { member, total: memberLeads.length, callRate, enrollRate };
  }).sort((left, right) => right.total - left.total);

  const funnelSteps = [
    { label: '线索总量', value: totalLeads, ratio: totalLeads ? 100 : 0 },
    { label: '已联系家长', value: calledCount, ratio: totalLeads ? Math.max(12, Math.round((calledCount / totalLeads) * 100)) : 0 },
    { label: '跟进中', value: inProgressCount, ratio: totalLeads ? Math.max(12, Math.round((inProgressCount / totalLeads) * 100)) : 0 },
    { label: '已报名', value: enrolledCount, ratio: totalLeads ? Math.max(12, Math.round((enrolledCount / totalLeads) * 100)) : 0 },
  ];

  return `
    <div class="section-shell">
      <div class="section-top">
        <div class="section-copy">
          <h2 class="section-title">数据看板</h2>
          <p class="small-text">聚合查看线索转化、成员跟进效率和学校对接情况，支持手机端纵向展示。</p>
        </div>
      </div>

      <div class="stats-grid">
        <div class="stats-card"><h3>线索总量</h3><p>${totalLeads}</p></div>
        <div class="stats-card"><h3>待跟进</h3><p>${pendingCount}</p></div>
        <div class="stats-card"><h3>跟进中</h3><p>${inProgressCount}</p></div>
        <div class="stats-card"><h3>已报名</h3><p>${enrolledCount}</p></div>
      </div>

      <div class="monitor-grid">
        <section class="panel">
          <div class="panel-header">
            <div>
              <h3 class="panel-title">转化漏斗</h3>
              <p class="panel-caption">从线索到报名的阶段分布。</p>
            </div>
          </div>
          <div class="funnel">
            ${funnelSteps.map(step => `
              <div class="funnel-step">
                <div class="funnel-label">${escapeHTML(step.label)}</div>
                <div class="funnel-bar"><div class="funnel-fill" style="width:${step.ratio}%"></div></div>
                <div class="funnel-value">${step.value}</div>
              </div>
            `).join('')}
          </div>
        </section>

        <section class="panel">
          <div class="panel-header">
            <div>
              <h3 class="panel-title">成员跟进效率</h3>
              <p class="panel-caption">按招生老师查看线索量、联系率与报名率。</p>
            </div>
          </div>
          <div class="progress-list">
            ${recruiterStats.length ? recruiterStats.map(item => `
              <div class="progress-item">
                <div class="progress-head"><strong>${escapeHTML(item.member.name)}</strong><span>${item.total} 条线索</span></div>
                <div class="progress-row"><span>联系率 ${item.callRate}%</span><div class="progress-bar"><div class="progress-fill" style="width:${item.callRate}%"></div></div></div>
                <div class="progress-row"><span>报名率 ${item.enrollRate}%</span><div class="progress-bar"><div class="progress-fill secondary" style="width:${item.enrollRate}%"></div></div></div>
              </div>
            `).join('') : renderEmptyState('暂无成员数据', '当前角色下没有可统计的成员线索数据。')}
          </div>
        </section>
      </div>

      <section class="panel">
        <div class="panel-header">
          <div>
            <h3 class="panel-title">学校对接概览</h3>
            <p class="panel-caption">结合学校班级对接关系与线索状态，快速识别重点渠道。</p>
          </div>
        </div>
        ${visibleConnections.length ? `
          <div class="table-card">
            <table>
              <thead>
                <tr>
                  <th>学校</th>
                  <th>班级</th>
                  <th>招生老师</th>
                  <th>当前进展</th>
                </tr>
              </thead>
              <tbody>
                ${visibleConnections.map(connection => `
                  <tr>
                    <td data-label="学校">${escapeHTML(connection.school)}</td>
                    <td data-label="班级">${escapeHTML(connection.className)}</td>
                    <td data-label="招生老师">${escapeHTML(connection.recruitmentTeacher)}</td>
                    <td data-label="当前进展">${escapeHTML(summarizeConnectionStatus(connection, visibleLeads))}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : renderEmptyState('暂无对接关系', '当前角色下还没有学校对接记录。')}
      </section>
    </div>
  `;
}

function renderProfileSection(user) {
  const approvalText = user.role === 'teacher' && !user.approved
    ? '<div class="announcement-item"><div class="announcement-head"><strong>账号待审核</strong><span class="announcement-meta">请等待审核</span></div><p>你的招生老师账号已提交审核，审核通过后可进入工作台功能。</p></div>'
    : '';

  const stats = `
    <div class="stats-grid compact-grid">
      <div class="stats-card"><h3>姓名</h3><p>${escapeHTML(user.name || '未设置')}</p></div>
      <div class="stats-card"><h3>手机号</h3><p>${escapeHTML(user.phone || '未设置')}</p></div>
      <div class="stats-card"><h3>身份类型</h3><p>${escapeHTML(formatRoleLabel(user.role))}</p></div>
    </div>
  `;

  const body = `
    ${approvalText}
    <div class="panel">
      <div class="panel-header">
        <div>
          <h3 class="panel-title">个人信息</h3>
          <p class="panel-caption">系统默认以注册信息为准，修改后会同步更新显示。</p>
        </div>
      </div>
      <div class="list">
        ${renderListRow('姓名', user.name || '未设置')}
        ${renderListRow('手机号', user.phone || '未设置')}
      </div>
    </div>
  `;

  return renderSectionLayout({
    title: '个人中心',
    description: '查看并维护个人信息，修改仅对本人生效。',
    actions: `
      <button type="button" class="secondary-button" data-edit-profile="true">修改资料</button>
      <button type="button" class="outline-button" data-change-password="true">修改密码</button>
    `,
    stats,
    body,
  });
}

function renderListRow(label, value) {
  return `
    <div class="list-row">
      <div class="list-row-main">
        <strong>${escapeHTML(label)}</strong>
        <p>${escapeHTML(value)}</p>
      </div>
    </div>
  `;
}

function renderAccountsSection(user) {
  queueMicrotask(() => loadAccountsSection());
  return renderSectionLayout({
    title: '账号审核',
    description: '审核招生老师注册信息、维护团队，以及设置团队负责人。',
    actions: `
      <button type="button" class="primary-button" data-add-backend-team="true">新增团队</button>
      <button type="button" class="outline-button" data-refresh-accounts="true">刷新</button>
    `,
    body: `
      <div class="panel" id="accountsTeamPanel">
        <div class="panel-header">
          <div>
            <h3 class="panel-title">团队列表</h3>
            <p class="panel-caption">用于招生老师注册选择所属团队。</p>
          </div>
        </div>
        <div class="table-card"><div class="muted-text">加载中...</div></div>
      </div>

      <div class="panel" id="accountsPendingPanel" style="margin-top:16px">
        <div class="panel-header">
          <div>
            <h3 class="panel-title">待审核老师</h3>
            <p class="panel-caption">审核通过后，老师即可进入工作台。</p>
          </div>
        </div>
        <div class="table-card"><div class="muted-text">加载中...</div></div>
      </div>

      <div class="panel" id="accountsTeacherPanel" style="margin-top:16px">
        <div class="panel-header">
          <div>
            <h3 class="panel-title">已审核老师</h3>
            <p class="panel-caption">可设置/取消团队负责人。</p>
          </div>
        </div>
        <div class="table-card"><div class="muted-text">加载中...</div></div>
      </div>
    `,
  });
}

async function loadAccountsSection() {
  const user = getCurrentUser();
  if (!user || !isSuperAdmin(user)) return;
  const teamPanel = document.getElementById('accountsTeamPanel');
  const pendingPanel = document.getElementById('accountsPendingPanel');
  const teacherPanel = document.getElementById('accountsTeacherPanel');
  if (!teamPanel || !pendingPanel || !teacherPanel) return;

  try {
    const [{ teams }, { pending }, { teachers }] = await Promise.all([
      apiRequest('/api/admin/teams', { method: 'GET' }),
      apiRequest('/api/admin/pending-teachers', { method: 'GET' }),
      apiRequest('/api/admin/teachers', { method: 'GET' }),
    ]);

    teamPanel.querySelector('.table-card').innerHTML = teams.length ? `
      <table>
        <thead><tr><th>团队名称</th><th>操作</th></tr></thead>
        <tbody>
          ${teams.map(team => `
            <tr>
              <td data-label="团队名称">${escapeHTML(team.name)}</td>
              <td data-label="操作">${renderActionButtons([
                `<button type="button" class="text-button danger-text" data-delete-backend-team="${team.id}">删除</button>`,
              ])}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    ` : renderEmptyState('暂无团队', '请先新增团队后再进行老师注册。');

    pendingPanel.querySelector('.table-card').innerHTML = pending.length ? `
      <table>
        <thead><tr><th>姓名</th><th>手机号</th><th>团队</th><th>操作</th></tr></thead>
        <tbody>
          ${pending.map(item => `
            <tr>
              <td data-label="姓名">${escapeHTML(item.name)}</td>
              <td data-label="手机号">${escapeHTML(item.phone)}</td>
              <td data-label="团队">${escapeHTML(getTeamNameById(item.teamId, teams))}</td>
              <td data-label="操作">${renderActionButtons([
                `<button type="button" class="text-button" data-approve-teacher="${item.id}">通过</button>`,
                `<button type="button" class="text-button danger-text" data-reject-teacher="${item.id}">驳回</button>`,
              ])}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    ` : renderEmptyState('暂无待审核账号', '当前没有需要审核的招生老师注册信息。');

    teacherPanel.querySelector('.table-card').innerHTML = teachers.length ? `
      <table>
        <thead><tr><th>姓名</th><th>手机号</th><th>团队</th><th>负责人</th><th>操作</th></tr></thead>
        <tbody>
          ${teachers.map(item => `
            <tr>
              <td data-label="姓名">${escapeHTML(item.name)}</td>
              <td data-label="手机号">${escapeHTML(item.phone)}</td>
              <td data-label="团队">${escapeHTML(getTeamNameById(item.teamId, teams))}</td>
              <td data-label="负责人">${renderStatusPill(item.isTeamLead ? '是' : '否', item.isTeamLead ? 'status-success' : 'status-muted')}</td>
              <td data-label="操作">${renderActionButtons([
                `<button type="button" class="text-button" data-toggle-team-lead="${item.id}" data-team-lead="${item.isTeamLead ? '0' : '1'}">${item.isTeamLead ? '取消负责人' : '设为负责人'}</button>`,
              ])}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    ` : renderEmptyState('暂无老师账号', '请先完成老师注册并审核。');
  } catch {
    if (teamPanel.querySelector('.table-card')) teamPanel.querySelector('.table-card').innerHTML = renderEmptyState('加载失败', '请检查网络或稍后重试。');
    if (pendingPanel.querySelector('.table-card')) pendingPanel.querySelector('.table-card').innerHTML = renderEmptyState('加载失败', '请检查网络或稍后重试。');
    if (teacherPanel.querySelector('.table-card')) teacherPanel.querySelector('.table-card').innerHTML = renderEmptyState('加载失败', '请检查网络或稍后重试。');
  }
}

function getTeamNameById(teamId, teams) {
  return teams.find(team => team.id === teamId)?.name || '未设置';
}

function showProfileEditForm() {
  const user = getCurrentUser();
  if (!user) return;
  showModal({
    title: '修改资料',
    description: '修改后会以最新信息显示。',
    fields: [
      { name: 'name', label: '姓名', value: user.name || '', placeholder: '请输入姓名' },
    ],
    submitText: '保存修改',
    onSubmit: async payload => {
      try {
        const result = await apiRequest('/api/me', {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        saveAuth(result.user);
        showToast('个人信息已更新。', 'success');
        refreshCurrentSection();
        return true;
      } catch {
        showToast('更新失败，请稍后重试。', 'error');
        return false;
      }
    },
  });
}

function showPasswordChangeForm() {
  showModal({
    title: '修改密码',
    description: '密码需 8 位以上且包含字母与数字。',
    fields: [
      {
        name: 'password',
        label: '新密码',
        type: 'password',
        autocomplete: 'new-password',
        validate: value => (isStrongPassword(value) ? true : '密码需 8 位以上且包含字母与数字。'),
      },
      {
        name: 'confirmPassword',
        label: '确认新密码',
        type: 'password',
        autocomplete: 'new-password',
        validate: (value, payload) => (value === payload.password ? true : '两次输入密码不一致。'),
      },
    ],
    submitText: '确认修改',
    onSubmit: async payload => {
      try {
        await apiRequest('/api/me', {
          method: 'PATCH',
          body: JSON.stringify({ password: payload.password }),
        });
        showToast('密码已更新，请妥善保管。', 'success');
        return true;
      } catch {
        showToast('修改失败，请稍后重试。', 'error');
        return false;
      }
    },
  });
}

function showBackendTeamForm() {
  showModal({
    title: '新增团队',
    description: '创建后可用于招生老师注册选择所属团队。',
    fields: [{ name: 'name', label: '团队名称', placeholder: '请输入团队名称' }],
    submitText: '创建团队',
    onSubmit: async payload => {
      try {
        await apiRequest('/api/admin/teams', { method: 'POST', body: JSON.stringify(payload) });
        showToast('团队已创建。', 'success');
        loadAccountsSection();
        return true;
      } catch (error) {
        if (error.code === 'TEAM_EXISTS') {
          showToast('该团队名称已存在。', 'error');
          return false;
        }
        showToast('创建失败，请稍后重试。', 'error');
        return false;
      }
    },
  });
}

async function deleteBackendTeam(teamId) {
  const confirmed = await showConfirm({
    title: '删除团队',
    description: '删除后该团队将不可用于注册选择，且不可恢复。',
    confirmText: '确认删除',
  });
  if (!confirmed) return;
  try {
    await apiRequest(`/api/admin/teams/${teamId}`, { method: 'DELETE' });
    showToast('团队已删除。', 'success');
    loadAccountsSection();
  } catch (error) {
    if (error.code === 'TEAM_IN_USE') {
      showToast('该团队仍有关联的老师账号，无法删除。', 'error');
      return;
    }
    showToast('删除失败，请稍后重试。', 'error');
  }
}

async function approveTeacher(userId, approved) {
  try {
    await apiRequest('/api/admin/approve-teacher', {
      method: 'POST',
      body: JSON.stringify({ userId, approved }),
    });
    showToast(approved ? '已通过审核。' : '已驳回申请。', 'success');
    loadAccountsSection();
  } catch {
    showToast('操作失败，请稍后重试。', 'error');
  }
}

async function toggleTeamLead(userId, nextValue) {
  try {
    await apiRequest('/api/admin/set-team-lead', {
      method: 'POST',
      body: JSON.stringify({ userId, isTeamLead: Boolean(nextValue) }),
    });
    showToast('已更新负责人设置。', 'success');
    loadAccountsSection();
  } catch {
    showToast('操作失败，请稍后重试。', 'error');
  }
}

function renderSection(sectionKey) {
  const user = getCurrentUser();
  const data = getData();
  if (!user) return;

  const renderers = {
    overview: () => renderOverviewSection(user, data),
    team: () => renderTeamSection(user, data),
    members: () => renderMembersSection(user, data),
    schools: () => renderSchoolsSection(user, data),
    leads: () => renderLeadsSection(user, data),
    connections: () => renderConnectionsSection(user, data),
    monitor: () => renderMonitorSection(user, data),
    accounts: () => renderAccountsSection(user),
    profile: () => renderProfileSection(user),
  };

  sectionContent.innerHTML = renderers[sectionKey] ? renderers[sectionKey]() : '';
}

function refreshCurrentSection() {
  renderSection(uiState.activeSection);
}

function closeCurrentModal() {
  modalContainer.innerHTML = '';
}

function showModal({ title, description = '', fields = [], submitText = '保存', onSubmit }) {
  closeCurrentModal();

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const card = document.createElement('div');
  card.className = 'modal-card';
  overlay.appendChild(card);

  const header = document.createElement('div');
  header.className = 'modal-header';
  header.innerHTML = `
    <div>
      <h2>${escapeHTML(title)}</h2>
      ${description ? `<p class="modal-subtitle">${escapeHTML(description)}</p>` : ''}
    </div>
    <button type="button" class="close-btn" aria-label="关闭弹窗">&times;</button>
  `;
  card.appendChild(header);

  const form = document.createElement('form');
  form.className = 'modal-form';
  card.appendChild(form);

  fields.forEach(field => {
    const wrapper = document.createElement('label');
    wrapper.className = 'form-field';

    const labelText = document.createElement('span');
    labelText.textContent = field.label;
    wrapper.appendChild(labelText);

    let input;
    if (field.options) {
      input = document.createElement('select');
      field.options.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option.value;
        optionElement.textContent = option.label;
        if (String(field.value ?? '') === option.value) optionElement.selected = true;
        input.appendChild(optionElement);
      });
    } else if (field.type === 'textarea') {
      input = document.createElement('textarea');
      input.rows = field.rows || 4;
    } else {
      input = document.createElement('input');
      input.type = field.type || 'text';
    }

    input.name = field.name;
    input.value = field.value || '';
    input.required = field.required ?? true;
    input.placeholder = field.placeholder || '';
    input.readOnly = Boolean(field.readOnly);
    input.disabled = Boolean(field.disabled);
    if (field.inputMode) input.inputMode = field.inputMode;
    if (field.autocomplete) input.autocomplete = field.autocomplete;

    wrapper.appendChild(input);

    if (field.help) {
      const help = document.createElement('small');
      help.className = 'field-help';
      help.textContent = field.help;
      wrapper.appendChild(help);
    }

    form.appendChild(wrapper);
  });

  const actions = document.createElement('div');
  actions.className = 'modal-actions';
  actions.innerHTML = `<button type="submit" class="primary-button">${escapeHTML(submitText)}</button>`;
  form.appendChild(actions);

  const closeButton = header.querySelector('.close-btn');
  const close = () => {
    document.removeEventListener('keydown', onKeydown);
    overlay.remove();
  };
  const onKeydown = event => {
    if (event.key === 'Escape') close();
  };

  closeButton.addEventListener('click', close);
  overlay.addEventListener('click', event => {
    if (event.target === overlay) close();
  });
  document.addEventListener('keydown', onKeydown);

  form.addEventListener('submit', event => {
    event.preventDefault();
    const payload = {};
    let missingRequired = false;

    fields.forEach(field => {
      const control = form.querySelector(`[name="${field.name}"]`);
      const value = String(control ? control.value : '').trim();
      if ((field.required ?? true) && !value) missingRequired = true;
      payload[field.name] = value;
    });

    if (missingRequired) {
      showToast('请完整填写必填项。', 'error');
      return;
    }

    for (const field of fields) {
      if (typeof field.validate !== 'function') continue;
      const validationResult = field.validate(payload[field.name], payload);
      if (validationResult !== true) {
        showToast(validationResult || `请检查“${field.label}”填写是否正确。`, 'error');
        return;
      }
    }

    const submitButton = form.querySelector('button[type="submit"]');
    const result = onSubmit(payload);
    if (result && typeof result.then === 'function') {
      if (submitButton) submitButton.disabled = true;
      result.then(shouldClose => {
        if (submitButton) submitButton.disabled = false;
        if (shouldClose !== false) close();
      }).catch(() => {
        if (submitButton) submitButton.disabled = false;
      });
      return;
    }
    if (result !== false) close();
  });

  modalContainer.appendChild(overlay);
}

function showNotice(title, description) {
  showModal({
    title,
    description,
    fields: [],
    submitText: '我知道了',
    onSubmit: () => true,
  });
}

function showConfirm({ title, description, confirmText = '确认操作', cancelText = '取消' }) {
  closeCurrentModal();

  return new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    const card = document.createElement('div');
    card.className = 'modal-card';
    card.innerHTML = `
      <div class="modal-header">
        <div>
          <h2>${escapeHTML(title)}</h2>
          <p class="modal-subtitle">${escapeHTML(description)}</p>
        </div>
        <button type="button" class="close-btn" aria-label="关闭确认弹窗">&times;</button>
      </div>
      <div class="modal-actions">
        <button type="button" class="secondary-button" data-confirm-action="cancel">${escapeHTML(cancelText)}</button>
        <button type="button" class="primary-button" data-confirm-action="confirm">${escapeHTML(confirmText)}</button>
      </div>
    `;

    overlay.appendChild(card);

    const close = confirmed => {
      document.removeEventListener('keydown', onKeydown);
      overlay.remove();
      resolve(Boolean(confirmed));
    };

    const onKeydown = event => {
      if (event.key === 'Escape') close(false);
    };

    overlay.addEventListener('click', event => {
      if (event.target === overlay) close(false);
    });

    card.addEventListener('click', event => {
      const actionButton = event.target.closest('[data-confirm-action]');
      if (!actionButton) return;
      close(actionButton.dataset.confirmAction === 'confirm');
    });

    card.querySelector('.close-btn')?.addEventListener('click', () => close(false));
    document.addEventListener('keydown', onKeydown);
    modalContainer.appendChild(overlay);
  });
}

function showLeadImportGuide() {
  showNotice(
    '线索导入说明',
    '支持导入 .xlsx、.xls、.csv。表头至少包含“学生姓名”和“家长电话”，可选列包含：年级/班级、家长姓名、负责人、负责人ID、所属分组、报名状态、优先级、跟进内容、联系状态、最近联系。系统会按“学生姓名 + 家长电话”自动识别重复线索并更新。'
  );
}

function resolveImportedLeadOwnership(row, user, data) {
  if (isTeamMember(user)) {
    const teamId = Number(user.teamId) || 0;
    return { teamId, teacher: { id: 0, name: user.name || user.phone || '本人', teamId } };
  }

  const editableTeams = getEditableTeams(user, data);
  const assignableMembers = getAssignableMembers(user, data);

  if (!editableTeams.length || !assignableMembers.length) {
    return { error: '当前账号没有可用的分组或负责人，无法导入。' };
  }

  const importedTeamId = parseImportedTeamId(getImportCell(row, leadImportColumnAliases.teamId), data);
  const importedTeacherId = Number(getImportCell(row, leadImportColumnAliases.assignedTeacherId));
  const importedTeacherName = normalizeSearchText(localizeDemoText(getImportCell(row, leadImportColumnAliases.assignedTeacher)));

  let teacher = null;
  if (Number.isFinite(importedTeacherId) && importedTeacherId > 0) {
    teacher = assignableMembers.find(member => member.id === importedTeacherId) || null;
  }
  if (!teacher && importedTeacherName) {
    teacher = assignableMembers.find(member => normalizeSearchText(member.name) === importedTeacherName) || null;
  }

  let teamId = importedTeamId;
  if (!teamId && teacher) teamId = teacher.teamId;
  if (!teamId) teamId = editableTeams[0]?.teamId || null;

  if (!editableTeams.some(team => team.teamId === teamId)) {
    return { error: '导入的所属分组超出当前账号可操作范围。' };
  }

  if (!teacher) {
    teacher = assignableMembers.find(member => member.teamId === teamId) || assignableMembers[0] || null;
  }
  if (!teacher) {
    return { error: '没有找到可用负责人，请先维护团队成员。' };
  }
  if (teacher.teamId !== teamId) {
    return { error: `负责人“${teacher.name}”与所属分组不一致。` };
  }

  return { teamId, teacher };
}

function importLeadRows(rows, fileName = '') {
  const user = getCurrentUser();
  const data = getData();
  const summary = {
    created: 0,
    updated: 0,
    skipped: 0,
    errors: [],
  };

  rows.forEach((row, index) => {
    const rowNumber = index + 2;
    if (isImportRowEmpty(row)) return;

    let name = localizeDemoText(getImportCell(row, leadImportColumnAliases.name));
    const phone = normalizePhone(getImportCell(row, leadImportColumnAliases.phone));
    const grade = localizeDemoText(getImportCell(row, leadImportColumnAliases.grade));
    const parent = localizeDemoText(getImportCell(row, leadImportColumnAliases.parent));
    const followUp = localizeDemoText(getImportCell(row, leadImportColumnAliases.followUp));
    const enrollmentStatus = getImportCell(row, leadImportColumnAliases.enrollmentStatus);
    const priority = getImportCell(row, leadImportColumnAliases.priority);
    const calledValue = getImportCell(row, leadImportColumnAliases.called);
    const lastContactTime = getImportCell(row, leadImportColumnAliases.lastContactTime);

    if (!phone) {
      summary.skipped += 1;
      summary.errors.push(`第 ${rowNumber} 行缺少电话号码`);
      return;
    }
    if (!name && isTeamMember(user)) name = phone;
    if (!name) {
      summary.skipped += 1;
      summary.errors.push(`第 ${rowNumber} 行缺少姓名`);
      return;
    }
    if (!isValidPhone(phone)) {
      summary.skipped += 1;
      summary.errors.push(`第 ${rowNumber} 行家长电话格式无效`);
      return;
    }

    const ownership = resolveImportedLeadOwnership(row, user, data);
    if (ownership.error) {
      summary.skipped += 1;
      summary.errors.push(`第 ${rowNumber} 行：${ownership.error}`);
      return;
    }

    const payload = {
      name,
      grade: grade || '待定',
      parent: parent || '家长',
      phone,
      followUp: followUp || '待补充跟进内容',
      assignedTeacherId: ownership.teacher.id,
      assignedTeacher: ownership.teacher.name,
      enrollmentStatus: mapEnrollmentStatus(enrollmentStatus || '待跟进'),
      teamId: ownership.teamId,
      priority: mapPriority(priority || '中'),
      called: parseImportedBoolean(calledValue, false),
      lastContactTime: String(lastContactTime || '').trim(),
      createdBy: user.id,
    };

    const existing = data.leadStudents.find(item => {
      return normalizeSearchText(item.name) === normalizeSearchText(name)
        && normalizePhone(item.phone) === phone;
    });

    if (existing) {
      existing.name = payload.name;
      existing.grade = payload.grade || existing.grade;
      existing.parent = payload.parent || existing.parent;
      existing.phone = payload.phone;
      existing.followUp = payload.followUp || existing.followUp;
      existing.assignedTeacherId = payload.assignedTeacherId;
      existing.assignedTeacher = payload.assignedTeacher;
      existing.enrollmentStatus = payload.enrollmentStatus || existing.enrollmentStatus;
      existing.teamId = payload.teamId || existing.teamId;
      existing.priority = payload.priority || existing.priority;
      existing.called = payload.called;
      existing.lastContactTime = payload.lastContactTime || existing.lastContactTime;
      summary.updated += 1;
      return;
    }

    data.leadStudents.push({
      id: generateId(),
      name: payload.name,
      grade: payload.grade,
      parent: payload.parent,
      phone: payload.phone,
      called: payload.called,
      followUp: payload.followUp,
      assignedTeacher: payload.assignedTeacher,
      assignedTeacherId: payload.assignedTeacherId,
      enrollmentStatus: payload.enrollmentStatus,
      teamId: payload.teamId,
      priority: payload.priority,
      lastContactTime: payload.lastContactTime,
    });
    summary.created += 1;
  });

  if (summary.created || summary.updated) {
    saveData(data);
    refreshCurrentSection();
  }

  if (!summary.created && !summary.updated && !summary.skipped) {
    summary.errors.push(`文件“${fileName || '当前文件'}”中没有识别到可导入的数据行`);
  }

  return summary;
}

function triggerLeadImport() {
  if (!leadImportInput) {
    showToast('未找到导入控件，请刷新页面后重试。', 'error');
    return;
  }
  if (!window.XLSX) {
    showToast('Excel 解析组件未加载完成，请检查网络后刷新页面。', 'error');
    return;
  }
  leadImportInput.value = '';
  leadImportInput.click();
}

async function handleLeadImportFileChange(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  if (!window.XLSX) {
    showToast('Excel 解析组件未加载完成，请检查网络后重试。', 'error');
    event.target.value = '';
    return;
  }

  try {
    const workbook = window.XLSX.read(await file.arrayBuffer(), { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    if (!worksheet) {
      showToast('导入失败：未读取到有效工作表。', 'error');
      return;
    }

    const rows = window.XLSX.utils.sheet_to_json(worksheet, {
      defval: '',
      raw: false,
    });
    const summary = importLeadRows(rows, file.name);
    if (summary.created || summary.updated) {
      showToast(`导入完成：新增 ${summary.created} 条，更新 ${summary.updated} 条。`, 'success');
    } else {
      showToast('未导入任何线索，请检查表头与数据内容。', 'error');
    }
    showNotice('线索导入结果', getImportSummaryMessage(summary));
  } catch (error) {
    showToast('Excel 导入失败，请确认文件格式是否正确。', 'error');
  } finally {
    event.target.value = '';
  }
}

function showTeamForm(id) {
  const user = getCurrentUser();
  const data = getData();
  const existing = data.team.find(item => item.id === id) || {};

  showModal({
    title: existing.id ? '编辑招生团队' : '新增招生团队',
    description: '统一维护团队学校名称、联系人和分组编号。',
    submitText: '保存团队',
    fields: [
      { name: 'schoolName', label: '学校名称', value: existing.schoolName || '', placeholder: '请输入学校名称' },
      { name: 'contacts', label: '联系人邮箱', type: 'email', value: existing.contacts || '', placeholder: '请输入联系邮箱', required: false, validate: value => isValidEmail(value) || '请输入正确的联系人邮箱。' },
      { name: 'phone', label: '联系电话', type: 'tel', value: existing.phone || '', placeholder: '请输入联系电话', inputMode: 'tel', validate: value => isValidPhone(value) || '请输入有效的联系电话。' },
      isSuperAdmin(user)
        ? { name: 'teamId', label: '分组编号', type: 'number', value: existing.teamId || '', placeholder: '请输入数字编号', inputMode: 'numeric' }
        : { name: 'teamId', label: '分组编号', value: String(existing.teamId || user.teamId || ''), readOnly: true, help: '团队负责人仅可维护所属分组。' },
    ],
    onSubmit: values => {
      const teamId = Number(values.teamId);
      if (!Number.isFinite(teamId) || teamId <= 0) {
        showToast('分组编号必须为有效数字。', 'error');
        return false;
      }

      const duplicated = data.team.find(item => item.teamId === teamId && item.id !== existing.id);
      if (duplicated) {
        showToast('该分组编号已存在，请更换后再保存。', 'error');
        return false;
      }
      if (isDuplicateText(data.team.map(item => ({ id: item.id, value: item.schoolName })), values.schoolName, existing.id)) {
        showToast('该学校团队名称已存在，请避免重复创建。', 'error');
        return false;
      }

      const payload = {
        schoolName: values.schoolName,
        role: '招生团队',
        contacts: values.contacts,
        phone: normalizePhone(values.phone),
        teamId,
      };

      if (existing.id) {
        const oldTeamId = existing.teamId;
        Object.assign(existing, payload);
        if (oldTeamId !== teamId) {
          data.members.forEach(member => {
            if (member.teamId === oldTeamId) member.teamId = teamId;
          });
          data.schools.forEach(school => {
            if (school.teamId === oldTeamId) school.teamId = teamId;
          });
          data.leadStudents.forEach(lead => {
            if (lead.teamId === oldTeamId) lead.teamId = teamId;
          });
          data.connections.forEach(connection => {
            if (connection.teamId === oldTeamId) connection.teamId = teamId;
          });
        }
      } else {
        data.team.push({ id: generateId(), ...payload });
      }

      saveData(data);
      refreshCurrentSection();
      showToast('团队信息已保存。', 'success');
      return true;
    },
  });
}

function showMemberForm(id) {
  const user = getCurrentUser();
  const data = getData();
  const existing = data.members.find(item => item.id === id) || {};
  const editableTeams = getEditableTeams(user, data);
  if (!editableTeams.length) {
    showToast('当前没有可用分组，请先创建团队。', 'error');
    return;
  }

  const teamOptions = editableTeams.map(team => ({ value: String(team.teamId), label: getTeamLabel(team.teamId, data) }));

  showModal({
    title: existing.id ? '编辑成员信息' : '新增团队成员',
    description: '成员变更会自动同步到线索负责人和学校对接记录中。',
    submitText: '保存成员',
    fields: [
      { name: 'name', label: '姓名', value: existing.name || '', placeholder: '请输入姓名' },
      { name: 'title', label: '岗位', value: existing.title || '', placeholder: '如：招生顾问 / 团队负责人' },
      { name: 'email', label: '邮箱', type: 'email', value: existing.email || '', placeholder: '请输入邮箱地址', validate: value => isValidEmail(value) || '请输入正确的邮箱地址。' },
      { name: 'phone', label: '联系电话', type: 'tel', value: existing.phone || '', placeholder: '请输入联系电话', inputMode: 'tel', validate: value => isValidPhone(value) || '请输入有效的联系电话。' },
      {
        name: 'teamId',
        label: '所属分组',
        options: teamOptions,
        value: String(existing.teamId || (isTeamMember(user) ? user.teamId : teamOptions[0]?.value || '')),
        required: true,
        disabled: isTeamMember(user),
        help: isTeamMember(user) ? '招生老师仅可查看自身所属分组。' : '',
      },
    ],
    onSubmit: values => {
      const memberId = existing.id || generateId();
      const teamId = Number(values.teamId || user.teamId);
      if (isDuplicateText(data.members.map(item => ({ id: item.id, value: item.email })), values.email, existing.id)) {
        showToast('该邮箱已被其他成员使用。', 'error');
        return false;
      }
      const payload = {
        name: values.name,
        title: values.title,
        email: values.email,
        phone: normalizePhone(values.phone),
        teamId,
      };

      if (existing.id) {
        Object.assign(existing, payload);
      } else {
        data.members.push({ id: memberId, ...payload });
      }

      data.leadStudents.forEach(lead => {
        if (lead.assignedTeacherId === memberId) {
          lead.assignedTeacher = payload.name;
          lead.teamId = teamId;
        }
      });

      data.connections.forEach(connection => {
        if (connection.recruitmentTeacherId === memberId) {
          connection.recruitmentTeacher = payload.name;
          connection.teamId = teamId;
        }
      });

      saveData(data);
      showToast('成员信息已保存。', 'success');
      refreshCurrentSection();
      return true;
    },
  });
}

function showSchoolForm(id) {
  const user = getCurrentUser();
  const data = getData();
  const existing = data.schools.find(item => item.id === id) || {};
  const editableTeams = getEditableTeams(user, data);
  if (!editableTeams.length) {
    showToast('请先创建招生团队后再维护学校。', 'error');
    return;
  }

  const teamOptions = editableTeams.map(team => ({ value: String(team.teamId), label: getTeamLabel(team.teamId, data) }));

  showModal({
    title: existing.id ? '编辑学校信息' : '新增招生学校',
    description: '学校名称变更后，会同步更新已建立的学校对接记录。',
    submitText: '保存学校',
    fields: [
      { name: 'name', label: '学校名称', value: existing.name || '', placeholder: '请输入学校名称' },
      { name: 'location', label: '所在区域', value: existing.location || '', placeholder: '请输入区域信息' },
      { name: 'teamId', label: '所属分组', options: teamOptions, value: String(existing.teamId || user.teamId || teamOptions[0]?.value || ''), required: true },
    ],
    onSubmit: values => {
      const schoolId = existing.id || generateId();
      const teamId = Number(values.teamId);
      const oldName = existing.name;
      if (isDuplicateText(data.schools.map(item => ({ id: item.id, value: item.name })), values.name, existing.id)) {
        showToast('该学校已存在，请直接编辑原记录。', 'error');
        return false;
      }
      const payload = { name: values.name, location: values.location, teamId };

      if (existing.id) {
        Object.assign(existing, payload);
      } else {
        data.schools.push({ id: schoolId, ...payload });
      }

      data.connections.forEach(connection => {
        if (connection.school === oldName) {
          connection.school = payload.name;
          connection.teamId = teamId;
        }
      });

      saveData(data);
      showToast('学校信息已保存。', 'success');
      refreshCurrentSection();
      return true;
    },
  });
}

function showLeadForm(id) {
  const user = getCurrentUser();
  const data = getData();
  const existing = data.leadStudents.find(item => item.id === id) || {};
  if (!isSuperAdmin(user)) {
    showModal({
      title: existing.id ? '编辑线索' : '新增线索',
      description: '用于记录电话号码、跟进备注与标记状态。',
      submitText: '保存线索',
      fields: [
        { name: 'name', label: '姓名', value: existing.name || '', placeholder: '可不填' , required: false },
        { name: 'phone', label: '电话号码', type: 'tel', value: existing.phone || '', placeholder: '请输入电话号码', inputMode: 'tel', validate: value => isValidPhone(value) || '请输入有效的电话号码。' },
        { name: 'followUp', label: '备注 / 跟进', type: 'textarea', value: existing.followUp || '', placeholder: '请输入备注或跟进记录', rows: 4 },
        {
          name: 'enrollmentStatus',
          label: '状态',
          options: [
            { value: '待跟进', label: '待跟进' },
            { value: '跟进中', label: '跟进中' },
            { value: '已报名', label: '已完成' },
            { value: '已搁置', label: '已搁置' },
          ],
          value: existing.enrollmentStatus || '待跟进',
        },
        {
          name: 'priority',
          label: '优先级',
          options: [
            { value: '高', label: '高' },
            { value: '中', label: '中' },
            { value: '低', label: '低' },
          ],
          value: existing.priority || '中',
        },
      ],
      onSubmit: values => {
        const leadId = existing.id || generateId();
        const normalizedPhone = normalizePhone(values.phone);
        const duplicateLead = data.leadStudents.find(item => item.id !== existing.id
          && normalizePhone(item.phone) === normalizedPhone
          && item.createdBy === user.id);
        if (duplicateLead) {
          showToast('该号码已存在于你的线索中，请避免重复导入。', 'error');
          return false;
        }

        const payload = {
          name: values.name,
          grade: existing.grade || '',
          parent: existing.parent || '',
          phone: normalizedPhone,
          followUp: values.followUp,
          assignedTeacherId: 0,
          assignedTeacher: user.name || user.phone || '本人',
          enrollmentStatus: mapEnrollmentStatus(values.enrollmentStatus),
          teamId: Number(user.teamId) || 0,
          priority: mapPriority(values.priority),
          createdBy: user.id,
        };

        if (existing.id) {
          Object.assign(existing, payload);
        } else {
          data.leadStudents.push({
            id: leadId,
            called: false,
            callOutcome: '',
            lastContactTime: '',
            favorite: false,
            nickname: '',
            note: '',
            wechatAdded: false,
            keep: false,
            ...payload,
          });
        }

        saveData(data);
        showToast('线索信息已保存。', 'success');
        refreshCurrentSection();
        return true;
      },
    });
    return;
  }

  const assignableMembers = getAssignableMembers(user, data);
  const editableTeams = getEditableTeams(user, data);

  if (!assignableMembers.length || !editableTeams.length) {
    showToast('请先配置团队成员与分组后再新增线索。', 'error');
    return;
  }

  const teacherOptions = assignableMembers.map(member => ({ value: String(member.id), label: `${member.name} · ${member.title}` }));
  const teamOptions = editableTeams.map(team => ({ value: String(team.teamId), label: getTeamLabel(team.teamId, data) }));

  showModal({
    title: existing.id ? '编辑线索' : '新增学生线索',
    description: '线索归属会按招生老师和团队自动联动校验。',
    submitText: '保存线索',
    fields: [
      { name: 'name', label: '学生姓名', value: existing.name || '', placeholder: '请输入学生姓名' },
      { name: 'grade', label: '年级 / 班级', value: existing.grade || '', placeholder: '请输入年级或班级' },
      { name: 'parent', label: '家长姓名', value: existing.parent || '', placeholder: '请输入家长姓名' },
      { name: 'phone', label: '家长电话', type: 'tel', value: existing.phone || '', placeholder: '请输入联系电话', inputMode: 'tel', validate: value => isValidPhone(value) || '请输入有效的家长电话。' },
      { name: 'followUp', label: '跟进内容', type: 'textarea', value: existing.followUp || '', placeholder: '请输入跟进说明', rows: 4 },
      { name: 'assignedTeacherId', label: '负责人', options: teacherOptions, value: String(existing.assignedTeacherId || teacherOptions[0]?.value || ''), required: true },
      {
        name: 'enrollmentStatus',
        label: '报名状态',
        options: [
          { value: '待跟进', label: '待跟进' },
          { value: '跟进中', label: '跟进中' },
          { value: '已报名', label: '已报名' },
          { value: '已搁置', label: '已搁置' },
        ],
        value: existing.enrollmentStatus || '待跟进',
      },
      {
        name: 'priority',
        label: '优先级',
        options: [
          { value: '高', label: '高' },
          { value: '中', label: '中' },
          { value: '低', label: '低' },
        ],
        value: existing.priority || '中',
      },
      {
        name: 'teamId',
        label: '所属分组',
        options: teamOptions,
        value: String(existing.teamId || teamOptions[0]?.value || ''),
        required: true,
      },
    ],
    onSubmit: values => {
      const leadId = existing.id || generateId();
      const assignedTeacherId = Number(values.assignedTeacherId);
      const teamId = Number(values.teamId);
      const teacher = data.members.find(member => member.id === assignedTeacherId);
      const duplicateLead = data.leadStudents.find(item => item.id !== existing.id
        && normalizeSearchText(item.name) === normalizeSearchText(values.name)
        && normalizePhone(item.phone) === normalizePhone(values.phone));

      if (!teacher) {
        showToast('请选择有效的负责人。', 'error');
        return false;
      }
      if (teacher.teamId !== teamId) {
        showToast('负责人必须属于当前分组，请重新选择。', 'error');
        return false;
      }
      if (duplicateLead) {
        showToast('同名且电话一致的线索已存在，请避免重复录入。', 'error');
        return false;
      }

      const payload = {
        name: values.name,
        grade: values.grade,
        parent: values.parent,
        phone: normalizePhone(values.phone),
        followUp: values.followUp,
        assignedTeacherId,
        assignedTeacher: teacher.name,
        enrollmentStatus: mapEnrollmentStatus(values.enrollmentStatus),
        teamId,
        priority: mapPriority(values.priority),
        createdBy: user.id,
      };

      if (existing.id) {
        Object.assign(existing, payload);
      } else {
        data.leadStudents.push({
          id: leadId,
          called: false,
          callOutcome: '',
          lastContactTime: '',
          favorite: false,
          nickname: '',
          note: '',
          wechatAdded: false,
          keep: false,
          ...payload,
        });
      }

      saveData(data);
      showToast('线索信息已保存。', 'success');
      refreshCurrentSection();
      return true;
    },
  });
}

function showConnectionForm(id) {
  const user = getCurrentUser();
  const data = getData();
  const existing = data.connections.find(item => item.id === id) || {};
  const visibleSchools = getVisibleSchools(user, data);
  const assignableMembers = getAssignableMembers(user, data);
  const editableTeams = getEditableTeams(user, data);

  if (!visibleSchools.length) {
    showToast('请先创建学校信息后再维护对接关系。', 'error');
    return;
  }
  if (!assignableMembers.length) {
    showToast('请先创建团队成员后再维护对接关系。', 'error');
    return;
  }

  const schoolOptions = visibleSchools.map(school => ({ value: school.name, label: `${school.name} · ${school.location}` }));
  const teacherOptions = assignableMembers.map(member => ({ value: String(member.id), label: `${member.name} · ${member.title}` }));
  const teamOptions = editableTeams.map(team => ({ value: String(team.teamId), label: getTeamLabel(team.teamId, data) }));

  showModal({
    title: existing.id ? '编辑对接关系' : '新增对接关系',
    description: '学校、班级、班主任和招生老师之间的关系会用于渠道分析和归因。',
    submitText: '保存对接',
    fields: [
      { name: 'school', label: '学校', options: schoolOptions, value: existing.school || schoolOptions[0]?.value || '', required: true },
      { name: 'className', label: '班级', value: existing.className || '', placeholder: '请输入班级信息' },
      { name: 'headTeacher', label: '班主任', value: existing.headTeacher || '', placeholder: '请输入班主任姓名' },
      { name: 'recruitmentTeacherId', label: '招生老师', options: teacherOptions, value: String(existing.recruitmentTeacherId || teacherOptions[0]?.value || ''), required: true },
      { name: 'teamId', label: '所属分组', options: teamOptions, value: String(existing.teamId || user.teamId || teamOptions[0]?.value || ''), required: true },
    ],
    onSubmit: values => {
      const connectionId = existing.id || generateId();
      const recruitmentTeacherId = Number(values.recruitmentTeacherId);
      const teamId = Number(values.teamId);
      const teacher = data.members.find(member => member.id === recruitmentTeacherId);
      const school = data.schools.find(item => item.name === values.school);
      const duplicateConnection = data.connections.find(item => item.id !== existing.id
        && normalizeSearchText(item.school) === normalizeSearchText(values.school)
        && normalizeSearchText(item.className) === normalizeSearchText(values.className)
        && item.recruitmentTeacherId === recruitmentTeacherId);

      if (!teacher) {
        showToast('请选择有效的招生老师。', 'error');
        return false;
      }
      if (teacher.teamId !== teamId) {
        showToast('招生老师必须属于当前分组。', 'error');
        return false;
      }
      if (school && school.teamId !== teamId) {
        showToast('所选学校与当前分组不一致，请重新选择。', 'error');
        return false;
      }
      if (duplicateConnection) {
        showToast('相同学校、班级与招生老师的对接关系已存在。', 'error');
        return false;
      }

      const payload = {
        school: values.school,
        className: values.className,
        headTeacher: values.headTeacher,
        recruitmentTeacherId,
        recruitmentTeacher: teacher.name,
        teamId,
      };

      if (existing.id) {
        Object.assign(existing, payload);
      } else {
        data.connections.push({ id: connectionId, ...payload });
      }

      saveData(data);
      showToast('对接关系已保存。', 'success');
      refreshCurrentSection();
      return true;
    },
  });
}

async function deleteTeam(id) {
  const data = getData();
  const target = data.team.find(team => team.id === id);
  if (!target) return;

  const hasDependencies = data.members.some(member => member.teamId === target.teamId)
    || data.schools.some(school => school.teamId === target.teamId)
    || data.leadStudents.some(lead => lead.teamId === target.teamId)
    || data.connections.some(connection => connection.teamId === target.teamId);

  if (hasDependencies) {
    showToast('该团队下仍存在成员、学校、线索或对接关系，请先清理后再删除。', 'error');
    return;
  }

  const confirmed = await showConfirm({
    title: '删除招生团队',
    description: `确认删除“${target.schoolName}”的团队记录吗？此操作不可撤销。`,
    confirmText: '确认删除',
  });
  if (!confirmed) return;
  data.team = data.team.filter(team => team.id !== id);
  saveData(data);
  refreshCurrentSection();
  showToast('团队记录已删除。', 'success');
}

async function deleteMember(id) {
  const data = getData();
  const target = data.members.find(member => member.id === id);
  const currentUser = getCurrentUser();
  if (!target) return;
  if (currentUser?.memberId === id) {
    showToast('当前登录账号不能直接删除。', 'error');
    return;
  }

  const hasDependencies = data.leadStudents.some(lead => lead.assignedTeacherId === id)
    || data.connections.some(connection => connection.recruitmentTeacherId === id);

  if (hasDependencies) {
    showToast('该成员仍关联线索或对接关系，请先调整负责人后再删除。', 'error');
    return;
  }

  const confirmed = await showConfirm({
    title: '删除团队成员',
    description: `确认删除成员“${target.name}”吗？删除后不可恢复。`,
    confirmText: '确认删除',
  });
  if (!confirmed) return;
  data.members = data.members.filter(member => member.id !== id);
  saveData(data);
  refreshCurrentSection();
  showToast('成员记录已删除。', 'success');
}

async function deleteSchool(id) {
  const data = getData();
  const target = data.schools.find(school => school.id === id);
  if (!target) return;
  if (data.connections.some(connection => connection.school === target.name)) {
    showToast('该学校仍存在对接关系，请先删除对接记录后再操作。', 'error');
    return;
  }

  const confirmed = await showConfirm({
    title: '删除招生学校',
    description: `确认删除学校“${target.name}”吗？此操作不可撤销。`,
    confirmText: '确认删除',
  });
  if (!confirmed) return;
  data.schools = data.schools.filter(school => school.id !== id);
  saveData(data);
  refreshCurrentSection();
  showToast('学校记录已删除。', 'success');
}

async function deleteLead(id) {
  const data = getData();
  const target = data.leadStudents.find(lead => lead.id === id);
  if (!target) return;
  const confirmed = await showConfirm({
    title: '删除学生线索',
    description: `确认删除线索“${target.name}”吗？删除后将无法恢复。`,
    confirmText: '确认删除',
  });
  if (!confirmed) return;
  data.leadStudents = data.leadStudents.filter(lead => lead.id !== id);
  saveData(data);
  refreshCurrentSection();
  showToast('线索记录已删除。', 'success');
}

async function deleteConnection(id) {
  const data = getData();
  const target = data.connections.find(connection => connection.id === id);
  if (!target) return;
  const confirmed = await showConfirm({
    title: '删除对接关系',
    description: `确认删除“${target.school} - ${target.className}”的对接关系吗？`,
    confirmText: '确认删除',
  });
  if (!confirmed) return;
  data.connections = data.connections.filter(connection => connection.id !== id);
  saveData(data);
  refreshCurrentSection();
  showToast('对接关系已删除。', 'success');
}

function markLeadCalled(id) {
  const user = getCurrentUser();
  const data = getData();
  const lead = data.leadStudents.find(item => item.id === id);
  if (!lead || !canEditLead(lead, user)) return;

  showModal({
    title: lead.called ? '更新联系记录' : '记录联系',
    description: '用于标记通话结果并补充跟进说明。',
    fields: [
      {
        name: 'callOutcome',
        label: '通话结果',
        options: [
          { value: '已接通', label: '已接通' },
          { value: '无人接听', label: '无人接听' },
          { value: '占线', label: '占线' },
          { value: '拒接', label: '拒接' },
          { value: '停机/空号', label: '停机/空号' },
          { value: '微信沟通', label: '微信沟通' },
          { value: '其他', label: '其他' },
        ],
        value: lead.callOutcome || (lead.called ? '已接通' : '已接通'),
      },
      { name: 'followUp', label: '备注 / 跟进', type: 'textarea', value: lead.followUp || '', placeholder: '请输入本次联系记录（可选）', rows: 4, required: false },
    ],
    submitText: '保存记录',
    onSubmit: values => {
      lead.called = true;
      lead.callOutcome = values.callOutcome;
      lead.lastContactTime = formatNow();
      if (values.followUp !== undefined && values.followUp !== null) {
        lead.followUp = values.followUp;
      }
      if (lead.enrollmentStatus === '待跟进') {
        lead.enrollmentStatus = '跟进中';
      }
      saveData(data);
      refreshCurrentSection();
      showToast('已更新联系记录。', 'success');
      return true;
    },
  });
}

function toggleLeadKeep(id) {
  const user = getCurrentUser();
  const data = getData();
  const lead = data.leadStudents.find(item => item.id === id);
  if (!lead || !canEditLead(lead, user)) return;
  lead.keep = !lead.keep;
  saveData(data);
  refreshCurrentSection();
  showToast(lead.keep ? '已标记为保留。' : '已取消保留。', 'success');
}

function handleLeadWechat(id) {
  const user = getCurrentUser();
  const data = getData();
  const lead = data.leadStudents.find(item => item.id === id);
  if (!lead || !canEditLead(lead, user)) return;
  const phone = normalizePhone(lead.phone);
  if (!phone) {
    showToast('该线索未填写电话号码。', 'error');
    return;
  }
  const copyPromise = navigator.clipboard?.writeText
    ? navigator.clipboard.writeText(phone)
    : Promise.reject();
  copyPromise.then(() => {
    lead.wechatAdded = true;
    saveData(data);
    refreshCurrentSection();
    showNotice('已复制号码', '已将号码复制到剪贴板，请打开微信添加好友并粘贴搜索。');
  }).catch(() => {
    showNotice('复制失败', `请手动复制号码：${phone}`);
  });
}

async function toggleLeadFavorite(id) {
  const user = getCurrentUser();
  const data = getData();
  const lead = data.leadStudents.find(item => item.id === id);
  if (!lead || !canEditLead(lead, user)) return;

  if (lead.favorite) {
    const confirmed = await showConfirm({
      title: '取消收藏',
      description: '确认取消该号码收藏吗？取消后昵称与备注会保留，但不再标记为收藏。',
      confirmText: '确认取消',
    });
    if (!confirmed) return;
    lead.favorite = false;
    saveData(data);
    refreshCurrentSection();
    showToast('已取消收藏。', 'success');
    return;
  }

  showModal({
    title: '收藏设置',
    description: '可设置昵称与备注，方便后续管理。',
    fields: [
      { name: 'nickname', label: '昵称', value: lead.nickname || lead.name || '', placeholder: '可选' , required: false },
      { name: 'note', label: '备注', type: 'textarea', value: lead.note || '', placeholder: '可选', rows: 3, required: false },
    ],
    submitText: '确认收藏',
    onSubmit: values => {
      lead.favorite = true;
      lead.nickname = values.nickname;
      lead.note = values.note;
      saveData(data);
      refreshCurrentSection();
      showToast('已收藏。', 'success');
      return true;
    },
  });
}

function showLeadTextImport() {
  showModal({
    title: '文本批量导入',
    description: '支持复制粘贴号码列表，系统会自动识别手机号/电话并去重导入。',
    fields: [
      { name: 'content', label: '号码文本', type: 'textarea', placeholder: '每行一个号码，或用空格/逗号分隔', rows: 6 },
    ],
    submitText: '开始导入',
    onSubmit: values => {
      const phones = extractPhonesFromText(values.content);
      if (!phones.length) {
        showToast('未识别到有效号码，请检查格式。', 'error');
        return false;
      }
      importPhonesToLeads(phones, { keep: true, wechatAdded: false });
      return true;
    },
  });
}

function showLeadImageImport() {
  const tesseract = window.Tesseract;
  if (!tesseract?.recognize) {
    showNotice('图片导入', '当前未加载号码识别组件，请刷新页面后重试。');
    return;
  }

  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.addEventListener('change', async () => {
    const file = input.files?.[0];
    if (!file) return;
    showToast('正在识别图片中的号码，请稍候…', 'info');
    try {
      const result = await tesseract.recognize(file, 'chi_sim+eng');
      const phones = extractPhonesFromText(result?.data?.text || '');
      if (!phones.length) {
        showToast('未识别到有效号码，请更换清晰图片或手动文本导入。', 'error');
        return;
      }
      importPhonesToLeads(phones, { keep: true, wechatAdded: false });
    } catch {
      showToast('图片识别失败，请稍后重试或改用文本导入。', 'error');
    }
  });
  input.click();
}

function showLeadWechatImport() {
  showModal({
    title: '微信批量导入',
    description: '从微信聊天记录/备注中复制内容粘贴到这里，系统会自动识别号码并去重导入。',
    fields: [
      { name: 'content', label: '微信内容', type: 'textarea', placeholder: '粘贴微信聊天内容或号码列表', rows: 6 },
    ],
    submitText: '开始导入',
    onSubmit: values => {
      const phones = extractPhonesFromText(values.content);
      if (!phones.length) {
        showToast('未识别到有效号码，请检查粘贴内容。', 'error');
        return false;
      }
      importPhonesToLeads(phones, { keep: true, wechatAdded: false });
      return true;
    },
  });
}

function renderNotificationList(category) {
  const data = getData();
  const filtered = data.notifications.filter(notification => notification.category === category);
  const unreadCount = filtered.filter(notification => !notification.read).length;

  if (notificationSummary) {
    notificationSummary.textContent = `${notificationLabels[category]}共 ${filtered.length} 条，未读 ${unreadCount} 条，点击单条消息可标记已读。`;
  }

  if (!notificationList) return;
  notificationList.innerHTML = filtered.length ? filtered.map(notification => `
    <button type="button" class="notification-item ${notification.read ? '' : 'unread'}" data-notification-id="${notification.id}">
      <div class="notification-item-head">
        <strong>${escapeHTML(notification.title)}</strong>
        ${renderStatusPill(notification.read ? '已读' : '未读', notification.read ? 'status-neutral' : 'status-warning')}
      </div>
      <p>${escapeHTML(notification.body)}</p>
      <span class="notification-time">${escapeHTML(notification.time)}</span>
    </button>
  `).join('') : renderEmptyState('暂无消息', '当前分类下还没有通知。');
}

function setNotificationTab(tabKey) {
  uiState.notificationTab = tabKey;
  notificationTabButtons.forEach(button => {
    button.classList.toggle('active', button.dataset.tab === tabKey);
  });
  renderNotificationList(tabKey);
}

function openNotificationModal() {
  if (!notificationModal) return;
  closeMobileNav();
  notificationModal.classList.remove('hidden');
  setNotificationTab(uiState.notificationTab || 'system');
}

function closeNotificationModal() {
  if (!notificationModal) return;
  notificationModal.classList.add('hidden');
}

function markNotificationsRead(category) {
  const data = getData();
  let changed = false;

  data.notifications = data.notifications.map(notification => {
    if (notification.category === category && !notification.read) {
      changed = true;
      return { ...notification, read: true };
    }
    return notification;
  });

  if (!changed) {
    showToast('当前分类已全部读完。', 'info');
    return;
  }

  saveData(data);
  renderNotificationList(category);
  showToast('当前分类消息已全部标记为已读。', 'success');
}

function markNotificationRead(id) {
  const data = getData();
  const target = data.notifications.find(notification => notification.id === id);
  if (!target || target.read) return;
  target.read = true;
  saveData(data);
  renderNotificationList(uiState.notificationTab);
}

function showDashboard() {
  const user = getCurrentUser();
  const topbar = document.getElementById('topbar');
  if (!user || !topbar) return;

  loginSection.classList.add('hidden');
  dashboard.classList.remove('hidden');
  dashboard.classList.remove('nav-open');
  topbar.classList.remove('hidden');
  const identityText = user.username || user.phone || user.id;
  const nameText = user.name ? `${user.name}${identityText ? ` · ${identityText}` : ''}` : identityText;
  const approvalText = user.role === 'teacher' && !user.approved ? '（待审核）' : '';
  userStatus.textContent = `当前身份：${formatRoleLabel(user.role)}${approvalText} · ${nameText}`;
  userStatus.classList.remove('hidden');

  renderTabs();
  updateGreeting();
  updateNotificationButton();
  updateDeviceStatus();

  const visibleSections = getAccessibleSectionKeys(user);
  if (!visibleSections.includes(uiState.activeSection)) {
    uiState.activeSection = visibleSections[0] || 'overview';
  }
  setActiveSection(uiState.activeSection);
}

function logout(showMessage = false) {
  localStorage.removeItem(authKey);
  loginSection.classList.remove('hidden');
  dashboard.classList.add('hidden');
  dashboard.classList.remove('nav-open');
  document.getElementById('topbar')?.classList.add('hidden');
  userStatus.classList.add('hidden');
  closeNotificationModal();
  closeCurrentModal();
  updateGreeting();
  updateWorkspaceSummary('overview');
  updateDeviceStatus();
  if (showMessage) showToast('已退出登录。', 'info');
}

function isStrongPassword(value) {
  const text = String(value || '');
  if (text.length < 8) return false;
  const hasLetter = /[A-Za-z]/.test(text);
  const hasDigit = /\d/.test(text);
  return hasLetter && hasDigit;
}

async function openRegisterFlow({ phone = '' } = {}) {
  const normalizedPhone = String(phone || '').trim();
  showModal({
    title: '注册账号',
    description: '首次使用需先完成注册；招生老师注册后需审核通过方可进入工作台。',
    fields: [
      {
        name: 'type',
        label: '身份类型',
        options: [
          { value: 'teacher', label: '招生老师' },
          { value: 'parent', label: '学生家长' },
          { value: 'student', label: '学生' },
        ],
      },
    ],
    submitText: '下一步',
    onSubmit: async ({ type }) => {
      await openRegisterForm({ type, phone: normalizedPhone });
      return true;
    },
  });
}

async function openRegisterForm({ type, phone }) {
  let extraField = null;
  if (type === 'teacher') {
    const { teams } = await apiRequest('/api/meta/teams', { method: 'GET' });
    if (!teams.length) {
      showNotice('暂无法注册', '系统尚未配置“所属团队”。请联系超级管理员先创建团队后再注册。');
      return;
    }
    extraField = {
      name: 'teamId',
      label: '所属招生团队',
      options: teams.map(team => ({ value: team.id, label: team.name })),
    };
  } else {
    const { teachers } = await apiRequest('/api/meta/teachers', { method: 'GET' });
    if (!teachers.length) {
      showNotice('暂无法注册', '系统尚未有可对接的招生老师账号，请联系管理员处理。');
      return;
    }
    extraField = {
      name: 'linkedTeacherId',
      label: '对接招生老师',
      options: teachers.map(teacher => ({
        value: teacher.id,
        label: `${teacher.name}${teacher.phone ? ` · ${teacher.phone}` : ''}`,
      })),
    };
  }

  showModal({
    title: '完善注册信息',
    description: '所有字段均为必填项。',
    fields: [
      { name: 'name', label: '姓名', placeholder: '请输入真实姓名' },
      {
        name: 'phone',
        label: '手机号',
        placeholder: '请输入手机号',
        value: phone || '',
        inputMode: 'tel',
        autocomplete: 'tel',
        validate: value => (String(value).replace(/\D/g, '').length >= 6 ? true : '请输入正确手机号。'),
      },
      extraField,
      {
        name: 'password',
        label: '登录密码',
        type: 'password',
        placeholder: '8位以上，包含字母和数字',
        autocomplete: 'new-password',
        validate: value => (isStrongPassword(value) ? true : '密码需 8 位以上且包含字母与数字。'),
      },
    ].filter(Boolean),
    submitText: '提交注册',
    onSubmit: async payload => {
      try {
        const result = await apiRequest('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify({ ...payload, type }),
        });
        saveAuth(result.user);
        ensureSeededStorage();
        showDashboard();
        if (result.user.type === 'teacher' && !result.user.approved) {
          showNotice('注册成功', '你的账号已提交审核，请等待团队负责人或超级管理员审核通过后进入工作台。');
        } else {
          showToast('注册成功，已登录系统。', 'success');
        }
        return true;
      } catch (error) {
        if (error.code === 'PHONE_EXISTS') {
          showToast('该手机号已注册，请直接登录。', 'error');
          return false;
        }
        if (error.code === 'WEAK_PASSWORD') {
          showToast('密码强度不足，请按要求设置。', 'error');
          return false;
        }
        showToast('注册失败，请检查填写信息或稍后重试。', 'error');
        return false;
      }
    },
  });
}

function ensureSeededStorage() {
  const user = getCurrentUser();
  const storageKey = getStorageKey(user);
  const versionKey = `${dataVersionKey}_${user?.id || user?.username || 'public'}`;
  if (localStorage.getItem(versionKey) !== currentDataVersion) {
    localStorage.setItem(versionKey, currentDataVersion);
    localStorage.setItem(storageKey, JSON.stringify(repairData(cloneInitialData())));
    return;
  }
  if (!localStorage.getItem(storageKey)) {
    localStorage.setItem(storageKey, JSON.stringify(repairData(cloneInitialData())));
    return;
  }
  saveData(getData());
}

const offlineSuperUsername = '吴老师';
const offlineSuperPasswordSha256 = '5f55082b635e5924c9897efdbb8da97790798468d52f695cb078e01071861807';

async function sha256Hex(value) {
  if (!globalThis.crypto?.subtle) return '';
  const data = new TextEncoder().encode(String(value || ''));
  const hash = await globalThis.crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(byte => byte.toString(16).padStart(2, '0')).join('');
}

async function handleLogin(event) {
  event.preventDefault();
  const identifier = usernameInput.value.trim();
  const password = passwordInput.value.trim();
  try {
    const payload = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    });
    saveAuth(payload.user);
    ensureSeededStorage();
    showDashboard();
    showToast(`欢迎回来，${formatRoleLabel(getCurrentUser().role)}。`, 'success');
  } catch (error) {
    const isNetworkError = error instanceof TypeError
      || error?.name === 'TypeError'
      || /fetch/i.test(String(error?.message || ''));
    if (isNetworkError && identifier === offlineSuperUsername) {
      const passwordHash = await sha256Hex(password);
      if (passwordHash === offlineSuperPasswordSha256) {
      saveAuth({
        id: 'offline-super',
        type: 'super',
        username: offlineSuperUsername,
        phone: '',
        name: offlineSuperUsername,
        employeeNo: '',
        teamId: '',
        linkedTeacherId: '',
        approved: true,
        isTeamLead: true,
      });
      ensureSeededStorage();
      showDashboard();
      showToast('已进入离线超级管理员模式。', 'success');
      return;
      }
    }
    if (error.code === 'USER_NOT_FOUND') {
      showToast('账号不存在，请先完成注册。', 'error');
      openRegisterFlow({ phone: identifier });
      return;
    }
    if (error.code === 'INVALID_CREDENTIALS') {
      showToast('账号或密码错误，请重试。', 'error');
      return;
    }
    showToast('登录失败，请检查网络或稍后重试。', 'error');
  }
}

function extractPhonesFromText(content) {
  const matches = String(content || '').match(/\+?\d[\d\s\-()]{5,}\d/g) || [];
  const phones = [...new Set(matches.map(item => normalizePhone(item)).filter(item => isValidPhone(item)))];
  return phones;
}

function importPhonesToLeads(phones, { keep = true, wechatAdded = false } = {}) {
  const user = getCurrentUser();
  const data = getData();
  const existingSet = new Set(data.leadStudents.filter(lead => lead.createdBy === user.id).map(lead => normalizePhone(lead.phone)));
  let created = 0;

  phones.forEach(phone => {
    if (existingSet.has(phone)) return;
    existingSet.add(phone);
    data.leadStudents.push({
      id: generateId(),
      name: phone,
      grade: '',
      parent: '',
      phone,
      called: false,
      callOutcome: '',
      followUp: '',
      assignedTeacherId: 0,
      assignedTeacher: user.name || user.phone || '本人',
      enrollmentStatus: '待跟进',
      teamId: Number(user.teamId) || 0,
      priority: '中',
      lastContactTime: '',
      createdBy: user.id,
      favorite: false,
      nickname: '',
      note: '',
      wechatAdded,
      keep,
    });
    created += 1;
  });

  saveData(data);
  refreshCurrentSection();
  showToast(`已导入 ${created} 个号码。`, 'success');
  return created;
}

function handleSectionClick(event) {
  const button = event.target.closest('button');
  if (!button) return;

  if (button.dataset.switchSection) return setActiveSection(button.dataset.switchSection);
  if (button.dataset.openNotifications !== undefined) return openNotificationModal();
  if (button.dataset.editProfile !== undefined) return showProfileEditForm();
  if (button.dataset.changePassword !== undefined) return showPasswordChangeForm();
  if (button.dataset.addBackendTeam !== undefined) return showBackendTeamForm();
  if (button.dataset.refreshAccounts !== undefined) return loadAccountsSection();
  if (button.dataset.deleteBackendTeam) return deleteBackendTeam(String(button.dataset.deleteBackendTeam));
  if (button.dataset.approveTeacher) return approveTeacher(String(button.dataset.approveTeacher), true);
  if (button.dataset.rejectTeacher) return approveTeacher(String(button.dataset.rejectTeacher), false);
  if (button.dataset.toggleTeamLead) {
    return toggleTeamLead(String(button.dataset.toggleTeamLead), button.dataset.teamLead === '1');
  }
  if (button.dataset.addTeam !== undefined) return showTeamForm();
  if (button.dataset.editTeam) return showTeamForm(Number(button.dataset.editTeam));
  if (button.dataset.deleteTeam) return deleteTeam(Number(button.dataset.deleteTeam));
  if (button.dataset.addMember !== undefined) return showMemberForm();
  if (button.dataset.editMember) return showMemberForm(Number(button.dataset.editMember));
  if (button.dataset.deleteMember) return deleteMember(Number(button.dataset.deleteMember));
  if (button.dataset.addSchool !== undefined) return showSchoolForm();
  if (button.dataset.editSchool) return showSchoolForm(Number(button.dataset.editSchool));
  if (button.dataset.deleteSchool) return deleteSchool(Number(button.dataset.deleteSchool));
  if (button.dataset.showLeadImportHelp !== undefined) return showLeadImportGuide();
  if (button.dataset.importLeads !== undefined) return triggerLeadImport();
  if (button.dataset.importLeadsText !== undefined) return showLeadTextImport();
  if (button.dataset.importLeadsImage !== undefined) return showLeadImageImport();
  if (button.dataset.importLeadsWechat !== undefined) return showLeadWechatImport();
  if (button.dataset.addLead !== undefined) return showLeadForm();
  if (button.dataset.editLead) return showLeadForm(Number(button.dataset.editLead));
  if (button.dataset.callLead) return markLeadCalled(Number(button.dataset.callLead));
  if (button.dataset.favoriteLead) return toggleLeadFavorite(Number(button.dataset.favoriteLead));
  if (button.dataset.wechatLead) return handleLeadWechat(Number(button.dataset.wechatLead));
  if (button.dataset.keepLead) return toggleLeadKeep(Number(button.dataset.keepLead));
  if (button.dataset.deleteLead) return deleteLead(Number(button.dataset.deleteLead));
  if (button.dataset.addConnection !== undefined) return showConnectionForm();
  if (button.dataset.editConnection) return showConnectionForm(Number(button.dataset.editConnection));
  if (button.dataset.deleteConnection) return deleteConnection(Number(button.dataset.deleteConnection));
}

function handleFilterInput(event) {
  const { filterSection, filterKey } = event.target.dataset;
  if (!filterSection || !filterKey) return;
  uiState.filters[filterKey] = event.target.value;
  renderSection(filterSection);
}

async function init() {
  updateGreeting();
  updateNotificationButton();
  updateWorkspaceSummary(uiState.activeSection);
  updateDeviceStatus();

  loginForm.addEventListener('submit', handleLogin);
  logoutButton?.addEventListener('click', async () => {
    try {
      await apiRequest('/api/auth/logout', { method: 'POST' });
    } catch {}
    logout(true);
  });
  switchAccountBtn?.addEventListener('click', () => {
    logout(false);
    usernameInput.value = '';
    passwordInput.value = '';
    usernameInput.focus();
    showToast('请输入其他账号进行切换。', 'info');
  });

  notificationBtn?.addEventListener('click', openNotificationModal);
  closeNotificationBtn?.addEventListener('click', closeNotificationModal);
  notificationModal?.addEventListener('click', event => {
    if (event.target === notificationModal) closeNotificationModal();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && notificationModal && !notificationModal.classList.contains('hidden')) {
      closeNotificationModal();
    }
  });
  notificationTabButtons.forEach(button => {
    button.addEventListener('click', () => setNotificationTab(button.dataset.tab));
  });
  markAllNotificationsBtn?.addEventListener('click', () => markNotificationsRead(uiState.notificationTab));
  notificationList?.addEventListener('click', event => {
    const target = event.target.closest('[data-notification-id]');
    if (!target) return;
    markNotificationRead(Number(target.dataset.notificationId));
  });

  sectionContent?.addEventListener('click', handleSectionClick);
  sectionContent?.addEventListener('input', handleFilterInput);
  sectionContent?.addEventListener('change', handleFilterInput);
  leadImportInput?.addEventListener('change', handleLeadImportFileChange);
  navToggleBtn?.addEventListener('click', () => {
    if (!dashboard) return;
    if (window.innerWidth > 1180) {
      updateDeviceStatus();
      return;
    }
    dashboard.classList.toggle('nav-open');
    updateDeviceStatus();
  });
  window.addEventListener('resize', updateDeviceStatus);

  forgotPasswordLink?.addEventListener('click', event => {
    event.preventDefault();
    showNotice('找回密码', '请联系超级管理员重置密码。');
  });
  registerLink?.addEventListener('click', event => {
    event.preventDefault();
    openRegisterFlow({});
  });

  try {
    const payload = await apiRequest('/api/me', { method: 'GET' });
    saveAuth(payload.user);
    ensureSeededStorage();
    showDashboard();
  } catch {}
}

init();
