import {
    Table, Column, Model, DataType, ForeignKey, BelongsTo, HasMany,
    PrimaryKey, IsUUID, Default,
} from 'sequelize-typescript';
import User from '../user.model';
import Transaction from '../transaction.model';

@Table
export default class Wallet extends Model<Wallet | IWallet> {
    @IsUUID(4)
    @PrimaryKey
    @Default(DataType.UUIDV4)
    @Column
        id: string;

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

    @ForeignKey(() => User)
    @Column
        userId: string;

    @BelongsTo(() => User)
        user: User;

    @HasMany(() => Transaction)
        transactions: Transaction[];
}

export interface IWallet {
    id?: string;
    userId: string;
    balance: number;
    currency: string;
}
