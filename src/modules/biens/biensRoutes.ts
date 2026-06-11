import { Router } from 'express';
import * as biensController from './biensController';
import { authenticate, authorize } from '../../middlewares/auth';

const router = Router();

router.get('/', biensController.getAll);
router.get('/:id', biensController.getOne);
router.post('/', authenticate, authorize(['agent', 'admin']), biensController.create);
router.put('/:id', authenticate, authorize(['agent', 'admin']), biensController.update);
router.delete('/:id', authenticate, authorize(['agent', 'admin']), biensController.remove);

export default router;
