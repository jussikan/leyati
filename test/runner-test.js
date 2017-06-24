const expect = require("expect");
const path = require("path");
const mockrequire = require("mockrequire");

const Parser = require("../src/Parser");

const MockMocha = require("./MockMocha");

require("babel-register");
require("jsdom-global")();


const Runner = mockrequire("../src/Runner", {
    "mocha": MockMocha
});

describe("Runner", () => {
    const PWD = path.resolve(path.dirname(__filename) +"/..");;

    it("runs tests from an alpha test script", (done) => {
        const runner = new Runner(path.join(PWD, "fixture", "Runner", "foo-alpha-test.js"));

        runner.on("end", (passes, suites, failures) => {
            expect(passes.length + suites.length + failures).toBeGreaterThan(1);
            expect(passes.length + failures).toBeGreaterThan(0);
            expect(failures).toNotBe(null);
            done();
        });

        runner.run();
    });

    it("collects all suites in a file", (done) => {
        const runner = new Runner(path.join(PWD, "fixture", "Runner", "foo-alpha-test.js"));

        runner.on("end", (passes, suites, failures) => {
            const suiteNames = suites.map(s => s.title);

            expect(suiteNames.sort())
                .toEqual([
                    "Foo",
                    "Foo contents"
                ].sort()
            );

            done();
        });

        runner.run();
    });

    it("collects all passed tests in a file", (done) => {
        const runner = new Runner(path.join(PWD, "fixture", "Runner", "bar-alpha-test.js"));

        runner.on("end", (passes, suites, failures) => {
            const passedTestsNames = passes.map(t => t.title);
            expect(passedTestsNames.sort()).toEqual(
                ["succeeds at shallow mount without props __PASS__",
                 "succeeds at deep mount without props __PASS__"
                ].sort()
            );

            done();
        });

        runner.run();
    });

    it("collects completely failed suites in a file", (done) => {
        const runner = new Runner(path.join(PWD, "fixture", "Runner", "fail-alpha-test.js"));

        runner.on("end", (passes, suites, failures) => {
            expect(passes.length).toEqual(0);

            const suiteNames = suites.map(s => s.title);
            expect(suiteNames.sort())
                .toEqual([
                    "Bar",
                    "for teh lulz"
                ].sort()
            );

            done();
        });

        runner.run();
    });

    it("collects passed tests, suites, failure count, alpha filename, final filename", (done) => {
        const runner = new Runner(path.join(PWD, "fixture", "Runner", "baz-alpha-test.js"));

        runner.on("end", (passes, suites, failures, alphaTestScript, finalTestScript) => {
            expect(passes.length).toBeGreaterThan(-1);
            expect(suites.length).toBeGreaterThan(0);
            expect(failures).toBeGreaterThan(-1);
            expect(passes.length + failures).toBeGreaterThan(0);

            done();
        });

        runner.run();
    });
});
