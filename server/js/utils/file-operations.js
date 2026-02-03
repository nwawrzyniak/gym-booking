const fs = require('fs').promises;

// Helper functions for file operations
const readJSON = async (filePath, defaultValue = []) => {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    if (err.code === 'ENOENT') {
      await writeJSON(filePath, defaultValue);
      return defaultValue;
    }
    throw err;
  }
};

const writeJSON = async (filePath, data) => {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
};

module.exports = {
  readJSON,
  writeJSON
};