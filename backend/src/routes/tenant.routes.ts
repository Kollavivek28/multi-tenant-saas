import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validate-request';
import { updateTenantSchema } from '../validators/tenant.validators';
import { createUserSchema } from '../validators/user.validators';
import { getTenantDetails, listTenants, updateTenant } from '../controllers/tenant.controller';
import { addUserToTenant, listTenantUsers } from '../controllers/user.controller';

const router = Router();

router.use(authenticate);
router.get('/', listTenants);
router.get('/:tenantId', getTenantDetails);
router.put('/:tenantId', validateBody(updateTenantSchema), updateTenant);
router.post('/:tenantId/users', validateBody(createUserSchema), addUserToTenant);
router.get('/:tenantId/users', listTenantUsers);

export default router;
