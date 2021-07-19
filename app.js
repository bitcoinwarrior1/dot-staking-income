const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const request = require("superagent");

app.get("/history/:address", (req, res, next) => {
    res.header( 'Access-Control-Allow-Origin','*' );
    const address = req.params.address;
    getObjectWithValue(address).then(res.send).catch(res.error);
});

async function getObjectWithValue(address) {
    const result = await request.post("https://polkadot.api.subscan.io/api/scan/staking_history", {
        "row": 20,
        "page": 0,
        "address": address
    });
    for(const index in result.history) {
        const timestamp = result.history[index].block_timestamp;
        const reward = result.history[index].reward;
        const priceAtTime = await getPrice(timestamp);
        result.history[index].value = priceAtTime * reward;
    }
    return result;
}

async function getPrice(time) {
    const result = await request.post("https://polkadot.api.subscan.io/api/open/price", {
        "time": time
    });
    return result.data.price;
}

app.listen(port, () => console.log(`listening at ${port}`));