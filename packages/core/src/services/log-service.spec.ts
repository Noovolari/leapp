import { describe, test } from "@jest/globals";
import { LoggedEntry, LoggedException, LogLevel, LogService } from "./log-service";
import { ILogger } from "../interfaces/i-logger";

describe("LogService", () => {
  /*
  - Throw Error:
      - L’utente può vedere o non vedere il messaggio
      - Il messaggio può avere diverse severità
      - Il messaggio viene sempre loggato con stack trace
      - Si esce dallo stack di chiamata
  - logService.log(…)
      - L’utente può vedere o non vedere il messaggio
      - Il messaggio può avere diverse severità
      - Il messaggio viene sempre loggato con stack trace
      - Non si esce dallo stack di chiamata
  - Il “title” dei toast non viene mai mostrato né loggato
  - Il “name” delle eccezioni (che proviene dalle varie sottoclassi di LeappBaseError) viene passato solo nel titolo del toast e quindi scartato.
   */

  test("log", () => {
    const logMessages = [];
    const toasts = [];

    const nativeLogger: ILogger = {
      log: (message: string, level: LogLevel) => {
        logMessages.push({ message, level });
      },
      show: (message: string, level: LogLevel) => {
        toasts.push({ message, level });
      },
    };

    class MyService {
      logService = new LogService(nativeLogger, true);
      errorHandler = (code) => {
        try {
          code();
        } catch (error: any) {
          this.logService.log(error);
        }
      };

      method1() {
        this.logService.log(new LoggedEntry("something to log", this, LogLevel.warn, false));
      }

      method2() {
        this.errorHandler(() => {
          throw new LoggedException("something to show", this, LogLevel.error, true);
        });
      }
    }

    const myService = new MyService();

    myService.method1();
    myService.method2();

    console.log("logMessages");
    console.log(logMessages);
    console.log("\n\ntoasts");
    console.log(toasts);
  });
});
