import { Router } from 'express';
import * as locatairesController from './locatairesController';
import { authenticate, authorize } from '../../middlewares/auth';

const router = Router();

router.get('/', authenticate, authorize(['agent', 'admin']), locatairesController.getAll);
router.get('/:id', authenticate, authorize(['agent', 'admin']), locatairesController.getOne);
router.post('/', authenticate, authorize(['agent', 'admin']), locatairesController.create);
router.put('/:id', authenticate, authorize(['agent', 'admin']), locatairesController.update);
router.delete('/:id', authenticate, authorize(['agent', 'admin']), locatairesController.remove);

export default router;
