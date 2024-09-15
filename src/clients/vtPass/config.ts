import axios, { AxiosError } from 'axios';
import { BadRequestError } from 'utils/customErrors';
import { VTPASS_CONFIG } from 'utils/constants';
import {
    getVTpassBaseUrl, VTPASS_NETWORKS, VTpassPurchaseResponse, VTpassQueryResponse, VTpassWalletBalanceResponse,
    VTpassServiceCategoriesResponse, VTpassServicesResponse, VTpassVariationCodesResponse, VTpassProductOptionsResponse,
    SmileEmailVerificationResponse, SmartCardVerifyResponse, SUBSCRIPTION_TYPES,
} from './types';


// VTpass Configuration Service class for interacting with the VTpass API
export class VTpassConfigService {
    private static async makeApiRequest<T>(endpoint: string, method: 'GET' | 'POST', params: Record<string, string | number | boolean> = {}, isBasicAuth: boolean = false): Promise<T> {
        const url = `${getVTpassBaseUrl()}${endpoint}`;
        let headers: Record<string, string>;

        if (isBasicAuth) {
            // DSTV-specific authentication
            const auth = Buffer.from(`${VTPASS_CONFIG.USERNAME}:${VTPASS_CONFIG.PASSWORD}`).toString('base64');
            headers = {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json',
            };
        } else {
            // Standard VTpass authentication
            headers = {
                'api-key': VTPASS_CONFIG.API_KEY,
                [method === 'GET' ? 'public-key' : 'secret-key']: method === 'GET' ? VTPASS_CONFIG.PUBLIC_KEY : VTPASS_CONFIG.SECRET_KEY,
            };
        }

        try {
            const response = method === 'GET'
                ? await axios.get(url, { params, headers })
                : await axios.post(url, params, { headers });
            return response.data;
        } catch (error) {
            const axiosError = error as AxiosError;
            console.error(`Error in VTpass API request: ${endpoint}`, axiosError.response?.data || axiosError.message);
            throw new BadRequestError('Error in VTpass API request');
        }
    }

    // Purchases a product through the VTpass API
    static async purchaseProduct(params: {
        request_id: string;
        serviceID: VTPASS_NETWORKS;
        amount: number;
        phone: string;
        billersCode?: string;
        variation_code?: string;
        quantity?: number;
        subscription_type?: SUBSCRIPTION_TYPES;
    }, isBasicAuth: boolean = false): Promise<VTpassPurchaseResponse> {
        return this.makeApiRequest('pay', 'POST', params, isBasicAuth);
    }

    static async queryTransactionStatus(params: {
        request_id: string;
    }): Promise<VTpassQueryResponse> {
        return this.makeApiRequest('requery', 'POST', params);
    }

    static async getWalletBalance(): Promise<VTpassWalletBalanceResponse> {
        return this.makeApiRequest('balance', 'GET');
    }

    static async getServiceCategories(): Promise<VTpassServiceCategoriesResponse> {
        return this.makeApiRequest('service-categories', 'GET');
    }

    static async getServiceId(identifier: string): Promise<VTpassServicesResponse> {
        return this.makeApiRequest(`services?identifier=${identifier}`, 'GET');
    }

    static async getVariationCodes(serviceID: VTPASS_NETWORKS): Promise<VTpassVariationCodesResponse> {
        return this.makeApiRequest(`service-variations?serviceID=${serviceID}`, 'GET');
    }

    static async getProductOptions(serviceID: VTPASS_NETWORKS, name: string): Promise<VTpassProductOptionsResponse> {
        return this.makeApiRequest(`options?serviceID=${serviceID}&name=${name}`, 'GET');
    }

    // Smile Network specific methods
    static async verifySmileEmail(params: {
        billersCode: string;
        serviceID: VTPASS_NETWORKS.SMILE_DATA;
    }): Promise<SmileEmailVerificationResponse> {
        return this.makeApiRequest('merchant-verify/smile/email', 'POST', params);
    }

    static generateRequestId(): string {
        const now = new Date();
        const date = now.toISOString().slice(0, 10).replace(/-/g, '');
        const time = now.toTimeString().slice(0, 5).replace(':', '');
        const randomString = Math.random().toString(36).substring(2, 6);
        return `${date}${time}${randomString}`;
    }

    static async verifySmartcard(params: {
        billersCode: string;
        serviceID: VTPASS_NETWORKS;
    }): Promise<SmartCardVerifyResponse> {
        return this.makeApiRequest('merchant-verify', 'POST', params);
    }
}