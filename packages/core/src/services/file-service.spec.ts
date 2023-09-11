import { jest, describe, test, expect } from "@jest/globals";
import { FileService } from "./file-service";

const truePathLib = require("path");
const cryptoJS = require("crypto-js");

describe("File Service", () => {
  const homedir = "homedir-path";
  const existsPath = "path";
  const fakePath = "fake-path";

  let newName;

  let directories: { isDirectory: () => boolean; name: string }[] = [];

  cryptoJS.AES.encrypt = jest.fn((_text: any, _machineId) => _text.trim() + "-encrypted");
  cryptoJS.AES.decrypt = jest.fn((_text: any, _machineId) => _text.trim() + "-decrypted");
  cryptoJS.enc.Utf8 = "utf-8";

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
      removeSync: jest.fn((_file) => {}),
      renameSync: jest.fn((_name, _newName) => (newName = _newName)),
      readFileSync: jest.fn((_filePath, _opt: { encoding: "utf-8" }) => "[config]\nfake-key=fake-value\n"),
      readdirSync: jest.fn((_source, _opt: { withFileTypes: true }) => directories),
      mkdirSync: jest.fn((_path, _options) => {}),
    },
    copydir: {
      sync: jest.fn((_source, _target, _opt: { mode: true }) => {}),
    },
    ini: {
      stringify: jest.fn((_content) => JSON.stringify(_content)),
      parse: jest.fn((_content) => JSON.stringify(_content)),
    },
    machineId: "fake-machine-id",
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

  test("copyDir", () => {
    const testPath = "test/my_test/again_a_test/file.js";
    const testPath2 = "test/my_test/again_a_test/file2.js";

    const fileService = new FileService(nativeService);
    fileService.copyDir(testPath, testPath2);
    expect(nativeService.copydir.sync).toHaveBeenNthCalledWith(1, testPath, testPath2, { mode: true });
  });

  test("readFileSync", () => {
    const testPath = "test/my_test/again_a_test/file.js";

    const fileService = new FileService(nativeService);
    fileService.readFileSync(testPath);
    expect(nativeService.fs.readFileSync).toHaveBeenNthCalledWith(1, testPath, { encoding: "utf-8" });
  });

  test("getSubDirs", () => {
    const source = "fake-source";
    directories = [
      {
        isDirectory: () => false,
        name: "fake-directory-1",
      },
      {
        isDirectory: () => true,
        name: "fake-directory-2",
      },
    ];
    const fileService = new FileService(nativeService);
    const result = fileService.getSubDirs(source);
    expect(result).toStrictEqual(["fake-directory-2"]);
    expect(nativeService.fs.readdirSync).toHaveBeenCalledTimes(1);
    directories = [
      {
        isDirectory: () => false,
        name: "fake-directory-1",
      },
    ];
    const result2 = fileService.getSubDirs(source);
    expect(result2).toStrictEqual([]);
  });

  test("newDir", () => {
    const testPath = "test/my_test/again_a_test/file.js";
    const fileService = new FileService(nativeService);
    fileService.newDir(testPath, { recursive: true });
    expect(nativeService.fs.mkdirSync).toHaveBeenCalledTimes(1);
  });

  test("writeFileSync", () => {
    const data = "fake-content";
    const newPath = "new-path";
    const fileService = new FileService(nativeService);
    fileService.writeFileSync(newPath, data);
    expect(nativeService.fs.writeFileSync).toHaveBeenNthCalledWith(1, newPath, data);
  });

  test("writeFileSyncWithOptions", () => {
    const data = "fake-content";
    const newPath = "new-path";
    const options = { mode: "600" };
    const fileService = new FileService(nativeService);
    fileService.writeFileSyncWithOptions(newPath, data, options);
    expect(nativeService.fs.writeFileSync).toHaveBeenCalledWith(newPath, data, options);
  });

  test("removeFileSync, if file exists", () => {
    const path = "path";
    const fileService = new FileService(nativeService);
    fileService.removeFileSync(path);
    expect(nativeService.fs.removeSync).toHaveBeenNthCalledWith(1, path);
  });

  test("iniWriteSync", () => {
    const content = {
      key1: {
        subkey1: "",
        subkey2: "null",
        subkey3: "fake-value-1",
      },
      key2: {
        subkey4: undefined,
        subkey5: "fake-value-2",
        subkey6: null,
        subkey7: "fake-value-3",
      },
      key3: {
        subkey8: "fake-value-4",
        subkey9: "fake-value-5",
      },
    };
    const oldObject = { fakeKey: "fake-value" };
    const filePath = "new-path";
    const fileService = new FileService(nativeService);
    fileService.writeFileSync = jest.fn();
    fileService.iniParseSync = jest.fn(() => oldObject);
    fileService.iniWriteSync(filePath, content);
    expect(content).toStrictEqual({
      key1: {
        subkey3: "fake-value-1",
      },
      key2: {
        subkey5: "fake-value-2",
        subkey7: "fake-value-3",
      },
      key3: {
        subkey8: "fake-value-4",
        subkey9: "fake-value-5",
      },
    });
    expect(fileService.iniParseSync).toHaveBeenCalled();
    expect(fileService.iniParseSync).toHaveBeenCalledWith(filePath);
    expect(fileService.writeFileSync).toHaveBeenCalledWith(
      filePath,
      nativeService.ini.stringify({
        fakeKey: "fake-value",
        key1: {
          subkey3: "fake-value-1",
        },
        key2: {
          subkey5: "fake-value-2",
          subkey7: "fake-value-3",
        },
        key3: {
          subkey8: "fake-value-4",
          subkey9: "fake-value-5",
        },
      })
    );
  });

  test("replaceWriteSync", () => {
    const content = {
      key1: {
        subkey1: "",
        subkey2: "null",
        subkey3: "fake-value-1",
      },
      key2: {
        subkey4: undefined,
        subkey5: "fake-value-2",
        subkey6: null,
        subkey7: "fake-value-3",
      },
      key3: {
        subkey8: "fake-value-4",
        subkey9: "fake-value-5",
      },
    };
    const filePath = "new-path";
    const fileService = new FileService(nativeService);
    fileService.writeFileSync = jest.fn();
    fileService.replaceWriteSync(filePath, content);
    expect(content).toStrictEqual({
      key1: {
        subkey3: "fake-value-1",
      },
      key2: {
        subkey5: "fake-value-2",
        subkey7: "fake-value-3",
      },
      key3: {
        subkey8: "fake-value-4",
        subkey9: "fake-value-5",
      },
    });
    expect(fileService.writeFileSync).toHaveBeenCalledTimes(1);
    expect(fileService.writeFileSync).toHaveBeenCalledWith(filePath, nativeService.ini.stringify(content));
  });

  test("iniParseSync", () => {
    const filePath = "file-path";
    const fileService = new FileService(nativeService);
    fileService.readFileSync = jest.fn(() => "fake-content");
    fileService.iniParseSync(filePath);
    expect(fileService.readFileSync).toHaveBeenCalled();
    expect(nativeService.ini.parse).toHaveBeenCalledWith("fake-content");
  });

  test("encryptText", () => {
    const text = " fake-text ";
    const fileService = new FileService(nativeService);
    fileService.aesKey = "fake-key";
    const result = fileService.encryptText(text);
    expect(cryptoJS.AES.encrypt).toHaveBeenCalledWith(text.trim(), "fake-key");
    expect(result).toEqual("fake-text-encrypted");
  });

  test("decryptText", () => {
    const text = " fake-text ";
    const fileService = new FileService(nativeService);
    fileService.aesKey = "fake-key";
    const result = fileService.decryptText(text);
    expect(cryptoJS.AES.decrypt).toHaveBeenCalledWith(text.trim(), "fake-key");
    expect(result).toEqual("fake-text-decrypted");
  });
});
