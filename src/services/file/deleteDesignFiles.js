const fs = require('fs');
const path = require('path');
const os = require('os');

// Constant cho đường dẫn thư mục ServerFile trên Desktop
const SERVER_FILE_PATH = path.join(os.homedir(), 'Desktop', 'ServerFile');

async function deleteDesignFiles() {
    const designPath = path.join(SERVER_FILE_PATH, 'design');
    
    try {
        // Kiểm tra xem thư mục có tồn tại không
        if (!fs.existsSync(designPath)) {
            console.log('Thư mục design không tồn tại');
            return false;
        }

        // Đọc tất cả files trong thư mục
        const files = fs.readdirSync(designPath);
        
        // Xóa từng file
        for (const file of files) {
            const filePath = path.join(designPath, file);
            fs.unlinkSync(filePath);
            console.log(`Đã xóa file: ${file}`);
        }

        console.log('Đã xóa tất cả files trong thư mục design');
        return true;
    } catch (error) {
        console.error('Lỗi khi xóa files:', error);
        return false;
    }
}

module.exports = deleteDesignFiles; 