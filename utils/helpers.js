const request = require("superagent");

module.exports = class Helpers {
    
    constructor(address, network) {
        const endpoints = {
            "polkadot": "https://polkadot.api.subscan.io",
            "kusama": "https://kusama.api.subscan.io"
        }
        this.address = address; 
        this.endpoint = endpoints[network];
        this.apiKey = process.env.API_KEY;
    }

    async getObjectWithValue() {
        let result = await request.post(`${this.endpoint}/api/scan/staking_history`, {
            "X-API-Key": this.apiKey,
            "row": 20,
            "page": 0,
            "address": this.address
        });
        result = result.body.data;
        result.total_value_usd = 0;
        for(const index in result.history) {
            const timestamp = result.history[index].block_timestamp;
            const reward = result.history[index].reward;
            const priceAtTime = await this.getPrice(timestamp, this.endpoint);
            const valueUSD = priceAtTime * reward;
            result.history[index].usd = valueUSD;
            result.total_value_usd += valueUSD;
        }
        return result;
    }

    async getPrice(time) {
        const result = await request.post(`${this.endpoint}/api/open/price`, {
            "X-API-Key": this.apiKey,
            "time": time
        });
        return result.data.price;
    }
    
}