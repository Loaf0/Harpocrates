import * as crypto from 'crypto'
import * as eccrypto from 'eccrypto'

const b64 = 'base64url'

/**
 * Generate the EC key pair
 * @param {String} password User chosen password (UTF8)
 * @returns {Object} Key pair
 */
const createKeys = (password) => {
    const privateKey = eccrypto.generatePrivate();
    const publicKey = eccrypto.getPublic(privateKey).toString(b64);
    const passwordHash = crypto.createHash('sha256').update(password).digest();

    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', passwordHash, iv);
    const encryptedPrivateKey = Buffer.concat([cipher.update(privateKey), cipher.final()]);
    const tag = cipher.getAuthTag().toString(b64);

    // format: privateKey$$authTag$$IV
    const encryptedPrivateKeyIV = `${encryptedPrivateKey.toString(b64)}$$${tag}$$${iv.toString(b64)}`;
    return { publicKey, encryptedPrivateKeyIV };
}

/**
 * Takes an encrypted private key and a password to decrypt the private key
 * @param {String} password User chosen password (UTF8)
 * @param {String} encryptedPrivateKeyIV Private key in format (base64$$base64$$base64)
 * @returns {String} User decrypted private key (base64)
 */
const decryptPrivateKey = (password, encryptedPrivateKeyIV) => {
    const passwordHash = crypto.createHash('sha256').update(password).digest();
    const [encryptedPrivateKey, tag, iv] = encryptedPrivateKeyIV.split('$$');

    const decipher = crypto.createDecipheriv('aes-256-gcm', passwordHash, Buffer.from(iv, b64));
    decipher.setAuthTag(Buffer.from(tag, b64));

    const rawPrivateKey = Buffer.concat([decipher.update(encryptedPrivateKey, b64), decipher.final()]);
    return rawPrivateKey.toString(b64);
}

/**
 * Format ECIES object properties to either Base64 or to a Buffer
 * @param {eccrypto.Ecies} rawECIES ECIES JS Object
 * @param {('base64url'|'Buffer')} encode Encoding to convert
 * @returns {eccrypto.Ecies} Converted ECIES
 */
const formatECIES = (rawECIES, encode) => {
    for (const key in rawECIES) {
        // Encode properties in base64
        if (encode === b64) {
            rawECIES[key] = Buffer.from(rawECIES[key]).toString(encode); continue;
        }
        // else Encode to Buffer
        rawECIES[key] = Buffer.from(rawECIES[key], b64);
    }
    return rawECIES;
}

/**
 * Encrypts a plaintext message with chosen contact public key
 * @param {String} publicKey Contact public key (base64)
 * @param {String} plainText Message to encrypt (UTF-8) 
 * @returns {Promise<String>} CipherText with prams (base64)
 */
const encryptMessage = async (publicKey, plainText) => {
    const ecies = await eccrypto.encrypt(Buffer.from(publicKey, b64), Buffer.from(plainText, 'utf8'));
    return Buffer.from(JSON.stringify(formatECIES(ecies, b64)), 'utf8').toString(b64);
}

/**
 * Decrypts a ciphertext message with user private key
 * @param {String} rawPrivateKey User decrypted private key (base64)
 * @param {String} encryptedMessage Ciphertext to decrypt (UTF-8)
 * @returns {Promise<String>} Plaintext message (UTF-8)
 */
const decryptMessage = async (rawPrivateKey, encryptedMessage) => {
    const ecies = formatECIES(JSON.parse(Buffer.from(encryptedMessage, b64).toString('utf8')), 'Buffer');
    return (await eccrypto.decrypt(Buffer.from(rawPrivateKey, b64), ecies)).toString('utf8');
}

const test = async () => {
    const bobKeys = createKeys("secretpassword1");
    const aliceKeys = createKeys("secretpassword2");

    const messageToSend = "Hello Alice!";
    const bobMessage = await encryptMessage(aliceKeys.publicKey, messageToSend);

    const aliceRawPrivateKey = decryptPrivateKey("secretpassword2", aliceKeys.encryptedPrivateKeyIV);
    const messageReceived = await decryptMessage(aliceRawPrivateKey, bobMessage);

    const didTestPass = messageToSend === messageReceived;
    console.log(`Test Passed? ${didTestPass}`);
}

test();


