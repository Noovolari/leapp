// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.


const environment = {
  appName: 'Leapp',
  sessionDuration: 1200,
  lockFileDestination: '',
  python3Version: '3.4.0',
  production: false,
  credentialsDestination: '.aws/credentials',
  apiGateway: {
    url: 'https://eddie-manager-apis.dev.noovolari.com/',
    allEndpoint: '/all',
    tosApiG: '/term-of-service',
    adminToolApiG: '/admin-tools',
    adminEndpoint: '/administrator',
    ecsApiG: '/ecs',
    transfersApiG: '/transfers',
    authUrl: 'auth_urls',
    getUserRoleMapping: 'configurations/get'
  },
  cognito: {
    url: 'https://eddie-manager-dev.auth.eu-west-1.amazoncognito.com/oauth2/',
    responseType: 'code',
    clientId: '570umacgimm0jodd2p0lpbt29o',
    scope: 'openid&profile&email',
    state: 'af5255eb-c597-48a5-937a-fec443c47e50',
    callback: 'https://eddie-manager-apis.dev.noovolari.com/callbacks/get'
  },
  customerly: {
    appId: '78998c3a'
  }
};

environment.lockFileDestination = `.Leapp/Leapp-lock.json`;
export { environment };
