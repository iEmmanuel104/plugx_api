import { Transaction as SequelizeTransaction } from 'sequelize';
import Transaction, { ITransaction, TransactionType, TransactionStatus } from '../models/transaction.model';
import WalletService from './wallet.service';
import { NotFoundError, BadRequestError } from '../utils/customErrors';

export default class TransactionService {
    static async createTransaction(transactionData: ITransaction, sequelizeTransaction?: SequelizeTransaction): Promise<Transaction> {
        const wallet = await WalletService.getWallet(transactionData.userId);
        transactionData.walletId = wallet.id;
        transactionData.previousBalance = wallet.balance;

        const transaction = await Transaction.create(transactionData, { transaction: sequelizeTransaction });

        if (transaction.status === TransactionStatus.SUCCESS) {
            const amount = transaction.type === TransactionType.DEPOSIT ? transaction.amount : -transaction.amount;
            await WalletService.updateWalletBalance(transactionData.userId, amount, sequelizeTransaction);
        }

        return transaction;
    }

    static async getTransactions(userId: string, page: number = 1, limit: number = 10): Promise<{ transactions: Transaction[], total: number, pages: number }> {
        const offset = (page - 1) * limit;
        const { rows: transactions, count: total } = await Transaction.findAndCountAll({
            where: { userId },
            limit,
            offset,
            order: [['createdAt', 'DESC']],
        });

        const pages = Math.ceil(total / limit);

        return { transactions, total, pages };
    }

    static async getTransaction(id: string, userId: string): Promise<Transaction> {
        const transaction = await Transaction.findOne({ where: { id, userId } });
        if (!transaction) {
            throw new NotFoundError('Transaction not found');
        }
        return transaction;
    }

    static async updateTransactionStatus(id: string, userId: string, status: TransactionStatus, sequelizeTransaction?: SequelizeTransaction): Promise<Transaction> {
        const transaction = await this.getTransaction(id, userId);

        if (transaction.status !== TransactionStatus.PENDING) {
            throw new BadRequestError('Only pending transactions can be updated');
        }

        transaction.status = status;
        await transaction.save({ transaction: sequelizeTransaction });

        if (status === TransactionStatus.SUCCESS) {
            const amount = transaction.type === TransactionType.DEPOSIT ? transaction.amount : -transaction.amount;
            await WalletService.updateWalletBalance(userId, amount, sequelizeTransaction);
        }

        return transaction;
    }
}