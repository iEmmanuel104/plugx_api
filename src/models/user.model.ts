import {
    Table, Column, Model, DataType, HasOne, Default, BeforeFind, Scopes,
    IsEmail, IsUUID, PrimaryKey, Index, BeforeCreate, BeforeUpdate, HasMany,
} from 'sequelize-typescript';
import Password from './password.model';
import UserSettings from './userSettings.model';
import { FindOptions } from 'sequelize';
import BankAccount from './financials/bankAccount.model';
import Card from './financials/card.model';
import Wallet from './financials/wallet.model';
import Transaction from './transaction.model';

@Scopes(() => ({
    withSettings: {
        include: [
            {
                model: UserSettings,
                as: 'settings',
                attributes: ['joinDate', 'isBlocked', 'isDeactivated', 'lastLogin', 'meta'],
            },
        ],
    },
}))
@Table
export default class User extends Model<User | IUser> {
    @IsUUID(4)
    @PrimaryKey
    @Default(DataType.UUIDV4)
    @Column
        id: string;

    @IsEmail
    @Index
    @Column({
        type: DataType.STRING, allowNull: false,
        get() {
            return this.getDataValue('email').trim().toLowerCase();
        },
        set(value: string) {
            this.setDataValue('email', value.trim().toLowerCase());
        },
    })
        email: string;

    @Index
    @Column({
        type: DataType.STRING,
        allowNull: false,
        set(value: string) {
            this.setDataValue('firstName', User.capitalizeFirstLetter(value));
        },
    })
        firstName: string;

    @Index
    @Column({
        type: DataType.STRING,
        allowNull: false,
        set(value: string) {
            this.setDataValue('lastName', User.capitalizeFirstLetter(value));
        },
    })
        lastName: string;

    @Column({
        type: DataType.STRING,
        set(value: string) {
            if (value) {
                this.setDataValue('otherName', User.capitalizeFirstLetter(value));
            }
        },
    })
        otherName: string;

    @Column({ type: DataType.STRING })
        gender: string;

    @Column({ type: DataType.STRING })
        displayImage: string;

    @Column({ type: DataType.JSONB, allowNull: false, defaultValue: { activated: false, emailVerified: false } })
        status: {
        activated: boolean;
        emailVerified: boolean;
    };

    @Column({
        type: DataType.VIRTUAL,
        get() {
            if (this.getDataValue('otherName')) {
                return `${this.getDataValue('firstName')} ${this.getDataValue('lastName')} ${this.getDataValue('otherName')}`.trim();
            } else {
                return `${this.getDataValue('firstName')} ${this.getDataValue('lastName')}`.trim();
            }
        },
        set(value: string) {
            const names = value.split(' ');
            this.setDataValue('firstName', names[0]);
            this.setDataValue('lastName', names.slice(1).join(' '));
        },
    })
        fullName: string;

    @Column({ type: DataType.JSONB })
        phone: {
        countryCode: string;
        number: string;
    };

    @Column({
        type: DataType.DATEONLY,
        validate: {
            isDate: true,
            isValidDate(value: string | Date) {
                if (new Date(value) > new Date()) {
                    throw new Error('Date of birth cannot be in the future');
                }
            },
        },
    })
        dob: Date;
    
    // Associations
    @HasOne(() => Password)
        password: Password;

    @HasOne(() => UserSettings)
        settings: UserSettings;

    @HasMany(() => BankAccount)
        bankAccounts: BankAccount[];

    @HasMany(() => Card)
        cards: Card[];

    @HasOne(() => Wallet)
        wallet: Wallet;

    @HasMany(() => Transaction)
        transactions: Transaction[];
    
    @BeforeFind
    static beforeFindHook(options: FindOptions) {
        if (options.where && 'email' in options.where && typeof options.where.email === 'string') {
            const whereOptions = options.where as { email?: string };
            if (whereOptions.email) {
                whereOptions.email = whereOptions.email.trim().toLowerCase();
            }
        }
    }

    @BeforeCreate
    @BeforeUpdate
    static beforeSaveHook(instance: User) {
        // Only capitalize if the field is changed (for updates) or new (for creates)
        if (instance.changed('firstName')) {
            instance.firstName = User.capitalizeFirstLetter(instance.firstName);
        }
        if (instance.changed('lastName')) {
            instance.lastName = User.capitalizeFirstLetter(instance.lastName);
        }
        if (instance.changed('otherName') && instance.otherName) {
            instance.otherName = User.capitalizeFirstLetter(instance.otherName);
        }
    }

    static capitalizeFirstLetter(str: string): string {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
}

export interface IUser {
    email: string;
    firstName: string;
    lastName: string;
    otherName?: string;
    gender?: string;
    status: {
        activated: boolean;
        emailVerified: boolean;
    };
    displayImage?: string;
    fullName?: string;
    phone?: {
        countryCode: string;
        number: string
    };
    dob?: Date;
}