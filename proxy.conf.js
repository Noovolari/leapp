const PROXY_CONFIG = [
  {
    bypass: false,
    context: [
      '**',
    ],
    target: 'http://34.242.151.101:3128',
    secure: false
  }
];
module.exports = PROXY_CONFIG;
