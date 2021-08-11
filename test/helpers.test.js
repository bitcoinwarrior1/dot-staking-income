const { chai, expect } = require('chai');
const Helpers = require("../utils/helpers");

describe("helpers functionality", () => {

    before(async () => {
        this.helpers = new Helpers("14RYaXRSqb9rPqMaAVp1UZW2czQ6dMNGMbvukwfifi6m8ZgZ", "DOT");
    });

    it("should be able to get the result properly", async () => {
        const result = await this.helpers.getObjectWithValue();
        expect(result.list.length !== 0, "should return a list of results");
    });

});