import axios, { AxiosError, Method } from 'axios';
import { PAYSTACK_CONFIG, NODE_ENV } from 'utils/constants';
import { BadRequestError } from 'utils/customErrors';

export const getPaystackBaseUrl = (): string => {
    // Returns the base URL for PAYSTACK API based on the current environment
    return NODE_ENV === 'production' ? PAYSTACK_CONFIG.LIVE_URL : PAYSTACK_CONFIG.SANDBOX_URL;
};

export class PaystackConfigService {
    private static readonly BASE_URL = getPaystackBaseUrl();
    private static readonly SECRET_KEY = PAYSTACK_CONFIG.SECRET_KEY;

    private static async makeApiRequest<T>(endpoint: string, method: Method, params: Record<string, unknown> = {}): Promise<T> {
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
            return response.data;
        } catch (error) {
            const axiosError = error as AxiosError;
            console.error(`Error in Paystack API request: ${endpoint}`, axiosError.response?.data || axiosError.message);
            throw new BadRequestError('Error in Paystack API request');
        }
    }

    static async initiateCharge(params: {
        email: string;
        amount: number;
        card: { number: string; cvv: string; expiry_month: string; expiry_year: string };
    }) {
        return this.makeApiRequest('charge', 'POST', params);
    }

    static async verifyPayment(reference: string) {
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