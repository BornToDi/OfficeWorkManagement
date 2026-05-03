const prisma = require('../prismaClient');
const { hashPassword, verifyPassword } = require('../utils/hash');
const { signAccess, signRefresh, verify } = require('../utils/jwt');

function sendTokens(res, user) {
  const access = signAccess({ userId: user.id });
  const refresh = signRefresh({ userId: user.id });
  const secure = process.env.NODE_ENV === 'production';
  res.cookie('refreshToken', refresh, { httpOnly: true, secure, sameSite: 'lax', path: '/api/auth/refresh' });
  return access;
}

async function register(req, res) {
  console.log('[auth/register] headers:', req.headers['content-type'])
  console.log('[auth/register] body:', req.body)
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Missing fields' });
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ error: 'Email already exists' });
  const userRole = req.body.userRole === 'MANAGEMENT' ? 'MANAGEMENT' : 'EMPLOYEE';
  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({ data: { name, email, passwordHash, userRole } });
  const access = sendTokens(res, user);
  res.json({ user: { id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl, userRole: user.userRole }, accessToken: access });
}

async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Missing fields' });
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
  const access = sendTokens(res, user);
  return res.json({ user: { id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl, userRole: user.userRole }, accessToken: access });
}

async function logout(req, res) {
  res.clearCookie('refreshToken', { path: '/api/auth/refresh' });
  res.json({ ok: true });
}

async function refresh(req, res) {
  const token = req.cookies.refreshToken;
  if (!token) return res.status(401).json({ error: 'No refresh token' });
  try {
    const payload = verify(token, 'refresh');
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) return res.status(401).json({ error: 'Invalid token user' });
    const access = sendTokens(res, user);
    res.json({ accessToken: access });
  } catch (err) {
    return res.status(401).json({ error: 'Invalid refresh token' });
  }
}

async function me(req, res) {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ error: 'Not authenticated' });
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user: { id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl, userRole: user.userRole } });
}

async function updateProfile(req, res) {
  const userId = req.userId;
  const { name } = req.body;
  const updated = await prisma.user.update({ where: { id: userId }, data: { name } });
  res.json({ user: { id: updated.id, name: updated.name, email: updated.email, avatarUrl: updated.avatarUrl } });
}

module.exports = { register, login, logout, refresh, me, updateProfile };
