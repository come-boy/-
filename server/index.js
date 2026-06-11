import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { getTeams, getUsers, setTeams, setUsers } from './store.js';
import { generateId, hashPassword, hmac, verifyPassword } from './security.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

function loadDotEnv() {
  const envPath = path.join(rootDir, '.env');
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed) return;
    if (trimmed.startsWith('#')) return;
    const idx = trimmed.indexOf('=');
    if (idx < 0) return;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    if (!key) return;
    if (process.env[key] !== undefined) return;
    process.env[key] = value;
  });
}

loadDotEnv();

const superUsername = process.env.SUPERADMIN_USERNAME || '吴老师';
const superPassword = process.env.SUPERADMIN_PASSWORD;
const sessionSecret = process.env.SESSION_SECRET;

if (!superPassword) {
  throw new Error('缺少 SUPERADMIN_PASSWORD，请在环境变量或 .env 中设置。');
}
if (!sessionSecret) {
  throw new Error('缺少 SESSION_SECRET，请在环境变量或 .env 中设置。');
}

function ensureSuperAdmin() {
  const users = getUsers();
  const existing = users.find(user => user.type === 'super');
  if (existing) return;
  const { salt, hash } = hashPassword(superPassword);
  const superUser = {
    id: generateId(),
    type: 'super',
    username: superUsername,
    phone: '',
    name: superUsername,
    employeeNo: '',
    teamId: '',
    linkedTeacherId: '',
    approved: true,
    isTeamLead: false,
    passwordSalt: salt,
    passwordHash: hash,
    createdAt: Date.now(),
  };
  setUsers([...users, superUser]);
}

ensureSuperAdmin();

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));

const sessions = new Map();

function parseCookies(req) {
  const header = req.headers.cookie || '';
  return header.split(';').reduce((result, part) => {
    const idx = part.indexOf('=');
    if (idx < 0) return result;
    const key = part.slice(0, idx).trim();
    const value = decodeURIComponent(part.slice(idx + 1).trim());
    if (!key) return result;
    result[key] = value;
    return result;
  }, {});
}

function setCookie(res, name, value, { maxAgeSeconds = 60 * 60 * 24 * 14 } = {}) {
  const encoded = encodeURIComponent(String(value));
  res.setHeader('Set-Cookie', [
    `${name}=${encoded}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}`,
  ]);
}

function clearCookie(res, name) {
  res.setHeader('Set-Cookie', [`${name}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`]);
}

function buildSessionId(raw) {
  return `${raw}.${hmac(raw, sessionSecret)}`;
}

function verifySessionId(value) {
  if (!value) return null;
  const [raw, sig] = String(value).split('.');
  if (!raw || !sig) return null;
  const expected = hmac(raw, sessionSecret);
  if (sig !== expected) return null;
  return raw;
}

function sanitizeUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    type: user.type,
    username: user.username || '',
    phone: user.phone || '',
    name: user.name || '',
    employeeNo: user.employeeNo || '',
    studentName: user.studentName || '',
    teamId: user.teamId || '',
    linkedTeacherId: user.linkedTeacherId || '',
    approved: Boolean(user.approved),
    isTeamLead: Boolean(user.isTeamLead),
  };
}

function getSessionUser(req) {
  const cookies = parseCookies(req);
  const sidRaw = verifySessionId(cookies.sid);
  if (!sidRaw) return null;
  const userId = sessions.get(sidRaw);
  if (!userId) return null;
  const users = getUsers();
  return users.find(user => user.id === userId) || null;
}

function requireLogin(req, res, next) {
  const user = getSessionUser(req);
  if (!user) return res.status(401).json({ ok: false, code: 'UNAUTHORIZED' });
  req.user = user;
  next();
}

function requireSuperOrLead(req, res, next) {
  const user = req.user;
  if (user?.type === 'super' || user?.isTeamLead) return next();
  return res.status(403).json({ ok: false, code: 'FORBIDDEN' });
}

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.get('/api/me', requireLogin, (req, res) => {
  res.json({ ok: true, user: sanitizeUser(req.user) });
});

app.patch('/api/me', requireLogin, (req, res) => {
  const user = req.user;
  const name = req.body?.name !== undefined ? String(req.body.name || '').trim() : null;
  const employeeNo = req.body?.employeeNo !== undefined ? String(req.body.employeeNo || '').trim() : null;
  const password = req.body?.password !== undefined ? String(req.body.password || '').trim() : null;

  if (name !== null && !name) return res.status(400).json({ ok: false, code: 'INVALID_NAME' });
  if (employeeNo !== null && !employeeNo) return res.status(400).json({ ok: false, code: 'INVALID_EMPLOYEE_NO' });
  if (password !== null && !isStrongPassword(password)) return res.status(400).json({ ok: false, code: 'WEAK_PASSWORD' });

  const users = getUsers();
  const target = users.find(entry => entry.id === user.id);
  if (!target) return res.status(404).json({ ok: false, code: 'USER_NOT_FOUND' });

  if (name !== null) target.name = name;
  if (employeeNo !== null) target.employeeNo = employeeNo;
  if (password !== null) {
    const { salt, hash } = hashPassword(password);
    target.passwordSalt = salt;
    target.passwordHash = hash;
  }

  setUsers(users);
  res.json({ ok: true, user: sanitizeUser(target) });
});

