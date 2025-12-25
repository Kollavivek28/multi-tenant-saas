import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validate-request';
import { updateUserSchema, updateUserRoleSchema, updateUserStatusSchema } from '../validators/user.validators';
import { updateUser, deleteUser, listUsers, updateUserRole, updateUserStatus } from '../controllers/user.controller';

const router = Router();

router.use(authenticate);
router.get('/', listUsers);
router.put('/:userId', validateBody(updateUserSchema), updateUser);
router.patch('/:userId/role', validateBody(updateUserRoleSchema), updateUserRole);
router.patch('/:userId/status', validateBody(updateUserStatusSchema), updateUserStatus);
router.delete('/:userId', deleteUser);

export default router;
