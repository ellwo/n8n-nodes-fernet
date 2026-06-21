const assert = require('node:assert/strict');
const test = require('node:test');

const { decryptFernet, encryptFernet } = require('../dist/nodes/Fernet/Fernet.crypto.js');

const key = 'DdivR60zj0gvL-6PG1nAj8SwSvyHW0SVxNI3JSvdGLE=';

test('encrypts and decrypts Fernet text', () => {
	const token = encryptFernet('hello from n8n', key);

	assert.match(token, /^gAAAAA/);
	assert.equal(decryptFernet(token, key), 'hello from n8n');
});

test('rejects tokens signed with a different key', () => {
	const otherKey = 'Brxd-7fAiRQFYz2eI81ZNzCzJwf7BjAsMjtx-_KH5wo=';
	const token = encryptFernet('secret', key);

	assert.throws(() => decryptFernet(token, otherKey), /signature/i);
});
