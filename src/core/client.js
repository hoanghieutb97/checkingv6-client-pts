const { io } = require("socket.io-client");
const retryFetchGLLMData = require('../services/api/fetchGLLMData');
const deleteDesignFiles = require('../services/file/deleteDesignFiles');
const readJsonAndDownloadImages = require('../services/file/readJsonAndDownloadImages');
const { method_PTSrun, check_AwaitPhotoshop } = require('../scripts/method_PTSrun');
const path = require('path');
const fs = require('fs');
const os = require('os');
const chokidar = require('chokidar');

const initPhotoshopStatus = require('../services/photoshop/initPhotoshopStatus');
const { log } = require("console");

// Constant cho đường dẫn thư mục ServerFile trên Desktop
const SERVER_FILE_PATH = path.join(os.homedir(), 'Desktop', 'ServerFile');

// Khởi tạo trạng thái Photoshop mặc định
initPhotoshopStatus();

// Define design path
const designPath = path.join(SERVER_FILE_PATH, 'design');
console.log('ServerFile path:', SERVER_FILE_PATH);  // Log để xem đường dẫn chính xác

// Function theo dõi file txt và emit cardDone độc lập
function startPhotoshopStatusWatcher(socket) {
    const statusPath = path.join(SERVER_FILE_PATH, 'photoshopStatus.txt');
    console.log('Starting Photoshop status watcher with chokidar...');

    const watcher = chokidar.watch(statusPath, {
        // Tùy chọn có thể thêm ở đây
    });

    let lastProcessedContent = null; // Tránh xử lý trùng lặp

    watcher.on('change', (path) => {
        console.log(`File ${path} đã thay đổi!`);
        
        // Đọc nội dung của file khi nó thay đổi
        fs.readFile(path, 'utf8', (err, data) => {
            if (err) {
                console.error(`Lỗi khi đọc nội dung của file: ${err}`);
                return;
            }

            // Tránh xử lý nội dung trùng lặp
            if (lastProcessedContent === data) {
                console.log("Nội dung không thay đổi, bỏ qua");
                return;
            }
            lastProcessedContent = data;

            console.log('Nội dung của file:', data);
            try {
                const { state, err, cardId } = JSON.parse(data);
                console.log("status", { state, err, cardId }, new Date());
                
                // Kiểm tra các trạng thái khác nhau
                if ((state === 'done') && cardId && (err === false)) { // done true false
                    console.log("cardDone.........", cardId);
                    socket.emit('cardDone', cardId);
                }
                else if ((state === 'awaitReady') && (cardId === false) && (err === false)) { // awaitReady false false
                    console.log("awaitReady.........");
                    socket.emit('awaitReady');
                }
                else if ((state === 'busy') && cardId && (err === true)) { // busy true true
                    console.log("cardError.........", cardId);
                    socket.emit('cardError', cardId);
                }
                else {
                    console.log("Unhandled status:", { state, err, cardId });
                }
            } catch (parseError) {
                console.error('Lỗi khi parse JSON:', parseError);
                console.error('Raw data:', data);
            }
        });
    });

    // Xử lý lỗi khi theo dõi file
    watcher.on('error', (error) => {
        console.error('Error watching Photoshop status file:', error);
    });

    // Cleanup function
    const cleanup = () => {
        console.log('Cleaning up watcher...');
        watcher.close();
    };

    // Đóng watcher khi socket disconnect
    socket.on('disconnect', cleanup);
    socket.on('error', cleanup);

    return { watcher, cleanup };
}

// Initialize socket connection
const socket = io("http://localhost:3999", {
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: Infinity,  // Thử kết nối lại vô hạn
    reconnectionDelay: 1000,
    timeout: 20000
});

let reconnectAttempts = 0;
let photoshopWatcher = null;
let watcherCleanup = null;

// Connection events
socket.on('connect', () => {
    reconnectAttempts = 0;  // Reset số lần thử kết nối khi kết nối thành công
    console.log('Connected to server');

    // Báo cho server biết client đã sẵn sàng
    socket.emit('awaitReady');

    // Bắt đầu theo dõi file Photoshop status
    const watcherResult = startPhotoshopStatusWatcher(socket);
    photoshopWatcher = watcherResult.watcher;
    watcherCleanup = watcherResult.cleanup;

    // Tự động gửi ready event mỗi 5 giây nếu vẫn ở trạng thái ready
    // setInterval(() => {
    //     if (clientStatus === 'awaitReady') {
    //         socket.emit('awaitReady');
    //     }
    // }, 5000);
});
socket.on('checkAwait', async () => {


    await check_AwaitPhotoshop();

});


socket.on('connect_error', (error) => {
    reconnectAttempts++;
    console.log(`Connection error (attempt ${reconnectAttempts}):`, error.message);
    console.log('Waiting to reconnect...');
});

socket.on('disconnect', () => {
    console.log('Disconnected from server');
    // Cleanup watcher khi disconnect
    if (watcherCleanup) {
        watcherCleanup();
        watcherCleanup = null;
    }
});

// Handle new card from server
socket.on('newCard', async (card) => {

    console.log('Received new card:', card.cardId);

    // Xử lý card ở đây
    console.log('Processing card...');

    try {
        // Fetch GLLM data với retry
        const gllmData = await retryFetchGLLMData();
        console.log('GLLM data received:', gllmData.length, 'items');

        // Xóa tất cả files trong thư mục design
        const deleteResult = await deleteDesignFiles();
        if (!deleteResult) {
            console.log('Không thể xóa files trong thư mục design');
            return;
        }

        // Xử lý JSON và tải ảnh
        const result = await readJsonAndDownloadImages(gllmData, card, designPath);

        // Kiểm tra kết quả verification
        if (result.verification) {
            console.log('All files downloaded successfully, running PTS script...');
            try {
                await method_PTSrun(card, SERVER_FILE_PATH);
                console.log('PTS script completed');
            } catch (error) {

            }
        } else {
            console.log('Some files are missing, skipping PTS script');
        }



    } catch (error) {
        console.error('Error processing card:', error);
    }
});

// sdv


// Thêm event để nhận thông tin về global.listTrello



// Function to send message
function sendMessage(message) {
    if (message) {
        socket.emit('chat message', message);
        console.log('Sent message:', message);
    }
}


// Example usage
sendMessage('Hello from Node.js client!');
