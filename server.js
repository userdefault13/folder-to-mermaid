// file path: /server.js

const express = require('express');
const multer = require('multer');
const fs = require('fs-extra');
const path = require('path');
const cors = require('cors');
const unzipper = require('unzipper');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(cors()); // Enable CORS
app.use(express.static('public'));
app.use(express.json());

const generateMermaidCode = (dir, parentId = 'root') => {
  let mermaidCode = parentId === 'root' ? 'graph TD;\n' : '';
  const items = fs.readdirSync(dir);

  items.forEach((item, index) => {
    const itemPath = path.join(dir, item);
    const isDirectory = fs.lstatSync(itemPath).isDirectory();
    const nodeId = `${parentId}_${index}`; // Unique ID for each node

    mermaidCode += `${parentId} --> ${nodeId}["${item}"];\n`; // Create connection from parent to this node

    if (isDirectory) {
      mermaidCode += generateMermaidCode(itemPath, nodeId); // Recursively generate code for subdirectories
    }
  });

  return mermaidCode;
};

const generateMarkdownCode = (dir, prefix = '') => {
  let markdownCode = '';
  const items = fs.readdirSync(dir);

  items.forEach((item, index) => {
    const itemPath = path.join(dir, item);
    const isDirectory = fs.lstatSync(itemPath).isDirectory();
    const itemPrefix = prefix + (index === items.length - 1 ? '└── ' : '├── ');
    const newPrefix = prefix + (index === items.length - 1 ? '    ' : '│   ');

    markdownCode += `${itemPrefix}${item}\n`;

    if (isDirectory) {
      markdownCode += generateMarkdownCode(itemPath, newPrefix);
    }
  });

  return markdownCode;
};

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/upload', upload.single('folder'), async (req, res) => {
  console.log('Upload request received');
  const file = req.file;
  const tempDir = `uploads/${Date.now()}`;

  try {
    console.log('Extracting zip file...');
    await fs.createReadStream(file.path)
      .pipe(unzipper.Extract({ path: tempDir }))
      .promise();

    console.log('Zip file extracted to:', tempDir);
    
    // Ensure the directory exists and is accessible
    if (!fs.existsSync(tempDir)) {
      throw new Error(`Directory ${tempDir} does not exist`);
    }

    console.log('Directory exists, generating Mermaid and Markdown code...');
    const mermaidCode = '```mermaid\n' + generateMermaidCode(tempDir) + '```';
    const markdownCode = '```\n' + generateMarkdownCode(tempDir) + '```';
    console.log('Mermaid and Markdown code generated');

    // Clean up
    fs.removeSync(tempDir); // Clean up the extracted folder
    fs.removeSync(file.path); // Clean up the uploaded zip file

    res.json({ mermaidCode, markdownCode });
  } catch (error) {
    console.error('Error processing upload:', error);
    res.status(500).json({ error: 'Failed to process upload', message: error.message, stack: error.stack });
  }
});

app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
