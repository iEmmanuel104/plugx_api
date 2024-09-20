import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';
import BankAccountService from '../services/bankAccount.service';

export default class BankAccountController {
    static async addBankAccount(req: AuthenticatedRequest, res: Response) {
        const userId = req.user.id;
        const bankAccountData = { ...req.body, userId };
        const bankAccount = await BankAccountService.addBankAccount(bankAccountData);

        res.status(201).json({
            status: 'success',
            message: 'Bank account added successfully',
            data: { bankAccount },
        });
    }

    static async getBankAccounts(req: AuthenticatedRequest, res: Response) {
        const userId = req.user.id;
        const bankAccounts = await BankAccountService.getBankAccounts(userId);

        res.status(200).json({
            status: 'success',
            message: 'Bank accounts retrieved successfully',
            data: { bankAccounts },
        });
    }

    static async deleteBankAccount(req: AuthenticatedRequest, res: Response) {
        const userId = req.user.id;
        const { id } = req.params;
        await BankAccountService.deleteBankAccount(id, userId);

        res.status(200).json({
            status: 'success',
            message: 'Bank account deleted successfully',
            data: null,
        });
    }
}