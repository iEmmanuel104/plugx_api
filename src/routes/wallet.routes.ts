import express, { Router } from 'express';
import WalletController from '../controllers/wallet.controller';
import { basicAuth, AuthenticatedController } from '../middlewares/authMiddleware';

const router: Router = express.Router();

router
    .get('/balance', basicAuth('access'), AuthenticatedController(WalletController.getWalletBalance));


export default router;