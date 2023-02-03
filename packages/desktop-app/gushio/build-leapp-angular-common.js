module.exports = {
  cli: {
    name: 'build-leapp-angular-common',
    description: 'Move leapp-angular-common from a local leapp-team project and build it',
    version: '0.1',
  },
  run: async (_args) => {
    const shellJs = await gushio.import("shelljs");
    const path = await gushio.import("path");

    try {
      console.log(`copying leapp-angular-common into leapp/packages/desktop-app...`);
      shellJs.cd(path.join(__dirname, '..'));
      shellJs.cp('-R', path.join(__dirname, "../../../../leapp-team/packages/frontend/projects"), path.join(__dirname, "../projects"));

      console.log(`building leapp-angular-common...`);
      const result = shellJs.exec("ng build leapp-angular-common");
      if (result.code !== 0) {
        throw new Error(result.stderr)
      }
    } catch (e) {
      e.message = e.stack.red
      throw e
    }
  },
}
