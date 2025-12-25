import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validate-request';
import { createProjectSchema, updateProjectSchema } from '../validators/project.validators';
import { createTaskSchema } from '../validators/task.validators';
import { createProject, deleteProject, getProjectDetails, listProjects, updateProject } from '../controllers/project.controller';
import { createTask, listProjectTasks } from '../controllers/task.controller';

const router = Router();

router.use(authenticate);
router.post('/', validateBody(createProjectSchema), createProject);
router.get('/', listProjects);
router.get('/:projectId', getProjectDetails);
router.put('/:projectId', validateBody(updateProjectSchema), updateProject);
router.delete('/:projectId', deleteProject);
router.post('/:projectId/tasks', validateBody(createTaskSchema), createTask);
router.get('/:projectId/tasks', listProjectTasks);

export default router;
