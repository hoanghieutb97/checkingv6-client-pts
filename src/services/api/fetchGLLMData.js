const axios = require('axios');
const { KeyAndApi } = require('../../core/constants');

async function fetchGLLMData() {
    try {
        const response = await axios.get(KeyAndApi.gllm);
        var GLLM = response.data.filter(item => (item.variant !== "" && item.variant !== null && item.ProductType !== "" && item.ProductType !== null));

        return GLLM.map(item => ({
            ...item,
            ProductType: item.ProductType.toLowerCase().trim().replace(/ /g, '').split(","),
            variant: item.variant.toLowerCase().trim().replace(/ /g, '').split(",")
        }));
    } catch (error) {
        console.log("---------------------------------------loi fetch gllm --------------------------------------------");
        return false;
    }
}

// Function to retry fetch GLLM data
async function retryFetchGLLMData() {
    while (true) {
        const gllmData = await fetchGLLMData();
        if (gllmData) {
            return gllmData;
        }
        console.log('Failed to fetch GLLM data, retrying in 30 seconds...');
        await new Promise(resolve => setTimeout(resolve, 30000)); // Đợi 30 giây
    }
}

module.exports = retryFetchGLLMData; 