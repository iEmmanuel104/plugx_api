import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';
import TransactionService from '../services/transaction.service';
import { TransactionStatus } from '../models/transaction.model';

export default class TransactionController {
    static async createTransaction(req: AuthenticatedRequest, res: Response) {
        const userId = req.user.id;
        const transactionData = { ...req.body, userId, status: TransactionStatus.PENDING };
        const transaction = await TransactionService.createTransaction(transactionData);

        res.status(201).json({
            status: 'success',
            message: 'Transaction created successfully',
            data: { transaction },
        });
    }

    static async getTransactions(req: AuthenticatedRequest, res: Response) {
        const userId = req.user.id;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;

        const { transactions, total, pages } = await TransactionService.getTransactions(userId, page, limit);

        res.status(200).json({
            status: 'success',
            message: 'Transactions retrieved successfully',
            data: { transactions, total, pages, currentPage: page },
        });
    }

    static async getTransaction(req: AuthenticatedRequest, res: Response) {
        const userId = req.user.id;
        const { id } = req.params;
        const transaction = await TransactionService.getTransaction(id, userId);

        res.status(200).json({
            status: 'success',
            message: 'Transaction retrieved successfully',
            data: { transaction },
        });
    }

    static async updateTransactionStatus(req: AuthenticatedRequest, res: Response) {
        const userId = req.user.id;
        const { id } = req.params;
        const { status } = req.body;

        const transaction = await TransactionService.updateTransactionStatus(id, userId, status);

        res.status(200).json({
            status: 'success',
            message: 'Transaction status updated successfully',
            data: { transaction },
        });
    }
}