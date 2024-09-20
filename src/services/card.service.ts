import { Transaction } from 'sequelize';
import Card, { ICard } from '../models/financials/card.model';
import { NotFoundError, BadRequestError } from '../utils/customErrors';

export default class CardService {
    static async addCard(cardData: ICard, transaction?: Transaction): Promise<Card> {
        const cardCount = await Card.count({ where: { userId: cardData.userId } });
        if (cardCount >= 3) {
            throw new BadRequestError('User can have a maximum of 3 cards');
        }
        return await Card.create(cardData, { transaction });
    }

    static async getCards(userId: string): Promise<Card[]> {
        return await Card.findAll({ where: { userId } });
    }

    static async getCard(id: string, userId: string): Promise<Card> {
        const card = await Card.findOne({ where: { id, userId } });
        if (!card) {
            throw new NotFoundError('Card not found');
        }
        return card;
    }

    static async deleteCard(id: string, userId: string, transaction?: Transaction): Promise<void> {
        const card = await this.getCard(id, userId);
        await card.destroy({ transaction });
    }
}