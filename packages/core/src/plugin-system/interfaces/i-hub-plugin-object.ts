export interface IHubPluginObject {
  id: string;
  title: string;
  author: string;
  description: string;
  tags?: string;
  uri: string;
  signature?: string;
  hash?: string;
  status: string;
  icon: string;
  image: string;
  pubdate: string;
  updatedate: string;
}
