/* eslint-disable @typescript-eslint/no-explicit-any */
// src/services/providers/vtpass.service.ts
import axios from 'axios';
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
    SubscriptionType,
} from '../../utils/interface';
import { logger } from '../../utils/logger';
import { VTPASS_CONFIG, NODE_ENV } from '../../utils/constants';
import HelperUtils from '../../utils/helpers';

export default class VTPassService implements IUtilityProvider {
    private readonly baseUrl: string;
    private readonly apiKey: string;
    private readonly secretKey: string;
    private readonly publicKey: string;

    constructor() {
        this.baseUrl = NODE_ENV === 'production' ? VTPASS_CONFIG.LIVE_URL : VTPASS_CONFIG.SANDBOX_URL;
        this.apiKey = VTPASS_CONFIG.API_KEY;
        this.secretKey = VTPASS_CONFIG.SECRET_KEY;
        this.publicKey = VTPASS_CONFIG.PUBLIC_KEY;
    }

    private async makeGetRequest<T>(endpoint: string, params: any = {}): Promise<T> {
        try {
            const response = await axios.get(`${this.baseUrl}/${endpoint}`, {
                params,
                headers: {
                    'api-key': this.apiKey,
                    'public-key': this.publicKey,
                },
            });
            return response.data;
        } catch (error) {
            logger.error(`VTPass GET request error: ${endpoint}`, error);
            throw error;
        }
    }

    private async makePostRequest<T>(endpoint: string, data: any = {}): Promise<T> {
        try {
            const response = await axios.post(`${this.baseUrl}/${endpoint}`, data, {
                headers: {
                    'api-key': this.apiKey,
                    'secret-key': this.secretKey,
                },
            });
            return response.data;
        } catch (error) {
            logger.error(`VTPass POST request error: ${endpoint}`, error);
            throw error;
        }
    }

    private generateRequestId(): string {
        // Format YYYYMMDDHHIISS + 8 random characters
        const now = new Date();
        const date = now.toISOString().slice(0, 10).replace(/-/g, '');
        const time = now.getHours().toString().padStart(2, '0') +
            now.getMinutes().toString().padStart(2, '0') +
            now.getSeconds().toString().padStart(2, '0');
        return `${date}${time}-${Date.now()}-${HelperUtils.generateRandomString(8)}`;
    }

    private mapStatusToEnum(status: string): TransactionStatus {
        switch (status.toLowerCase()) {
        case 'delivered':
            return TransactionStatus.DELIVERED;
        case 'pending':
            return TransactionStatus.PENDING;
        case 'initiated':
            return TransactionStatus.INITIATED;
        case 'reversed':
            return TransactionStatus.REVERSED;
        default:
            return TransactionStatus.FAILED;
        }
    }

    private mapVTPassResponse(vtpassResponse: any): IProviderResponse {
        let transactionStatus = TransactionStatus.FAILED;
        let message = 'Transaction failed';
        let success = false;

        if (vtpassResponse.code === '000') {
            if (vtpassResponse.content?.transactions?.status) {
                transactionStatus = this.mapStatusToEnum(vtpassResponse.content.transactions.status);
                success = transactionStatus === TransactionStatus.DELIVERED;
            }
            message = vtpassResponse.response_description || 'Transaction processed';
        } else {
            message = vtpassResponse.response_description || 'Transaction failed';
        }

        return {
            success,
            transactionStatus,
            transactionReference: vtpassResponse.requestId || '',
            message,
            providerReference: vtpassResponse.content?.transactions?.transactionId || '',
            providerType: ProviderType.VTPASS,
            data: vtpassResponse,
        };
    }

    // Implementation of IUtilityProvider methods
    async validateTransaction(reference: string): Promise<IProviderResponse> {
        try {
            const response = await this.makePostRequest('requery', { request_id: reference });
            return this.mapVTPassResponse(response);
        } catch (error) {
            logger.error('VTPass validate transaction error', error);
            return {
                success: false,
                transactionStatus: TransactionStatus.FAILED,
                transactionReference: reference,
                message: 'Transaction validation failed',
                providerType: ProviderType.VTPASS,
            };
        }
    }

    async purchaseAirtime(request: IAirtimeRequest): Promise<IProviderResponse> {
        try {
            // Map network to VTPass serviceID
            const networkMap: { [key: string]: string } = {
                'mtn': 'mtn',
                'airtel': 'airtel',
                'glo': 'glo',
                'etisalat': 'etisalat',
                '9mobile': 'etisalat',
            };

            const serviceID = networkMap[request.network.toLowerCase()];
            if (!serviceID) {
                throw new Error(`Unsupported network: ${request.network}`);
            }

            const requestId = request.reference || this.generateRequestId();
            const payload = {
                request_id: requestId,
                serviceID,
                amount: request.amount,
                phone: request.phone,
            };

            const response = await this.makePostRequest('pay', payload);
            return this.mapVTPassResponse(response);
        } catch (error) {
            logger.error('VTPass airtime purchase error', error);
            return {
                success: false,
                transactionStatus: TransactionStatus.FAILED,
                transactionReference: request.reference || '',
                message: 'Airtime purchase failed',
                providerType: ProviderType.VTPASS,
            };
        }
    }

