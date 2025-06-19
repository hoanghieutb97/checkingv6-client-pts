const path = require('path');
const _ = require('lodash');
const fs = require('fs-extra');
const axios = require('axios');

async function downloadImage(link, name, downloadDirectory) {
    try {
        const response = await axios.get(link, { responseType: 'stream' });
        const imageExtension = link.split('.').pop().split('?')[0];
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
        throw error;
    }
}

async function calFrontBack(GLLM, name, link, product, variant, dateParts, downloadDirectory) {
    try {
        // Kiểm tra input
        if (!GLLM || !name || !link || !product || !variant || !dateParts || !downloadDirectory) {
            throw new Error('Missing required parameters');
        }

        // Tìm sản phẩm phù hợp
        const matchedProducts = GLLM.filter(item =>
            _.intersection(item.ProductType, [product.toLowerCase().trim().replace(/ /g, '')]).length &&
            _.intersection(item.variant, [variant.toLowerCase().trim().replace(/ /g, '')]).length
        );

        if (!matchedProducts || matchedProducts.length === 0) {
            throw new Error(`No matching product found for ${product} - ${variant}`);
        }

        // Xử lý thời gian
        const timeParts = dateParts.split(" ");
        if (!timeParts || timeParts.length === 0) {
            throw new Error('Invalid date format');
        }
        const dateComponents = timeParts[0].split("-");
        if (dateComponents.length !== 3) {
            throw new Error('Invalid date components');
        }

        // Tạo đường dẫn
        const basePath = path.join('//192.168.1.230/production', dateComponents[0], dateComponents[1], dateComponents[2], product);
        
        // Kiểm tra kết nối mạng
        try {
            await fs.access(basePath);
        } catch (error) {
            console.error(`Cannot access network path: ${basePath}`);
            throw new Error('Network path not accessible');
        }

        // Format link
        const formatLink = (link) => {
            if (!link) {
                throw new Error('Link is empty or null');
            }
            if (typeof link === "object" && !link.text) {
                throw new Error('Invalid link object format');
            }
            const linkText = typeof link === "object" ? link.text : link;
            return linkText.replace(/www\.dropbox\.com/g, 'dl.dropboxusercontent.com');
        };

        // Function to process image download or copy
        async function processImage(amountFile, nameSuffix = '') {
            const imageName = `${name}${nameSuffix}.png`;
            const imagePath = path.join(basePath, imageName);
            
            try {
                if (!fs.existsSync(imagePath)) {
                    const formattedLink = formatLink(link);
                    const splitLink = formattedLink.split(";");
                    
                    if (!splitLink || splitLink.length === 0) {
                        throw new Error('Invalid link format');
                    }

                    const linkToUse = nameSuffix === " back" && splitLink.length > 1 ? splitLink[1] : splitLink[0];
                    if (!linkToUse) {
                        throw new Error(`No link available for ${nameSuffix}`);
                    }

                    await downloadImage(linkToUse, `${name}${nameSuffix}`, downloadDirectory);
                    console.log(`Downloaded: ${name}${nameSuffix}`);
                } else {
                    await copyFile(imagePath, path.join(downloadDirectory, imageName));
                    
                }
            } catch (error) {
                console.error(`Error processing image ${imageName}:`, error);
                throw error;
            }
        }

        // Function to copy file
        async function copyFile(source, destination) {
            return new Promise((resolve, reject) => {
                const readStream = fs.createReadStream(source);
                const writeStream = fs.createWriteStream(destination);

                readStream.on('error', reject);
                writeStream.on('error', reject);
                writeStream.on('finish', resolve);

                readStream.pipe(writeStream);
            });
        }

        // Process based on amountFile
        const amountFile = matchedProducts[0].amountFile;
        if (amountFile === "1") {
            await processImage("1");
        } else if (amountFile === "2") {
            // Luôn tải file front
            await processImage("2", ' front');
            
            // Thử tải file back nếu có link
            try {
                const formattedLink = formatLink(link);
                const splitLink = formattedLink.split(";");
                if (splitLink.length > 1) {
                    await processImage("2", ' back');
                }
            } catch (error) {
                console.log(`No back file for ${name}, skipping...`);
            }
        } else {
            throw new Error(`Invalid amountFile: ${amountFile}`);
        }

    } catch (error) {
        console.error('Error in calFrontBack:', error);
        throw error;
    }
}

module.exports = calFrontBack;
