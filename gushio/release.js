const FgGreen = "\x1b[32m"
const FgRed = "\x1b[31m"

module.exports = {
  deps: [
    { name: 'enquirer', version: '2.3.6' },
    { name: 'semver', version: '7.3.7' },
  ],
  cli: {
    name: "leapp-release",
    description: "This CLI guides you through the release of Leapp Core, CLI, and Desktop App.",
    version: "0.1.0",
  },
  run: async () => {
    try {
      const readPackageJsonFunction = require('./read-package-json-func');
      const path = await gushio.import('path')
      const shellJs = await gushio.import('shelljs')
      const { Select } = (await gushio.import('enquirer')).default
      shellJs.config.silent = true;

      const releaseFunctions = {
        "core": releaseCore,
        "cli": releaseCli,
        "desktop-app": releaseDesktopApp
      };
      let target;
      console.log(FgGreen, `Welcome to leapp-release script`)
      const prompt = new Select({
        name: "target",
        message: "What do you want to deploy?",
        choices: ["core", "cli", "desktop-app"]
      });
      target = await prompt.run();
      const packageJson = await readPackageJsonFunction(path, target);
      const currentVersion = packageJson["version"];

      let version = await console.input(
        {
          type: 'input',
          name: 'number',
          message: `Specify the version (current ver: ${currentVersion}):`
        },
      );
      const regex = /^([0-9]+)\.([0-9]+)\.([0-9]+)/g;
      const found = version.number.match(regex);
      if(!found) {
        throw new Error(`version ${version.number} is not a valid SemVer version.`);
      }
      await checkVersion(version.number, currentVersion);

      const releaseFunction = releaseFunctions[target];
      await releaseFunction(version.number);
    } catch(e) {
      e.message = e.stack.red;
      throw e;
    }
  },
}

async function setProEnvironment() {
  const shellJs = await gushio.import('shelljs')
  console.log(FgGreen, "npm run set-pro-environment...");
  result = shellJs.exec("npm run set-pro-environment");
  if (result.code !== 0) {
    throw new Error(result.stderr)
  }
}

async function checkVersion(wantedVersion, currentVersion) {
  const semver = (await gushio.import('semver')).default
  if(!semver.gt(wantedVersion, currentVersion)) {
    throw new Error(`the wanted version (${wantedVersion}) cannot be less than or equal to the current one (${currentVersion})`);
  }
}

async function updatePackageJsonVersion(packageName, version) {
  const readPackageJsonFunction = require('./read-package-json-func');
  const writePackageJsonFunction = require('./write-package-json-func');
  const path = await gushio.import('path')
  const packageJson = await readPackageJsonFunction(path, packageName);
  packageJson["version"] = version;
  await writePackageJsonFunction(path, packageName, packageJson);
}

async function rollbackProject(commitId, version, package) {
  const shellJs = await gushio.import('shelljs')
  console.log(FgRed, `rolling back project ${package}...`)

  package = package === "desktop-app" ? "" : `${package}-`
  console.log(FgGreen, `removing tag ${package}v${version}...`);
  let result = shellJs.exec(`git tag -d ${package}v${version}`);
  if (result.code !== 0) {
    console.log(FgRed, result.stderr)
  }

  if(commitId !== undefined) {
    console.log(FgGreen, "reset codebase to previous commit...");
    result = shellJs.exec(`git reset --hard ${commitId}`);
    if (result.code !== 0) {
      console.log(FgRed, result.stderr)
    }
  }
}

async function releaseCore(version) {
  const { Confirm } = (await gushio.import('enquirer')).default
  const path = await gushio.import('path')
  const shellJs = await gushio.import('shelljs')
  let commitId;

  try {
    shellJs.cd(path.join(__dirname, ".."))

    console.log(FgGreen, "updating Leapp Core package.json version...");
    const packageName = "core";
    await updatePackageJsonVersion(packageName, version);
    let result = shellJs.exec("git add .");
    if (result.code !== 0) {
      throw new Error(result.stderr)
    }

    console.log(FgGreen, "retrieving current commit id...");
    commitId = shellJs.exec(`git rev-parse HEAD`);
    if (result.code !== 0) {
      throw new Error(result.stderr)
    }

    console.log(FgGreen, "creating commit with updated package.json version...");
    result = shellJs.exec(`git commit -m "chore(release): release core v${version}"`);
    if (result.code !== 0) {
      throw new Error(result.stderr)
    }

    console.log(FgGreen, `creating tag core-v${version}...`);
    result = shellJs.exec(`git tag -a core-v${version} -m "release core v${version}"`);
    if (result.code !== 0) {
      throw new Error(result.stderr)
    }

    const prompt = new Confirm({
      name: 'question',
      message: 'Proceed and push? (yes: y/Y/t/T, no: n/N/f/F)'
    });

    const wantToPush = await prompt.run();

    if(wantToPush) {
      console.log(FgGreen, "pushing commit...");
      result = shellJs.exec(`git push --follow-tags`);
      if (result.code !== 0) {
        throw new Error(result.stderr)
      }
      //The pipeline starts now. The following commands are to ensure that
      //we set the pro environment and bootstrap it before releasing the CLI/DA

      console.log(FgGreen, "keep track of the release pipeline here: https://github.com/Noovolari/leapp/actions/workflows/core-ci-cd.yml")
    } else {
      await rollbackProject(commitId, version, "core");
    }
  } catch(e) {
    await rollbackProject(commitId, version, "core");
    throw e;
  }
}