    async purchaseData(request: IDataRequest): Promise<IProviderResponse> {
        try {
            // Map network to VTPass serviceID
            const networkMap: { [key: string]: string } = {
                'mtn': 'mtn-data',
                'airtel': 'airtel-data',
                'glo': 'glo-data',
                'etisalat': 'etisalat-data',
                '9mobile': 'etisalat-data',
            };

            const serviceID = networkMap[request.network.toLowerCase()];
            if (!serviceID) {
                throw new Error(`Unsupported network: ${request.network}`);
            }

            const requestId = request.reference || this.generateRequestId();
            const payload = {
                request_id: requestId,
                serviceID,
                billersCode: request.recipientPhone,
                variation_code: request.dataCode,
                amount: request.amount,
                phone: request.phone,
            };

            const response = await this.makePostRequest('pay', payload);
            return this.mapVTPassResponse(response);
        } catch (error) {
            logger.error('VTPass data purchase error', error);
            return {
                success: false,
                transactionStatus: TransactionStatus.FAILED,
                transactionReference: request.reference || '',
                message: 'Data purchase failed',
                providerType: ProviderType.VTPASS,
            };
        }
    }

    async purchaseElectricity(request: IElectricityRequest): Promise<IProviderResponse> {
        try {
            // Map disco to VTPass serviceID
            const discoMap: { [key: string]: string } = {
                'ikeja': 'ikeja-electric',
                'eko': 'eko-electric',
                'kano': 'kano-electric',
                'portharcourt': 'portharcourt-electric',
                'jos': 'jos-electric',
                'ibadan': 'ibadan-electric',
                'kaduna': 'kaduna-electric',
                'abuja': 'abuja-electric',
                'enugu': 'enugu-electric',
                'benin': 'benin-electric',
                'aba': 'aba-electric',
                'yola': 'yola-electric',
            };

            const serviceID = discoMap[request.disco.toLowerCase()];
            if (!serviceID) {
                throw new Error(`Unsupported disco: ${request.disco}`);
            }

            const requestId = request.reference || this.generateRequestId();
            const payload: {
                request_id: string;
                serviceID: string;
                billersCode: string;
                variation_code: string;
                amount: number;
                phone: string;
                email?: string;
            } = {
                request_id: requestId,
                serviceID,
                billersCode: request.meterNumber,
                variation_code: request.meterType.toLowerCase(),
                amount: request.amount,
                phone: request.phone,
            };

            // Add optional email if provided
            if (request.email) {
                payload['email'] = request.email;
            }

            const response = await this.makePostRequest('pay', payload);
            return this.mapVTPassResponse(response);
        } catch (error) {
            logger.error('VTPass electricity purchase error', error);
            return {
                success: false,
                transactionStatus: TransactionStatus.FAILED,
                transactionReference: request.reference || '',
                message: 'Electricity purchase failed',
                providerType: ProviderType.VTPASS,
            };
        }
    }

    async purchaseTV(request: ITVRequest): Promise<IProviderResponse> {
        try {
            const providerMap: { [key: string]: string } = {
                [TVType.DSTV]: 'dstv',
                [TVType.GOTV]: 'gotv',
                [TVType.STARTIMES]: 'startimes',
                [TVType.SHOWMAX]: 'showmax',
            };

            const serviceID = providerMap[request.provider];
            if (!serviceID) {
                throw new Error(`Unsupported TV provider: ${request.provider}`);
            }

            const requestId = request.reference || this.generateRequestId();
            const payload: any = {
                request_id: requestId,
                serviceID,
                billersCode: request.smartCardNumber,
                amount: request.amount,
                phone: request.phone,
            };

            // For DSTV and GOTV, we need to specify the subscription type
            if ((request.provider === TVType.DSTV || request.provider === TVType.GOTV) && request.subscriptionType) {
                payload.subscription_type = request.subscriptionType;
            }

            // For DSTV, GOTV, and Startimes with subscription_type as 'change', we need package code
            if (request.packageCode &&
                (request.provider !== TVType.SHOWMAX) &&
                (!request.subscriptionType || request.subscriptionType === SubscriptionType.CHANGE)) {
                payload.variation_code = request.packageCode;
            }

            // Add optional email if provided
            if (request.email) {
                payload['email'] = request.email;
            }

            const response = await this.makePostRequest('pay', payload);
            return this.mapVTPassResponse(response);
        } catch (error) {
            logger.error('VTPass TV subscription error', error);
            return {
                success: false,
                transactionStatus: TransactionStatus.FAILED,
                transactionReference: request.reference || '',
                message: 'TV subscription failed',
                providerType: ProviderType.VTPASS,
            };
        }
    }

