import {
    Table, Column, Model, DataType, ForeignKey, BelongsTo, HasMany,
} from 'sequelize-typescript';
import User from '../user.model';
import Transaction from 'models/transaction.model';

Table;
export default class Wallet extends Model<Wallet | IWallet> {
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
        type: DataType.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: 0,
        },
    })
        balance: number;

    @Column({
        type: DataType.STRING,
        allowNull: false,
        defaultValue: 'NGN',
    })
        currency: string;

    @HasMany(() => Transaction)
        transactions: Transaction[];
}

export interface IWallet {
    id?: string;
    userId: string;
    balance: number;
    currency: string;
}
