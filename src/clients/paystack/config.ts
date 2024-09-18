import axios, { AxiosError, Method } from 'axios';
import { PAYSTACK_CONFIG, NODE_ENV } from 'utils/constants';
import { BadRequestError, UnauthorizedError, NotFoundError } from 'utils/customErrors';
import { PaystackResponse, InitializeTransactionResponseData } from './types';

export const getPaystackBaseUrl = (): string => {
    return NODE_ENV === 'production' ? PAYSTACK_CONFIG.LIVE_URL : PAYSTACK_CONFIG.SANDBOX_URL;
};

export class PaystackConfigService {
    private static readonly BASE_URL = getPaystackBaseUrl();
    private static readonly SECRET_KEY = PAYSTACK_CONFIG.SECRET_KEY;

    private static async makeApiRequest<T>(endpoint: string, method: Method, params: Record<string, string | number | boolean | object> = {}): Promise<PaystackResponse<T>> {
        const url = `${this.BASE_URL}/${endpoint}`;
        const headers = {
            Authorization: `Bearer ${this.SECRET_KEY}`,
            'Content-Type': 'application/json',
        };

        try {
            const response = method === 'GET'
                ? await axios.get(url, { params, headers })
                : await axios.request({
                    url,
                    method,
                    headers,
                    data: params,
                });

            // Check if the response status is not successful (2xx)
            if (response.status < 200 || response.status >= 300) {
                if (response.status === 400) {
                    throw new BadRequestError(response.data.message || 'Bad Request');
                } else if (response.status === 401) {
                    throw new UnauthorizedError(response.data.message || 'Unauthorized');
                } else if (response.status === 404) {
                    throw new NotFoundError(response.data.message || 'Not Found');
                }
            }

            return response.data;
        } catch (error) {
            const axiosError = error as AxiosError;
            console.error(`Error in Paystack API request: ${endpoint}`, axiosError.response?.data || axiosError.message);
            throw new BadRequestError('Error in Paystack API request');
        }
    }

    static async initializePaymentTransaction(params: {
        amount: string;
        email: string;
        currency?: string;
        reference?: string;
        callback_url?: string;
        metadata?: string;
    }): Promise<PaystackResponse<InitializeTransactionResponseData>> {
        const defaultChannels: Array<'card' | 'bank' | 'ussd' | 'qr' | 'mobile_money' | 'bank_transfer' | 'eft'> =
            ['card', 'bank', 'ussd', 'bank_transfer'];
        
        const updatedParams = {
            ...params,
            channels: defaultChannels,
        };

        return this.makeApiRequest('transaction/initialize', 'POST', updatedParams);
    }

    static async verifyPaymentTransaction(reference: string) {
        return this.makeApiRequest(`transaction/verify/${reference}`, 'GET');
    }

    static async createRecurringCharge(params: {
        authorization_code: string;
        email: string;
        amount: number;
    }) {
        return this.makeApiRequest('transaction/charge_authorization', 'POST', params);
    }

    static async initiateWithdrawal(params: {
        source: string;
        amount: number;
        recipient: string;
        reason: string;
    }) {
        return this.makeApiRequest('transfer', 'POST', params);
    }

    static async getTransactionHistory(params: { from: string; to: string; }) {
        return this.makeApiRequest('transaction', 'GET', params);
    }
}