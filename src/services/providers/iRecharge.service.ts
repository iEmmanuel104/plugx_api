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
} from '../../utils/interface';
import { logger } from '../../utils/logger';
import { IRECHARGE_CONFIG, NODE_ENV } from '../../utils/constants';
import HelperUtils from '../../utils/helpers';
import { IRECHARGE_DATA_NETWORKS } from '../../clients/iRecharge/config';
import { 
    IRechargeBaseResponse, 
    IRechargeTransactionStatusResponse, 
    IRechargeAirtimeResponse, 
    IRechargeDataResponse, 
    IRechargeElectricityResponse, 
    IRechargeSmartCardInfoResponse, 
    IRechargeSmartCardResponse, 
    IRechargeDataBundlesResponse, 
    IRechargeDataBundle,
    IRechargePackage,
    IRechargePackagesResponse,
    IDataBundleInfo,
    ITVPackageInfo,
} from '../../clients/iRecharge/types';

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
        if (status === 'completed' || status === 'successful' || status === '200') {
            return TransactionStatus.DELIVERED;
        } else if (status === 'pending') {
            return TransactionStatus.PENDING;
        } else if (status === 'initiated') {
            return TransactionStatus.INITIATED;
        } else {
            return TransactionStatus.FAILED;
        }
    }

    private mapIRechargeResponse(response: IRechargeBaseResponse, reference: string): IProviderResponse {
        const transactionStatus = this.mapStatusToEnum(response.status);
        const success = response.status === '200';
        const message = response.message || 'Transaction processed';

        return {
            success,
            transactionStatus,
            transactionReference: reference,
            message,
            providerReference: response.transaction_id || '',
            providerType: ProviderType.IRECHARGE,
            data: response,
        };
    }

    // Implementation of IUtilityProvider methods
    async validateTransaction(reference: string): Promise<IProviderResponse> {
        try {
            // For iRecharge, we need to check the transaction status
            const params = {
                reference_id: reference,
            };

            const response = await this.makeRequest<IRechargeTransactionStatusResponse>('get_transaction_status.php', params);

            return this.mapIRechargeResponse(response, reference);
        } catch (error) {
            logger.error('iRecharge validate transaction error', error);
            return {
                success: false,
                transactionStatus: TransactionStatus.FAILED,
                transactionReference: reference,
                message: 'Transaction validation failed',
                providerType: ProviderType.IRECHARGE,
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
                '9mobile': 'Etisalat',
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
                reference_id: reference,
            };

            const response = await this.makeRequest<IRechargeAirtimeResponse>('vend_airtime.php', params);

            return this.mapIRechargeResponse(response, reference);
        } catch (error) {
            logger.error('iRecharge airtime purchase error', error);
            return {
                success: false,
                transactionStatus: TransactionStatus.FAILED,
                transactionReference: request.reference || '',
                message: error instanceof Error ? error.message : 'Airtime purchase failed',
                providerType: ProviderType.IRECHARGE,
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
                '9mobile': IRECHARGE_DATA_NETWORKS.Etisalat,
            };

            const vtuNetwork = networkMap[request.network.toLowerCase()];
            if (!vtuNetwork) {
                throw new Error(`Unsupported network: ${request.network}`);
            }

            const reference = request.reference || this.generateReferenceId();

            const params = {
                vtu_network: vtuNetwork,
                reference_id: reference,
                vtu_number: request.recipientPhone,
                vtu_data: request.dataCode,
                vtu_email: request.email || request.phone,
            };

            const response = await this.makeRequest<IRechargeDataResponse>('vend_data.php', params);

            return this.mapIRechargeResponse(response, reference);
        } catch (error) {
            logger.error('iRecharge data purchase error', error);
            return {
                success: false,
                transactionStatus: TransactionStatus.FAILED,
                transactionReference: request.reference || '',
                message: error instanceof Error ? error.message : 'Data purchase failed',
                providerType: ProviderType.IRECHARGE,
            };
        }
    }

    async purchaseElectricity(request: IElectricityRequest): Promise<IProviderResponse> {
        try {
            // Map disco to the expected format for iRecharge
            const discoMap: { [key: string]: string } = {
                'ikeja': 'IKEDC',
                'eko': 'EKEDC',
                'kano': 'KEDCO',
                'portharcourt': 'PHED',
                'jos': 'JED',
                'ibadan': 'IBEDC',
                'kaduna': 'KAEDCO',
                'abuja': 'AEDC',
                'enugu': 'EEDC',
                'benin': 'BEDC',
            };

            const disco = discoMap[request.disco.toLowerCase()];
            if (!disco) {
                throw new Error(`Unsupported disco: ${request.disco}`);
            }

            const reference = request.reference || this.generateReferenceId();

            const params: Record<string, string> = {
                reference_id: reference,
                meter: request.meterNumber,
                disco: disco,
                amount: request.amount.toString(),
                phone: request.phone,
            };

            if (request.email) {
                params.email = request.email;
            }

            const endpoint = 'vend_power.php';

            // For prepaid meters, we need to get the access token first
            if (request.meterType.toLowerCase() === MeterType.PREPAID.toLowerCase()) {
                // Get meter info to retrieve access token
                const meterInfo = await this.makeRequest<IRechargeElectricityResponse>('get_meter_info.php', {
                    reference_id: reference,
                    meter: request.meterNumber,
                    disco: disco,
                });

                // Check if meter info was successfully retrieved
                if (meterInfo && meterInfo.status === '200' && meterInfo.access_token) {
                    params.access_token = meterInfo.access_token;
                } else {
                    throw new Error('Failed to retrieve meter access token');
                }
            }

            const response = await this.makeRequest<IRechargeElectricityResponse>(endpoint, params);

            return this.mapIRechargeResponse(response, reference);
        } catch (error) {
            logger.error('iRecharge electricity purchase error', error);
            return {
                success: false,
                transactionStatus: TransactionStatus.FAILED,
                transactionReference: request.reference || '',
                message: error instanceof Error ? error.message : 'Electricity purchase failed',
                providerType: ProviderType.IRECHARGE,
            };
        }
    }

    async purchaseTV(request: ITVRequest): Promise<IProviderResponse> {
        try {
            // Map TV provider to iRecharge expected format
            const providerMap: { [key: string]: string } = {
                [TVType.DSTV]: 'DSTV',
                [TVType.GOTV]: 'GOTV',
                [TVType.STARTIMES]: 'StarTimes',
                // iRecharge might not support Showmax
            };

            const tvNetwork = providerMap[request.provider];
            if (!tvNetwork) {
                throw new Error(`Unsupported TV provider: ${request.provider}`);
            }

            const reference = request.reference || this.generateReferenceId();

            // First validate the smartcard
            const smartcardParams: Record<string, string> = {
                smartcard_number: request.smartCardNumber,
                reference_id: reference,
                tv_network: tvNetwork,
                service_code: tvNetwork === 'StarTimes' ? 'StarTimes' : request.packageCode || '',
            };

            // StarTimes requires tv_amount
            if (tvNetwork === 'StarTimes' && request.amount) {
                smartcardParams.tv_amount = request.amount.toString();
            }

            const smartcardInfo = await this.makeRequest<IRechargeSmartCardInfoResponse>('get_smartcard_info.php', smartcardParams);

            if (!smartcardInfo || smartcardInfo.status !== '200') {
                throw new Error(smartcardInfo?.message || 'Failed to validate smartcard');
            }

            // Now purchase the subscription
            const params: Record<string, string> = {
                smartcard_number: request.smartCardNumber,
                tv_network: tvNetwork,
                reference_id: reference,
                service_code: request.packageCode || tvNetwork,
                phone: request.phone,
                access_token: smartcardInfo.access_token || '',
            };

            if (request.email) {
                params.email = request.email;
            }

            const response = await this.makeRequest<IRechargeSmartCardResponse>('vend_tv.php', params);

            return this.mapIRechargeResponse(response, reference);
        } catch (error) {
            logger.error('iRecharge TV subscription error', error);
            return {
                success: false,
                transactionStatus: TransactionStatus.FAILED,
                transactionReference: request.reference || '',
                message: error instanceof Error ? error.message : 'TV subscription failed',
                providerType: ProviderType.IRECHARGE,
            };
        }
    }

    async purchaseEducation(request: IEducationRequest): Promise<IProviderResponse> {
        // iRecharge doesn't support education payments like WAEC and JAMB
        return {
            success: false,
            transactionStatus: TransactionStatus.FAILED,
            transactionReference: request.reference || '',
            message: 'Education payments not supported by iRecharge',
            providerType: ProviderType.IRECHARGE,
        };
    }

    async validateMeterNumber(disco: string, meterNumber: string, meterType: MeterType): Promise<Record<string, unknown>> {
        try {
            // Map disco to the expected format for iRecharge
            const discoMap: { [key: string]: string } = {
                'ikeja': 'IKEDC',
                'eko': 'EKEDC',
                'kano': 'KEDCO',
                'portharcourt': 'PHED',
                'jos': 'JED',
                'ibadan': 'IBEDC',
                'kaduna': 'KAEDCO',
                'abuja': 'AEDC',
                'enugu': 'EEDC',
                'benin': 'BEDC',
            };

            const discoCode = discoMap[disco.toLowerCase()];
            if (!discoCode) {
                throw new Error(`Unsupported disco: ${disco}`);
            }

            const reference = `validate_${Date.now()}`;

            const response = await this.makeRequest<IRechargeElectricityResponse>('get_meter_info.php', {
                reference_id: reference,
                meter: meterNumber,
                disco: discoCode,
            });

            if (response && response.status === '200') {
                return {
                    success: true,
                    message: 'Meter validation successful',
                    data: {
                        customerName: response.customer_name || '',
                        address: response.address || '',
                        meterNumber: meterNumber,
                        meterType: meterType,
                        accessToken: response.access_token || '',
                    },
                } as Record<string, unknown>;
            }

            return {
                success: false,
                message: response?.message || 'Meter validation failed',
                data: {
                    customerName: '',
                    address: '',
                    meterNumber: meterNumber,
                    meterType: meterType,
                },
            } as Record<string, unknown>;
        } catch (error) {
            logger.error('iRecharge meter validation error', error);
            throw error;
        }
    }

    async validateSmartCardNumber(provider: TVType, smartCardNumber: string): Promise<Record<string, unknown>> {
        try {
            // Map TV provider to iRecharge expected format
            const providerMap: { [key: string]: string } = {
                [TVType.DSTV]: 'DSTV',
                [TVType.GOTV]: 'GOTV',
                [TVType.STARTIMES]: 'StarTimes',
                // iRecharge might not support Showmax
            };

            const tvNetwork = providerMap[provider];
            if (!tvNetwork) {
                throw new Error(`Unsupported TV provider: ${provider}`);
            }

            const reference = `validate_${Date.now()}`;

            // For StarTimes, a different approach may be needed
            const params: Record<string, string> = {
                smartcard_number: smartCardNumber,
                service_code: tvNetwork,
                reference_id: reference,
                tv_network: tvNetwork,
            };

            // Add tv_amount for StarTimes
            if (tvNetwork === 'StarTimes') {
                params.tv_amount = '1000'; // Default amount for validation
            }

            const response = await this.makeRequest<IRechargeSmartCardInfoResponse>('get_smartcard_info.php', params);

            if (response && response.status === '200') {
                return {
                    success: true,
                    message: 'Smartcard validation successful',
                    data: {
                        customerName: response.customer_name || '',
                        customerNumber: response.customer_number || '',
                        dueDate: response.due_date || '',
                        status: response.status || '',
                        smartCardNumber: smartCardNumber,
                        accessToken: response.access_token || '',
                    },
                } as Record<string, unknown>;
            }

            return {
                success: false,
                message: response?.message || 'Smartcard validation failed',
                data: {
                    customerName: '',
                    customerNumber: '',
                    smartCardNumber: smartCardNumber,
                },
            } as Record<string, unknown>;
        } catch (error) {
            logger.error('iRecharge smartcard validation error', error);
            throw error;
        }
    }

    async validateDataBundle(network: string): Promise<IDataBundleInfo[]> {
        try {
            // Convert network to iRecharge expected format
            const networkMap: { [key: string]: IRECHARGE_DATA_NETWORKS } = {
                'mtn': IRECHARGE_DATA_NETWORKS.MTN,
                'airtel': IRECHARGE_DATA_NETWORKS.Airtel,
                'glo': IRECHARGE_DATA_NETWORKS.GLO,
                'etisalat': IRECHARGE_DATA_NETWORKS.Etisalat,
                '9mobile': IRECHARGE_DATA_NETWORKS.Etisalat,
            };

            const vtuNetwork = networkMap[network.toLowerCase()];
            if (!vtuNetwork) {
                throw new Error(`Unsupported network: ${network}`);
            }

            const response = await this.makeRequest<IRechargeDataBundlesResponse>('get_data_bundles.php', {
                data_network: vtuNetwork,
            });

            if (response && response.status === '200' && response.bundles) {
                // Transform the data to match the expected format
                return response.bundles.map((bundle: IRechargeDataBundle) => ({
                    variation_code: bundle.code,
                    name: bundle.name,
                    variation_amount: bundle.price,
                    validity: bundle.validity || '',
                    fixedPrice: 'Yes',
                }));
            }

            return [];
        } catch (error) {
            logger.error('iRecharge data bundle validation error', error);
            throw error;
        }
    }

    async validateTVPackages(provider: TVType): Promise<ITVPackageInfo[]> {
        try {
            // Map TV provider to iRecharge expected format
            const providerMap: { [key: string]: string } = {
                [TVType.DSTV]: 'DSTV',
                [TVType.GOTV]: 'GOTV',
                [TVType.STARTIMES]: 'StarTimes',
                // iRecharge might not support Showmax
            };

            const tvNetwork = providerMap[provider];
            if (!tvNetwork) {
                throw new Error(`Unsupported TV provider: ${provider}`);
            }

            const response = await this.makeRequest<IRechargePackagesResponse>('get_tv_bouquet.php', {
                tv_network: tvNetwork,
            });

            if (response && response.status === '200' && response.bouquets) {
                // Transform the data to match the expected format
                return response.bouquets.map((bouquet: IRechargePackage) => ({
                    variation_code: bouquet.code,
                    name: bouquet.name,
                    variation_amount: bouquet.price,
                    fixedPrice: 'Yes',
                }));
            }

            return [];
        } catch (error) {
            logger.error('iRecharge TV packages validation error', error);
            throw error;
        }
    }
}