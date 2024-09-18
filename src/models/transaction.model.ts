/* eslint-disable no-unused-vars */
import {
    Table, Column, Model, DataType, ForeignKey, BelongsTo,
} from 'sequelize-typescript';
import User from './user.model';

export enum TransactionType {
    DEPOSIT = 'deposit',
    CHARGE = 'charge',
    REFUND = 'refund',
    WITHDRAWAL = 'withdrawal',
}

export enum TransactionStatus {
    SUCCESS = 'success',
    FAILED = 'failed',
    PENDING = 'pending',
}

@Table
export default class Transaction extends Model<Transaction> {
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
        type: DataType.ENUM,
        values: Object.values(TransactionType),
        allowNull: false,
    })
        type: TransactionType;

    @Column({
        type: DataType.DECIMAL(10, 2),
        allowNull: false,
    })
        amount: number;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
        currency: string;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
        reference: string;

    @Column({
        type: DataType.ENUM,
        values: Object.values(TransactionStatus),
        allowNull: false,
        defaultValue: TransactionStatus.PENDING,
    })
        status: TransactionStatus;

    @Column({
        type: DataType.JSONB,
        allowNull: true,
    })
        metadata?: object;
}

export interface ITransaction {
    id?: string;
    userId: string;
    type: TransactionType;
    amount: number;
    currency: string;
    reference: string;
    status: TransactionStatus;
    metadata?: object;
}