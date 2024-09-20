import {
    Table, Column, Model, DataType, ForeignKey, BelongsTo, BeforeCreate, BeforeUpdate,
    Default, IsUUID, PrimaryKey,
} from 'sequelize-typescript';
import User from '../user.model';
import { BadRequestError } from '../../utils/customErrors';

@Table
export default class BankAccount extends Model<BankAccount | IBankAccount> {
    @IsUUID(4)
    @PrimaryKey
    @Default(DataType.UUIDV4)
    @Column
        id: string;

    @ForeignKey(() => User)
    @Column
        userId: string;

    @BelongsTo(() => User)
        user: User;

    @Column({
        type: DataType.STRING,
        allowNull: false,
        validate: {
            isNumeric: true,
            len: [10, 10],
        },
    })
        accountNumber: string;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
        accountName: string;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
        bankCode: string;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
        bankName: string;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
        recipientCode: string;

    @BeforeCreate
    @BeforeUpdate
    static async checkLimit(instance: BankAccount) {
        const count = await BankAccount.count({ where: { userId: instance.userId } });
        if (count >= 3) {
            throw new BadRequestError('User can have a maximum of 3 bank accounts');
        }
    }
}

export interface IBankAccount {
    id?: string;
    userId: string;
    accountNumber: string;
    accountName: string;
    bankCode: string;
    bankName: string;
    recipientCode: string;
}