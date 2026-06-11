import { Router } from 'express';
import * as proprietairesController from './proprietairesController';
import { authenticate, authorize } from '../../middlewares/auth';

const router = Router();

router.get('/', authenticate, authorize(['agent', 'admin']), proprietairesController.getAll);
router.get('/:id', authenticate, authorize(['agent', 'admin']), proprietairesController.getOne);
router.post('/', authenticate, authorize(['agent', 'admin']), proprietairesController.create);

export default router;
