const { contextBridge } = require('electron');
const fs = require('fs');
const path = require('path');

contextBridge.exposeInMainWorld('electronAPI', {
  readJson: (fileName) => {
    const filePath = path.join(__dirname, 'data', fileName);
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }
});
