const fs = require('fs');
const path = require('path');

function clearFolder(folder) {
    if (fs.existsSync(folder)) {
        fs.readdirSync(folder).forEach(file => {
            const filePath = path.join(folder, file);
            if (fs.lstatSync(filePath).isDirectory()) {
                fs.rmSync(filePath, { recursive: true, force: true }); // Delete subdirectories
            } else {
                fs.unlinkSync(filePath); // Delete files
            }
        });
        console.log(`Cleared folder: ${folder}`);
    } else {
        console.log(`Folder does not exist: ${folder}`);
    }
}

module.exports = clearFolder;