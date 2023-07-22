import config from './lib/config'
import {
    SpecRpcClientOptions,
    StringKeyMap,
    AuthOptions,
    ChainId,
    Address,
    AbiItem,
    MetadataProtocolId,
    ContractCallResponseData,
    ResolveMetadataResponseData,
} from './lib/types'

const DEFAULT_OPTIONS = {
    origin: config.API_ORIGIN,
}

/**
 * Spec Rpc Client.
 *
 * A Javascript client for calling contract 
 * methods and resolving off-chain metadata.
 */
class SpecRpcClient {
    protected origin: string

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

    /**
     * Create a new client instance.
     */
    constructor(options?: SpecRpcClientOptions) {
        const settings = { ...DEFAULT_OPTIONS, ...options }
        this.origin = settings.origin
    }

    /**
     * Call a smart contract method.
     */
    async call(
        chainId: ChainId, 
        contractAddress: Address, 
        abi: AbiItem | string, 
        authOptions: AuthOptions,
    ): Promise<ContractCallResponseData> {
        return (await this._performRequest(
            this.callUrl, 
            { chainId, contractAddress, abi }, 
            authOptions,
        )) as ContractCallResponseData
    }

    /**
     * Resolve off-chain metadata.
     */
    async resolveMetadata(
        protocolId: MetadataProtocolId, 
        pointer: string,
        authOptions: AuthOptions,
    ): Promise<ResolveMetadataResponseData> {
        return (await this._performRequest(
            this.metadataUrl, 
            { protocolId, pointer }, 
            authOptions,
        )) as ResolveMetadataResponseData
    }

    /**
     * Perform a query and return the JSON-parsed result.
     */
    async _performRequest(
        url: string,
        payload: StringKeyMap | StringKeyMap[],
        authOptions: AuthOptions,
        attempt: number = 1
    ): Promise<StringKeyMap> {
        const abortController = new AbortController()
        const timer = setTimeout(() => abortController.abort(), config.REQUEST_TIMEOUT)

        let resp
        try {
            resp = await this._fetch(url, payload, authOptions, abortController)
        } catch (err) {
            clearTimeout(timer)
            const message = err.message || err.toString() || ''
            const didTimeout = message.toLowerCase().includes('user aborted')
            if ((didTimeout && attempt > config.MAX_TIMEOUT_RETRIES) || attempt > config.MAX_ERROR_RETRIES) {
                throw err
            }
            return await this._performRequest(url, payload, authOptions, attempt + 1)
        }
        clearTimeout(timer)

        return this._parseResponse(resp)
    }

    /**
     * POST fetch.
     */
    async _fetch(
        url: string,
        payload: StringKeyMap | StringKeyMap[],
        authOptions: AuthOptions | null,
        abortController: AbortController
    ): Promise<Response> {
        try {
            return await fetch(url, {
                method: 'POST',
                headers: this._buildHeaders(authOptions),
                body: JSON.stringify(payload),
                signal: abortController.signal,
            })
        } catch (err) {
            throw `Query request error: ${err}`
        }
    }

    /**
     * Build base + auth request headers.
     */
    _buildHeaders(authOptions: AuthOptions | null): StringKeyMap {
        const baseHeaders = this.requestHeaders
        return authOptions?.token
            ? {
                  ...baseHeaders,
                  [config.AUTH_HEADER_NAME]: authOptions.token,
              }
            : baseHeaders
    }

    /**
     * Parse JSON HTTP response.
     */
    async _parseResponse(resp: Response): Promise<StringKeyMap[]> {
        try {
            return (await resp.json()) || []
        } catch (err) {
            throw `Failed to parse JSON response data: ${err}`
        }
    }
}

export default SpecRpcClient
