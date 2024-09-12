/* eslint-disable @typescript-eslint/no-explicit-any */
import axios, { AxiosError } from 'axios';
import crypto from 'crypto';
import { BadRequestError } from 'utils/customErrors';
import { IRECHARGE_CONFIG, NODE_ENV } from 'utils/constants';

export const getIRechargeBaseUrl = () => {
    return NODE_ENV === 'production' ? IRECHARGE_CONFIG.LIVE_URL : IRECHARGE_CONFIG.SANDBOX_URL;
};

export class IRechargeConfigService {
    private static generateHash(params: string[]): string {
        const combinedString = params.join('|') + '|' + IRECHARGE_CONFIG.PUBLIC_KEY;
        return crypto.createHmac('sha1', IRECHARGE_CONFIG.PRIVATE_KEY).update(combinedString).digest('hex');
    }

    private static async makeApiRequest<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
        const url = `${getIRechargeBaseUrl()}${endpoint}`;
        const hash = this.generateHash(Object.values(params));

        try {
            const response = await axios.get(url, {
                params: {
                    ...params,
                    vendor_code: IRECHARGE_CONFIG.VENDOR_CODE,
                    hash,
                    response_format: 'json',
                },
            });
            return response.data;
        } catch (error) {
            const axiosError = error as AxiosError;
            console.error(`Error in iRecharge API request: ${endpoint}`, axiosError.response?.data || axiosError.message);
            throw new BadRequestError('Error in iRecharge API request');
        }
    }

    static async vendPower(params: {
        reference_id: string;
        meter: string;
        access_token: string;
        disco: string;
        amount: string;
        phone: string;
        email: string;
    }): Promise<any> {
        return this.makeApiRequest('vend_power.php', params);
    }

    static async getMeterInfo(params: {
        reference_id: string;
        meter: string;
        disco: string;
    }): Promise<any> {
        return this.makeApiRequest('get_meter_info.php', params);
    }

    static async getElectricDisco(): Promise<any> {
        return this.makeApiRequest('get_electric_disco.php');
    }

    static async vendAirtime(params: {
        vtu_network: string;
        vtu_amount: string;
        vtu_number: string;
        vtu_email: string;
        reference_id: string;
    }): Promise<any> {
        return this.makeApiRequest('vend_airtime.php', params);
    }

    // Validate the response hash
    static validateResponseHash(customerName: string, Token: string, responseHash: string): boolean {
        const combinedResponse = `${customerName}|${Token}`;
        const computedHash = crypto.createHmac('sha1', IRECHARGE_CONFIG.PUBLIC_KEY).update(combinedResponse).digest('hex');
        return computedHash === responseHash;
    }
}