    async purchaseEducation(request: IEducationRequest): Promise<IProviderResponse> {
        try {
            const serviceID = request.type;
            const requestId = request.reference || this.generateRequestId();

            const payload: any = {
                request_id: requestId,
                serviceID,
                phone: request.phone,
                amount: request.amount,
            };

            // JAMB requires examNumber (profile ID)
            if (request.type === 'jamb' && request.examNumber) {
                payload.billersCode = request.examNumber;
            }

            // Add quantity if provided
            if (request.quantity && request.quantity > 0) {
                payload.quantity = request.quantity;
            }

            // Add variation_code for specific education types
            if (request.type === 'waec') {
                payload.variation_code = 'waecdirect';
            } else if (request.type === 'jamb') {
                // For JAMB, we need to decide between UTME with mock or without mock
                payload.variation_code = request.amount >= 7700 ? 'utme-mock' : 'utme-no-mock';
            }

            // Add optional email if provided
            if (request.email) {
                payload['email'] = request.email;
            }

            const response = await this.makePostRequest('pay', payload);
            return this.mapVTPassResponse(response);
        } catch (error) {
            logger.error('VTPass education purchase error', error);
            return {
                success: false,
                transactionStatus: TransactionStatus.FAILED,
                transactionReference: request.reference || '',
                message: 'Education purchase failed',
                providerType: ProviderType.VTPASS,
            };
        }
    }

    async validateMeterNumber(disco: string, meterNumber: string, meterType: MeterType): Promise<any> {
        try {
            const discoMap: { [key: string]: string } = {
                'ikeja': 'ikeja-electric',
                'eko': 'eko-electric',
                'kano': 'kano-electric',
                'portharcourt': 'portharcourt-electric',
                'jos': 'jos-electric',
                'ibadan': 'ibadan-electric',
                'kaduna': 'kaduna-electric',
                'abuja': 'abuja-electric',
                'enugu': 'enugu-electric',
                'benin': 'benin-electric',
                'aba': 'aba-electric',
                'yola': 'yola-electric',
            };

            const serviceID = discoMap[disco.toLowerCase()];
            if (!serviceID) {
                throw new Error(`Unsupported disco: ${disco}`);
            }

            const payload = {
                billersCode: meterNumber,
                serviceID,
                type: meterType.toLowerCase(),
            };

            const response = await this.makePostRequest('merchant-verify', payload);

            if (response.code === '000') {
                return {
                    success: true,
                    data: response.content,
                };
            }

            return {
                success: false,
                message: response.response_description || 'Meter validation failed',
                data: response,
            };
        } catch (error) {
            logger.error('VTPass meter validation error', error);
            throw error;
        }
    }

    async validateSmartCardNumber(provider: TVType, smartCardNumber: string): Promise<any> {
        try {
            const providerMap: { [key: string]: string } = {
                [TVType.DSTV]: 'dstv',
                [TVType.GOTV]: 'gotv',
                [TVType.STARTIMES]: 'startimes',
                [TVType.SHOWMAX]: 'showmax',
            };

            const serviceID = providerMap[provider];
            if (!serviceID) {
                throw new Error(`Unsupported TV provider: ${provider}`);
            }

            // Showmax doesn't support smartcard validation
            if (provider === TVType.SHOWMAX) {
                return {
                    success: true,
                    message: 'Showmax does not support smartcard validation',
                    data: { isValid: true },
                };
            }

            const payload = {
                billersCode: smartCardNumber,
                serviceID,
            };

            const response = await this.makePostRequest('merchant-verify', payload);

            if (response.code === '000') {
                return {
                    success: true,
                    data: response.content,
                };
            }

            return {
                success: false,
                message: response.response_description || 'Smartcard validation failed',
                data: response,
            };
        } catch (error) {
            logger.error('VTPass smartcard validation error', error);
            throw error;
        }
    }

    async validateDataBundle(network: string): Promise<any[]> {
        try {
            const networkMap: { [key: string]: string } = {
                'mtn': 'mtn-data',
                'airtel': 'airtel-data',
                'glo': 'glo-data',
                'etisalat': 'etisalat-data',
                '9mobile': 'etisalat-data',
            };

            const serviceID = networkMap[network.toLowerCase()];
            if (!serviceID) {
                throw new Error(`Unsupported network: ${network}`);
            }

            const response = await this.makeGetRequest('service-variations', { serviceID });

            if (response.response_description === '000' && response.content && response.content.variations) {
                return response.content.variations;
            }

            return [];
        } catch (error) {
            logger.error('VTPass data bundle validation error', error);
            throw error;
        }
    }

    async validateTVPackages(provider: TVType): Promise<any[]> {
        try {
            const providerMap: { [key: string]: string } = {
                [TVType.DSTV]: 'dstv',
                [TVType.GOTV]: 'gotv',
                [TVType.STARTIMES]: 'startimes',
                [TVType.SHOWMAX]: 'showmax',
            };

            const serviceID = providerMap[provider];
            if (!serviceID) {
                throw new Error(`Unsupported TV provider: ${provider}`);
            }

            const response = await this.makeGetRequest('service-variations', { serviceID });

            if (response.response_description === '000' && response.content && response.content.variations) {
                return response.content.variations;
            }

            return [];
        } catch (error) {
            logger.error('VTPass TV packages validation error', error);
            throw error;
        }
    }
}