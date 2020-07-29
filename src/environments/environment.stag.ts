// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.


const environment = {
  sessionDuration: 3600,
  liteClient: true,
  lockFileDestination: '',
  python3Version: '3.4.0',
  production: false,
  credentialsDestination: '.aws/credentials',
  apiGateway: {
    url: 'https://eddie-manager-apis.demo.noovolari.com/',
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
    url: 'https://eddie-manager-stag.auth.eu-west-1.amazoncognito.com/oauth2/',
    responseType: 'code',
    clientId: '4qf8n9h0p2r27e2rtf9i2o35hu',
    scope: 'openid&profile&email',
    state: 'c38ef916-edc1-40b8-b64f-0a9f23c67971',
    callback: 'https://eddie-manager-apis.demo.noovolari.com/callbacks/get'
  },
  customerly: {
    appId: '78998c3a'
  }
};

environment.lockFileDestination = `.LookAuth${environment.liteClient ? 'Lite' : ''}/LookAuth${environment.liteClient ? 'Lite' : ''}-lock.json`;
export {environment};
