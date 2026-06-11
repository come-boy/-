import crypto from 'node:crypto';

export function generateId() {
  return crypto.randomBytes(16).toString('hex');
}

export function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(String(password), salt, 64).toString('hex');
  return { salt, hash };
}

export function verifyPassword(password, salt, hash) {
  if (!salt || !hash) return false;
  const nextHash = crypto.scryptSync(String(password), salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(nextHash, 'hex'));
}

export function hmac(value, secret) {
  return crypto.createHmac('sha256', String(secret)).update(String(value)).digest('hex');
}

