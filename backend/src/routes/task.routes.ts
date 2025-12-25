import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validate-request';
import { updateTaskSchema, updateTaskStatusSchema } from '../validators/task.validators';
import { updateTask, updateTaskStatus } from '../controllers/task.controller';

const router = Router();

router.use(authenticate);
router.patch('/:taskId/status', validateBody(updateTaskStatusSchema), updateTaskStatus);
router.put('/:taskId', validateBody(updateTaskSchema), updateTask);

export default router;
