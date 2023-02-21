import { jest, describe, test, expect } from "@jest/globals";
import { SegmentService } from "./segment-service";

describe("SegmentService", () => {
  test("list", () => {
    const segments = [
      { name: "segment1", filterGroup: null },
      { name: "segment2", filterGroup: null },
    ];
    const repository: any = {
      getSegments: jest.fn(() => segments),
    };
    const segmentService = new SegmentService(repository);
    const result = segmentService.list();
    expect(result).toEqual(segments);
    expect(repository.getSegments).toHaveBeenCalled();
  });

  test("setSegments", () => {
    const repository: any = {
      setSegments: jest.fn(),
    };
    const segments: any = ["segment-mock-1", "segment-mock-2"];
    const segmentService = new SegmentService(repository);
    segmentService.setSegments(segments);
    expect(repository.setSegments).toHaveBeenCalledWith(segments);
  });

  test("getSegmentByName", () => {
    const repository: any = {
      getSegment: jest.fn(() => "segment-mock"),
    };
    const segmentName = "segment-name-mock";
    const segmentService = new SegmentService(repository);
    const result = segmentService.getSegmentByName(segmentName);
    expect(result).toBe("segment-mock");
    expect(repository.getSegment).toHaveBeenCalledWith(segmentName);
  });

  test("removeSegment", () => {
    const repository: any = {
      removeSegment: jest.fn(),
    };
    const segment: any = "segment-mock";
    const segmentService = new SegmentService(repository);
    segmentService.removeSegment(segment);
    expect(repository.removeSegment).toHaveBeenCalledWith(segment);
  });
});
