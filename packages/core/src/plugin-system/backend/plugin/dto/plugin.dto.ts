import {StatusDto} from "./status.dto";

export interface PluginDto {
  id: string;
  title: string;
  author: string;
  description: string;
  tags?: string;
  uri: string;
  signature?: string;
  hash?: string;
  status: string;
  icon: "ICONA", // TODO
  image: "IMAGE" // TODO
  pubdate: string;
  updatedate: string;
}
