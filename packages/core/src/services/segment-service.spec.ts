import { Repository } from "./repository";
import { describe, test } from "@jest/globals";
import { SegmentService } from "./segment-service";
import { FileService } from "./file-service";
import Segment from "../models/segment";

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

  test("removeSegment - should remove a segment from segment list", () => {
    fileService.existsSync = () => true;
    const segment2 = { name: "segment2", filterGroup: null };
    const repositoryMock = new Repository(nativeService as any, fileService);
    let list = [{ name: "segment1", filterGroup: null }, segment2];
    repositoryMock.createWorkspace = () => {};
    repositoryMock.getSegments = jest.fn(() => list);
    repositoryMock.getSegment = jest.fn((segmentName: string) => repositoryMock.getSegments().find((s) => s.name === segmentName));
    repositoryMock.removeSegment = jest.fn((segment: Segment) => {
      list = list.filter((s) => s.name !== segment.name);
      repositoryMock.getSegments = jest.fn(() => list);
    });

    const segmentService = new SegmentService(repositoryMock);
    segmentService.removeSegment(segment2);
    expect(segmentService.list()).toStrictEqual([{ name: "segment1", filterGroup: null }]);
  });

  test("setSegments - should add segments to the list of segments", () => {
    const segment1 = { name: "segment1", filterGroup: null };
    const segment2 = { name: "segment2", filterGroup: null };
    const segment3 = { name: "segment3", filterGroup: null };

    const segments = [segment1, segment2, segment3];
    let workspaceSegments;

    const repositoryMock = new Repository(nativeService as any, fileService);
    jest.spyOn(repositoryMock, "setSegments").mockImplementation((_segments) => {
      workspaceSegments = _segments;
    });
    jest.spyOn(repositoryMock, "getSegments").mockImplementation(() => workspaceSegments);
    jest.spyOn(repositoryMock, "getSegment").mockImplementation((name) => workspaceSegments.find((ws) => ws.name === name));

    const segmentService = new SegmentService(repositoryMock);
    segmentService.setSegments(segments);
    expect(repositoryMock.setSegments).toHaveBeenCalledWith(segments);
    expect(segmentService.getSegmentByName("segment2")).toStrictEqual(segment2);
  });
});
