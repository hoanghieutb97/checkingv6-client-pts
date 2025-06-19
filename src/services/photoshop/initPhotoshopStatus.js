const fs = require('fs');
const path = require('path');
const os = require('os');

// Constant cho đường dẫn thư mục ServerFile trên Desktop
const SERVER_FILE_PATH = path.join(os.homedir(), 'Desktop', 'ServerFile');

function initPhotoshopStatus() {
    const statusPath = path.join(SERVER_FILE_PATH, 'photoshopStatus.txt');
    const defaultStatus = {
        fileName: "",
        state: "awaitReady",
        activeTime: 0
    };

    try {
        // Đảm bảo thư mục ServerFile tồn tại
        if (!fs.existsSync(SERVER_FILE_PATH)) {
            fs.mkdirSync(SERVER_FILE_PATH, { recursive: true });
        }

        // Ghi đè file với trạng thái mặc định
        fs.writeFileSync(statusPath, JSON.stringify(defaultStatus, null, 4));
        console.log('Đã khởi tạo trạng thái Photoshop mặc định');
    } catch (error) {
        console.error('Lỗi khi khởi tạo trạng thái Photoshop:', error);
    }
}

module.exports = initPhotoshopStatus; 