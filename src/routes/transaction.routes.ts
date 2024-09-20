import express, { Router } from 'express';
import { basicAuth, AuthenticatedController } from '../middlewares/authMiddleware';
import TransactionController from '../controllers/transaction.controller';

const router: Router = express.Router();

router
    .post('/', basicAuth('access'), AuthenticatedController(TransactionController.createTransaction))
    .get('/', basicAuth('access'), AuthenticatedController(TransactionController.getTransactions))
    .get('/:id', basicAuth('access'), AuthenticatedController(TransactionController.getTransaction))
    .patch('/:id/status', basicAuth('access'), AuthenticatedController(TransactionController.updateTransactionStatus));

export default router;