async function releaseCli(version) {
  const path = await gushio.import('path')
  const { Confirm } = (await gushio.import('enquirer')).default
  const shellJs = await gushio.import('shelljs')
  let commitId;

  try {
    shellJs.cd(path.join(__dirname, ".."))

    await setProEnvironment();
    console.log(FgGreen, "updating Leapp CLI package.json version...");
    const packageName = "cli";
    await updatePackageJsonVersion(packageName, version);

    console.log(FgGreen, "running Leapp CLI prepack script...");
    shellJs.cd(path.join(__dirname, "..", "packages", "cli"))
    let result = shellJs.exec("npm run prepack");
    if (result.code !== 0) {
      throw new Error(result.stderr)
    }

    console.log(FgGreen, "running Leapp CLI prepare-docs script...");
    result = shellJs.exec("npm run prepare-docs");
    if (result.code !== 0) {
      throw new Error(result.stderr)
    }

    shellJs.cd(path.join(__dirname, ".."))

    result = shellJs.exec("git add .");
    if (result.code !== 0) {
      throw new Error(result.stderr)
    }

    console.log(FgGreen, "retrieving current commit id...");
    commitId = shellJs.exec(`git rev-parse HEAD`);
    if (result.code !== 0) {
      throw new Error(result.stderr)
    }

    console.log(FgGreen, "creating commit with updated package.json version...");
    result = shellJs.exec(`git commit -m "chore(release): release cli v${version}"`);
    if (result.code !== 0) {
      throw new Error(result.stderr)
    }

    console.log(FgGreen, `creating tag cli-v${version}...`);
    result = shellJs.exec(`git tag -a cli-v${version} -m "release cli v${version}"`);
    if (result.code !== 0) {
      throw new Error(result.stderr)
    }

    const prompt = new Confirm({
      name: 'question',
      message: 'Proceed and push? (yes: y/Y/t/T, no: n/N/f/F)'
    });

    const wantToPush = await prompt.run();

    if(wantToPush) {
      console.log(FgGreen, "pushing commit...");
      result = shellJs.exec(`git push --follow-tags`);
      if (result.code !== 0) {
        throw new Error(result.stderr)
      }

      console.log(FgGreen, "keep track of the release pipeline here: https://github.com/Noovolari/leapp/actions/workflows/cli-ci-cd.yml")
    } else {
      await rollbackProject(commitId, version, "cli");
    }
  } catch(e) {
    await rollbackProject(commitId, version, "cli");
    throw e;
  }
}

async function releaseDesktopApp(version) {
  const path = await gushio.import('path')
  const { Confirm } = (await gushio.import('enquirer')).default
  const shellJs = await gushio.import('shelljs')
  const deleteFunction = require('./delete-func')
  let commitId;

  try {
    shellJs.cd(path.join(__dirname, ".."))

    await setProEnvironment();

    const desktopAppPath = ["..", "packages", "desktop-app"];
    shellJs.cd(path.join(__dirname, ...desktopAppPath))

    console.log(FgGreen, "updating Leapp Desktop App package.json version...");
    let result = shellJs.exec(`npm run release -- --release-as ${version}`)
    if (result.code !== 0) {
      throw new Error(result.stderr)
    }

    await console.input(
      {
        type: 'input',
        name: 'continue',
        message: `Waiting for CHANGELOG.md to be modified... When the file is ready, type continue`,
        validate: (input) => input === "continue" || "You have to enter continue. Try again"
      },
    );

    await deleteFunction(path, ...desktopAppPath, "CHANGELOG.md")


    shellJs.cd(path.join(__dirname, ".."))

    result = shellJs.exec(`git tag -d v${version}`);
    if (result.code !== 0) {
      throw new Error(result.stderr)
    }

    result = shellJs.exec(`git add .`);
    if (result.code !== 0) {
      throw new Error(result.stderr)
    }

    console.log(FgGreen, "retrieving current commit id...");
    commitId = shellJs.exec(`git rev-parse HEAD`);
    if (result.code !== 0) {
      throw new Error(result.stderr)
    }

    console.log(FgGreen, "creating commit with updated package.json version...");
    result = shellJs.exec(`git commit --amend -m "chore(release): release desktop app v${version}"`);
    if (result.code !== 0) {
      throw new Error(result.stderr)
    }

    console.log(FgGreen, `creating tag v${version}...`);
    result = shellJs.exec(`git tag -a v${version} -m "release desktop app v${version}"`);
    if (result.code !== 0) {
      throw new Error(result.stderr)
    }

    const prompt = new Confirm({
      name: 'question',
      message: 'Proceed and push? (yes: y/Y/t/T, no: n/N/f/F)'
    });

    const wantToPush = await prompt.run();

    if(wantToPush) {
      console.log(FgGreen, "pushing commit...");
      result = shellJs.exec(`git push --follow-tags`);
      if (result.code !== 0) {
        throw new Error(result.stderr)
      }

      console.log(FgGreen, "keep track of the release pipeline here: https://github.com/Noovolari/leapp/actions/workflows/desktop-app-cd.yml")
    } else {
      await rollbackProject(commitId, version, "desktop-app");
    }
  } catch(e) {
    await rollbackProject(commitId, version, "desktop-app");
    throw e;
  }
}
