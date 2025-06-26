const fs = require('fs-extra');
const calFrontBack = require('../../utils/calFrontBack');
const path = require('path');

async function verifyDownloadedFiles(json, pathFolder) {
    try {
        const items = json.items;
        let isComplete = true;

        // Đọc danh sách file trong thư mục
        const files = await fs.readdir(pathFolder);
        
        for (const item of items) {
            const expectedFiles = [];
            const sku = item.sku;
            
            // Kiểm tra xem item có cần file front không
            const needsFront = item.amountFile === "2";
            
            // Tạo danh sách file cần có
            if (needsFront) {
                expectedFiles.push(`${sku} front.png`);
            } else {
                expectedFiles.push(`${sku}.png`);
            }

            // Kiểm tra từng file
            const missingFiles = expectedFiles.filter(file => !files.includes(file));
            
            if (missingFiles.length > 0) {
                isComplete = false;
                break; // Dừng ngay khi tìm thấy file thiếu
            }
        }

        // In báo cáo
        
        console.log(`All files downloaded...........: ${isComplete ? 'Yes' : 'No'}`);

        return isComplete;
    } catch (error) {
        console.error('Error verifying downloaded files:', error);
        return false;
    }
}

async function readJsonAndDownloadImages(GLLM, json, pathFolder) {
    // Validate input
    if (!GLLM || !json || !pathFolder) {
        throw new Error('Missing required parameters: GLLM, json, or pathFolder');
    }

    if (!json.items || !Array.isArray(json.items)) {
        throw new Error('Invalid json format: items array is required');
    }

    // Ensure download directory exists
    try {
        await fs.ensureDir(pathFolder);
    } catch (error) {
        throw new Error(`Failed to create download directory: ${error.message}`);
    }

    const items = json.items;
    const results = {
        success: [],
        failed: []
    };

    // Process each item
    for (const item of items) {
        try {
            // Validate item data
            if (!item.product || !item.variant || !item.dateItem || !item.sku || !item.urlDesign) {
                throw new Error(`Missing required fields in item: ${JSON.stringify(item)}`);
            }

            await calFrontBack(
                GLLM,
                item.sku,
                item.urlDesign,
                item.product,
                item.variant,
                item.dateItem,
                pathFolder
            );

            results.success.push(item.sku);
           
        } catch (error) {
            results.failed.push({
                sku: item.sku,
                error: error.message
            });
            console.error(`Failed to process item ${item.sku}:`, error.message);
        }
    }

    // Log summary


    if (results.failed.length > 0) {
        console.log('\nFailed items:');
        results.failed.forEach(item => {
            console.log(`- ${item.sku}: ${item.error}`);
        });
    }

    // Verify downloaded files
    console.log('\nVerifying downloaded files...');
    const isComplete = await verifyDownloadedFiles(json, pathFolder);

    return {
        processing: results,
        verification: isComplete
    };
}

module.exports = readJsonAndDownloadImages;