import {
    IUtilityService,
    IAirtimeRequest,
    IDataRequest,
    IElectricityRequest,
    ITVRequest,
    IEducationRequest,
    IProviderResponse,
    MeterType,
    ProviderType,
    TVType,
    TransactionStatus,
} from '../utils/interface';
import VTPassService from './providers/vtpass.service';
import IRechargeService from './providers/iRecharge.service';
import { logger } from '../utils/logger';
import { TransactionType, TransactionStatus as DbTransactionStatus } from '../models/transaction.model';
import TransactionService from './transaction.service';
import { Database } from '../models';
import { v4 as uuidv4 } from 'uuid';
import WalletService from './wallet.service';

export default class UtilityService implements IUtilityService {
    private readonly vtpassService: VTPassService;
    private readonly irechargeService: IRechargeService;

    constructor() {
        this.vtpassService = new VTPassService();
        this.irechargeService = new IRechargeService();
    }

    /**
     * Attempts to complete a utility request using the primary provider (VTPass)
     * and falls back to the secondary provider (iRecharge) if needed
     */
    private async executeWithFallback<T extends { reference?: string }>(
        request: T,
        primaryAction: (request: T) => Promise<IProviderResponse>,
        fallbackAction: (request: T) => Promise<IProviderResponse>,
        transactionType: TransactionType,
        userId: string
    ): Promise<IProviderResponse> {
        // Ensure we have a reference for tracking
        const reference = request.reference || uuidv4();
        const requestWithRef = { ...request, reference };

        // Create a database transaction to ensure consistency
        const sequelizeTransaction = await Database.transaction();

        try {
            // Get user's wallet
            const wallet = await WalletService.getWallet(userId);
            
            // Create initial pending transaction in our database
            const transaction = await TransactionService.createTransaction({
                userId,
                walletId: wallet.id, 
                type: transactionType,
                amount: 'amount' in request ? Number((request as Record<string, unknown>).amount) : 0,
                currency: 'NGN',
                reference,
                status: DbTransactionStatus.PENDING,
                description: `${transactionType} transaction initiated`,
                transactionDate: new Date(),
                previousBalance: wallet.balance, 
                metadata: { request: requestWithRef },
            }, sequelizeTransaction);

            // First try with primary provider (VTPass)
            logger.info(`Attempting to process ${transactionType} with primary provider`, { reference });
            let response = await primaryAction(requestWithRef);

            // If primary provider fails, try the fallback provider (iRecharge)
            if (!response.success && response.transactionStatus !== TransactionStatus.PENDING) {
                logger.info(`Primary provider failed for ${transactionType}, trying fallback provider`, { reference });
                response = await fallbackAction(requestWithRef);
            }

            // Update transaction status based on provider response
            const txStatus = this.mapProviderStatusToDbStatus(response.transactionStatus);

            await TransactionService.updateTransactionStatus(
                transaction.id,
                userId,
                txStatus,
                sequelizeTransaction
            );

            // Update transaction metadata with provider response
            await transaction.update({
                metadata: {
                    ...transaction.metadata,
                    provider: response.providerType,
                    providerReference: response.providerReference,
                    response: response.data,
                },
            }, { transaction: sequelizeTransaction });

            await sequelizeTransaction.commit();
            return response;
        } catch (error: unknown) {
            await sequelizeTransaction.rollback();
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            logger.error(`Error processing ${transactionType}`, { error: errorMessage, reference });

            return {
                success: false,
                transactionStatus: TransactionStatus.FAILED,
                transactionReference: reference,
                message: `An error occurred while processing the ${transactionType} transaction`,
                providerType: ProviderType.VTPASS, 
                data: { error: errorMessage },
            };
        }
    }

    private mapProviderStatusToDbStatus(status: TransactionStatus): DbTransactionStatus {
        switch (status) {
        case TransactionStatus.DELIVERED:
            return DbTransactionStatus.SUCCESS;
        case TransactionStatus.PENDING:
            return DbTransactionStatus.PENDING;
        case TransactionStatus.REVERSED:
            return DbTransactionStatus.FAILED; 
        default:
            return DbTransactionStatus.FAILED;
        }
    }

    // IUtilityService Implementation
    async purchaseAirtime(request: IAirtimeRequest & { userId: string }): Promise<IProviderResponse> {
        return this.executeWithFallback(
            request,
            (request) => this.vtpassService.purchaseAirtime(request),
            (request) => this.irechargeService.purchaseAirtime(request),
            TransactionType.CHARGE,
            request.userId
        );
    }

    async purchaseData(request: IDataRequest & { userId: string }): Promise<IProviderResponse> {
        return this.executeWithFallback(
            request,
            (request) => this.vtpassService.purchaseData(request),
            (request) => this.irechargeService.purchaseData(request),
            TransactionType.CHARGE,
            request.userId
        );
    }

