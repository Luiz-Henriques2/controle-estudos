// electron-main.js
const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, 'public/favicon.ico'), // Certifique-se de ter um ícone aqui ou remova essa linha
    autoHideMenuBar: true, // Esconde a barra de menus (Arquivo, Editar...)
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // Em produção (quando virar .exe), carrega o arquivo buildado.
  // Em desenvolvimento, carrega o localhost.
  if (app.isPackaged) {
    win.loadFile(path.join(__dirname, 'dist', 'index.html'));
  } else {
    win.loadURL('http://localhost:3000');
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});