// src/services/AdminServices/providerWallet.service.ts

import { VTpassConfigService } from '../../clients/vtPass/config';
import { IRechargeConfigService } from '../../clients/iRecharge/config';
import { logger } from '../../utils/logger';

export interface ProviderWalletBalance {
    provider: string;
    balance: number;
    currency: string;
    status: 'success' | 'error';
    message?: string;
}

export default class ProviderWalletService {
    /**
     * Get wallet balances from all integrated payment providers
     */
    static async getAllProviderBalances(): Promise<ProviderWalletBalance[]> {
        const balances: ProviderWalletBalance[] = [];

        // Get VTPass balance
        try {
            const vtpassResponse = await VTpassConfigService.getWalletBalance();

            balances.push({
                provider: 'VTPass',
                balance: vtpassResponse.contents?.balance || 0,
                currency: 'NGN', // VTPass uses NGN
                status: vtpassResponse.code === '000' ? 'success' : 'error',
                message: vtpassResponse.response_description,
            });
        } catch (error) {
            logger.error('Error fetching VTPass wallet balance', error);
            balances.push({
                provider: 'VTPass',
                balance: 0,
                currency: 'NGN',
                status: 'error',
                message: error instanceof Error ? error.message : 'Unknown error',
            });
        }

        // Get iRecharge balance
        try {
            const irechargeResponse = await IRechargeConfigService.getWalletBalance();

            balances.push({
                provider: 'iRecharge',
                balance: parseFloat(irechargeResponse.balance || '0'),
                currency: 'NGN', // iRecharge uses NGN
                status: irechargeResponse.status === '200' ? 'success' : 'error',
                message: irechargeResponse.message,
            });
        } catch (error) {
            logger.error('Error fetching iRecharge wallet balance', error);
            balances.push({
                provider: 'iRecharge',
                balance: 0,
                currency: 'NGN',
                status: 'error',
                message: error instanceof Error ? error.message : 'Unknown error',
            });
        }

        return balances;
    }

    /**
     * Get wallet balance for a specific provider
     * @param provider The provider name: 'vtpass' or 'irecharge'
     */
    static async getProviderBalance(provider: string): Promise<ProviderWalletBalance> {
        const normalizedProvider = provider.toLowerCase().trim();

        if (normalizedProvider === 'vtpass') {
            try {
                const response = await VTpassConfigService.getWalletBalance();

                return {
                    provider: 'VTPass',
                    balance: response.contents?.balance || 0,
                    currency: 'NGN',
                    status: response.code === '000' ? 'success' : 'error',
                    message: response.response_description,
                };
            } catch (error) {
                logger.error('Error fetching VTPass wallet balance', error);
                return {
                    provider: 'VTPass',
                    balance: 0,
                    currency: 'NGN',
                    status: 'error',
                    message: error instanceof Error ? error.message : 'Unknown error',
                };
            }
        } else if (normalizedProvider === 'irecharge') {
            try {
                const response = await IRechargeConfigService.getWalletBalance();

                return {
                    provider: 'iRecharge',
                    balance: parseFloat(response.balance || '0'),
                    currency: 'NGN',
                    status: response.status === '200' ? 'success' : 'error',
                    message: response.message,
                };
            } catch (error) {
                logger.error('Error fetching iRecharge wallet balance', error);
                return {
                    provider: 'iRecharge',
                    balance: 0,
                    currency: 'NGN',
                    status: 'error',
                    message: error instanceof Error ? error.message : 'Unknown error',
                };
            }
        } else {
            return {
                provider: provider,
                balance: 0,
                currency: 'NGN',
                status: 'error',
                message: `Invalid provider: ${provider}. Supported providers are 'vtpass' and 'irecharge'`,
            };
        }
    }
}