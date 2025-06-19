/////////////////////////////drive
const readline = require('readline');
const { google } = require('googleapis');
const SCOPES = ['https://www.googleapis.com/auth/drive'];
const TOKEN_PATH = './token.json';
const fs = require('fs-extra');
const axios = require('axios');
const path = require('path');

async function getOAuth2Client() {
    const credentials = JSON.parse(await fs.promises.readFile('credentials.json'));
    const { client_secret, client_id, redirect_uris } = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    let token;
    try {
        token = JSON.parse(await fs.promises.readFile(TOKEN_PATH));
    } catch (error) {
        token = await getNewToken(oAuth2Client);
    }
    oAuth2Client.setCredentials(token);
    return oAuth2Client;
}

async function getNewToken(oAuth2Client) {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });
    console.log('Authorize this app by visiting this url:', authUrl);
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    const code = await new Promise(resolve => rl.question('Enter the code from that page here: ', resolve));
    rl.close();
    const { tokens } = await oAuth2Client.getToken(code);
    await fs.promises.writeFile(TOKEN_PATH, JSON.stringify(tokens));
    return tokens;
}

async function downloadImageDrive(auth, fileId, downloadDirectory, name) {
    const drive = google.drive({ version: 'v3', auth });
    const res = await drive.files.get({ fileId: fileId, fields: '*' });
    const link = res.data.webContentLink;
    const nameDrive = res.data.name;
    const imageExtension = nameDrive.split('.').pop();
    const imageName = `${name}.${imageExtension}`;
    const imagePath = path.join(downloadDirectory, imageName);
    try {
        const writer = fs.createWriteStream(imagePath);
        const response = await axios.get(link, { responseType: 'stream' });
        response.data.pipe(writer);
        return new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });
    } catch (error) {
        console.log("Error downloading image 1:", error);
    }

}

async function downloadImage(link, name, downloadDirectory) {
    const oAuth2Client = await getOAuth2Client();
    const match = link.match(/\/d\/(.+?)\//) || link.match(/id=([^&]+)/);
    if (match) {
        const fileId = match[1];
        // await downloadImageDrive(oAuth2Client, fileId, downloadDirectory, name);
    } else {
        // Your existing logic for non-Google Drive links
        try {
            const response = await axios.get(link, { responseType: 'stream' });
            const imageExtension = link.split('.').pop().split('?')[0]; // Simplified extension extraction
            const imageName = `${name}.${imageExtension}`;
            const imagePath = path.join(downloadDirectory, imageName);
            const writer = fs.createWriteStream(imagePath);
            response.data.pipe(writer);
            await new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });
        } catch (error) {
            console.error("Error downloading image:", error.message);
        }
    }
}

module.exports = downloadImage;
