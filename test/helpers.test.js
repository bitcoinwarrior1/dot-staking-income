const { chai, expect } = require('chai');
const Helpers = require("../utils/helpers");

describe("helpers functionality", () => {

    it("should be able to get the result properly", async () => {
        const result = await new Helpers("13yHcTycP5tJhfDNvzLBDhLLgTEC9ZuZp3sL8yJNsoWh7Fpd", "DOT", "AUD").getResults();
        expect(result.list.length !== 0, "should return a list of results");
    });

    it("should be able to get a result on a large wallet", async() => {
        const result = await new Helpers(
            "1bq1oEa8ghJN5xViGDz4MnxBpsHpZ3Y1Uuef4E1vhKhh1WY",
            "DOT",
                    "AUD"
        ).getResults();
        expect(result.list.length !== 0, "should return a list of results");
        expect(result.total_value_aud !== 0, "should form the total AUD value properly");
        expect(result.total_value_DOT !== 0, "should form the total DOT value properly");
    });

    it("should get results within the specified date range", async() => {
        const from = 1638193558;
        const to = 1669769171;
        const result = await new Helpers("13yHcTycP5tJhfDNvzLBDhLLgTEC9ZuZp3sL8yJNsoWh7Fpd", "DOT", "AUD", from, to).getResults();
        const { list } = result;
        expect(list.length !== 0, "should return a list of results");
        expect(list[0].timestamp >= from, "Should be at or later than the from time");
        expect(list[list.length - 1].timestamp <= to, "Should be at or earlier than the to time");
    });

});