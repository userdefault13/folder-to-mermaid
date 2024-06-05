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
