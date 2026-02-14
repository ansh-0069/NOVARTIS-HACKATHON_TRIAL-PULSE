const path = require('path');
const fs = require('fs');

console.log('Current directory:', process.cwd());
console.log('__dirname:', __dirname);

try {
    const configPath = path.join(__dirname, 'lims_config.json');
    console.log('Config path:', configPath);
    if (fs.existsSync(configPath)) {
        console.log('Config file exists');
    } else {
        console.log('Config file does NOT exist');
    }
} catch (e) {
    console.error('Error checking config file:', e);
}

try {
    console.log('Loading limsManager...');
    const limsManager = require('./lims/limsManager');
    console.log('limsManager loaded successfully');
} catch (e) {
    console.error('Error loading limsManager:', e);
}
