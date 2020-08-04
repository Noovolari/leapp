// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

// TODO: Sensible data here -> Eddie manager, client-id etc.
const environment = {
  appName: 'Leapp',
  sessionDuration: 1200,
  lockFileDestination: '',
  python3Version: '3.4.0',
  production: true,
  credentialsDestination: '.aws/credentials',
  apiGateway: {
    url: 'https://eddie-manager-apis.prod.noovolari.com/',
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
    url: 'https://eddie-manager-prod.auth.eu-west-1.amazoncognito.com/oauth2/',
    responseType: 'code',
    clientId: '4dn7kdu3e9cktvumb2b2c3t8t5',
    scope: 'openid&profile&email',
    state: 'b697ad4a-2cf6-4729-a5d2-eab2eff7b50a',
    callback: 'https://eddie-manager-apis.prod.noovolari.com/callbacks/get'
  },
  customerly: {
    appId: '78998c3a'
  }
};

environment.lockFileDestination = `.Leapp/Leapp-lock.json`;
export {environment};

