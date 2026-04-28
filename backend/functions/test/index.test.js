const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('build emits core trigger artifacts', () => {
  const onUserResponsePath = path.resolve(__dirname, '../lib/triggers/onUserResponse.js');
  const onExternalDataPath = path.resolve(
    __dirname,
    '../lib/triggers/onExternalDataIngestion.js',
  );

  assert.equal(fs.existsSync(onUserResponsePath), true, 'Expected onUserResponse build artifact');
  assert.equal(
    fs.existsSync(onExternalDataPath),
    true,
    'Expected onExternalDataIngestion build artifact',
  );
});
