import { Repository } from "./repository";
import { describe, test } from "@jest/globals";
import { SegmentService } from "./segment-service";
import { FileService } from "./file-service";

describe("SegmentService", () => {
  const nativeService = { os: { homedir: () => "" }, fs: { readFileSync: () => "" } };
  const fileService = new FileService(nativeService as any);

  test("list - should give a list of segment from repository", () => {
    fileService.existsSync = () => true;
    const repositoryMock = new Repository(nativeService as any, fileService);
    repositoryMock.createWorkspace = () => {};
    repositoryMock.getSegments = jest.fn(() => [
      { name: "segment1", filterGroup: null },
      { name: "segment2", filterGroup: null },
    ]);
    const segmentService = new SegmentService(repositoryMock);
    expect(segmentService.list()[0]).toStrictEqual({ name: "segment1", filterGroup: null });
    expect(segmentService.list().length).toBe(2);
  });

  test("getSegment - should return a segment by its name", () => {
    fileService.existsSync = () => true;
    const repositoryMock = new Repository(nativeService as any, fileService);
    repositoryMock.createWorkspace = () => {};
    repositoryMock.getSegments = jest.fn(() => [
      { name: "segment1", filterGroup: null },
      { name: "segment2", filterGroup: null },
    ]);
    repositoryMock.getSegment = jest.fn((segmentName: string) => repositoryMock.getSegments().find((s) => s.name === segmentName));
    const segmentService = new SegmentService(repositoryMock);
    expect(segmentService.getSegmentByName("segment1")).toStrictEqual({ name: "segment1", filterGroup: null });
    expect(segmentService.getSegmentByName("segment2")).toStrictEqual({ name: "segment2", filterGroup: null });
  });
});
