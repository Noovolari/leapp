import { jest, describe, test, expect } from "@jest/globals";
import { FileService } from "./file-service";

const truePathLib = require("path");
const cryptoJS = require("crypto-js");

describe("File Service", () => {
  const homedir = "homedir-path";
  const existsPath = "path";
  const fakePath = "fake-path";

  let newName;
  let callbackMock = { err: undefined, data: "data" };
  let callbackMock2 = { err: undefined, data: null };

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
      renameSync: jest.fn((_name, _newName) => (newName = _newName)),
      readFile: jest.fn((_filePath, _options, _callback: (err: any, data: string) => void) => _callback(callbackMock.err, callbackMock.data)),
      readFileSync: jest.fn((_filePath, _opt: { encoding: "utf-8" }) => "[config]\nfake-key=fake-value\n"),
      readdirSync: jest.fn((_source, _opt: { withFileTypes: true }) => directories),
      mkdirSync: jest.fn((_path, _options) => {}),
      writeFile: jest.fn((_filePath, content, _callback: (err: any, data: string) => void) => _callback(callbackMock.err, callbackMock.data)),
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

  test("writeFile", () => {
    callbackMock = { err: undefined, data: "data" };
    const testPath = "test/my_test/again_a_test/file.js";
    const fileService = new FileService(nativeService);
    fileService.writeFile(testPath, "fake-content").subscribe(
      (res) => {
        expect(res).toBe(callbackMock.data);
        expect(nativeService.fs.writeFile).toHaveBeenNthCalledWith(1, testPath, "fake-content", callbackMock);
      },
      (_err) => {}
    );
    callbackMock = { err: "error", data: undefined };
    fileService.writeFile(testPath, "fake-content").subscribe(
      (_res) => {},
      (err) => {
        expect(err).toBe(callbackMock.err);
        expect(nativeService.fs.writeFile).toHaveBeenNthCalledWith(2, testPath, "fake-content", callbackMock);
      }
    );
  });

  test("writeFileSync", () => {
    const data = "fake-content";
    const newPath = "new-path";
    const fileService = new FileService(nativeService);
    fileService.writeFileSync(newPath, data);
    expect(nativeService.fs.writeFileSync).toHaveBeenNthCalledWith(1, newPath, data);
  });

  test("iniWrite", () => {
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
    fileService.writeFile = jest.fn();
    fileService.iniWrite(filePath, content);
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
    expect(fileService.writeFile).toHaveBeenCalledTimes(1);
    expect(nativeService.ini.stringify).toHaveBeenCalledTimes(1);
    expect(nativeService.ini.stringify).toHaveBeenCalledWith(content);
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

  test("iniParse", async () => {
    callbackMock2 = { err: undefined, data: { data: "fake-data" } };
    const filePath = "new-path";
    const fileService = new FileService(nativeService);
    jest.spyOn(fileService, "readFile");
    (fileService as any).readSubscription = { unsubscribe: jest.fn() } as any;
    fileService.iniParse(filePath).subscribe(
      (res) => {
        expect(res).toBe(nativeService.ini.parse(callbackMock2.data));
        expect(fileService.readFile).toHaveBeenCalled();
        expect((fileService as any).readSubscription.unsubscribe).toHaveBeenCalled();
      },
      (_err) => {}
    );
    callbackMock2 = { err: "Error", data: undefined };
    fileService.iniParse(filePath).subscribe(
      (_res) => {},
      (err) => {
        expect(err).toBe(callbackMock2.err);
      }
    );
  });

  test("iniParseSync", () => {
    const filePath = "file-path";
    const fileService = new FileService(nativeService);
    fileService.readFileSync = jest.fn(() => "fake-content");
    fileService.iniParseSync(filePath);
    expect(fileService.readFileSync).toHaveBeenCalled();
    expect(nativeService.ini.parse).toHaveBeenNthCalledWith(1, "fake-content");
  });

  test("encryptText", () => {
    const text = " fake-text ";
    const fileService = new FileService(nativeService);
    const result = fileService.encryptText(text);
    expect(cryptoJS.AES.encrypt).toHaveBeenCalledWith(text.trim(), nativeService.machineId);
    expect(result).toEqual("fake-text-encrypted");
  });

  test("decryptText", () => {
    const text = " fake-text ";
    const fileService = new FileService(nativeService);
    const result = fileService.decryptText(text);
    expect(cryptoJS.AES.decrypt).toHaveBeenCalledWith(text.trim(), nativeService.machineId);
    expect(result).toEqual("fake-text-decrypted");
  });
});
