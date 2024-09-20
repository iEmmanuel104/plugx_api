import {
    Table, Column, Model, DataType, ForeignKey, BelongsTo, BeforeCreate, BeforeUpdate,
} from 'sequelize-typescript';
import User from '../user.model';
import { BadRequestError } from 'utils/customErrors';

@Table
export default class Card extends Model<Card | ICard> {
    @Column({
        type: DataType.UUID,
        defaultValue: DataType.UUIDV4,
        primaryKey: true,
    })
        id: string;

    @ForeignKey(() => User)
    @Column
        userId: string;

    @BelongsTo(() => User)
        user: User;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
        authorizationCode: string;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
        cardType: string;

    @Column({
        type: DataType.STRING,
        allowNull: false,
        validate: {
            len: [4, 4],
        },
    })
        last4: string;

    @Column({
        type: DataType.STRING,
        allowNull: false,
        validate: {
            isNumeric: true,
            len: [1, 2],
        },
    })
        expMonth: string;

    @Column({
        type: DataType.STRING,
        allowNull: false,
        validate: {
            isNumeric: true,
            len: [4, 4],
        },
    })
        exp_year: string;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
        bin: string;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
        bank: string;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
        signature: string;

    @Column({
        type: DataType.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    })
        reusable: boolean;

    @Column({
        type: DataType.STRING,
        allowNull: true,
    })
        countryCode: string;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
        brand: string;

    @BeforeCreate
    @BeforeUpdate
    static async checkLimit(instance: Card) {
        const count = await Card.count({ where: { userId: instance.userId } });
        if (count >= 3) {
            throw new BadRequestError('User can have a maximum of 3 cards');
        }
    }
}

export interface ICard {
    id?: string;
    userId: string;
    authorizationCode: string;
    card_type: string;
    last4: string;
    expMonth: string;
    expYear: string;
    bin: string;
    bank: string;
    signature: string;
    reusable: boolean;
    countryCode?: string;
    brand: string;
}