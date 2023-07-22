import { ev } from './utils/env'

export default {
    API_ORIGIN: ev('SPEC_RPC_ORIGIN', 'https://rpc.spec.dev'),
    REQUEST_TIMEOUT: Number(ev('REQUEST_TIMEOUT', 5000)),
    MAX_TIMEOUT_RETRIES: Number(ev('MAX_TIMEOUT_RETRIES', 2)),
    MAX_ERROR_RETRIES: Number(ev('MAX_ERROR_RETRIES', 10)),
    AUTH_HEADER_NAME: 'Spec-Auth-Token',
    AUTH_TOKEN: ev('SPEC_RPC_AUTH_TOKEN'),
}
