const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const Helpers = require("./utils/helpers");

app.get("/history/:address/:network/:currency/:fromDate/:toDate", (req, res, next) => {
    res.header( 'Access-Control-Allow-Origin','*' );
    const address = req.params.address;
    const network = req.params.network.toUpperCase();
    const currency = req.params.currency.toLowerCase();
    const fromDate = parseInt(req.params.fromDate);
    const toDate = parseInt(req.params.toDate);
    new Helpers(address, network, currency, fromDate, toDate).getResults().then((result) => {
        res.send(result);
    }).catch((err) => {
        res.send(err);
    });
});

app.listen(port, () => {
    console.log(`listening at ${port}`)
});