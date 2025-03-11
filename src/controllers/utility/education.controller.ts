// src/controllers/utility/education.controller.ts

import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../../middlewares/authMiddleware';
import UtilityService from '../../services/utility.service';
import { BadRequestError } from '../../utils/customErrors';
import UserService from '../../services/user.service';
import { EducationType } from '../../utils/interface';

export default class EducationController {
    private static utilityService = new UtilityService();

    /**
     * Purchase education products (WAEC, JAMB, etc.)
     */
    static async purchaseEducation(req: AuthenticatedRequest, res: Response) {
        const userId = req.user.id;
        const {
            amount,
            type,
            quantity,
            examNumber,
            email,
            reference,
        } = req.body;

        // Validate required fields
        if (!amount || !type) {
            throw new BadRequestError('Amount and type are required');
        }

        // Validate amount
        if (isNaN(Number(amount)) || Number(amount) <= 0) {
            throw new BadRequestError('Amount must be a positive number');
        }

        // Validate education type
        if (![
            EducationType.WAEC_REGISTRATION,
            EducationType.WAEC_RESULT,
            EducationType.JAMB,
        ].includes(type.toLowerCase() as EducationType)) {
            throw new BadRequestError('Invalid type. Must be one of: waec-registration, waec, jamb');
        }

        // For JAMB, we need the profile ID (examNumber)
        if (type.toLowerCase() === EducationType.JAMB && !examNumber) {
            throw new BadRequestError('JAMB profile ID is required for JAMB purchases');
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

        // Process education purchase request
        const response = await EducationController.utilityService.purchaseEducation({
            userId,
            amount: Number(amount),
            type: type.toLowerCase() as EducationType,
            quantity: quantity ? Number(quantity) : 1,
            examNumber,
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
     * Validate JAMB profile ID
     */
    static async validateJambProfile(req: Request, res: Response) {
        const { profileId } = req.body;

        if (!profileId) {
            throw new BadRequestError('JAMB profile ID is required');
        }

        // This is a placeholder since there's no direct method in the utility service
        // You may need to implement this in the VTPass service based on the documentation
        let isValid = false;
        let message = 'JAMB profile validation failed';
        let data = null;

        // Basic validation - this should be replaced with actual API call
        if (profileId && profileId.length > 5) {
            isValid = true;
            message = 'JAMB profile validated successfully';
            data = { profileId, isValid: true };
        }

        res.status(200).json({
            status: isValid ? 'success' : 'error',
            message,
            data,
        });

    }

    /**
     * Get supported education products
     */
    static async getSupportedProducts(req: Request, res: Response) {
        const products = [
            {
                id: EducationType.WAEC_REGISTRATION,
                name: 'WAEC Registration PIN',
                description: 'WASSCE for Private Candidates Registration',
                price: 14450,
            },
            {
                id: EducationType.WAEC_RESULT,
                name: 'WAEC Result Checker PIN',
                description: 'WASSCE Result Checker',
                price: 900,
            },
            {
                id: EducationType.JAMB,
                name: 'JAMB PIN (with mock)',
                description: 'UTME Registration PIN with mock exam',
                price: 7700,
            },
            {
                id: EducationType.JAMB,
                name: 'JAMB PIN (without mock)',
                description: 'UTME Registration PIN without mock exam',
                price: 6200,
            },
        ];

        res.status(200).json({
            status: 'success',
            message: 'Supported education products retrieved successfully',
            data: { products },
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

        const response = await EducationController.utilityService.validateTransaction(reference);

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