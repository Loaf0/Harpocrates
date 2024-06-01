const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('api', {
    fetchMessage: async () => {
        const response = await fetch('http://127.0.0.1:3000/api/data');
        const data = await response.json();
        return data.message;
    }
});
