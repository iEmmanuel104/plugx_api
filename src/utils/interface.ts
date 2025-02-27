/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-unused-vars */
import User, { IUser } from '../models/user.model';

export interface SaveTokenToCache {
    key: string,
    token: string,
    expiry?: number
}

export type AuthToken = 'access' | 'refresh' | 'passwordreset' | 'emailverification' | 'setpassword' | 'adminlogin' | 'admin';

export type ENCRYPTEDTOKEN = AuthToken | 'admin'

export type AWSUploadType = 'profile' | 'posts' | 'document' | 'other';

export interface GenerateTokenData {
    type: AuthToken,
    user: User,
}
export interface GenerateAdminTokenData {
    type: AuthToken,
    identifier: string,
}

export interface GenerateCodeData {
    type: AuthToken,
    identifier: string,
    expiry: number,
}

export interface CompareTokenData {
    tokenType: AuthToken,
    user: IUser & { id: string },
    token: string
}
export interface CompareAdminTokenData {
    tokenType: AuthToken,
    identifier: string,
    token: string
}

export interface DeleteToken {
    tokenType: AuthToken,
    tokenClass: 'token' | 'code',
    user: IUser & { id: string },
}

export type DecodedUser = { id: string };

export interface DecodedTokenData {
    user: DecodedUser,
    token: string,
    tokenType: AuthToken
    authKey?: string
}

export interface AWSKeyData {
    id: string,
    fileName: string,
    type: AWSUploadType,
}


export enum UtilityType {
    AIRTIME = 'airtime',
    DATA = 'data',
    ELECTRICITY = 'electricity',
    TV = 'tv',
    EDUCATION = 'education'
}

export enum ProviderType {
    VTPASS = 'vtpass',
    IRECHARGE = 'irecharge'
}

export enum MeterType {
    PREPAID = 'prepaid',
    POSTPAID = 'postpaid'
}

export enum TVType {
    DSTV = 'dstv',
    GOTV = 'gotv',
    STARTIMES = 'startimes',
    SHOWMAX = 'showmax'
}

export enum SubscriptionType {
    CHANGE = 'change',
    RENEW = 'renew'
}

export enum EducationType {
    WAEC_REGISTRATION = 'waec-registration',
    WAEC_RESULT = 'waec',
    JAMB = 'jamb'
}

export enum TransactionStatus {
    INITIATED = 'initiated',
    PENDING = 'pending',
    DELIVERED = 'delivered',
    FAILED = 'failed',
    REVERSED = 'reversed'
}

// Base interface for all utility requests
export interface IUtilityRequest {
    amount: number;
    phone: string;
    email?: string;
    reference?: string; // Our internal reference
}

// Base interface for all provider responses
export interface IProviderResponse {
    success: boolean;
    transactionStatus: TransactionStatus;
    transactionReference: string;
    message: string;
    providerReference?: string;
    providerType: ProviderType;
    data?: any;
}

// Interface for airtime requests
export interface IAirtimeRequest extends IUtilityRequest {
    network: string;
    recipientPhone: string;
}

// Interface for data requests
export interface IDataRequest extends IUtilityRequest {
    network: string;
    recipientPhone: string;
    dataCode: string;
}

// Interface for electricity requests
export interface IElectricityRequest extends IUtilityRequest {
    disco: string;
    meterNumber: string;
    meterType: MeterType;
}

// Interface for TV requests
export interface ITVRequest extends IUtilityRequest {
    provider: TVType;
    smartCardNumber: string;
    packageCode?: string;
    subscriptionType?: SubscriptionType;
}

// Interface for education requests
export interface IEducationRequest extends IUtilityRequest {
    type: EducationType;
    quantity?: number;
    examNumber?: string;  // For JAMB
}

// Interface for utility provider service
export interface IUtilityProvider {
    // Common methods
    validateTransaction(reference: string): Promise<IProviderResponse>;

    // Utility specific methods
    purchaseAirtime(request: IAirtimeRequest): Promise<IProviderResponse>;
    purchaseData(request: IDataRequest): Promise<IProviderResponse>;
    purchaseElectricity(request: IElectricityRequest): Promise<IProviderResponse>;
    purchaseTV(request: ITVRequest): Promise<IProviderResponse>;
    purchaseEducation(request: IEducationRequest): Promise<IProviderResponse>;

    // Validation methods
    validateMeterNumber(disco: string, meterNumber: string, meterType: MeterType): Promise<any>;
    validateSmartCardNumber(provider: TVType, smartCardNumber: string): Promise<any>;
    validateDataBundle(network: string): Promise<any[]>;
    validateTVPackages(provider: TVType): Promise<any[]>;
}

// Interface for the main utility service
export interface IUtilityService {
    purchaseAirtime(request: IAirtimeRequest): Promise<IProviderResponse>;
    purchaseData(request: IDataRequest): Promise<IProviderResponse>;
    purchaseElectricity(request: IElectricityRequest): Promise<IProviderResponse>;
    purchaseTV(request: ITVRequest): Promise<IProviderResponse>;
    purchaseEducation(request: IEducationRequest): Promise<IProviderResponse>;
    validateMeterNumber(disco: string, meterNumber: string, meterType: MeterType): Promise<any>;
    validateSmartCardNumber(provider: TVType, smartCardNumber: string): Promise<any>;
    validateTransaction(reference: string): Promise<IProviderResponse>;
    validateDataBundle(network: string): Promise<any[]>;
    validateTVPackages(provider: TVType): Promise<any[]>;
}