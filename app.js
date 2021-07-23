const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const Helpers = require("./utils/helpers");

app.get("/history/:address/:network", (req, res, next) => {
    res.header( 'Access-Control-Allow-Origin','*' );
    const address = req.params.address;
    const network = req.params.network.toUpperCase();
    new Helpers(address, network).getObjectWithValue().then((result) => {
        res.send(result);
    }).catch((err) => {
        res.send(err);
    });
});

app.listen(port, () => console.log(`listening at ${port}`));