import { Transaction } from 'sequelize';
import BankAccount, { IBankAccount } from '../models/financials/bankAccount.model';
import { NotFoundError, BadRequestError } from '../utils/customErrors';

export default class BankAccountService {
    static async addBankAccount(bankAccountData: IBankAccount, transaction?: Transaction): Promise<BankAccount> {
        const accountCount = await BankAccount.count({ where: { userId: bankAccountData.userId } });
        if (accountCount >= 3) {
            throw new BadRequestError('User can have a maximum of 3 bank accounts');
        }
        return await BankAccount.create(bankAccountData, { transaction });
    }

    static async getBankAccounts(userId: string): Promise<BankAccount[]> {
        return await BankAccount.findAll({ where: { userId } });
    }

    static async getBankAccount(id: string, userId: string): Promise<BankAccount> {
        const bankAccount = await BankAccount.findOne({ where: { id, userId } });
        if (!bankAccount) {
            throw new NotFoundError('Bank account not found');
        }
        return bankAccount;
    }

    static async deleteBankAccount(id: string, userId: string, transaction?: Transaction): Promise<void> {
        const bankAccount = await this.getBankAccount(id, userId);
        await bankAccount.destroy({ transaction });
    }
}