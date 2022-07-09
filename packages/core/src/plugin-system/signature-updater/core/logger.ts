import { environment } from "../environments/environment";

export class Logger {
	static debug(message?: any, ...optionalParams: any[]): void {
		if (
			environment.name === "local" ||
			environment.name === "dev" ||
			environment.name === "test"
		) {
			console.debug(
				"[" + new Date().toISOString() + "] - DEBUG - ",
				message,
				...optionalParams
			);
		}
	}
	static info(message?: any, ...optionalParams: any[]): void {
		console.info(
			"[" + new Date().toISOString() + "] - INFO - ",
			message,
			...optionalParams
		);
	}
	static warn(message?: any, ...optionalParams: any[]): void {
		console.warn(
			"[" + new Date().toISOString() + "] - WARN - ",
			message,
			...optionalParams
		);
	}
	static error(message?: any, ...optionalParams: any[]): void {
		console.error(
			"[" + new Date().toISOString() + "] - ERROR - ",
			message,
			...optionalParams
		);
	}
}
