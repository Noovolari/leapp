require('dotenv').config();

const fs = require('fs');
const packageJson = require('../package.json');

const liteClient = fs.readFileSync('src/environments/environment.ts').toString().split('liteClient: ')[1].split(',')[0];

const filename = 'LookAuth' + (liteClient === 'true' ? ' Lite' : '');
const name = 'LookAuth' + (liteClient === 'true' ? 'Lite' : '');
const bucket = 'lookauth' + (liteClient === 'true' ? '-lite' : '') + '.clients';

// Change the version
const version = packageJson.version.split('.');
version[2] = parseInt(version[2]) + 1;
process.argv.forEach(function (val, index, array) {
  if(val === 'minor') {
    version[2] = 0;
    version[1] = parseInt(version[1]) + 1;
  }
  if(val === 'major') {
    version[2] = 0;
    version[1] = 0;
    version[0] = parseInt(version[0]) + 1;
  }
});
packageJson.version = version.join('.');


// Change the filename
packageJson.name = name;
packageJson.build.productName = filename;
packageJson.build.publish.bucket = bucket;

// Write the file again
fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 4));
return;
