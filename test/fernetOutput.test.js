const assert = require('node:assert/strict');
const test = require('node:test');

const { getResultJson } = require('../dist/nodes/Fernet/Fernet.output.js');

test('returns only parsed JSON inside result for decrypted JSON text', () => {
	assert.deepEqual(getResultJson('decrypt', '{"hello":"world"}'), {
		result: {
			hello: 'world',
		},
	});
});

test('returns only text inside result for decrypted plain text', () => {
	assert.deepEqual(getResultJson('decrypt', 'plain text'), {
		result: 'plain text',
	});
});

test('returns only token text inside result for encrypted data', () => {
	assert.deepEqual(getResultJson('encrypt', 'gAAAA-token'), {
		result: 'gAAAA-token',
	});
});
