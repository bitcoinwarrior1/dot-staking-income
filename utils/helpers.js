const request = require("superagent");
const fs = require('fs');
const dotPrices = require("./prices/usd/dot.json").prices;
const ksmPrices = require("./prices/usd/ksm.json").prices;
const endpoints = {
    "DOT": "https://polkadot.api.subscan.io",
    "KSM": "https://kusama.api.subscan.io"
}
const decimals = {
    "DOT": 1e10,
    "KSM": 1e12
}

module.exports = class Helpers {
    
    constructor(address, network) {
        this.address = address;
        this.network = network;
        this.decimal = decimals[network];
        this.endpoint = endpoints[network];
        this.apiKey = process.env.API_KEY;
        if(this.network === "DOT") {
            this.prices = dotPrices;
            this.coinName = "polkadot";
        } else {
            this.prices = ksmPrices;
            this.coinName = "kusama";
        }
    }

    async getObjectWithValue() {
        let index = 0;
        const dataObj = {};
        try {
            while(true) {
                const result = await request.post(`${this.endpoint}/api/scan/account/reward_slash`, {
                    "X-API-Key": this.apiKey,
                    "row": 100,
                    "page": index,
                    "address": this.address
                });
                const offset = index * 99;
                index++;
                if(result.body.data.list === null) break;
                this.objCombine(result.body.data, dataObj, offset);
                await this.timeout(1000);
            }
        } catch (e) {
            return {error: e};
        }
        dataObj.list = this.convertListObjToArray(dataObj.list);
        return this.handleData(dataObj);
    }

    objCombine(obj, variable, offset) {
        for (let key of Object.keys(obj)) {
            if (!variable[key]) variable[key] = {};
            for (let innerKey of Object.keys(obj[key]))
                variable[key][parseInt(innerKey) + offset] = obj[key][innerKey];
        }
    }

    convertListObjToArray(dataObj) {
        let dataAsArray = [];
        for(let k in Object.keys(dataObj)) {
            dataAsArray.push(dataObj[k]);
        }
        return dataAsArray;
    }

    async handleData(result) {
        result.total_value_usd = 0;
        result[`total_value_${this.network}`] = 0;
        for(const index in result.list) {
            const timestamp = result.list[index].block_timestamp;
            const amount = result.list[index].amount;
            result.list[index].amount = amount / this.decimal;
            const priceAtTime = await this.getPrice(timestamp, amount, "USD");
            const valueOfRewardUSD = parseFloat((priceAtTime * (amount / this.decimal)).toFixed(2)); // USD is only 2dp
            result.list[index].usd_price_per_coin = priceAtTime;
            result.list[index].usd_value = valueOfRewardUSD;
            result.total_value_usd += valueOfRewardUSD;
            result[`total_value_${this.network}`] += result.list[index].amount;
            result.list[index].date = new Date(result.list[index].block_timestamp * 1000).toDateString();
            // delete irrelevant details
            delete result.list[index].account;
            delete result.list[index].params;
            delete result.list[index].event_index;
            delete result.list[index].event_idx;
            delete result.list[index].block_num;
            delete result.list[index].extrinsic_idx;
        }
        result.total_value_usd = parseFloat(result.total_value_usd.toFixed(2));
        return result;
    }

    timeout(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async getPrice(time, amount, currency) {
        // coingecko uses zero hour time snapshots
        const date = new Date(time * 1000).setHours(0, 0, 0, 0);
        // TODO a bit inefficient to have to iterate each time
        for(const snapshot of this.prices) {
            const snapshotTime = new Date(snapshot[0]).setHours(0,0,0,0);
            if(snapshotTime === date) {
                const output = parseFloat(snapshot[1]).toFixed(2);
                return parseFloat(output);
            }
        }
        // if no prices are found, update the file and retry
        await this.updatePrices(currency);
        return this.getPrice(time, amount, currency);
    }

    async updatePrices(currency) {
        const query = `https://api.coingecko.com/api/v3/coins/${this.coinName}/market_chart?vs_currency=${currency}&days=max`;
        const result = await request.get(query);
        const updatedDataset = JSON.stringify(result.body);
        const fileName = `./utils/prices/usd/${this.network}.json`;
        return new Promise((resolve, reject) => {
            fs.writeFile(fileName, updatedDataset, function writeJSON(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve('updated ' + fileName);
                }
            });
        });
    }
    
}