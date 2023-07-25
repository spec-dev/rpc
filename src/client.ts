import config from './lib/config'
import {
    SpecRpcClientOptions,
    StringKeyMap,
    ChainId,
    Address,
    AbiItem,
    MetaProtocolId,
    ContractCallResponse,
} from './lib/types'
import { RequestError } from './lib/errors'

const DEFAULT_OPTIONS = {
    origin: config.API_ORIGIN,
    authToken: config.AUTH_TOKEN,
}

/**
 * Spec RPC Client.
 *
 * A Javascript client for calling contract methods and resolving metadata.
 */
class SpecRpcClient {
    protected origin: string

    protected authToken: string

    get callUrl(): string {
        const url = new URL(this.origin)
        url.pathname = '/call'
        return url.toString()
    }

    get metadataUrl(): string {
        const url = new URL(this.origin)
        url.pathname = '/metadata'
        return url.toString()
    }

    get requestHeaders(): StringKeyMap {
        return {
            'Content-Type': 'application/json',
        }
    }

    /**,
     * Create a new client instance.
     */
    constructor(options?: SpecRpcClientOptions) {
        const settings = { ...DEFAULT_OPTIONS, ...options }
        this.origin = settings.origin
        this.authToken = settings.authToken
    }

    /**
     * Call a smart contract method.
     */
    async call(
        chainId: ChainId,
        contractAddress: Address,
        abiItem: AbiItem | string,
        inputs: any[]
    ): Promise<ContractCallResponse> {
        return (await this._performRequest(this.callUrl, {
            chainId,
            contractAddress,
            abiItem,
            inputs,
        })) as ContractCallResponse
    }

    /**
     * Resolve off-chain metadata.
     */
    async resolveMetadata(pointer: string, protocolId?: MetaProtocolId): Promise<StringKeyMap> {
        return await this._performRequest(this.metadataUrl, {
            pointer,
            protocolId,
        })
    }

    /**
     * Perform request with auto-retries.
     */
    async _performRequest(
        url: string,
        payload: StringKeyMap | StringKeyMap[],
        attempt: number = 1
    ): Promise<StringKeyMap> {
        const abortController = new AbortController()
        const timer = setTimeout(() => abortController.abort(), config.REQUEST_TIMEOUT)

        let data
        try {
            data = await this._post(url, payload, abortController)
        } catch (err) {
            clearTimeout(timer)
            const message = err.message || err.toString() || ''
            const didTimeout = message.toLowerCase().includes('user aborted')
            if (
                (didTimeout && attempt > config.MAX_TIMEOUT_RETRIES) ||
                attempt > config.MAX_ERROR_RETRIES
            ) {
                throw err
            }
            return await this._performRequest(url, payload, attempt + 1)
        }
        clearTimeout(timer)

        return data
    }

    /**
     * Perform HTTP POST.
     */
    async _post(
        url: string,
        payload: StringKeyMap | StringKeyMap[],
        abortController: AbortController
    ): Promise<StringKeyMap> {
        const resp = await fetch(url, {
            method: 'POST',
            headers: this._buildHeaders(),
            body: JSON.stringify(payload),
            signal: abortController.signal,
        })

        const { data, error } = (await resp.json()) || {}

        if (resp.status !== 200 || error) {
            throw new RequestError(error?.message || 'unknown error', error?.code || resp.status)
        }

        return data
    }

    /**
     * Build base + auth request headers.
     */
    _buildHeaders(): StringKeyMap {
        const baseHeaders = this.requestHeaders
        return this.authToken
            ? {
                  ...baseHeaders,
                  [config.AUTH_HEADER_NAME]: this.authToken,
              }
            : baseHeaders
    }
}

export default SpecRpcClient
