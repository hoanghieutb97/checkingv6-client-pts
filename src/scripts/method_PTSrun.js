const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const os = require('os');
const { log } = require('console');

// Constant cho đường dẫn thư mục ServerFile trên Desktop
const SERVER_FILE_PATH = path.join(os.homedir(), 'Desktop', 'ServerFile');

async function method_PTSrun(dataJSON) {
    console.log("chay pts script=======================================");
    const filePath = path.join(SERVER_FILE_PATH, 'data.json');  // Tạo đường dẫn tới file data.json trong thư mục ServerFile trên Desktop

    return new Promise((resolve, reject) => {
        fs.writeFile(filePath, JSON.stringify(dataJSON, null, 2), (err) => {
            if (err) {
                console.error('Error writing file:', err);
                reject(err);
                return;
            }

            try {
                const photoshopPath = 'C:\\Program Files\\Adobe\\Adobe Photoshop 2020\\Photoshop.exe';
                const scriptPath = '\\\\192.168.1.240\\photoshop-script-V4-ultimate\\HomeAutoV6.jsx';
                const command = `"${photoshopPath}" "${scriptPath}"`;

                exec(command, (err) => {
                    if (err) {
                  
                        reject(err);
                       
                    }
                    resolve();
                });
            } catch (error) {
             
                reject(error);
            }
        });
    });
}

async function check_AwaitPhotoshop() {
    console.log("checkAwait=======================================");
    return new Promise((resolve, reject) => {
        try {
            const photoshopPath = 'C:\\Program Files\\Adobe\\Adobe Photoshop 2020\\Photoshop.exe';
            const scriptPath = '\\\\192.168.1.240\\photoshop-script-V4-ultimate\\checkAwait.jsx';
            const command = `"${photoshopPath}" "${scriptPath}"`;

            exec(command, (err) => {
       
                resolve();
            });
        } catch (error) {
       
            reject(error);
        }
    });
}

module.exports = { method_PTSrun, check_AwaitPhotoshop }; 