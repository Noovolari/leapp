import { Service } from "../core/service";
export declare class SignatureUpdaterService extends Service {
    private readonly dataApiConnector;
    constructor(region: string);
    updateRds(pluginName: string, hash: string, signature: string): Promise<void>;
}
