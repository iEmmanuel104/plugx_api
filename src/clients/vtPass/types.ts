/* eslint-disable no-unused-vars */
import { VTPASS_CONFIG, NODE_ENV } from 'utils/constants';


// Returns the base URL for VTpass API based on the current environment
export const getVTpassBaseUrl = (): string => {
    return NODE_ENV === 'production' ? VTPASS_CONFIG.LIVE_URL : VTPASS_CONFIG.SANDBOX_URL;
};

// Enum representing the available networks for VTpass services
export enum VTPASS_NETWORKS {
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
    // TV NETWORKS SERVICE ID
}

// Interface for the common response structure from VTpass API
export interface BaseResponse {
    code: string;
    response_description: string;
}

// Interface for the transaction date structure
export interface TransactionDate {
    date: string;
    timezone_type: number;
    timezone: string;
}

// Interface for the purchase product response from VTpass API
export interface VTpassPurchaseResponse extends BaseResponse {
    requestId: string;
    transactionId: string;
    amount: string;
    transaction_date: TransactionDate;
    purchased_code: string;
    // spectranert card details
    cards?: {
        serialNumber: string;
        pin: string;
        expiresOn: string;
        value: number;
    }[];
}

// Interface for the transaction details in the query response
export interface TransactionDetails {
    status: string;
    product_name: string;
    unique_element: string;
    unit_price: number;
    quantity: number;
    service_verification: null;
    channel: string;
    commission: number;
    total_amount: number;
    discount: null;
    type: string;
    email: string;
    phone: string;
    name: null;
    convinience_fee: number;
    amount: number;
    platform: string;
    method: string;
    transactionId: string;
}

// Interface for the query transaction status response from VTpass API
export interface VTpassQueryResponse extends BaseResponse {
    requestId: string;
    amount: string;
    transaction_date: TransactionDate;
    purchased_code: string;
    content: {
        transactions: TransactionDetails;
    };
}

// Interface for the wallet balance response from VTpass API
export interface VTpassWalletBalanceResponse extends BaseResponse {
    contents: {
        balance: number;
    };
}

// Interface for a service category in the service categories response
export interface ServiceCategory {
    identifier: string;
    name: string;
}

// Interface for the service categories response from VTpass API
export interface VTpassServiceCategoriesResponse extends BaseResponse {
    content: ServiceCategory[];
}

// Interface for a service in the services response
export interface Service {
    serviceID: string;
    name: string;
    minimium_amount: string;
    maximum_amount: number;
    convinience_fee: string;
    product_type: string;
    image: string;
}

// Interface for the services response from VTpass API
export interface VTpassServicesResponse extends BaseResponse {
    content: Service[];
}

// Interface for a variation in the variation codes response
export interface Variation {
    variation_code: string;
    name: string;
    variation_amount: string;
    fixedPrice: string;
}

// Interface for the variation codes response from VTpass API
export interface VTpassVariationCodesResponse extends BaseResponse {
    content: {
        ServiceName: string;
        serviceID: string;
        convinience_fee: string;
        variations: Variation[];
    };
}

// Interface for the product options response from VTpass API
export interface VTpassProductOptionsResponse extends BaseResponse {
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