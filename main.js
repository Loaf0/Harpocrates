import { app, BrowserWindow, ipcMain } from 'electron/main';
// import { WebSocket, WebSocketServer } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import * as fs from 'fs';
import { createPasswordHash, createKeys, decryptPrivateKey, changePrivateKeyPassword, encryptMessage, decryptMessage } from './security.cjs'


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const userdataFile = path.join(app.getPath("userData"), "userdata.json");
const contactsFile = path.join(app.getPath("userData"), "contacts");

// const wss = new WebSocketServer({ port: 37095 });
// let ws;

// wss.on('connection', (ws) => {
//     ws.on('error', console.error);

//     ws.on('message', (data) => {

//     });

//     // send current user contact info
//     ws.send(JSON.stringify({
//         'ipAddress': '',
//         'displayName': '',
//         'pubKey': ''
//     }));
// });

// const attemptConnection = (address) => {
//     ws = new WebSocket(`ws://${address}`);

//     // client timeout
//     ws.on('error', console.error);

//     // connection to server successful
//     ws.on('open', () => {

//     });

//     // received data from server
//     ws.on('message', (data) => {

//     });
// }

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 900,
        height: 900,
        icon: path.join(__dirname, "icon.png"),
        webPreferences: {
            preload: path.join(__dirname, "preload.js")
        }
    });

    // Electron Window Settings
    mainWindow.setMenu(null);
    mainWindow.resizable = false;
    mainWindow.webContents.openDevTools();
    mainWindow.loadFile("pages/index.html");
}

// wow- the amount of test cases
const fileExists = async path => !!(await fs.promises.stat(path).catch(() => false));
async function doesUserExist() {
    const userdataFileExist = await fileExists(userdataFile);
    if (!userdataFileExist) return false;

    const userdataRaw = await fs.promises.readFile(userdataFile).catch(() => { return false });
    try {
        const userdataJson = JSON.parse(userdataRaw);
        if (userdataJson.displayName === undefined || userdataJson.displayName === "") return false;
        if (userdataJson.publicKey === undefined || userdataJson.publicKey === "") return false;
        if (userdataJson.privateKey === undefined || userdataJson.privateKey === "") return false;
        if (userdataJson.passwordHash === undefined || userdataJson.passwordHash === "") return false;

        return true;
    } catch(err) {
        if (err) console.error(err);
        return false;
    }
}

async function getUserData() {
    if (!await doesUserExist()) return null;
    const userdataRaw = await fs.promises.readFile(userdataFile).catch(() => { return false });
    const userdataJson = JSON.parse(userdataRaw);
    return userdataJson;
}

async function createPasswordHashHex(_event, password) {
    return createPasswordHash(password).toString("hex");
}

async function createNewUser(_event, displayName, password) {
    const passwordHash = createPasswordHash(password).toString("hex");
    const keys = createKeys(password);
    const userdata = {
        displayName,
        publicKey: keys.publicKey,
        privateKey: keys.encryptedPrivateKeyIV,
        passwordHash
    }

    // Write UserData to disk
    fs.writeFileSync(userdataFile, JSON.stringify(userdata));

    // Setting first session, decrypt private key
    userdata.privateKey = decryptPrivateKey(password, keys.encryptedPrivateKeyIV);
    return userdata;
}

async function decryptPrivateKeyHandle(_event, encryptedPrivateKey, password) {
    return decryptPrivateKey(password, encryptedPrivateKey);
}

async function changePassword(_event, currentPassword, newPassword, currentPrivateKey) {
    const userdata = await getUserData();
    const newPrivateKey = changePrivateKeyPassword(currentPassword, newPassword, currentPrivateKey);
    const newPasswordHash = createPasswordHash(newPassword).toString("hex");

    // Write updated UserData to disk
    userdata.privateKey = newPrivateKey;
    userdata.passwordHash =  newPasswordHash;
    fs.writeFileSync(userdataFile, JSON.stringify(userdata));

    // Setting first session, decrypt private key
    userdata.privateKey = decryptPrivateKey(newPassword, userdata.privateKey);
    return userdata;
}

async function changeDisplayName(_event, newDisplayName) {
    const userdata = await getUserData();
    userdata.displayName = newDisplayName;
    fs.writeFileSync(userdataFile, JSON.stringify(userdata));

    return userdata;
}

async function getContactList(_event, privateKey) {
    const contactsFileExist = await fileExists(contactsFile);
    if (!contactsFileExist) return [];

    // Decrypt contacts
    const contactsRaw = await fs.promises.readFile(contactsFile).catch(() => { return false });
    const decryptedContacts = await decryptMessage(privateKey, contactsRaw.toString('utf8'));
    const contacts = JSON.parse(decryptedContacts);

    return contacts;
}

async function saveNewContact(_event, contact, publicKey, privateKey) {
    // Check for contacts file
    const contactsFileExist = await fileExists(contactsFile);
    if (!contactsFileExist) {
        const newContactsData = JSON.stringify([contact]);
        const contactsEncrypted = await encryptMessage(publicKey, newContactsData);

        fs.writeFileSync(contactsFile, contactsEncrypted);
        return newContactsData;
    }

    // If client has existing contacts, add on to it
    const contactsRaw = await fs.promises.readFile(contactsFile).catch(() => { return false });
    const decryptedContacts = await decryptMessage(privateKey, contactsRaw.toString('utf8'));
    const contacts = JSON.parse(decryptedContacts);
    contacts.push(contact);

    // Re-Encrypt and save
    const contactsEncrypted = await encryptMessage(publicKey, JSON.stringify(contacts));
    fs.writeFileSync(contactsFile, contactsEncrypted);

    return contacts;
}

app.whenReady().then(async() => {
    createWindow();

    // Listen for renderer events
    ipcMain.handle("dialog:doesUserExist", doesUserExist);
    ipcMain.handle("dialog:getUserData", getUserData);
    ipcMain.handle("dialog:createNewUser", createNewUser);
    ipcMain.handle("dialog:createPasswordHash", createPasswordHashHex);
    ipcMain.handle("dialog:changePassword", changePassword);
    ipcMain.handle("dialog:decryptPrivateKey", decryptPrivateKeyHandle);
    ipcMain.handle("dialog:changeDisplayName", changeDisplayName);
    ipcMain.handle("dialog:saveNewContact", saveNewContact);

    // Retry to create window
    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

// Quit the app once window closes
app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});
