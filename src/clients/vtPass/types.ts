/* eslint-disable no-unused-vars */
import { VTPASS_CONFIG, NODE_ENV } from 'utils/constants';


export const getVTpassBaseUrl = (): string => {
    // Returns the base URL for VTpass API based on the current environment
    return NODE_ENV === 'production' ? VTPASS_CONFIG.LIVE_URL : VTPASS_CONFIG.SANDBOX_URL;
};

export enum VTPASS_NETWORKS {
    // Enum representing the available networks for VTpass services
    
    // AIRTIMES NETWORKS SERVICE ID
    MTN_AIRTIME = 'mtn',
    GLO_AIRTIME = 'glo',
    AIRTEL_AIRTIME = 'airtel',
    ETISALAT_AIRTIME = 'etisalat',

    // DATA NETWORKS SERVICE ID
    MTN_DATA = 'mtn-data',
    GLO_DATA = 'glo-data',
    GLO_SME_DATA = 'glo-sme-data',
    AIRTEL_DATA = 'airtel-data',
    ETISALAT_DATA = 'etisalat-data',
    ETISALAT_SME_DATA = '9mobile-sme-data',
    SMILE_DATA = 'smile-direct',
    SPECTRANET_DATA = 'spectranet',

    // TV NETWORKS SERVICE 
    DSTV = 'dstv',
    GOTV = 'gotv',
    STARTIMES = 'startimes',
    SHOWMAX = 'showmax',

    // ELECTRICITY NETWORKS SERVICE
    IKEJA_ELECTRIC = 'ikeja-electric',
    EKO_ELECTRIC = 'eko-electric',
    KANO_ELECTRIC = 'kano-electric',
}

export enum SUBSCRIPTION_TYPES {
    RENEW = 'renew',
    CHANGE = 'change',
}

export enum METER_TYPES {
    PREPAID = 'prepaid',
    POSTPAID = 'postpaid',
}

export interface BaseResponse {
    // Interface for the common response structure from VTpass API
    code: string;
    response_description?: string;
}

export interface TransactionDate {
    // Interface for the transaction date structure
    date: string;
    timezone_type: number;
    timezone: string;
}

export interface TransactionDetails {
    // Interface for the transaction details in the query response
    status: string;
    product_name?: string;
    unique_element?: string;
    unit_price: string | number;
    quantity: number;
    service_verification?: null;
    channel: string;
    commission: number;
    total_amount: number;
    discount: null;
    type: string;
    email: string;
    phone: string;
    name?: null;
    convinience_fee: string | number;
    amount: string | number;
    platform: string;
    method: string;
    transactionId: string;
    // New fields
    is_api?: number;
    customer_id?: number;
    updated_at?: string;
    created_at?: string;
    id?: number;
}

export interface CardDetails {
    serialNumber: string;
    pin: string;
    expiresOn: string;
    value: number;
}

export interface Service {
    // Interface for a service in the services response
    serviceID: string;
    name: string;
    minimium_amount: string;
    maximum_amount: number;
    convinience_fee: string;
    product_type: string;
    image: string;
}

export interface Variation {
    // Interface for a variation in the variation codes response
    variation_code: string;
    name: string;
    variation_amount: string;
    fixedPrice: string;
}

export interface ServiceCategory {
    // Interface for a service category in the service categories response
    identifier: string;
    name: string;
}

export interface VTpassServiceCategoriesResponse extends BaseResponse {
    // Interface for the service categories response from VTpass API
    content: ServiceCategory[];
}

export interface VTpassServicesResponse extends BaseResponse {
    // Interface for the services response from VTpass API
    content: Service[];
}

export interface VTpassVariationCodesResponse extends BaseResponse {
    // Interface for the variation codes response from VTpass API
    content: {
        ServiceName: string;
        serviceID: string;
        convinience_fee: string;
        variations: Variation[];
    };
}

export interface VTpassWalletBalanceResponse extends BaseResponse {
    // Interface for the wallet balance response from VTpass API
    contents: {
        balance: number;
    };
}

export interface VTpassPurchaseResponse extends BaseResponse {
    // Interface for the purchase product response from VTpass API
    requestId: string;
    transactionId?: string;
    amount: string | number;
    transaction_date: TransactionDate;
    purchased_code: string;

    // spectranert card details
    cards?: CardDetails[];

    // tv subscriptioms
    content?: {
        transactions: TransactionDetails;
    };

    // showmax voucher
    Voucher?: string;

    // Fields for electricity
    meterNumber?: string;
    customerName?: string | null;
    customerNumber?: string;
    address?: string | null;
    token?: string;
    tokenAmount?: string;
    tokenValue?: string;
    businessCenter?: string | null;
    exchangeReference?: string;
    units?: string;
    tariff?: string;
    receiptNumber?: string;
    energyAmount?: string | null;
    energyVAT?: string | null;
    mainToken?: string;
    mainTokenDescription?: string;
    mainTokenUnits?: number;
    mainTokenTax?: number;
    mainsTokenAmount?: number;
    bonusToken?: string;
    bonusTokenDescription?: string;
    bonusTokenUnits?: number;
    bonusTokenTax?: number | null;
    bonusTokenAmount?: number | null;
    tariffIndex?: string;
    debtDescription?: string;
    utilityName?: string;
    balance?: number | null;
    resetToken?: string | null;
    fixChargeAmount?: number | null;
    taxAmount?: number | null;
}

export interface VTpassProductOptionsResponse extends BaseResponse {
    // Interface for the product options response from VTpass API
    content: {
        ServiceName: string;
        serviceID: string;
        optionName: string;
        optionType: string;
        optionLabel: string;
        options: Record<string, string>;
    };
}

export interface SmileEmailVerificationResponse extends BaseResponse {
    content: {
        Customer_Name: string;
        AccountList: {
            Account: {
                AccountId: number;
                FriendlyName: string;
            };
            NumberOfAccounts: number;
        };
    };
}

export interface SmartCardVerifyResponse extends BaseResponse {
    content: {
        Customer_Name: string;
        Status: string;
        DUE_DATE: string;
        Customer_Number?: number;
        Customer_Type?: string;
        Current_Bouquet?: string;
        Current_Bouquet_Code?: string;
        Renewal_Amount?: number;
        Customer_ID?: number;
    };
}

export interface MeterVerifyResponse extends BaseResponse {
    content: {
        Customer_Name: string;
        Address: string;
        Meter_Number: string;
        Customer_Arrears: string;
        Minimum_Amount: number | string;
        Min_Purchase_Amount: number | string;
        Customer_Account_Type: 'NMD' | 'MD';
        Meter_Type: string;
        MAX_Purchase_Amount: number | string;
        Can_Vend?: string;
        Business_Unit?: string;
        WrongBillersCode?: boolean;
        Customer_Phone?: string;
    };
}