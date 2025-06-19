const path = require('path');
const os = require('os');

const filePath = path.join(os.homedir(), 'Desktop',"ServerFile","xlsx");
const serverFile = path.join(os.homedir(), 'Desktop',"ServerFile");

const KeyAndApi = {
    // Cập nhật với thông tin API Key, Token và URL đính kèm cụ thể
    apiKey: 'eaab65cdb6b3f930891953f93327e65e',
    token: 'ATTA9890326a872fc0376b216d80d4582602fcf88703471fda6cb1b13f33b6c9702008C31C28',
    filePath: filePath,
    serverURL: 'http://192.168.1.240:3010',
    gllm: 'https://sheet.best/api/sheets/e8876c80-1778-414d-ae68-af6b9ec1289c',
    // gllm: 'https://sheetdb.io/api/v1/xvqhrhg4y9avq',
    serverFile: serverFile
};

module.exports = { KeyAndApi }; 