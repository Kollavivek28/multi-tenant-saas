import { Router } from 'express';
import { registerTenant, login, getCurrentUser, logout } from '../controllers/auth.controller';
import { validateBody } from '../middleware/validate-request';
import { registerTenantSchema, loginSchema } from '../validators/auth.validators';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/register-tenant', validateBody(registerTenantSchema), registerTenant);
router.post('/login', validateBody(loginSchema), login);
router.get('/me', authenticate, getCurrentUser);
router.post('/logout', authenticate, logout);

export default router;
