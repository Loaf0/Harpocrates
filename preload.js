const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
    doesUserExist: () => ipcRenderer.invoke('dialog:doesUserExist'),
    getUserData: () => ipcRenderer.invoke('dialog:getUserData'),
    createNewUser: (displayName, password) => ipcRenderer.invoke('dialog:createNewUser', displayName, password),
    createPasswordHash: (rawPassword) => ipcRenderer.invoke('dialog:createPasswordHash', rawPassword)
})

window.addEventListener('DOMContentLoaded', () => {
    const contacts = ["Joe", "John", "Tyler", "Zach", "Nick", "Teddy", "Ethan", "Anneliese", "Twig"];
    const contactsDiv = document.getElementById("contacts-list");

    for (let i = 0; i < contacts.length; i++) {
        const li = document.createElement("li");
        li.innerText = contacts[i];
        li.onclick = () => {
            //TODO: switch screen to contact, load contact messages
        }
        contactsDiv.appendChild(li);
    }

    document.getElementById("add-contact").onclick = () => {
        //TODO: display a screen to enter contact address
    }

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
})
