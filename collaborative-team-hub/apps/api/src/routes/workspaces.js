const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/workspaceController');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/', ctrl.listWorkspaces);
router.post('/', ctrl.createWorkspace);
router.get('/:id', ctrl.getWorkspace);
router.put('/:id', ctrl.updateWorkspace);
router.delete('/:id', ctrl.deleteWorkspace);

router.post('/:id/invite', ctrl.inviteMember);
router.get('/:id/members', ctrl.listMembers);
router.patch('/:id/members/:memberId/role', ctrl.updateMemberRole);
router.delete('/:id/members/:memberId', ctrl.removeMember);

module.exports = router;
