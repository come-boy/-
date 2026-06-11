import fs from 'node:fs';
import path from 'node:path';

const dataDir = path.join(process.cwd(), 'server', 'data');

function ensureDir() {
  fs.mkdirSync(dataDir, { recursive: true });
}

function readJson(fileName, fallback) {
  ensureDir();
  const filePath = path.join(dataDir, fileName);
  if (!fs.existsSync(filePath)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return fallback;
  }
}

function writeJson(fileName, value) {
  ensureDir();
  const filePath = path.join(dataDir, fileName);
  const tempPath = `${filePath}.${process.pid}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(value, null, 2), 'utf8');
  fs.renameSync(tempPath, filePath);
}

export function getUsers() {
  return readJson('users.json', []);
}

export function setUsers(users) {
  writeJson('users.json', users);
}

export function getTeams() {
  return readJson('teams.json', []);
}

export function setTeams(teams) {
  writeJson('teams.json', teams);
}

