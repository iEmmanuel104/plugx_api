// src/controllers/utility/electricity.controller.ts

import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../../middlewares/authMiddleware';
import UtilityService from '../../services/utility.service';
import { BadRequestError } from '../../utils/customErrors';
import UserService from '../../services/user.service';
import { MeterType } from '../../utils/interface';

export default class ElectricityController {
    private static utilityService = new UtilityService();

    /**
     * Validate meter number
     */
    static async validateMeter(req: Request, res: Response) {
        const { disco, meterNumber, meterType } = req.body;

        // Validate required fields
        if (!disco || !meterNumber || !meterType) {
            throw new BadRequestError('Disco, meter number, and meter type are required');
        }

        // Validate meter type
        if (![MeterType.PREPAID, MeterType.POSTPAID].includes(meterType.toUpperCase() as MeterType)) {
            throw new BadRequestError('Invalid meter type. Must be either PREPAID or POSTPAID');
        }

        // Validate disco (basic check, can be more sophisticated)
        const validDiscos = [
            'ikeja', 'eko', 'kano', 'portharcourt', 'jos',
            'ibadan', 'kaduna', 'abuja', 'enugu', 'benin', 'aba', 'yola',
        ];

        if (!validDiscos.includes(disco.toLowerCase())) {
            throw new BadRequestError(`Invalid disco. Supported discos are: ${validDiscos.join(', ')}`);
        }

        const result = await ElectricityController.utilityService.validateMeterNumber(
            disco,
            meterNumber,
                meterType.toUpperCase() as MeterType
        );

        res.status(200).json({
            status: result.success ? 'success' : 'error',
            message: result.success ? 'Meter validated successfully' : (result.message || 'Meter validation failed'),
            data: result.data,
        });

    }

    /**
     * Purchase electricity
     */
    static async purchaseElectricity(req: AuthenticatedRequest, res: Response) {
        const userId = req.user.id;
        const { amount, disco, meterNumber, meterType, email, reference } = req.body;

        // Validate required fields
        if (!amount || !disco || !meterNumber || !meterType) {
            throw new BadRequestError('Amount, disco, meter number, and meter type are required');
        }

        // Validate amount
        if (isNaN(Number(amount)) || Number(amount) <= 0) {
            throw new BadRequestError('Amount must be a positive number');
        }

        // Validate meter type
        if (![MeterType.PREPAID, MeterType.POSTPAID].includes(meterType.toUpperCase() as MeterType)) {
            throw new BadRequestError('Invalid meter type. Must be either PREPAID or POSTPAID');
        }

        // Validate disco
        const validDiscos = [
            'ikeja', 'eko', 'kano', 'portharcourt', 'jos',
            'ibadan', 'kaduna', 'abuja', 'enugu', 'benin', 'aba', 'yola',
        ];

        if (!validDiscos.includes(disco.toLowerCase())) {
            throw new BadRequestError(`Invalid disco. Supported discos are: ${validDiscos.join(', ')}`);
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

        // Process electricity purchase request
        const response = await ElectricityController.utilityService.purchaseElectricity({
            userId,
            amount: Number(amount),
            disco,
            meterNumber,
            meterType: meterType.toUpperCase() as MeterType,
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
     * Get list of supported discos
     */
    static async getSupportedDiscos(req: Request, res: Response) {
        const discos = [
            { id: 'ikeja', name: 'Ikeja Electric (IKEDC)' },
            { id: 'eko', name: 'Eko Electric (EKEDC)' },
            { id: 'kano', name: 'Kano Electric (KEDCO)' },
            { id: 'portharcourt', name: 'Port Harcourt Electric (PHED)' },
            { id: 'jos', name: 'Jos Electric (JED)' },
            { id: 'ibadan', name: 'Ibadan Electric (IBEDC)' },
            { id: 'kaduna', name: 'Kaduna Electric (KAEDCO)' },
            { id: 'abuja', name: 'Abuja Electric (AEDC)' },
            { id: 'enugu', name: 'Enugu Electric (EEDC)' },
            { id: 'benin', name: 'Benin Electric (BEDC)' },
            { id: 'aba', name: 'Aba Electric (ABEDC)' },
            { id: 'yola', name: 'Yola Electric (YEDC)' },
        ];

        res.status(200).json({
            status: 'success',
            message: 'Supported discos retrieved successfully',
            data: { discos },
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

        const response = await ElectricityController.utilityService.validateTransaction(reference);

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