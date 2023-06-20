exports.default = function windowSigning(context) {
  try {
    const path = require('path');
    const fs = require("fs");
    const shellJs = require('shelljs');
    const currentPath = shellJs.pwd().stdout;
    const version = require("../package.json").version;

    console.log(`Starting Window signing for ${version} executable...`);
    console.time();

    // credentials from ssl.com
    const USER_NAME = process.env.ESIGNER_WIN_USERNAME;
    const USER_PASSWORD = process.env.ESIGNER_WIN_PASSWORD;
    const CREDENTIAL_ID = process.env.ESIGNER_WIN_CREDENTIAL_ID;
    const USER_TOTP = process.env.ESIGNER_WIN_TOTP;

    // CodeSignTool can't sign in place without verifying the overwrite with a
    // y/m interaction so we are creating a new file in a temp directory and
    // then replacing the original file with the signed file.
    const codeSignToolPath = path.join(currentPath, "CodeSignTool-v1.2.7-windows", "CodeSignTool");
    const executablePath = context.path;
    const outputPath = path.join(currentPath, "release", "signing");

    console.log("Paths: ");
    console.log("- ", codeSignToolPath);
    console.log("- ", executablePath);
    console.log("- ", outputPath);
    console.log("Version: ", version);

    let result;

    if(!fs.existsSync(outputPath)) {
      result = shellJs.mkdir(outputPath);
    }


    result = shellJs.cd("CodeSignTool-v1.2.7-windows");
    if (result.code !== 0) {
      throw new Error(result.stderr);
    }

    const signFile = `CodeSignTool sign -input_file_path="${executablePath}" -output_dir_path="${outputPath}" -credential_id=${CREDENTIAL_ID} -username=${USER_NAME} -password=${USER_PASSWORD} -totp_secret=${USER_TOTP}`;

    result = shellJs.exec(`${signFile}`);
    if (result.code !== 0) {
      throw new Error(result.stderr);
    }

    result = shellJs.rm("-f", executablePath);
    if (result.code !== 0) {
      throw new Error(result.stderr);
    }

    result = shellJs.mv(path.join(outputPath, "*"), executablePath.substring(0, executablePath.lastIndexOf("\\")));
    if (result.code !== 0) {
      throw new Error(result.stderr);
    }

    result = shellJs.cd("..");
    if (result.code !== 0) {
      throw new Error(result.stderr);
    }

    console.log('Windows executable signed successfully');
    return result.code;
  } catch (e) {

    console.log("An error occurred while signing: ", e);
    e.message = e.stack.red;
    throw e;
  } finally {
    console.log("End of Signing.");
    console.timeEnd();
  }
};
