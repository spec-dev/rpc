export type StringKeyMap = { [key: string]: any }

export type StringMap = { [key: string]: string }

export type SpecRpcClientOptions = {
    origin?: string
    authToken?: string
}

export type Address = string

export type ChainId = string

export type MetadataProtocolId = number

export interface ContractCallResponse {
    outputs: StringKeyMap
    outputArgs: any[]
}

export interface AbiItemInput {
    type: string
    name?: string
    indexed?: boolean
    internalType?: string
}

export interface AbiItemOutput {
    name: string
    type: string
}

export enum AbiItemType {
    Function = 'function',
    Event = 'event',
    Constructor = 'constructor',
}

export enum AbiItemStateMutability {
    Payable = 'payable',
    NonPayable = 'nonpayable',
    View = 'view',
}

export interface AbiItem {
    name: string
    type: AbiItemType
    inputs: AbiItemInput[]
    signature?: string
    constant?: boolean
    outputs?: AbiItemOutput[]
    payable?: boolean
    stateMutability?: AbiItemStateMutability
    anonymous?: boolean
}

export type Abi = AbiItem[]
