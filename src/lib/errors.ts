export class RequestError extends Error {
    code: any

    constructor(message: string, code?: any) {
        super(message)
        this.code = code
    }
}
