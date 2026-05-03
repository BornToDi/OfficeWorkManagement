const prisma = require('../prismaClient');

async function listWorkspaces(req, res) {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ error: 'Not authenticated' });
  const memberships = await prisma.workspaceMember.findMany({ where: { userId }, include: { workspace: true } });
  const workspaces = memberships.map((m) => ({ ...m.workspace }));
  // include owned workspaces that may not have membership row
  const owned = await prisma.workspace.findMany({ where: { ownerId: userId } });
  const merged = [...workspaces, ...owned].reduce((acc, w) => {
    acc[w.id] = w; return acc;
  }, {});
  res.json(Object.values(merged));
}

async function createWorkspace(req, res) {
  const userId = req.userId;
  const { name, description, accentColor } = req.body;
  if (!userId) return res.status(401).json({ error: 'Not authenticated' });
  if (!name) return res.status(400).json({ error: 'Name is required' });
  const workspace = await prisma.workspace.create({ data: { name, description, accentColor, ownerId: userId } });
  await prisma.workspaceMember.create({ data: { workspaceId: workspace.id, userId, role: 'ADMIN' } });
  res.status(201).json(workspace);
}

async function getWorkspace(req, res) {
  const userId = req.userId;
  const { id } = req.params;
  const member = await prisma.workspaceMember.findFirst({ where: { workspaceId: id, userId } });
  const workspace = await prisma.workspace.findUnique({ where: { id }, include: { members: { include: { user: true } } } });
  if (!workspace) return res.status(404).json({ error: 'Workspace not found' });
  if (!member && workspace.ownerId !== userId) return res.status(403).json({ error: 'Access denied' });
  res.json(workspace);
}

async function updateWorkspace(req, res) {
  const userId = req.userId;
  const { id } = req.params;
  const { name, description, accentColor } = req.body;
  const workspace = await prisma.workspace.findUnique({ where: { id } });
  if (!workspace) return res.status(404).json({ error: 'Workspace not found' });
  // only owner or admin member can update
  if (workspace.ownerId !== userId) {
    const member = await prisma.workspaceMember.findFirst({ where: { workspaceId: id, userId } });
    if (!member || member.role !== 'ADMIN') return res.status(403).json({ error: 'Access denied' });
  }
  const updated = await prisma.workspace.update({ where: { id }, data: { name, description, accentColor } });
  res.json(updated);
}

async function deleteWorkspace(req, res) {
  const userId = req.userId;
  const { id } = req.params;
  const workspace = await prisma.workspace.findUnique({ where: { id } });
  if (!workspace) return res.status(404).json({ error: 'Workspace not found' });
  if (workspace.ownerId !== userId) return res.status(403).json({ error: 'Only owner can delete workspace' });
  await prisma.workspace.delete({ where: { id } });
  res.json({ ok: true });
}

async function inviteMember(req, res) {
  const userId = req.userId;
  const { id } = req.params; // workspace id
  const { email, role = 'MEMBER' } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });
  const workspace = await prisma.workspace.findUnique({ where: { id } });
  if (!workspace) return res.status(404).json({ error: 'Workspace not found' });
  // only the workspace creator can invite
  if (workspace.ownerId !== userId) return res.status(403).json({ error: 'Only the workspace owner can invite members' });
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(404).json({ error: 'User not found' });
  const existing = await prisma.workspaceMember.findFirst({ where: { workspaceId: id, userId: user.id } });
  if (existing) return res.status(409).json({ error: 'User already member' });
  const member = await prisma.workspaceMember.create({ data: { workspaceId: id, userId: user.id, role } });
  // Create notification for the invited user
  try {
    await prisma.notification.create({
      data: {
        type: 'INVITE',
        workspaceId: id,
        userId: user.id,
        message: `You have been invited to join workspace: ${workspace.name}`,
        isRead: false
      }
    });
  } catch (err) {
    console.error('[inviteMember] notification creation failed:', err);
  }
  res.status(201).json(member);
}

async function listMembers(req, res) {
  const userId = req.userId;
  const { id } = req.params;
  const workspace = await prisma.workspace.findUnique({ where: { id } });
  if (!workspace) return res.status(404).json({ error: 'Workspace not found' });
  const member = await prisma.workspaceMember.findFirst({ where: { workspaceId: id, userId } });
  if (!member && workspace.ownerId !== userId) return res.status(403).json({ error: 'Access denied' });
  const members = await prisma.workspaceMember.findMany({ where: { workspaceId: id }, include: { user: true } });
  res.json(members);
}

async function updateMemberRole(req, res) {
  const userId = req.userId;
  const { id, memberId } = req.params;
  const { role } = req.body;
  const workspace = await prisma.workspace.findUnique({ where: { id } });
  if (!workspace) return res.status(404).json({ error: 'Workspace not found' });
  if (workspace.ownerId !== userId) {
    const caller = await prisma.workspaceMember.findFirst({ where: { workspaceId: id, userId } });
    if (!caller || caller.role !== 'ADMIN') return res.status(403).json({ error: 'Access denied' });
  }
  const member = await prisma.workspaceMember.update({ where: { id: memberId }, data: { role } });
  res.json(member);
}

async function removeMember(req, res) {
  const userId = req.userId;
  const { id, memberId } = req.params;
  const workspace = await prisma.workspace.findUnique({ where: { id } });
  if (!workspace) return res.status(404).json({ error: 'Workspace not found' });
  if (workspace.ownerId !== userId) {
    const caller = await prisma.workspaceMember.findFirst({ where: { workspaceId: id, userId } });
    if (!caller || caller.role !== 'ADMIN') return res.status(403).json({ error: 'Access denied' });
  }
  await prisma.workspaceMember.delete({ where: { id: memberId } });
  res.json({ ok: true });
}

module.exports = {
  listWorkspaces,
  createWorkspace,
  getWorkspace,
  updateWorkspace,
  deleteWorkspace,
  inviteMember,
  listMembers,
  updateMemberRole,
  removeMember,
};
