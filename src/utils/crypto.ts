// utils/crypto.ts
// Node.js crypto module for backend usage
// IMPORTANT: This file should ONLY be imported in backend code (Vercel Serverless Functions)
// Do not import this in React components directly to avoid leaking the secret key or bringing large crypto libs to the frontend.

import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';

// Gets the key from environment and ensures it's 32 bytes
const getEncryptionKey = (): Buffer => {
    const keyStr = process.env.ENCRYPTION_KEY || 'default_32_byte_key_for_dev_only_'; // 32 chars
    // If the key is hex, parse it, otherwise pad/slice it to 32 bytes
    if (/^[0-9a-fA-F]{64}$/.test(keyStr)) {
        return Buffer.from(keyStr, 'hex');
    }
    const keyBuf = Buffer.alloc(32);
    Buffer.from(keyStr, 'utf8').copy(keyBuf);
    return keyBuf;
};

export const encrypt = (text: string): string => {
    if (!text) return text;
    try {
        const iv = crypto.randomBytes(16);
        const key = getEncryptionKey();
        const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return `${iv.toString('hex')}:${encrypted}`;
    } catch (e) {
        console.error("Encryption error:", e);
        throw new Error("Failed to encrypt data");
    }
};

export const decrypt = (text: string): string => {
    if (!text || !text.includes(':')) return text;
    try {
        const textParts = text.split(':');
        const iv = Buffer.from(textParts.shift()!, 'hex');
        const encryptedText = Buffer.from(textParts.join(':'), 'hex');
        const key = getEncryptionKey();
        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        let decrypted = decipher.update(encryptedText, undefined, 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (e) {
        console.error("Decryption error:", e);
        return "[DECRYPTION_FAILED]";
    }
};
