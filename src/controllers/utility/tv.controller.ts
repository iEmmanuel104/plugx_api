// src/controllers/utility/tv.controller.ts

import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../../middlewares/authMiddleware';
import UtilityService from '../../services/utility.service';
import { BadRequestError } from '../../utils/customErrors';
import UserService from '../../services/user.service';
import { TVType, SubscriptionType } from '../../utils/interface';

export default class TVController {
    private static utilityService = new UtilityService();

    /**
     * Validate smart card number
     */
    static async validateSmartCard(req: Request, res: Response) {
        const { provider, smartCardNumber } = req.body;

        // Validate required fields
        if (!provider || !smartCardNumber) {
            throw new BadRequestError('Provider and smart card number are required');
        }

        // Validate provider
        if (![TVType.DSTV, TVType.GOTV, TVType.STARTIMES, TVType.SHOWMAX].includes(provider.toLowerCase() as TVType)) {
            throw new BadRequestError('Invalid provider. Must be one of: DSTV, GOTV, STARTIMES, SHOWMAX');
        }

        const result = await TVController.utilityService.validateSmartCardNumber(
                provider.toLowerCase() as TVType,
                smartCardNumber
        );

        res.status(200).json({
            status: result.success ? 'success' : 'error',
            message: result.success ? 'Smart card validated successfully' : (result.message || 'Smart card validation failed'),
            data: result.data,
        });

    }

    /**
     * Get TV packages for a specific provider
     */
    static async getTVPackages(req: Request, res: Response) {
        const { provider } = req.params;

        if (!provider) {
            throw new BadRequestError('Provider is required');
        }

        // Validate provider
        if (![TVType.DSTV, TVType.GOTV, TVType.STARTIMES, TVType.SHOWMAX].includes(provider.toLowerCase() as TVType)) {
            throw new BadRequestError('Invalid provider. Must be one of: DSTV, GOTV, STARTIMES, SHOWMAX');
        }

        const packages = await TVController.utilityService.validateTVPackages(provider.toLowerCase() as TVType);

        res.status(200).json({
            status: 'success',
            message: 'TV packages retrieved successfully',
            data: { packages },
        });

    }

    /**
     * Purchase TV subscription
     */
    static async purchaseTV(req: AuthenticatedRequest, res: Response) {
        const userId = req.user.id;
        const {
            amount,
            provider,
            smartCardNumber,
            packageCode,
            subscriptionType,
            email,
            reference,
        } = req.body;

        // Validate required fields
        if (!amount || !provider || !smartCardNumber) {
            throw new BadRequestError('Amount, provider, and smart card number are required');
        }

        // Validate amount
        if (isNaN(Number(amount)) || Number(amount) <= 0) {
            throw new BadRequestError('Amount must be a positive number');
        }

        // Validate provider
        if (![TVType.DSTV, TVType.GOTV, TVType.STARTIMES, TVType.SHOWMAX].includes(provider.toLowerCase() as TVType)) {
            throw new BadRequestError('Invalid provider. Must be one of: DSTV, GOTV, STARTIMES, SHOWMAX');
        }

        // For DSTV and GOTV subscription type is required
        if ((provider.toLowerCase() === TVType.DSTV || provider.toLowerCase() === TVType.GOTV) &&
                subscriptionType &&
                ![SubscriptionType.CHANGE, SubscriptionType.RENEW].includes(subscriptionType.toLowerCase() as SubscriptionType)) {
            throw new BadRequestError('Invalid subscription type. Must be either CHANGE or RENEW');
        }

        // Package code is required for new subscriptions or when changing packages
        if ((provider.toLowerCase() !== TVType.SHOWMAX) &&
                (!subscriptionType || subscriptionType.toLowerCase() === SubscriptionType.CHANGE) &&
                !packageCode) {
            throw new BadRequestError('Package code is required for new subscriptions or when changing packages');
        }

        // Get user's phone number if not provided in request
        let phone = req.body.phone;
        if (!phone) {
            const user = await UserService.viewSingleUser(userId);
            if (user.phone && user.phone.number) {
                phone = `${user.phone.countryCode}${user.phone.number}`;
            } else {
                throw new BadRequestError('Phone number is required');
            }
        }

        // Process TV subscription purchase request
        const response = await TVController.utilityService.purchaseTV({
            userId,
            amount: Number(amount),
            provider: provider.toLowerCase() as TVType,
            smartCardNumber,
            packageCode,
            subscriptionType: subscriptionType ? (subscriptionType.toLowerCase() as SubscriptionType) : undefined,
            phone,
            email: email || req.user.email,
            reference,
        });

        // response
        res.status(200).json({
            status: response.success ? 'success' : 'error',
            message: response.message,
            data: {
                transactionReference: response.transactionReference,
                status: response.transactionStatus,
                provider: response.providerType,
                details: response.data,
            },
        });

    }

    /**
     * Get list of supported TV providers
     */
    static async getSupportedProviders(req: Request, res: Response) {
        const providers = [
            { id: TVType.DSTV, name: 'DSTV' },
            { id: TVType.GOTV, name: 'GOTV' },
            { id: TVType.STARTIMES, name: 'StarTimes' },
            { id: TVType.SHOWMAX, name: 'Showmax' },
        ];

        res.status(200).json({
            status: 'success',
            message: 'Supported TV providers retrieved successfully',
            data: { providers },
        });

    }

    /**
     * Check transaction status
     */
    static async checkTransactionStatus(req: AuthenticatedRequest, res: Response) {
        const { reference } = req.params;

        if (!reference) {
            throw new BadRequestError('Transaction reference is required');
        }

        const response = await TVController.utilityService.validateTransaction(reference);

        res.status(200).json({
            status: response.success ? 'success' : 'error',
            message: response.message,
            data: {
                transactionReference: response.transactionReference,
                status: response.transactionStatus,
                provider: response.providerType,
                details: response.data,
            },
        });

    }
}