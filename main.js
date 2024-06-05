import { app, BrowserWindow, ipcMain, dialog } from 'electron/main';
import { WebSocket, WebSocketServer } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import * as fs from 'fs'
import { createPasswordHash, createKeys, decryptPrivateKey } from './security.cjs'


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const userdataFile = path.join(app.getPath('userData'), 'userdata.json')

const wss = new WebSocketServer({ port: 37095 });
let ws;

wss.on('connection', (ws) => {
    ws.on('error', console.error);

    ws.on('message', (data) => {

    });

    // send current user contact info
    ws.send(JSON.stringify({
        'ipAddress': '',
        'displayName': '',
        'pubKey': ''
    }));
});

const attemptConnection = (address) => {
    ws = new WebSocket(`ws://${address}`);

    // client timeout
    ws.on('error', console.error);

    // connection to server successful
    ws.on('open', () => {

    });

    // received data from server
    ws.on('message', (data) => {

    });
}

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 900,
        height: 900,
        icon: path.join(__dirname, 'icon.png'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    });

    // mainWindow.setMenu(null);
    mainWindow.resizable = false;
    mainWindow.loadFile('pages/index.html');
}

// wow- the amount of test cases
const fileExists = async path => !!(await fs.promises.stat(path).catch(e => false));
async function doesUserExist() {
    const userdataFileExist = await fileExists(userdataFile)
    if (!userdataFileExist) return false

    const userdataRaw = await fs.promises.readFile(userdataFile).catch(() => { return false });
    try {
        const userdataJson = JSON.parse(userdataRaw)
        if (userdataJson.displayName === undefined || userdataJson.displayName === "") return false;
        if (userdataJson.publicKey === undefined || userdataJson.publicKey === "") return false;
        if (userdataJson.privateKey === undefined || userdataJson.privateKey === "") return false;
        if (userdataJson.passwordHash === undefined || userdataJson.passwordHash === "") return false;

        return true;
    } catch(err) {
        return false;
    }
}

async function getUserData() {
    const userdataRaw = await fs.promises.readFile(userdataFile).catch(() => { return false });
    const userdataJson = JSON.parse(userdataRaw);
    return userdataJson;
}

async function createPasswordHashHex(_event, password) {
    return createPasswordHash(password).toString('hex');
}

async function createNewUser(_event, displayName, password) {
    const passwordHash = createPasswordHash(password).toString('hex');
    const keys = createKeys(password);
    const userdata = {
        displayName,
        publicKey: keys.publicKey,
        privateKey: keys.encryptedPrivateKeyIV,
        passwordHash
    };

    // save userdata
    fs.writeFileSync(userdataFile, JSON.stringify(userdata));

    // setting first session, decrypt private key
    userdata.privateKey = decryptPrivateKey(password, keys.encryptedPrivateKeyIV);
    return userdata;
}

app.whenReady().then(async() => {
    createWindow();

    // listen for renderer events
    ipcMain.handle('dialog:doesUserExist', doesUserExist);
    ipcMain.handle('dialog:getUserData', getUserData);
    ipcMain.handle('dialog:createNewUser', createNewUser);
    ipcMain.handle('dialog:createPasswordHash', createPasswordHashHex);

    // retry to create window
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

// quit the app once window closes
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
