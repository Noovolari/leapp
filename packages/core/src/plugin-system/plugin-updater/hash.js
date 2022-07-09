const { hashElement } = require('folder-hash');

const options = {
  files: { include: ['signature'] },
};

console.log('Creating a hash over the current folder:');
hashElement('leapp-helloworld', options)
  .then(hash => {
    console.log(hash.toString());
  })
  .catch(error => {
    return console.error('hashing failed:', error);
  });
