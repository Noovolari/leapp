module.exports = async function compileFunction(path, shellJs, target) {
  const desktopAppModulePath = path.join(__dirname, '..')
  shellJs.cd(desktopAppModulePath)

  let result = shellJs.exec(`ng build --${target} --base-href ./`)
  if (result.code !== 0) {
    throw new Error(result.stderr)
  }

  // Step to inject debug id and upload Sentry maps to Online service
  result = shellJs.exec('/usr/local/bin/sentry-cli sourcemaps inject dist/leapp-client');
  if (result.code !== 0) {
    throw new Error(result.stderr)
  }

  const org = 'gushior';
  const project = 'javascript-angular';

  result = shellJs.exec('cat .sentry-token');
  if (result.code !== 0) {
    throw new Error(result.stderr);
  }
  const token = result.stdout;

  const readPackageJsonFunction = require('../../../gushio/read-package-json-func');
  const desktopAppPackage = await readPackageJsonFunction(path, "desktop-app");
  const release = desktopAppPackage["version"];

  result = shellJs.exec(`/usr/local/bin/sentry-cli sourcemaps --org '${org}' --project '${project}' --auth-token '${token}' --release '${release}' upload dist/leapp-client`);
  if (result.code !== 0) {
    throw new Error(result.stderr)
  }

  result = shellJs.exec('tsc --p electron')
  if (result.code !== 0) {
    throw new Error(result.stderr)
  }
}
