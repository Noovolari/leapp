import { jest, describe, test, expect } from "@jest/globals";
import { FileService } from "./file-service";

const truePathLib = require("path");

describe("File Service", () => {
  const homedir = "homedir-path";
  const existsPath = "path";
  const fakePath = "fake-path";

  let newName;
  let callbackMock = { err: undefined, data: "data" };

  const nativeService = {
    os: {
      homedir: jest.fn(() => homedir),
    },
    path: {
      dirname: jest.fn((_path) => truePathLib.dirname(_path)),
      join: jest.fn((...array) => array.join("/")),
    },
    fs: {
      existsSync: jest.fn((_path) => _path === existsPath),
      writeFileSync: jest.fn((_file, _data) => {}),
      renameSync: jest.fn((_name, _newName) => (newName = _newName)),
      readFile: jest.fn((_filePath, _options, _callback: (err: any, data: string) => void) => _callback(callbackMock.err, callbackMock.data)),
    },
    copydir: {
      sync: jest.fn((_source, _target, _opt: { mode: true }) => {}),
    },
  } as any;

  test("homeDir", () => {
    const fileService = new FileService(nativeService);
    const result = fileService.homeDir();
    expect(result).toStrictEqual(homedir);
    expect(nativeService.os.homedir).toHaveBeenCalledTimes(1);
  });

  test("existsSync", () => {
    const fileService = new FileService(nativeService);
    let result = fileService.existsSync(existsPath);
    expect(result).toBe(true);
    result = fileService.existsSync(fakePath);
    expect(result).toBe(false);
    expect(nativeService.fs.existsSync).toHaveBeenCalledTimes(2);
  });

  test("renameSync", () => {
    const newPath = "new-path";
    const fileService = new FileService(nativeService);
    fileService.renameSync(existsPath, newPath);
    expect(newName).toBe(newPath);
    expect(nativeService.fs.renameSync).toHaveBeenNthCalledWith(1, existsPath, newPath);
  });

  test("dirname", () => {
    const testPath = "test/my_test/again_a_test/file.js";
    const fileService = new FileService(nativeService);
    expect(fileService.dirname(testPath)).toBe("test/my_test/again_a_test");
    expect(nativeService.path.dirname).toHaveBeenCalledTimes(1);
    expect(nativeService.path.dirname).toHaveBeenCalledWith(testPath);
  });

  test("readFile, normal and error", async () => {
    callbackMock = { err: undefined, data: "data" };

    const testPath = "test/my_test/again_a_test/file.js";
    const fileService = new FileService(nativeService);
    fileService.readFile(testPath).subscribe(
      (res) => {
        expect(res).toBe(callbackMock.data);
        expect(nativeService.fs.readFile).toHaveBeenNthCalledWith(1, testPath, { encoding: "utf-8" }, callbackMock);
      },
      (_err) => {}
    );
    callbackMock = { err: "error", data: undefined };
    fileService.readFile(testPath).subscribe(
      (_res) => {},
      (err) => {
        expect(err).toBe(callbackMock.err);
        expect(nativeService.fs.readFile).toHaveBeenNthCalledWith(2, testPath, { encoding: "utf-8" }, callbackMock);
      }
    );
  });

  test("copyDir", () => {
    const testPath = "test/my_test/again_a_test/file.js";
    const testPath2 = "test/my_test/again_a_test/file2.js";

    const fileService = new FileService(nativeService);
    fileService.copyDir(testPath, testPath2);
    expect(nativeService.copydir.sync).toHaveBeenNthCalledWith(1, testPath, testPath2, { mode: true });
  });

  test("readFileSync", () => {});

  test("getSubDirs", () => {});

  test("newDir", () => {});

  test("writeFile", () => {});

  test("writeFileSync", () => {});

  test("iniWrite", () => {});

  test("iniWriteSync", () => {});

  test("replaceWriteSync", () => {});

  test("iniParse", () => {});

  test("iniParseSync", () => {});

  test("encryptText", () => {});

  test("decryptText", () => {});
});
