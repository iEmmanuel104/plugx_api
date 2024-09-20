import express, { Router } from 'express';
import { basicAuth, AuthenticatedController } from '../middlewares/authMiddleware';
import BankAccountController from '../controllers/bankAccount.controller';

const router: Router = express.Router();

router
    .post('/', basicAuth('access'), AuthenticatedController(BankAccountController.addBankAccount))
    .get('/', basicAuth('access'), AuthenticatedController(BankAccountController.getBankAccounts))
    .delete('/:id', basicAuth('access'), AuthenticatedController(BankAccountController.deleteBankAccount));

export default router;