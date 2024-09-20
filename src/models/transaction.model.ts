/* eslint-disable no-unused-vars */
import {
    Table, Column, Model, DataType, ForeignKey, BelongsTo,
    BeforeValidate,
} from 'sequelize-typescript';
import User from './user.model';
import Wallet from './financials/wallet.model';

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

export enum ChargeType {
    DATA = 'data',
    AIRTIME = 'airtime',
    ELECTRICITY = 'electricity',
    CABLE_TV = 'cable_tv',
    EDUCATION = 'education',
    BETTING = 'betting',
    GIFTCARD = 'giftcard',
    OTHER = 'other',
}

@Table
export default class Transaction extends Model<Transaction | ITransaction> {
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

    @ForeignKey(() => Wallet)
    @Column
        walletId: string;

    @BelongsTo(() => Wallet)
        wallet: Wallet;

    @Column({
        type: DataType.ENUM,
        values: Object.values(TransactionType),
        allowNull: false,
    })
        type: TransactionType;

    @Column({
        type: DataType.ENUM,
        values: Object.values(ChargeType),
        allowNull: true,
    })
        chargeType: ChargeType | null;

    @Column({
        type: DataType.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            min: 0,
        },
    })
        amount: number;

    @Column({
        type: DataType.DECIMAL(10, 2),
        allowNull: false,
    })
        previousBalance: number;

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

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
        description: string;

    @BeforeValidate
    static validateChargeType(instance: Transaction) {
        if (instance.type === TransactionType.CHARGE && !instance.chargeType) {
            throw new Error('Charge type is required for CHARGE transactions');
        }
        if (instance.type !== TransactionType.CHARGE && instance.chargeType) {
            instance.chargeType = null;
        }
    }
}

export interface ITransaction {
    id?: string;
    userId: string;
    walletId: string;
    type: TransactionType;
    chargeType?: ChargeType;
    amount: number;
    previousBalance: number;
    currency: string;
    reference: string;
    status: TransactionStatus;
    metadata?: object;
    description: string;
}