app.post('/api/auth/logout', requireLogin, (req, res) => {
  const cookies = parseCookies(req);
  const sidRaw = verifySessionId(cookies.sid);
  if (sidRaw) sessions.delete(sidRaw);
  clearCookie(res, 'sid');
  res.json({ ok: true });
});

app.post('/api/auth/login', (req, res) => {
  const identifier = String(req.body?.identifier || '').trim();
  const password = String(req.body?.password || '').trim();
  if (!identifier || !password) return res.status(400).json({ ok: false, code: 'MISSING_FIELDS' });

  const users = getUsers();
  const user = users.find(entry => entry.username === identifier || entry.phone === identifier);
  if (!user) return res.status(404).json({ ok: false, code: 'USER_NOT_FOUND' });

  if (!verifyPassword(password, user.passwordSalt, user.passwordHash)) {
    return res.status(401).json({ ok: false, code: 'INVALID_CREDENTIALS' });
  }

  const sidRaw = generateId();
  sessions.set(sidRaw, user.id);
  setCookie(res, 'sid', buildSessionId(sidRaw), {});

  res.json({ ok: true, user: sanitizeUser(user) });
});

function isStrongPassword(password) {
  if (String(password).length < 8) return false;
  const hasLetter = /[A-Za-z]/.test(password);
  const hasDigit = /\d/.test(password);
  return hasLetter && hasDigit;
}

app.post('/api/auth/register', (req, res) => {
  const type = String(req.body?.type || '').trim();
  const name = String(req.body?.name || '').trim();
  const phone = String(req.body?.phone || '').trim();
  const employeeNo = String(req.body?.employeeNo || '').trim();
  const studentName = String(req.body?.studentName || '').trim();
  const password = String(req.body?.password || '').trim();
  const teamId = req.body?.teamId !== undefined ? Number(req.body.teamId) : NaN;
  const linkedTeacherId = String(req.body?.linkedTeacherId || '').trim();

  if (!['teacher', 'parent', 'student'].includes(type)) {
    return res.status(400).json({ ok: false, code: 'INVALID_TYPE' });
  }
  if (!name || !phone || !password) {
    return res.status(400).json({ ok: false, code: 'MISSING_FIELDS' });
  }
  if (type === 'teacher' && !employeeNo) {
    return res.status(400).json({ ok: false, code: 'MISSING_EMPLOYEE_NO' });
  }
  if (type === 'parent' && !studentName) {
    return res.status(400).json({ ok: false, code: 'MISSING_STUDENT_NAME' });
  }
  if (!/^\d{6,}$/.test(phone.replace(/\D/g, ''))) {
    return res.status(400).json({ ok: false, code: 'INVALID_PHONE' });
  }
  if (!isStrongPassword(password)) {
    return res.status(400).json({ ok: false, code: 'WEAK_PASSWORD' });
  }

  const users = getUsers();
  if (users.some(entry => entry.phone === phone)) {
    return res.status(409).json({ ok: false, code: 'PHONE_EXISTS' });
  }

  if (type === 'teacher' && !Number.isFinite(teamId)) return res.status(400).json({ ok: false, code: 'MISSING_TEAM' });
  if (type !== 'teacher' && !linkedTeacherId) return res.status(400).json({ ok: false, code: 'MISSING_TEACHER' });

  if (type === 'teacher') {
    const teams = getTeams();
    if (!teams.some(team => team.id === teamId)) return res.status(400).json({ ok: false, code: 'TEAM_NOT_FOUND' });
  }

  if (type !== 'teacher') {
    const teacher = users.find(entry => entry.id === linkedTeacherId && entry.type === 'teacher' && entry.approved);
    if (!teacher) return res.status(400).json({ ok: false, code: 'TEACHER_NOT_FOUND' });
  }

  const { salt, hash } = hashPassword(password);
  const created = {
    id: generateId(),
    type,
    username: '',
    phone,
    name,
    employeeNo: type === 'teacher' ? employeeNo : '',
    studentName: type === 'parent' ? studentName : '',
    teamId: type === 'teacher' ? teamId : null,
    linkedTeacherId: type !== 'teacher' ? linkedTeacherId : '',
    approved: type !== 'teacher',
    isTeamLead: false,
    passwordSalt: salt,
    passwordHash: hash,
    createdAt: Date.now(),
  };

  setUsers([...users, created]);

  const sidRaw = generateId();
  sessions.set(sidRaw, created.id);
  setCookie(res, 'sid', buildSessionId(sidRaw), {});
  res.json({ ok: true, user: sanitizeUser(created) });
});

