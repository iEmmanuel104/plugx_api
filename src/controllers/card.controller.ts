import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';
import CardService from '../services/card.service';

export default class CardController {
    static async addCard(req: AuthenticatedRequest, res: Response) {
        const userId = req.user.id;
        const cardData = { ...req.body, userId };
        const card = await CardService.addCard(cardData);

        res.status(201).json({
            status: 'success',
            message: 'Card added successfully',
            data: { card },
        });
    }

    static async getCards(req: AuthenticatedRequest, res: Response) {
        const userId = req.user.id;
        const cards = await CardService.getCards(userId);

        res.status(200).json({
            status: 'success',
            message: 'Cards retrieved successfully',
            data: { cards },
        });
    }

    static async deleteCard(req: AuthenticatedRequest, res: Response) {
        const userId = req.user.id;
        const { id } = req.params;
        await CardService.deleteCard(id, userId);

        res.status(200).json({
            status: 'success',
            message: 'Card deleted successfully',
            data: null,
        });
    }
}