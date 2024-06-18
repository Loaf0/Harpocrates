const { contextBridge, ipcRenderer } = require('electron');

// Expose backend functions to the DOM
contextBridge.exposeInMainWorld("electronAPI", {
    doesUserExist: () => ipcRenderer.invoke("dialog:doesUserExist"),
    getUserData: () => ipcRenderer.invoke("dialog:getUserData"),
    createNewUser: (displayName, password) => ipcRenderer.invoke("dialog:createNewUser", displayName, password),
    createPasswordHash: (rawPassword) => ipcRenderer.invoke("dialog:createPasswordHash", rawPassword),
    decryptPrivateKey: (encryptedPrivateKey, password) => ipcRenderer.invoke("dialog:decryptPrivateKey", encryptedPrivateKey, password),
    changePassword: (currentPassword, newPassword, currentPrivateKey) => ipcRenderer.invoke("dialog:changePassword", currentPassword, newPassword, currentPrivateKey),
    // changeDisplayName: (newDisplayName) => ipcRenderer.invoke("dialog:changeDisplayName", newDisplayName),
    changeUserSettings: (displayName, msgLogLimit, port, isMsgsSaved) => ipcRenderer.invoke("dialog:changeUserSettings", displayName, msgLogLimit, port, isMsgsSaved),
    saveNewContact: (contact, publicKey, privateKey) => ipcRenderer.invoke("dialog:saveNewContact", contact, publicKey, privateKey),
    getContactList: (privateKey) => ipcRenderer.invoke("dialog:getContactList", privateKey),
    deleteContact: (contactID, publicKey, privateKey) => ipcRenderer.invoke("dialog:deleteContact", contactID, publicKey, privateKey)
});

window.addEventListener('DOMContentLoaded', () => {
    const messagesDiv = document.getElementById("messages");
    const createMessage = (contact, content) => {
        const div = document.createElement("div");
        div.className = "message";

        const p = document.createElement("p");
        p.innerHTML = `<strong>${contact}:</strong> ${content}`;
        div.appendChild(p);
        messagesDiv.appendChild(div);
    }

    //? example
    createMessage("Contact 1", "Hello!");
    createMessage("You", "Hi, how are you?");
    createMessage("Contact 1", "I'm good, thanks!");
});
