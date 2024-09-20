import { Transaction } from 'sequelize';
import Wallet, { IWallet } from '../models/financials/wallet.model';
import { NotFoundError } from '../utils/customErrors';

export default class WalletService {
    static async createWallet(userId: string, transaction?: Transaction): Promise<Wallet> {
        return await Wallet.create({ userId } as IWallet, { transaction });
    }

    static async getWallet(userId: string): Promise<Wallet> {
        const wallet = await Wallet.findOne({ where: { userId } });
        if (!wallet) {
            throw new NotFoundError('Wallet not found');
        }
        return wallet;
    }

    static async updateWalletBalance(userId: string, amount: number, transaction?: Transaction): Promise<Wallet> {
        const wallet = await this.getWallet(userId);
        wallet.balance += amount;
        await wallet.save({ transaction });
        return wallet;
    }

    static async getWalletBalance(userId: string): Promise<number> {
        const wallet = await this.getWallet(userId);
        return wallet.balance;
    }
}