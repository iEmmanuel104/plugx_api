import {
    Table, Column, Model, DataType, ForeignKey, BelongsTo, HasMany,
} from 'sequelize-typescript';
import User from '../user.model';

@Table
export class Card extends Model<Card | ICard> {
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
        authorization_code: string;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
        card_type: string;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
        last4: string;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
        exp_month: string;

    @Column({
        type: DataType.STRING,
        allowNull: false,
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
        country_code: string;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
        brand: string;
}

export interface ICard {
    id?: string;
    userId: string;
    authorization_code: string;
    card_type: string;
    last4: string;
    exp_month: string;
    exp_year: string;
    bin: string;
    bank: string;
    signature: string;
    reusable: boolean;
    country_code?: string;
    brand: string;
}