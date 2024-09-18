import axios from 'axios';
import { PAYSTACK_CONFIG } from 'utils/constants';
import { BadRequestError } from 'utils/customErrors';

export class PaystackConfigService {
    static readonly BASE_URL = 'https://api.paystack.co';
    static readonly SECRET_KEY = PAYSTACK_CONFIG.SECRET_KEY;

    static getHeaders() {
        return {
            Authorization: `Bearer ${this.SECRET_KEY}`,
            'Content-Type': 'application/json',
        };
    }

    static async initiateCharge(params: {
        email: string;
        amount: number;
        card: { number: string; cvv: string; expiry_month: string; expiry_year: string };
    }) {
        try {
            const response = await axios.post(
                `${PaystackConfigService.BASE_URL}/charge`,
                params,
                { headers: PaystackConfigService.getHeaders() }
            );
            return response.data;
        } catch (error) {
            throw new BadRequestError('Error initiating charge');
        }
    }

    static async verifyPayment(reference: string) {
        try {
            const response = await axios.get(
                `${PaystackConfigService.BASE_URL}/transaction/verify/${reference}`,
                { headers: PaystackConfigService.getHeaders() }
            );
            return response.data;
        } catch (error) {
            throw new BadRequestError('Error verifying payment');
        }
    }

    static async createRecurringCharge(params: {
        authorization_code: string;
        email: string;
        amount: number;
    }) {
        try {
            const response = await axios.post(
                `${PaystackConfigService.BASE_URL}/transaction/charge_authorization`,
                params,
                { headers: PaystackConfigService.getHeaders() }
            );
            return response.data;
        } catch (error) {
            throw new BadRequestError('Error creating recurring charge');
        }
    }

    static async initiateWithdrawal(params: {
        source: string;
        amount: number;
        recipient: string;
        reason: string;
    }) {
        try {
            const response = await axios.post(
                `${PaystackConfigService.BASE_URL}/transfer`,
                params,
                { headers: PaystackConfigService.getHeaders() }
            );
            return response.data;
        } catch (error) {
            throw new BadRequestError('Error initiating withdrawal');
        }
    }

    static async getTransactionHistory(params: { from: string; to: string; }) {
        try {
            const response = await axios.get(
                `${PaystackConfigService.BASE_URL}/transaction`,
                {
                    params,
                    headers: PaystackConfigService.getHeaders(),
                }
            );
            return response.data;
        } catch (error) {
            throw new BadRequestError('Error fetching transaction history');
        }
    }
}