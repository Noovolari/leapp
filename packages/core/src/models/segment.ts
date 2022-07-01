import { SessionType } from "./session-type";

export interface GlobalFilters {
  searchFilter: string;
  dateFilter: boolean;
  pinnedFilter: boolean;
  providerFilter: { show: boolean; id: string; name: string; value: boolean }[];
  profileFilter: { show: boolean; id: string; name: string; value: boolean }[];
  regionFilter: { show: boolean; name: string; value: boolean }[];
  integrationFilter: { name: string; value: boolean }[];
  typeFilter: { show: boolean; id: SessionType; category: string; name: string; value: boolean }[];
}

export default interface Segment {
  name: string;
  filterGroup: GlobalFilters;
}
