const fs = require('fs');
const path = require('path');
const os = require('os');

// Constant cho đường dẫn thư mục ServerFile trên Desktop
const SERVER_FILE_PATH = path.join(os.homedir(), 'Desktop', 'ServerFile');

// Hàm kiểm tra trạng thái Photoshop
async function checkPhotoshopStatus() {
    try {
        const statusPath = path.join(SERVER_FILE_PATH, 'photoshopStatus.txt');
        const statusContent = await fs.promises.readFile(statusPath, 'utf8');
        const status = JSON.parse(statusContent);
        return status.state === 'awaitReady';
    } catch (error) {
        console.error('Error checking Photoshop status:', error);
        return false;
    }
}

// Hàm đợi cho đến khi Photoshop sẵn sàng
function waitForPhotoshopReady() {
    return new Promise((resolve, reject) => {
        const statusPath = path.join(SERVER_FILE_PATH, 'photoshopStatus.txt');
        

        // Kiểm tra trạng thái ban đầu
        checkPhotoshopStatus().then(isReady => {
            if (isReady) {
                
                resolve({ isReady: true, cardId: null });
                return;
            }
        });

        // Theo dõi sự thay đổi của file
        const watcher = fs.watch(statusPath, async (eventType, filename) => {
            if (eventType === 'change') {
                try {
                    const statusContent = await fs.promises.readFile(statusPath, 'utf8');
                    const status = JSON.parse(statusContent);
                    
                    // Kiểm tra nếu trạng thái là 'done' và có cardId
                    if (status.state === 'done' && status.cardId && status.cardId !== '') {
                        console.log('Photoshop status changed to done with cardId:', status.cardId);
                        watcher.close(); // Dừng theo dõi
                        resolve({ isReady: true, cardId: status.cardId });
                    } else if (status.state === 'awaitReady') {
                        console.log('Photoshop status changed to ready!');
                        watcher.close(); // Dừng theo dõi
                        resolve({ isReady: true, cardId: null });
                    }
                } catch (error) {
                    console.error('Error while watching file:', error);
                    watcher.close();
                    reject(error);
                }
            }
        });

        // Xử lý lỗi khi theo dõi file
        watcher.on('error', (error) => {
            console.error('Error watching file:', error);
            watcher.close();
            reject(error);
        });
    });
}

module.exports = {
    checkPhotoshopStatus,
    waitForPhotoshopReady
}; 