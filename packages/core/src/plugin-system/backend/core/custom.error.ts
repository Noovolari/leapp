import {HTTPStatusCodeEnum} from "../enum/http-status-code.enum";


export class CustomError extends Error {
	status: HTTPStatusCodeEnum;
	cause: string;

	constructor(
		status: HTTPStatusCodeEnum,
		message: string,
		cause = "Client Error"
	) {
		super(message);
		this.status = status;
		this.cause = cause;
	}
}

export class DataApiError extends CustomError {
	constructor(message: string) {
		super(
      HTTPStatusCodeEnum.internalServerError,
			message,
			"Data API error"
		);
	}
}
