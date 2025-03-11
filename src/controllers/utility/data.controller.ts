// src/controllers/utility/data.controller.ts

import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../../middlewares/authMiddleware';
import UtilityService from '../../services/utility.service';
import { BadRequestError } from '../../utils/customErrors';
import Validator from '../../utils/validators';
import UserService from '../../services/user.service';

export default class DataController {
    private static utilityService = new UtilityService();

    /**
     * Purchase data bundle for a phone number
     */
    static async purchaseData(req: AuthenticatedRequest, res: Response) {
        const userId = req.user.id;
        const { amount, network, recipientPhone, dataCode, email, reference } = req.body;

        // Validate required fields
        if (!amount || !network || !recipientPhone || !dataCode) {
            throw new BadRequestError('Amount, network, recipient phone number, and data code are required');
        }

        // Validate amount
        if (isNaN(Number(amount)) || Number(amount) <= 0) {
            throw new BadRequestError('Amount must be a positive number');
        }

        // Validate phone number
        if (!Validator.isValidPhoneNumber(recipientPhone)) {
            throw new BadRequestError('Invalid recipient phone number');
        }

        // Validate network (basic check, can be more sophisticated)
        const validNetworks = ['mtn', 'airtel', 'glo', 'etisalat', '9mobile'];
        if (!validNetworks.includes(network.toLowerCase())) {
            throw new BadRequestError('Invalid network. Supported networks are: MTN, Airtel, Glo, Etisalat/9mobile');
        }

        // Get user's phone number if not provided in request
        let phone = req.body.phone;
        if (!phone) {
            const user = await UserService.viewSingleUser(userId);
            if (user.phone && user.phone.number) {
                phone = `${user.phone.countryCode}${user.phone.number}`;
            } else {
                phone = recipientPhone; // Use recipient's phone as fallback
            }
        }

        // Process data bundle purchase request
        const response = await DataController.utilityService.purchaseData({
            userId,
            amount: Number(amount),
            network,
            recipientPhone,
            dataCode,
            phone,
            email: email || req.user.email,
            reference,
        });

        // Return response
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
     * Get data bundles for a specific network
     */
    static async getDataBundles(req: Request, res: Response) {
        const { network } = req.params;

        if (!network) {
            throw new BadRequestError('Network is required');
        }

        // Validate network
        const validNetworks = ['mtn', 'airtel', 'glo', 'etisalat', '9mobile'];
        if (!validNetworks.includes(network.toLowerCase())) {
            throw new BadRequestError('Invalid network. Supported networks are: MTN, Airtel, Glo, Etisalat/9mobile');
        }

        const bundles = await DataController.utilityService.validateDataBundle(network);

        res.status(200).json({
            status: 'success',
            message: 'Data bundles retrieved successfully',
            data: { bundles },
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

        const response = await DataController.utilityService.validateTransaction(reference);

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