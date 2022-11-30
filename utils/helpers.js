const request = require("superagent");
const endpoints = {
    "DOT": "https://polkadot.api.subscan.io",
    "KSM": "https://kusama.api.subscan.io"
}
const decimals = {
    "DOT": 1e10,
    "KSM": 1e12
}

module.exports = class Helpers {

    /*
    * @param address - the address of the user
    * @param network - the network to check for staking income
    * @param currency - the fiat currency to use
    * */
    constructor(address, network, currency) {
        this.address = address;
        this.network = network;
        this.decimal = decimals[network];
        this.endpoint = endpoints[network];
        this.apiKey = process.env.API_KEY;
        this.currency = currency.toLowerCase();
    }

    /*
    * @dev - get the latest prices from our scheduled server
    * */
    async initPrices() {
        const data = await request.get("https://dot-tool-server.herokuapp.com/dot-staking-income/prices");
        const formatted = JSON.parse(data.text);
        if(this.network === "DOT") {
            this.prices = formatted[this.currency + "DOT"].prices;
        } else {
            this.prices = formatted[this.currency + "KSM"].prices;
        }
    }

    /*
    * @dev - call the subscan API to get staking rewards, parse the data and format it for the user
    * @returns - results that can be downloaded as a CSV file
    * */
    async getResults() {
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

        return this.getDataFormattedForCSV(dataObj);
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

    /*
    * @dev - format the raw data into data that can be downloaded as a CSV. This function removes irrelevant data and adds useful data like the total value etc.
    * @param result - the raw data result object
    * @returns - final result object for the user to download as a CSV
    * */
    async getDataFormattedForCSV(result) {
        await this.initPrices();
        result = this.removeIrrelevantData(result);
        result[`total_value_${this.currency}`] = 0;
        result[`total_value_${this.network}`] = 0;
        for(const index in result.list) {
            const { block_timestamp, amount } = result.list[index];
            try {
                const priceAtTime = await this.getPriceAtTime(block_timestamp);
                result.list[index].amount = amount / this.decimal;
                const valueOfRewardFiat = parseFloat((priceAtTime * (amount / this.decimal)).toFixed(2));
                result.list[index][`${this.currency}_price_per_coin`] = priceAtTime;
                result.list[index][`${this.currency}_value`] = valueOfRewardFiat;
                result[`total_value_${this.currency}`] += valueOfRewardFiat;
                result[`total_value_${this.network}`] += result.list[index].amount;
                result.list[index].date = new Date(result.list[index].block_timestamp * 1000).toDateString();
            } catch {
                delete result.list[index];
                console.log(`No price found for ${block_timestamp}`);
            }
        }
        result = await this.addNominationPoolRewards(result);
        result[`total_value_${this.currency}`] = parseFloat(result[`total_value_${this.currency}`].toFixed(2));
        result.list = result.list.filter(x => x !== null);

        return result;
    }

    async addNominationPoolRewards(result) {
        try {
            const data = await request.post(`${this.endpoint}/api/scan/nomination_pool/rewards`, {
                "X-API-Key": this.apiKey,
                "address": this.address
            });
            const { list } = data.body.data;
            for(let tx of list) {
                const { amount, block_timestamp, module_id, extrinsic_index, extrinsic_hash, event_id, event_method  } = tx;
                const priceAtTime = await this.getPriceAtTime(block_timestamp);
                const valueOfRewardFiat = parseFloat((priceAtTime * (amount / this.decimal)).toFixed(2));
                const eventObj = { amount: amount / this.decimal, block_timestamp, module_id, extrinsic_index, extrinsic_hash, event_id, event_method };
                eventObj[`${this.currency}_price_per_coin`] = priceAtTime;
                eventObj[`${this.currency}_value`] = valueOfRewardFiat;
                eventObj.date = new Date(block_timestamp * 1000).toDateString();
                result.list.push(eventObj);
                result[`total_value_${this.currency}`] += valueOfRewardFiat;
                result[`total_value_${this.network}`] += amount / this.decimal;
            }
            return result;
        } catch (e) {
            console.error(e);
            return result;
        }
    }

    /*
    * @dev - removes irrelevant information from the raw result object
    * @param result - raw data from the subscan API
    * @returns - the same result object, minus irrelevant details
    * */
    removeIrrelevantData(result) {
        for(const index in result.list) {
            // delete irrelevant details
            delete result.list[index].account;
            delete result.list[index].params;
            delete result.list[index].event_index;
            delete result.list[index].event_idx;
            delete result.list[index].block_num;
            delete result.list[index].extrinsic_idx;
        }

        return result;
    }

    timeout(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /*
    * @dev - gets the price for a particular day
    * @param time - the timestamp
    * @returns - the price as per coingecko's historical data
    * */
    async getPriceAtTime(time) {
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
        throw "Could not find price";
    }
    
}