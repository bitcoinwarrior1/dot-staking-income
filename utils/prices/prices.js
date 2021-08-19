const dotPricesUSD = require("./usd/dot.json");
const ksmPricesUSD = require("./usd/ksm.json");
const dotPricesAUD = require("./aud/dot.json");
const ksmPricesAUD = require("./aud/ksm.json");
const dotPricesCAD = require("./cad/dot.json");
const ksmPricesCAD = require("./cad/ksm.json");
const dotPricesCHF = require("./chf/dot.json");
const ksmPricesCHF = require("./chf/ksm.json");
const dotPricesEUR = require("./eur/dot.json");
const ksmPricesEUR = require("./eur/ksm.json");
const dotPricesSGD = require("./sgd/dot.json");
const ksmPricesSGD = require("./sgd/ksm.json");
const dotPricesNZD = require("./nzd/dot.json");
const ksmPricesNZD = require("./nzd/ksm.json");

module.exports = {
    usd: {
        DOT: dotPricesUSD,
        KSM: ksmPricesUSD
    },
    aud: {
        DOT: dotPricesAUD,
        KSM: ksmPricesAUD
    },
    cad: {
        DOT: dotPricesCAD,
        KSM: ksmPricesCAD
    },
    chf: {
        DOT: dotPricesCHF,
        KSM: ksmPricesCHF
    },
    eur: {
        DOT: dotPricesEUR,
        KSM: ksmPricesEUR
    },
    sgd: {
        DOT: dotPricesSGD,
        KSM: ksmPricesSGD
    },
    nzd: {
        DOT: dotPricesNZD,
        KSM: ksmPricesNZD
    }
}