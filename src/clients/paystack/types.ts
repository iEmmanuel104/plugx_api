export interface PaystackResponse<T> {
    status: boolean;
    message: string;
    data?: T;
}

export interface InitializeTransactionParams {
    amount: string;
    email: string;
    currency?: string;
    reference?: string;
    callback_url?: string;
    metadata?: string;
    channels?: ['card' | 'bank' | 'ussd' | 'bank_transfer'];
}
export interface InitializeTransactionResponseData {
    authorization_url: string;
    access_code: string;
    reference: string;
}