    async purchaseElectricity(request: IElectricityRequest & { userId: string }): Promise<IProviderResponse> {
        return this.executeWithFallback(
            request,
            (request) => this.vtpassService.purchaseElectricity(request),
            (request) => this.irechargeService.purchaseElectricity(request),
            TransactionType.CHARGE,
            request.userId
        );
    }

    async purchaseTV(request: ITVRequest & { userId: string }): Promise<IProviderResponse> {
        return this.executeWithFallback(
            request,
            (request) => this.vtpassService.purchaseTV(request),
            (request) => this.irechargeService.purchaseTV(request),
            TransactionType.CHARGE,
            request.userId
        );
    }

    async purchaseEducation(request: IEducationRequest & { userId: string }): Promise<IProviderResponse> {
        // Since iRecharge doesn't support education services, we'll only use VTPass
        return this.executeWithFallback(
            request,
            (request) => this.vtpassService.purchaseEducation(request),
            () => Promise.resolve({
                success: false,
                transactionStatus: TransactionStatus.FAILED,
                transactionReference: request.reference || '',
                message: 'Education services not supported by secondary provider',
                providerType: ProviderType.IRECHARGE,
            }),
            TransactionType.CHARGE,
            request.userId
        );
    }

    async validateTransaction(reference: string): Promise<IProviderResponse> {
        try {
            // First, check our database for the transaction
            const transaction = await TransactionService.findTransactionByReference(reference);

            if (!transaction) {
                return {
                    success: false,
                    transactionStatus: TransactionStatus.FAILED,
                    transactionReference: reference,
                    message: 'Transaction not found',
                    providerType: ProviderType.VTPASS,
                };
            }

            // If we have a provider stored in metadata, use that provider to check status
            const metadata = transaction.metadata as Record<string, unknown>;
            const provider = metadata?.provider || ProviderType.VTPASS;

            // Now validate with the appropriate provider
            if (provider === ProviderType.IRECHARGE) {
                return this.irechargeService.validateTransaction(reference);
            } else {
                return this.vtpassService.validateTransaction(reference);
            }
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            logger.error('Error validating transaction', { error: errorMessage, reference });
            return {
                success: false,
                transactionStatus: TransactionStatus.FAILED,
                transactionReference: reference,
                message: 'Error validating transaction',
                providerType: ProviderType.VTPASS,
            };
        }
    }

    async validateMeterNumber(disco: string, meterNumber: string, meterType: MeterType): Promise<Record<string, unknown>> {
        try {
            // Try with VTPass first
            try {
                const vtpassResult = await this.vtpassService.validateMeterNumber(disco, meterNumber, meterType);
                if (vtpassResult.success) {
                    return vtpassResult;
                }
            } catch (error) {
                logger.error('VTPass meter validation error', { error, disco, meterNumber, meterType });
            }

            // Fallback to iRecharge
            return this.irechargeService.validateMeterNumber(disco, meterNumber, meterType);
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            logger.error('Error validating meter number', { error: errorMessage, disco, meterNumber, meterType });
            throw error;
        }
    }

    async validateSmartCardNumber(provider: TVType, smartCardNumber: string): Promise<Record<string, unknown>> {
        try {
            // Try with VTPass first
            try {
                const vtpassResult = await this.vtpassService.validateSmartCardNumber(provider, smartCardNumber);
                if (vtpassResult.success) {
                    return vtpassResult;
                }
            } catch (error) {
                logger.error('VTPass smartcard validation error', { error, provider, smartCardNumber });
            }

            // Fallback to iRecharge
            return this.irechargeService.validateSmartCardNumber(provider, smartCardNumber);
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            logger.error('Error validating smartcard number', { error: errorMessage, provider, smartCardNumber });
            throw error;
        }
    }

    async validateDataBundle(network: string): Promise<unknown[]> {
        try {
            // Try with VTPass first
            try {
                const vtpassBundles = await this.vtpassService.validateDataBundle(network);
                if (vtpassBundles && vtpassBundles.length > 0) {
                    return vtpassBundles;
                }
            } catch (error) {
                logger.error('VTPass data bundle validation error', { error, network });
            }

            // Fallback to iRecharge
            return this.irechargeService.validateDataBundle(network);
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            logger.error('Error validating data bundles', { error: errorMessage, network });
            return [];
        }
    }

    async validateTVPackages(provider: TVType): Promise<unknown[]> {
        try {
            // Try with VTPass first
            try {
                const vtpassPackages = await this.vtpassService.validateTVPackages(provider);
                if (vtpassPackages && vtpassPackages.length > 0) {
                    return vtpassPackages;
                }
            } catch (error) {
                logger.error('VTPass TV packages validation error', { error, provider });
            }

            // Fallback to iRecharge
            return this.irechargeService.validateTVPackages(provider);
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            logger.error('Error validating TV packages', { error: errorMessage, provider });
            return [];
        }
    }
}