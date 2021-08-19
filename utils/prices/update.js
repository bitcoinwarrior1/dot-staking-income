const Helpers = require("../helpers");
const prices = require("../prices/prices");

async function main() {
    try {
        const currencies = Object.keys(prices);
        for(const currency of currencies) {
            await new Helpers("", "DOT", currency).updatePrices(currency);
            await new Helpers("", "KSM", currency).updatePrices(currency);
        }
    } catch (e) {
        console.error(e);
        // don't want to commit the price updates if it didn't succeed
        process.exit(-1);
    }
}

const _ = main();
