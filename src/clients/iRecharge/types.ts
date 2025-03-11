export interface IRechargeBaseResponse {
    status: string;
    message: string;
    transaction_id?: string;
}

export interface IRechargeAirtimeResponse extends IRechargeBaseResponse {
    vtu_network?: string;
    vtu_number?: string;
    vtu_amount?: string;
    customer_name?: string;
    access_token?: string;
    meter_token?: string;
}

export interface IRechargeDataResponse extends IRechargeBaseResponse {
    vtu_network?: string;
    vtu_number?: string;
    vtu_data?: string;
    customer_name?: string;
    access_token?: string;
    meter_token?: string;
}

export interface IRechargeElectricityResponse extends IRechargeBaseResponse {
    disco?: string;
    meter?: string;
    amount?: string;
    customer_name?: string;
    address?: string;
    access_token?: string;
    meter_token?: string;
    units?: string;
}

export interface IRechargeSmartCardResponse extends IRechargeBaseResponse {
    tv_network?: string;
    smartcard_number?: string;
    customer_name?: string;
    customer_number?: string;
    due_date?: string;
    access_token?: string;
}

export interface IRechargeTransactionStatusResponse extends IRechargeBaseResponse {
    status: string;
    reference_id?: string;
    transaction_date?: string;
    transaction_status?: string;
}

export interface IRechargeDataBundle {
    code: string;
    name: string;
    price: string;
    validity?: string;
}

export interface IRechargeDataBundlesResponse extends IRechargeBaseResponse {
    bundles?: IRechargeDataBundle[];
}

export interface IRechargeSmartCardInfoResponse extends IRechargeBaseResponse {
    customer_name?: string;
    customer_number?: string;
    due_date?: string;
    access_token?: string;
}

export interface IRechargeValidationData {
    customerName?: string;
    customerNumber?: string;
    address?: string;
    meterNumber?: string;
    meterType?: string;
    accessToken?: string;
    dueDate?: string;
    status?: string;
    smartCardNumber?: string;
    [key: string]: string | undefined; 
}

export interface IRechargeValidationResponse {
    success: boolean;
    message: string;
    data: IRechargeValidationData;
}

export interface IRechargePackage {
    code: string;
    name: string;
    price: string;
}

export interface IRechargePackagesResponse extends IRechargeBaseResponse {
    bouquets?: IRechargePackage[];
}

export interface IDataBundleInfo {
    variation_code: string;
    name: string;
    variation_amount: string;
    validity: string;
    fixedPrice: string;
}

export interface ITVPackageInfo {
    variation_code: string;
    name: string;
    variation_amount: string;
    fixedPrice: string;
}
