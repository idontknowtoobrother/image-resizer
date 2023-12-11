const path = require('path');
const os = require('os');
const fs = require('fs');
const sharp = require('sharp');
const { app, BrowserWindow, Menu, ipcMain, shell } = require('electron')

const devMode = false;
const isMacOS = process.platform === 'darwin';

// Global reference to mainWindow
let mainWindow;

// Create main window
function createMainWindow() {

    mainWindow = new BrowserWindow({
        width: devMode ? 1000 : 500,
        height: 600,
        title: "Image Resizer",
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: true,
            preload: path.join(__dirname, './preload.js'),
        }
    });

    if (devMode) {
        mainWindow.webContents.openDevTools();
    }

const sharp = require('sharp');
    mainWindow.loadFile(path.join(__dirname, './renderer/index.html'));
}

function createAboutWindow() {
    const aboutWindow = new BrowserWindow({
        width: devMode ? 600 : 300,
        height: 300,
        title: "About Image Resizer"
    });

    if (devMode) {
        aboutWindow.webContents.openDevTools();
    }

    aboutWindow.loadFile(path.join(__dirname, './renderer/about.html'));
}

// App is ready
app.whenReady().then(() => {
    createMainWindow();

    // Implement menu
    const mainMenu = Menu.buildFromTemplate(menu);
    Menu.setApplicationMenu(mainMenu);

    // Remove mainWindow on close clear memory
    mainWindow.on('closed', () => (mainWindow = null))

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createMainWindow();
        }
    })
})

// Menu template
const menu = [
    ...(isMacOS ? [
        {
            label: app.name,
            submenu: [
                {
                    label: 'About',
                    click: createAboutWindow
                }
            ]
        }
    ] : []),
    {
        role: 'fileMenu'
    },
    ...(!isMacOS ? [{
        label: 'Help',
        submenu: [
            {
                label: 'About',
                click: createAboutWindow
            }
        ]
    }] : [

    ]),
]

// Because if all windows are closed we should quit the app
// otherwise it will be running in the background
app.on('window-all-closed', () => {
    if (isMacOS) return;
    app.quit();
})

// Resize the image
async function resizeImge({imgPath, width, height, dest}) {
    try {
       
        // Create filename
        const filename = path.basename(imgPath);

        // Create dest folder if it doesn't exist
        if(!fs.existsSync(dest)) {
            fs.mkdirSync(dest);
        }

        // Resize and write file to dest
        sharp(fs.readFileSync(imgPath)).resize({
            width: parseInt(width),
            height: parseInt(height)
        }).toFile(path.join(dest, filename));

        // Send success message to renderer
        mainWindow.webContents.send('image:resized', {
            width,
            height,
            dest: path.join(dest, filename)
        });

        // Open folder dest
        shell.openPath(dest);
    } catch (error) {
        console.log(error);
    }
}

// Respond to message from renderer
ipcMain.on('image:resize', (e, options) => {
    options.dest = path.join(os.homedir(), 'imageresizer');
    resizeImge(options);
});