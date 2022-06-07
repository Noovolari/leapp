import { JsonCache } from "@azure/msal-node";

export interface IMsalPersistence {
  load(): Promise<JsonCache>;
  save(cache: JsonCache): Promise<void>;
}
