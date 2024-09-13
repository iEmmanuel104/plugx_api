/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import axios, { AxiosError } from 'axios';
import crypto from 'crypto';
import { BadRequestError } from 'utils/customErrors';
import { IRECHARGE_CONFIG, NODE_ENV } from 'utils/constants';

export const getIRechargeBaseUrl = () => {
    return NODE_ENV === 'production' ? IRECHARGE_CONFIG.LIVE_URL : IRECHARGE_CONFIG.SANDBOX_URL;
};

export enum IRECHARGE_DATA_NETWORKS {
    MTN = 'MTN',
    GLO = 'GLO',
    Airtel = 'Airtel',
    Etisalat = 'Etisalat',
    Smile = 'Smile',
    Spectranet = 'Spectranet',
}

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

    static async getTvBouquet(params: {
        tv_network: string;
    }): Promise<any> {
        return this.makeApiRequest('get_tv_bouquet.php', params);
    }

    static async getSmartcardInfo(params: {
        smartcard_number: string;
        service_code: string;
        reference_id: string;
        tv_network: string;
        tv_amount?: string; // Optional, only for StarTimes
    }): Promise<any> {
        return this.makeApiRequest('get_smartcard_info.php', params);
    }

    static async getStarTimesSmartcardInfo(params: {
        smartcard_number: string;
        service_code: string;
        reference_id: string;
        tv_network: string;
        tv_amount: string;
    }): Promise<any> {
        return this.makeApiRequest('get_smartcard_info.php', params);
    }

    static async vendTv(params: {
        smartcard_number: string;
        access_token: string;
        tv_network: string;
        reference_id: string;
        service_code: string;
        phone: string;
        email: string;
    }): Promise<any> {
        return this.makeApiRequest('vend_tv.php', params);
    }

    static async vendStarTimesTv(params: {
        smartcard_number: string;
        access_token: string;
        tv_network: string;
        reference_id: string;
        service_code: string;
        phone: string;
        email: string;
    }): Promise<any> {
        return this.makeApiRequest('vend_tv.php', {
            ...params,
            service_code: 'StarTimes',
            tv_network: 'StarTimes',
        });
    }

    static async getDataBundles(params: {
        data_network: IRECHARGE_DATA_NETWORKS;
    }): Promise<any> {
        return this.makeApiRequest('get_data_bundles.php', params);
    }

    static async getSmileInfo(params: {
        receiver: string;
    }): Promise<any> {
        return this.makeApiRequest('get_smile_info.php', params);
    }

    static async vendData(params: {
        vtu_network: IRECHARGE_DATA_NETWORKS;
        reference_id: string;
        vtu_number: string;
        vtu_data: string;
        vtu_email: string;
    }): Promise<any> {
        return this.makeApiRequest('vend_data.php', params);
    }

    static async getWalletBalance(): Promise<any> {
        return this.makeApiRequest('get_wallet_balance.php', {
            vendor_code: IRECHARGE_CONFIG.VENDOR_CODE,
        });
    }

    // Validate the response hash
    static validateResponseHash(customerName: string, accessToken: string, responseHash: string): boolean {
        const combinedResponse = `${customerName}|${accessToken}`;
        const computedHash = crypto.createHmac('sha1', IRECHARGE_CONFIG.PUBLIC_KEY).update(combinedResponse).digest('hex');
        return computedHash === responseHash;
    }

    // Validate the airtime response hash
    static validateAirtimeResponseHash(accessToken: string, meterToken: string, responseHash: string): boolean {
        const combinedResponse = `${accessToken}|${meterToken}`;
        const computedHash = crypto.createHmac('sha1', IRECHARGE_CONFIG.PUBLIC_KEY).update(combinedResponse).digest('hex');
        return computedHash === responseHash;
    }

    // Validate the TV response hash
    static validateTvResponseHash(accessToken: string, smartcardNumber: string, responseHash: string): boolean {
        const combinedResponse = `${accessToken}|${smartcardNumber}`;
        const computedHash = crypto.createHmac('sha1', IRECHARGE_CONFIG.PUBLIC_KEY).update(combinedResponse).digest('hex');
        return computedHash === responseHash;
    }

    // Validate the smartcard info response hash
    static validateSmartcardInfoResponseHash(customerName: string, customerNumber: string, accessToken: string, responseHash: string): boolean {
        const combinedResponse = `${customerName}|${customerNumber}|${accessToken}`;
        const computedHash = crypto.createHmac('sha1', IRECHARGE_CONFIG.PUBLIC_KEY).update(combinedResponse).digest('hex');
        return computedHash === responseHash;
    }

    // Validate the data vending response hash
    static validateDataVendingResponseHash(accessToken: string, meterToken: string, responseHash: string): boolean {
        const combinedResponse = `${accessToken}|${meterToken}`;
        const computedHash = crypto.createHmac('sha1', IRECHARGE_CONFIG.PUBLIC_KEY).update(combinedResponse).digest('hex');
        return computedHash === responseHash;
    }
}