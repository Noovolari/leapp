import Segment from "../models/segment";
import { Repository } from "./repository";

export class SegmentService {
  constructor(private repository: Repository) {}

  list(): Segment[] {
    return this.repository.getSegments();
  }

  setSegments(segments: Segment[]): void {
    this.repository.setSegments(segments);
  }

  getSegmentByName(segmentName: string): Segment {
    return this.repository.getSegment(segmentName);
  }

  removeSegment(segment: Segment): void {
    this.repository.removeSegment(segment);
  }
}
