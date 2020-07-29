// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.


export const environment = {
  python3Version: '3.4.0',
  production: false,
  lockFileDestination: '.look-auth/look-auth-lock.json',
  allEndpoint: '/all',
  tosApiG: '/term-of-service',
  adminToolApiG: '/admin-tools',
  adminEndpoint: '/administrator',
  ecsApiG: '/ecs',
  transfersApiG: '/transfers',
  userRegistryApiG: '',
  apiGateway: {
    url: 'https://beauth-admin.besharp.net',
  },
  cognito: {
    url: '',
    autoUpdateToken: true,
    sso: {
      url: ''
    },
    userPoolId: '',
    grantType: '',
    clientId: ''

  }
};


/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
