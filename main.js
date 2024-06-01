const { app, BrowserWindow } = require('electron/main')
const path = require('node:path')
const { WebSocket, WebSocketServer } = require('ws')

const wss = new WebSocketServer({ port: 37095 })
let ws;

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 900,
        height: 900,
        icon: path.join(__dirname, 'icon.png'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    });

    mainWindow.setMenu(null);
    mainWindow.resizable = false;
    mainWindow.loadFile('index.html');
}

wss.on('connection', (ws) => {
    ws.on('error', console.error);

    ws.on('message', (data) => {

    })

    // send current user contact info
    ws.send(JSON.stringify({
        'ipAddress': '',
        'displayName': '',
        'pubKey': ''
    }))
})

const attemptConnection = (address) => {
    ws = new WebSocket(`ws://${address}`)

    // client timeout
    ws.on('error', console.error)

    // connection to server successful
    ws.on('open', () => {

    })

    // received data from server
    ws.on('message', (data) => {

    })
}

app.whenReady().then(() => {
    createWindow();

    // retry to create window
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    })
})

// quit the app once window closes
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
})
