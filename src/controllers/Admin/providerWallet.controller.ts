// src/controllers/Admin/providerWallet.controller.ts

import { Response } from 'express';
import { AdminAuthenticatedRequest } from '../../middlewares/authMiddleware';
import ProviderWalletService from '../../services/AdminServices/providerWallet.service';
import { BadRequestError, ForbiddenError } from '../../utils/customErrors';

export default class ProviderWalletController {
    /**
     * Get wallet balances from all integrated payment providers
     * Only accessible by super admins
     */
    static async getAllProviderBalances(req: AdminAuthenticatedRequest, res: Response) {
        // Check if the requester is a super admin
        if (req.isSuperAdmin === false) {
            throw new ForbiddenError('Only super admin can view provider wallet balances');
        }

        const balances = await ProviderWalletService.getAllProviderBalances();

        res.status(200).json({
            status: 'success',
            message: 'Provider wallet balances retrieved successfully',
            data: { balances },
        });
    }

    /**
     * Get wallet balance for a specific provider
     * Only accessible by super admins
     */
    static async getProviderBalance(req: AdminAuthenticatedRequest, res: Response) {
        // Check if the requester is a super admin
        if (req.isSuperAdmin === false) {
            throw new ForbiddenError('Only super admin can view provider wallet balances');
        }

        const { provider } = req.params;

        if (!provider) {
            throw new BadRequestError('Provider name is required');
        }

        // Validate provider name
        const validProviders = ['vtpass', 'irecharge'];
        if (!validProviders.includes(provider.toLowerCase())) {
            throw new BadRequestError(`Invalid provider. Supported providers are: ${validProviders.join(', ')}`);
        }

        const balance = await ProviderWalletService.getProviderBalance(provider);

        res.status(200).json({
            status: 'success',
            message: `${provider} wallet balance retrieved successfully`,
            data: { balance },
        });
    }
}