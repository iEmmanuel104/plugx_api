import { Router } from 'express';
import authRoute from './auth.routes';
import userRoute from './user.routes';
// import AdminRoutes from './Admin/admin.routes';
import walletRoutes from './wallet.routes';
import cardRoutes from './card.routes';
import bankAccountRoutes from './bankAccount.routes';
import transactionRoutes from './transaction.routes';

const router = Router();

router
    .use('/auth', authRoute)
    // .use('/iamPlugX', adminRoute)
    .use('/wallet', walletRoutes)
    .use('/card', cardRoutes)
    .use('/bankAccount', bankAccountRoutes)
    .use('/transaction', transactionRoutes)
    .use('/user', userRoute);

export default router;


