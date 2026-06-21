const assert = require('node:assert/strict');
const test = require('node:test');

const { getInputText } = require('../dist/nodes/Fernet/Fernet.input.js');

test('reads input from an item JSON field', () => {
	assert.equal(getInputText('field', { token: 'abc' }, 'token'), 'abc');
});

test('uses direct text as the input value', () => {
	assert.equal(getInputText('text', {}, 'gAAAA-token'), 'gAAAA-token');
});

test('serializes direct JSON as the input value', () => {
	assert.equal(getInputText('json', {}, { hello: 'world' }), '{"hello":"world"}');
});

test('throws a useful error when selected field is missing', () => {
	assert.throws(() => getInputText('field', {}, 'missing'), /Input field "missing" is empty/);
});

test('reads nested field paths from incoming item JSON', () => {
	assert.equal(
		getInputText(
			'field',
			{
				body: {
					secrets_envelope: {
						encrypted_data: 'gAAAA-token',
					},
				},
			},
			'body.secrets_envelope.encrypted_data',
		),
		'gAAAA-token',
	);
});

test('uses resolved expression value when it is passed as a field name', () => {
	assert.equal(getInputText('field', {}, 'gAAAA-token'), 'gAAAA-token');
});
