// src/controllers/utility/data.controller.ts

import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../../middlewares/authMiddleware';
import UtilityService from '../../services/utility.service';
import { BadRequestError } from '../../utils/customErrors';
import Validator from '../../utils/validators';
import UserService from '../../services/user.service';
import { logger } from '../../utils/logger';

export default class DataController {
    private static utilityService = new UtilityService();

    /**
     * Purchase data bundle for a phone number
     */
    static async purchaseData(req: AuthenticatedRequest, res: Response) {
        try {
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
            return res.status(200).json({
                status: response.success ? 'success' : 'error',
                message: response.message,
                data: {
                    transactionReference: response.transactionReference,
                    status: response.transactionStatus,
                    provider: response.providerType,
                    details: response.data,
                },
            });
        } catch (error) {
            logger.error('Error purchasing data bundle', error);

            if (error instanceof BadRequestError) {
                return res.status(400).json({
                    status: 'error',
                    message: error.message,
                });
            }

            return res.status(500).json({
                status: 'error',
                message: 'An error occurred while processing your data bundle purchase',
            });
        }
    }

    /**
     * Get data bundles for a specific network
     */
    static async getDataBundles(req: Request, res: Response) {
        try {
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

            return res.status(200).json({
                status: 'success',
                message: 'Data bundles retrieved successfully',
                data: { bundles },
            });
        } catch (error) {
            logger.error('Error getting data bundles', error);

            if (error instanceof BadRequestError) {
                return res.status(400).json({
                    status: 'error',
                    message: error.message,
                });
            }

            return res.status(500).json({
                status: 'error',
                message: 'An error occurred while retrieving data bundles',
            });
        }
    }

    /**
     * Check transaction status
     */
    static async checkTransactionStatus(req: AuthenticatedRequest, res: Response) {
        try {
            const { reference } = req.params;

            if (!reference) {
                throw new BadRequestError('Transaction reference is required');
            }

            const response = await DataController.utilityService.validateTransaction(reference);

            return res.status(200).json({
                status: response.success ? 'success' : 'error',
                message: response.message,
                data: {
                    transactionReference: response.transactionReference,
                    status: response.transactionStatus,
                    provider: response.providerType,
                    details: response.data,
                },
            });
        } catch (error) {
            logger.error('Error checking transaction status', error);

            if (error instanceof BadRequestError) {
                return res.status(400).json({
                    status: 'error',
                    message: error.message,
                });
            }

            return res.status(500).json({
                status: 'error',
                message: 'An error occurred while checking transaction status',
            });
        }
    }
}