import {
    Table, Column, Model, DataType, ForeignKey, BelongsTo, HasMany,
} from 'sequelize-typescript';
import User from '../user.model';
@Table
export class BankAccount extends Model<BankAccount | IBankAccount> {
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
        account_number: string;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
        account_name: string;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
        bank_code: string;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
        bank_name: string;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
        recipient_code: string;
}

export interface IBankAccount {
    id?: string;
    userId: string;
    account_number: string;
    account_name: string;
    bank_code: string;
    bank_name: string;
    recipient_code: string;
}