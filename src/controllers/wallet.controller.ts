import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';
import WalletService from '../services/wallet.service';

export default class WalletController {
    static async getWalletBalance(req: AuthenticatedRequest, res: Response) {
        const userId = req.user.id;
        const balance = await WalletService.getWalletBalance(userId);

        res.status(200).json({
            status: 'success',
            message: 'Wallet balance retrieved successfully',
            data: { balance },
        });
    }

    // Add more wallet-related controller methods as needed
}