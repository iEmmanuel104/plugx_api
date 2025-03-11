import { Router } from 'express';
import authRoute from './auth.routes';
import userRoute from './user.routes';
import adminRoutes from './Admin/admin.routes';
import walletRoutes from './wallet.routes';
import cardRoutes from './card.routes';
import bankAccountRoutes from './bankAccount.routes';
import transactionRoutes from './transaction.routes';
import utilityRoutes from './utility.routes';

const router = Router();

router
    .use('/auth', authRoute)
    .use('/iamplugx', adminRoutes)
    .use('/wallet', walletRoutes)
    .use('/card', cardRoutes)
    .use('/bankAccount', bankAccountRoutes)
    .use('/transaction', transactionRoutes)
    .use('/utility', utilityRoutes)
    .use('/user', userRoute);

export default router;