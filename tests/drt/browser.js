
const {load} = require("../../src/drt/main.js");

describe("Browser", function() {
    it("main", async function() {
        let foo = await load("bin/", async (path) => {
            let content = require("fs").readFileSync(path).toString();
            // console.log(content);
            return Promise.resolve({
                text() {
                    return Promise.resolve(content);
                }
            });
        });
    });
});
