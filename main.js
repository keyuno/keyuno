// Import required modules
const {
  app,
  BrowserWindow
} = require('electron');
const {
  ipcMain
} = require('electron');
const fs = require('fs');
const path = require('path');

let mainWindow;

// Remove the menu bar from newly created windows
app.on('browser-window-created', (event, newWindow) => {
  newWindow.setMenuBarVisibility(false);
});

// Create the main window and IPFS node when the app is ready
app.on('ready', () => {
  createWindow();
  createIPFSNode();
});

let node;

async function createIPFSNode() {
  // Import the IPFS module and create a new IPFS node
  const IPFS = await import('ipfs-core');
  node = await IPFS.create();
}

function createWindow() {
  // Create a new browser window with some properties
  mainWindow = new BrowserWindow({
    icon: path.join(__dirname, 'css', 'icons', 'keyuno2.ico'),
    show: false,
    autoHideMenuBar: true,
    width: 800,
    height: 600,
    webPreferences: {
      sandbox: false,
      preload: path.join(__dirname, 'preload.js'),
    }
  });

  // Maximize and show the main window
  mainWindow.maximize();
  mainWindow.show();

  // Load the index.html file into the window
  mainWindow.loadFile("welcome.html");

  // When the window is closed, set mainWindow to null
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

ipcMain.on('my-message', (event, data) => {
  console.log(data);
  // Call the main function if node exists
  if (node) {
    main(event);
  }
});

const filePath = "filename.html";


async function main(event) {
  // Read the file from disk
  const file = fs.readFileSync(filePath);

  // Add the file to IPFS
  const fileAdded = await node.add({
    path: filePath,
    content: file
  });

  // Log the added file's path and CID, and save the CID to disk
  console.log("Added file:", fileAdded.path, fileAdded.cid);
  fs.writeFileSync('cid.txt', fileAdded.cid.toString());
  console.log("cid.txt successfully saved to disk.");

  // Send the CID to preload.js
  event.sender.send('main-to-preload', fileAdded.cid.toString());
}

ipcMain.on('retrieve-message', async (event, data) => {
  // Get the file's content from IPFS
  const stream = await node.cat(data);
  const decoder = new TextDecoder();
  let fileContent = "";
  for await (const chunk of stream) {
    fileContent += decoder.decode(chunk, {
      stream: true
    });
  }

  // Write the file content to disk
  fs.writeFile("filename.html", fileContent, function (err) {
    if (err) {
      return console.log(err);
    }
    console.log("File successfully saved to disk.");
  });
});


app.on('before-quit', () => {
  // Delete the file
  fs.unlinkSync(filePath);

});

