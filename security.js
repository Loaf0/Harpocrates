import * as crypto from 'crypto'
import * as eccrypto from 'eccrypto'

// utf8
const createKeys = (password) => {
    const privateKey = eccrypto.generatePrivate();
    const publicKey = eccrypto.getPublic(privateKey).toString('base64url');
    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');

    const iv = crypto.randomBytes(16).toString('base64url')
    const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(passwordHash, 'hex'), Buffer.from(iv, 'base64url'));
    let encryptedPrivateKey = cipher.update(privateKey.toString('hex'), 'hex', 'base64url');
    encryptedPrivateKey += cipher.final('base64url')
    const tag = cipher.getAuthTag().toString('base64url')

    const encryptedPrivateKeyIV = `${encryptedPrivateKey}$$${tag}$$${iv}`
    return { publicKey, encryptedPrivateKeyIV }
}

/**
 * 
 * @param {String} password 
 * @param {String} encryptedPrivateKeyIV 
 * @returns {String} base64
 */
const decryptPrivateKey = (password, encryptedPrivateKeyIV) => {
    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
    const [encryptedPrivateKey, tag, iv] = encryptedPrivateKeyIV.split('$$')

    const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(passwordHash, 'hex'), Buffer.from(iv, 'base64url'))
    decipher.setAuthTag(Buffer.from(tag, 'base64url'))

    let rawPrivateKey = decipher.update(encryptedPrivateKey, 'base64url', 'base64url')
    rawPrivateKey += decipher.final('base64url')
    return rawPrivateKey
}

/**
 * Encrypts an plaintext message with contacts public key
 * @param {String} publicKey Base64
 * @param {String} rawMessage UTF-8 
 * @returns {Promise<String>} Base64
 */
const encryptMessage = async (publicKey, rawMessage) => {
    const ecies = await eccrypto.encrypt(Buffer.from(publicKey, 'base64url'), Buffer.from(rawMessage, 'utf-8'))
    return Buffer.from(JSON.stringify(formatECIES(ecies, 'base64url')), 'utf8').toString('base64url')
}

/**
 * TODO: too messy
 * @param {eccrypto.Ecies} rawECIES  
 * @param {('base64url'|'Buffer')} encode
 */
const formatECIES = (rawECIES, encode) => {
    if (encode === 'base64url') {
        rawECIES.iv = Buffer.from(rawECIES.iv).toString(encode)
        rawECIES.ephemPublicKey = Buffer.from(rawECIES.ephemPublicKey).toString(encode)
        rawECIES.ciphertext = Buffer.from(rawECIES.ciphertext).toString(encode)
        rawECIES.mac = Buffer.from(rawECIES.mac).toString(encode)
        return rawECIES
    }

    rawECIES.iv = Buffer.from(rawECIES.iv, 'base64url')
    rawECIES.ephemPublicKey = Buffer.from(rawECIES.ephemPublicKey, 'base64url')
    rawECIES.ciphertext = Buffer.from(rawECIES.ciphertext, 'base64url')
    rawECIES.mac = Buffer.from(rawECIES.mac, 'base64url')
    return rawECIES
}

/**
 * 
 * @param {String} rawPrivateKey 
 * @param {String} encryptedMessage 
 */
const decryptMessage = async (rawPrivateKey, encryptedMessage) => {
    const ecies = formatECIES(JSON.parse(Buffer.from(encryptedMessage, 'base64url').toString('utf8')), 'Buffer')
    return (await eccrypto.decrypt(Buffer.from(rawPrivateKey, 'base64url'), ecies)).toString('utf-8')
}

const test = async () => {
    const bobKeys = createKeys("secretpassword1");
    const aliceKeys = createKeys("secretpassword2");

    const messageToSend = "Hello Alice!"
    const bobMessage = await encryptMessage(aliceKeys.publicKey, messageToSend);

    const aliceRawPrivateKey = decryptPrivateKey("secretpassword2", aliceKeys.encryptedPrivateKeyIV)
    const messageReceived = await decryptMessage(aliceRawPrivateKey, bobMessage)

    const didTestPass = messageToSend === messageReceived
    console.log(`Test Passed? ${didTestPass}`)
}

test()


