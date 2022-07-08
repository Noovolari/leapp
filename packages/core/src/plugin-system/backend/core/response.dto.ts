import { HTTPStatusCodeEnum } from "../enum/http-status-code.enum";

export interface ResponseDto {
  httpStatusCode: HTTPStatusCodeEnum;
  message: string;
  details?: string;
  stack?: string;
}
