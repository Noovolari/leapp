require('dotenv').config();
const { notarize } = require('electron-notarize');

exports.default = async function notarizing(context) {
  try {
    console.log("Starting notarization...")
    console.time();
    const {electronPlatformName, appOutDir} = context;
    if (electronPlatformName !== 'darwin') {
      return;
    }

    const appName = context.packager.appInfo.productFilename;

    return await notarize({
      appBundleId: 'com.noovolari.leapp',
      appPath: `${appOutDir}/${appName}.app`,
      appleId: "mobile@besharp.it",
      appleIdPassword: process.env.APPLE_NOTARISATION_PASSWORD ? process.env.APPLE_NOTARISATION_PASSWORD :
        "@keychain:Leapp",
    });
  } finally {
    console.log("End of notarization")
    console.timeEnd()
  }
};
