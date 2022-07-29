export interface PluginRdsModel {
    "p.id": string;
    "p.plugin_name": string;
    "a.name": string;
    "a.surname": string;
    "a.email": string;
    "p.description": string;
    "p.tags": string;
    "p.uri": string;
    "p.signature"?: string;
    "p.hash"?: string;
    "p.created_at": string;
    "p.updated_at": string;
    "s.name": string;
}
