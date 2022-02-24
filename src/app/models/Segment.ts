import {GlobalFilters} from '../components/command-bar/command-bar.component';

export default interface Segment {
  name: string;
  filterGroup: GlobalFilters;
}
