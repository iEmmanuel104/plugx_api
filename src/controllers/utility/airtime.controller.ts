// src/controllers/utility/airtime.controller.ts

import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../../middlewares/authMiddleware';
import UtilityService from '../../services/utility.service';
import { BadRequestError } from '../../utils/customErrors';
import Validator from '../../utils/validators';
import UserService from '../../services/user.service';
import { logger } from '../../utils/logger';

export default class AirtimeController {
    private static utilityService = new UtilityService();

    /**
     * Purchase airtime for a phone number
     */
    static async purchaseAirtime(req: AuthenticatedRequest, res: Response) {
        try {
            const userId = req.user.id;
            const { amount, network, recipientPhone, email, reference } = req.body;

            // Validate required fields
            if (!amount || !network || !recipientPhone) {
                throw new BadRequestError('Amount, network, and recipient phone number are required');
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

            // Process airtime purchase request
            const response = await AirtimeController.utilityService.purchaseAirtime({
                userId,
                amount: Number(amount),
                network,
                recipientPhone,
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
            logger.error('Error purchasing airtime', error);

            if (error instanceof BadRequestError) {
                return res.status(400).json({
                    status: 'error',
                    message: error.message,
                });
            }

            return res.status(500).json({
                status: 'error',
                message: 'An error occurred while processing your airtime purchase',
            });
        }
    }

    /**
     * Get list of supported networks
     */
    static async getSupportedNetworks(req: Request, res: Response) {
        try {
            const networks = [
                { id: 'mtn', name: 'MTN' },
                { id: 'airtel', name: 'Airtel' },
                { id: 'glo', name: 'Glo' },
                { id: '9mobile', name: '9mobile' },
            ];

            return res.status(200).json({
                status: 'success',
                message: 'Supported networks retrieved successfully',
                data: { networks },
            });
        } catch (error) {
            logger.error('Error getting supported networks', error);

            return res.status(500).json({
                status: 'error',
                message: 'An error occurred while retrieving supported networks',
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

            const response = await AirtimeController.utilityService.validateTransaction(reference);

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