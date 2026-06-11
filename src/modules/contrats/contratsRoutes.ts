import { Router } from 'express';
import * as contratsController from './contratsController';
import { authenticate, authorize } from '../../middlewares/auth';

const router = Router();

router.get('/', authenticate, authorize(['agent', 'admin']), contratsController.getAll);
router.get('/payments/all', authenticate, authorize(['agent', 'admin', 'locataire']), contratsController.getAllPayments);
router.get('/:id', authenticate, authorize(['agent', 'admin']), contratsController.getOne);
router.post('/', authenticate, authorize(['agent', 'admin']), contratsController.create);
router.put('/:id', authenticate, authorize(['agent', 'admin']), contratsController.update);
router.delete('/:id', authenticate, authorize(['agent', 'admin']), contratsController.remove);

// New document endpoints
router.get('/:id/documents', authenticate, authorize(['agent', 'admin', 'locataire']), contratsController.getDocuments);
router.post('/:id/documents', authenticate, authorize(['agent', 'admin']), contratsController.addDocument);
router.delete('/:id/documents/:docId', authenticate, authorize(['agent', 'admin']), contratsController.deleteDocument);

// Payment validation & confirmation endpoints
router.get('/:id/payments', authenticate, authorize(['agent', 'admin', 'locataire']), contratsController.getPayments);
router.post('/:id/payments', authenticate, authorize(['agent', 'admin']), contratsController.confirmPayment);
router.delete('/:id/payments/:paymentId', authenticate, authorize(['agent', 'admin']), contratsController.deletePayment);

export default router;
