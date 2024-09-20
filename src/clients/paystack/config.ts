import axios, { AxiosError, Method } from 'axios';
import { PAYSTACK_CONFIG, NODE_ENV } from 'utils/constants';
import { BadRequestError, UnauthorizedError, NotFoundError } from 'utils/customErrors';
import {
    PaystackResponse, InitializeTransactionResponseData, CustomerData, BankData,
    AccountVerificationData, TransferRecipientData, TransferData,
} from './types';

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

    // Customer CRUD operations
    static async createCustomer(params: {
        email: string;
        first_name?: string;
        last_name?: string;
        phone?: string;
    }): Promise<PaystackResponse<CustomerData>> {
        return this.makeApiRequest('customer', 'POST', params);
    }

    static async listCustomers(params?: {
        perPage?: number;
        page?: number;
    }): Promise<PaystackResponse<CustomerData[]>> {
        return this.makeApiRequest('customer', 'GET', params);
    }

    static async fetchCustomer(emailOrCode: string): Promise<PaystackResponse<CustomerData>> {
        return this.makeApiRequest(`customer/${emailOrCode}`, 'GET');
    }

    static async updateCustomer(code: string, params: {
        first_name?: string;
        last_name?: string;
        phone?: string;
    }): Promise<PaystackResponse<CustomerData>> {
        return this.makeApiRequest(`customer/${code}`, 'PUT', params);
    }

    static async whitelistBlacklistCustomer(params: {
        customer: string;
        risk_action: 'allow' | 'deny';
    }): Promise<PaystackResponse<CustomerData>> {
        return this.makeApiRequest('customer/set_risk_action', 'POST', params);
    }

    static async deactivateAuthorization(params: {
        authorization_code: string;
    }): Promise<PaystackResponse<{ message: string }>> {
        return this.makeApiRequest('customer/deactivate_authorization', 'POST', params);
    }

    // Bank list method
    static async listBanks(params?: {
        country?: string;
        use_cursor?: boolean;
        perPage?: number;
    }): Promise<PaystackResponse<BankData[]>> {
        return this.makeApiRequest('bank', 'GET', params);
    }

    static async verifyAccountNumber(params: {
        account_number: string;
        bank_code: string;
    }): Promise<PaystackResponse<AccountVerificationData>> {
        return this.makeApiRequest('bank/resolve', 'GET', params);
    }

    static async createTransferRecipient(params: {
        type: string;
        name: string;
        account_number: string;
        bank_code: string;
        currency: string;
    }): Promise<PaystackResponse<TransferRecipientData>> {
        return this.makeApiRequest('transferrecipient', 'POST', params);
    }

    static async initiateTransfer(params: {
        source: string;
        amount: number;
        recipient: string;
        reason?: string;
        currency?: string;
    }): Promise<PaystackResponse<TransferData>> {
        return this.makeApiRequest('transfer', 'POST', params);
    }

    static async finalizeTransfer(params: {
        transfer_code: string;
        otp: string;
    }): Promise<PaystackResponse<TransferData>> {
        return this.makeApiRequest('transfer/finalize_transfer', 'POST', params);
    }

    static async listTransfers(params?: {
        perPage?: number;
        page?: number;
        customer?: string;
    }): Promise<PaystackResponse<Array<TransferData>>> {
        return this.makeApiRequest('transfer', 'GET', params);
    }

    static async fetchTransfer(idOrCode: string): Promise<PaystackResponse<TransferData>> {
        return this.makeApiRequest(`transfer/${idOrCode}`, 'GET');
    }

    static async verifyTransfer(reference: string): Promise<PaystackResponse<TransferData>> {
        return this.makeApiRequest(`transfer/verify/${reference}`, 'GET');
    }
}