// src/services/providers/irecharge.service.ts

import axios from 'axios';
import crypto from 'crypto';
import {
    IUtilityProvider,
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
    SubscriptionType
} from '../../utils/interface';
import { logger } from '../../utils/logger';
import { IRECHARGE_CONFIG, NODE_ENV } from '../../utils/constants';
import HelperUtils from '../../utils/helpers';
import { IRECHARGE_DATA_NETWORKS } from 'clients/iRecharge.config';

export default class IRechargeService implements IUtilityProvider {
    private readonly baseUrl: string;
    private readonly vendorCode: string;
    private readonly publicKey: string;
    private readonly privateKey: string;

    constructor() {
        this.baseUrl = NODE_ENV === 'production' ? IRECHARGE_CONFIG.LIVE_URL : IRECHARGE_CONFIG.SANDBOX_URL;
        this.vendorCode = IRECHARGE_CONFIG.VENDOR_CODE;
        this.publicKey = IRECHARGE_CONFIG.PUBLIC_KEY;
        this.privateKey = IRECHARGE_CONFIG.PRIVATE_KEY;
    }

    private generateHash(params: string[]): string {
        const combinedString = params.join('|') + '|' + this.publicKey;
        return crypto.createHmac('sha1', this.privateKey).update(combinedString).digest('hex');
    }

    private async makeRequest<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
        try {
            // Create hash
            const hash = this.generateHash(Object.values(params));

            // Create URL with params
            const url = `${this.baseUrl}/${endpoint}`;

            const response = await axios.get(url, {
                params: {
                    ...params,
                    vendor_code: this.vendorCode,
                    hash,
                    response_format: 'json',
                },
            });

            return response.data;
        } catch (error) {
            logger.error(`iRecharge request error: ${endpoint}`, error);
            throw error;
        }
    }

    private generateReferenceId(): string {
        // Format: current timestamp + 10 random characters
        return `${Date.now()}_${HelperUtils.generateRandomString(10)}`;
    }

    private mapStatusToEnum(status: string): TransactionStatus {
        if (status === "completed" || status === "successful") {
            return TransactionStatus.DELIVERED;
        } else if (status === "pending") {
            return TransactionStatus.PENDING;
        } else if (status === "initiated") {
            return TransactionStatus.INITIATED;
        } else {
            return TransactionStatus.FAILED;
        }
    }

    private mapIRechargeResponse(response: any, reference: string): IProviderResponse {
        let transactionStatus = TransactionStatus.FAILED;
        let message = "Transaction failed";
        let success = false;

        // For successful response
        if (response && response.status === "200") {
            transactionStatus = TransactionStatus.DELIVERED;
            success = true;
            message = "Transaction successful";
        } else if (response && response.status === "pending") {
            transactionStatus = TransactionStatus.PENDING;
            message = "Transaction pending";
        } else {
            message = response?.message || "Transaction failed";
        }

        return {
            success,
            transactionStatus,
            transactionReference: reference,
            message,
            providerReference: response?.transaction_id || "",
            providerType: ProviderType.IRECHARGE,
            data: response
        };
    }

    // Implementation of IUtilityProvider methods
    async validateTransaction(reference: string): Promise<IProviderResponse> {
        try {
            // For iRecharge, we need to check the transaction status
            // Using a generic transaction status endpoint
            const params = {
                reference_id: reference
            };

            const response = await this.makeRequest('get_transaction_status.php', params);

            return this.mapIRechargeResponse(response, reference);
        } catch (error) {
            logger.error('iRecharge validate transaction error', error);
            return {
                success: false,
                transactionStatus: TransactionStatus.FAILED,
                transactionReference: reference,
                message: 'Transaction validation failed',
                providerType: ProviderType.IRECHARGE
            };
        }
    }

    async purchaseAirtime(request: IAirtimeRequest): Promise<IProviderResponse> {
        try {
            // Convert network to iRecharge expected format
            const networkMap: { [key: string]: string } = {
                'mtn': 'MTN',
                'airtel': 'Airtel',
                'glo': 'GLO',
                'etisalat': 'Etisalat',
                '9mobile': 'Etisalat'
            };

            const vtuNetwork = networkMap[request.network.toLowerCase()];
            if (!vtuNetwork) {
                throw new Error(`Unsupported network: ${request.network}`);
            }

            const reference = request.reference || this.generateReferenceId();

            const params = {
                vtu_network: vtuNetwork,
                vtu_amount: request.amount.toString(),
                vtu_number: request.recipientPhone,
                vtu_email: request.email || request.phone,
                reference_id: reference
            };

            const response = await this.makeRequest('vend_airtime.php', params);

            return this.mapIRechargeResponse(response, reference);
        } catch (error) {
            logger.error('iRecharge airtime purchase error', error);
            return {
                success: false,
                transactionStatus: TransactionStatus.FAILED,
                transactionReference: request.reference || "",
                message: 'Airtime purchase failed',
                providerType: ProviderType.IRECHARGE
            };
        }
    }

    async purchaseData(request: IDataRequest): Promise<IProviderResponse> {
        try {
            // Convert network to iRecharge expected format for data
            const networkMap: { [key: string]: IRECHARGE_DATA_NETWORKS } = {
                'mtn': IRECHARGE_DATA_NETWORKS.MTN,
                'airtel': IRECHARGE_DATA_NETWORKS.Airtel,
                'glo': IRECHARGE_DATA_NETWORKS.GLO,
                'etisalat': IRECHARGE_DATA_NETWORKS.Etisalat,
                '9mobile': IRECHARGE_DATA_NETWORKS.Etisalat
            };

            const vtuNetwork = networkMap[request.network.toLowerCase()];
            if (!vtuNetwork) {
                throw new Error(`Unsupported network: ${request.network}`);
            }

            const reference = request.reference || this.generateR