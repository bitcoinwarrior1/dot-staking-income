const request = require("superagent");

module.exports = class Helpers {
    
    constructor(address, network) {
        const endpoints = {
            "DOT": "https://polkadot.api.subscan.io",
            "KSM": "https://kusama.api.subscan.io"
        }
        const decimals = {
            "DOT": 1e10,
            "KSM": 1e12
        }
        this.address = address;
        this.network = network;
        this.decimal = decimals[network];
        this.endpoint = endpoints[network];
        this.apiKey = process.env.API_KEY;
    }

    async getObjectWithValue() {
        let result = await request.post(`${this.endpoint}/api/scan/account/reward_slash`, {
            "X-API-Key": this.apiKey,
            "row": 20,
            "page": 0,
            "address": this.address
        });
        result = result.body.data;
        result.total_value_usd = 0;
        for(const index in result.list) {
            const timestamp = result.list[index].block_timestamp;
            const amount = result.list[index].amount;
            const priceAtTime = await this.getPrice(timestamp, amount, "USD");
            const valueOfRewardUSD = parseFloat((priceAtTime * (amount / this.decimal)).toFixed(2)); // USD is only 2dp
            result.list[index].usd_price_per_coin = priceAtTime;
            result.list[index].usd_value = valueOfRewardUSD;
            result.total_value_usd += valueOfRewardUSD;
        }
        result.total_value_usd = parseFloat(result.total_value_usd.toFixed(2));
        return result;
    }

    timeout(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async getPrice(time, amount, currency) {
        try {
            const result = await request.post(`${this.endpoint}/api/open/price_converter`, {
                "X-API-Key": this.apiKey,
                "time": time,
                "value": 1,
                "from": this.network,
                "quote": currency
            });
            const output = parseFloat(result.body.data.output).toFixed(2);
            return parseFloat(output);
        } catch (e) {
            console.error(e);
            await this.timeout(1000);
            return this.getPrice(time, amount, currency);
        }

    }
    
}