app.get('/api/meta/teams', (req, res) => {
  res.json({ ok: true, teams: getTeams() });
});

app.get('/api/meta/teachers', (req, res) => {
  const users = getUsers();
  const teachers = users
    .filter(user => user.type === 'teacher' && user.approved)
    .map(teacher => ({ id: teacher.id, name: teacher.name, phone: teacher.phone, teamId: teacher.teamId }));
  res.json({ ok: true, teachers });
});

app.get('/api/admin/teachers', requireLogin, requireSuperOrLead, (req, res) => {
  const current = req.user;
  const users = getUsers();
  const teachers = users
    .filter(user => {
      if (user.type !== 'teacher' || !user.approved) return false;
      if (current.type === 'super') return true;
      return current.isTeamLead && user.teamId === current.teamId;
    })
    .map(teacher => sanitizeUser(teacher));
  res.json({ ok: true, teachers });
});

app.get('/api/admin/teams', requireLogin, requireSuperOrLead, (req, res) => {
  res.json({ ok: true, teams: getTeams() });
});

app.post('/api/admin/teams', requireLogin, requireSuperOrLead, (req, res) => {
  const name = String(req.body?.name || '').trim();
  if (!name) return res.status(400).json({ ok: false, code: 'MISSING_NAME' });
  const teams = getTeams();
  if (teams.some(team => team.name === name)) return res.status(409).json({ ok: false, code: 'TEAM_EXISTS' });
  const nextId = teams.reduce((max, team) => Math.max(max, Number(team.id) || 0), 0) + 1;
  const created = { id: nextId, name, createdAt: Date.now() };
  setTeams([...teams, created]);
  res.json({ ok: true, team: created });
});

app.delete('/api/admin/teams/:id', requireLogin, requireSuperOrLead, (req, res) => {
  const teamId = Number(req.params.id);
  if (!Number.isFinite(teamId)) return res.status(400).json({ ok: false, code: 'TEAM_NOT_FOUND' });
  const teams = getTeams();
  const next = teams.filter(team => team.id !== teamId);
  if (next.length === teams.length) return res.status(404).json({ ok: false, code: 'TEAM_NOT_FOUND' });
  const users = getUsers();
  if (users.some(user => user.type === 'teacher' && user.teamId === teamId)) {
    return res.status(409).json({ ok: false, code: 'TEAM_IN_USE' });
  }
  setTeams(next);
  res.json({ ok: true });
});

app.get('/api/admin/pending-teachers', requireLogin, requireSuperOrLead, (req, res) => {
  const current = req.user;
  const users = getUsers();
  const pending = users.filter(user => {
    if (user.type !== 'teacher' || user.approved) return false;
    if (current.type === 'super') return true;
    return current.isTeamLead && user.teamId === current.teamId;
  }).map(teacher => sanitizeUser(teacher));
  res.json({ ok: true, pending });
});

app.post('/api/admin/approve-teacher', requireLogin, requireSuperOrLead, (req, res) => {
  const current = req.user;
  const userId = String(req.body?.userId || '').trim();
  const approved = Boolean(req.body?.approved);
  const users = getUsers();
  const target = users.find(user => user.id === userId && user.type === 'teacher');
  if (!target) return res.status(404).json({ ok: false, code: 'USER_NOT_FOUND' });
  if (current.type !== 'super' && (!current.isTeamLead || target.teamId !== current.teamId)) {
    return res.status(403).json({ ok: false, code: 'FORBIDDEN' });
  }
  target.approved = approved;
  setUsers(users);
  res.json({ ok: true, user: sanitizeUser(target) });
});

app.post('/api/admin/set-team-lead', requireLogin, (req, res) => {
  const current = req.user;
  if (current.type !== 'super') return res.status(403).json({ ok: false, code: 'FORBIDDEN' });
  const userId = String(req.body?.userId || '').trim();
  const isTeamLead = Boolean(req.body?.isTeamLead);
  const users = getUsers();
  const target = users.find(user => user.id === userId && user.type === 'teacher' && user.approved);
  if (!target) return res.status(404).json({ ok: false, code: 'USER_NOT_FOUND' });
  target.isTeamLead = isTeamLead;
  setUsers(users);
  res.json({ ok: true, user: sanitizeUser(target) });
});

app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  return express.static(rootDir)(req, res, next);
});

const port = Number(process.env.PORT || 5173);
app.listen(port);
