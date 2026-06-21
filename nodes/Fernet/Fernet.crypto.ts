import { createCipheriv, createDecipheriv, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

const VERSION = 0x80;
const IV_LENGTH = 16;
const HMAC_LENGTH = 32;
const SIGNING_KEY_LENGTH = 16;
const ENCRYPTION_KEY_LENGTH = 16;

function decodeBase64Url(value: string): Buffer {
	return Buffer.from(value, 'base64url');
}

function splitKey(key: string): { signingKey: Buffer; encryptionKey: Buffer } {
	const decodedKey = decodeBase64Url(key);

	if (decodedKey.length !== SIGNING_KEY_LENGTH + ENCRYPTION_KEY_LENGTH) {
		throw new Error('Fernet key must decode to 32 bytes');
	}

	return {
		signingKey: decodedKey.subarray(0, SIGNING_KEY_LENGTH),
		encryptionKey: decodedKey.subarray(SIGNING_KEY_LENGTH),
	};
}

function sign(data: Buffer, signingKey: Buffer): Buffer {
	return createHmac('sha256', signingKey).update(data).digest();
}

function assertValidSignature(body: Buffer, signature: Buffer, signingKey: Buffer): void {
	const expectedSignature = sign(body, signingKey);

	if (signature.length !== expectedSignature.length || !timingSafeEqual(signature, expectedSignature)) {
		throw new Error('Invalid Fernet token signature');
	}
}

export function encryptFernet(plainText: string, key: string): string {
	const { signingKey, encryptionKey } = splitKey(key);
	const version = Buffer.from([VERSION]);
	const timestamp = Buffer.alloc(8);
	timestamp.writeUInt32BE(Math.floor(Date.now() / 1000), 4);

	const iv = randomBytes(IV_LENGTH);
	const cipher = createCipheriv('aes-128-cbc', encryptionKey, iv);
	const cipherText = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
	const body = Buffer.concat([version, timestamp, iv, cipherText]);
	const signature = sign(body, signingKey);

	return Buffer.concat([body, signature]).toString('base64url');
}

export function decryptFernet(token: string, key: string): string {
	const { signingKey, encryptionKey } = splitKey(key);
	const decodedToken = decodeBase64Url(token);
	const minimumLength = 1 + 8 + IV_LENGTH + HMAC_LENGTH;

	if (decodedToken.length <= minimumLength) {
		throw new Error('Invalid Fernet token length');
	}

	if (decodedToken[0] !== VERSION) {
		throw new Error('Invalid Fernet token version');
	}

	const body = decodedToken.subarray(0, decodedToken.length - HMAC_LENGTH);
	const signature = decodedToken.subarray(decodedToken.length - HMAC_LENGTH);
	assertValidSignature(body, signature, signingKey);

	const iv = decodedToken.subarray(9, 9 + IV_LENGTH);
	const cipherText = decodedToken.subarray(9 + IV_LENGTH, decodedToken.length - HMAC_LENGTH);
	const decipher = createDecipheriv('aes-128-cbc', encryptionKey, iv);

	return Buffer.concat([decipher.update(cipherText), decipher.final()]).toString('utf8');
}
