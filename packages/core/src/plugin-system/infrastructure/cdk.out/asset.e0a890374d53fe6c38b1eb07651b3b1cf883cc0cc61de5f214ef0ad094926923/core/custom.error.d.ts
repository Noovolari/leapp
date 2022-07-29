import { HTTPStatusCodeEnum } from "../enum/http-status-code.enum";
export declare class CustomError extends Error {
    status: HTTPStatusCodeEnum;
    cause: string;
    constructor(status: HTTPStatusCodeEnum, message: string, cause?: string);
}
export declare class DataApiError extends CustomError {
    constructor(message: string);
}
