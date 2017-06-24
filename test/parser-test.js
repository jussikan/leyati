const path = require("path");
const expect = require("expect");

const Parser = require("../src/Parser");

describe("Parser", () => {
    it("collects tests of one suite to caller", () => {
        const foundTests = [];

        const callbacks = {
            onTest: (testCall) => {
                foundTests.push(testCall);
            }
        };

        const parser = new Parser(callbacks);
        parser.parseCodeFromFile(path.join("fixture", "foo-alpha-test.js"));
        parser.iterateTestSuites(null, null);

        expect(foundTests.length).toEqual(3);

        const test1 = foundTests.filter(t => t.title == "succeeds at shallow mount without props");
        expect(test1[0].related.suite.title).toEqual("Foo");

        const test2 = foundTests.filter(t => t.title == "succeeds at deep mount without props");
        expect(test2[0].related.suite.title).toEqual("Foo");

        const test3 = foundTests.filter(t => t.title == "are rendered without props");
        expect(test3[0].related.suite.title).toEqual("Foo contents");
    });

    it("provides all tests of top-level suites of a file via a single callback", () => {
        /* use an alpha test script that has two top-level suites */
        const foundTests = [];

        const callbacks = {
            onTest: (testCall) => {
                foundTests.push(testCall);
            }
        };

        const parser = new Parser(callbacks);
        parser.parseCodeFromFile(path.join("fixture", "bar-alpha-test.js"));
        parser.iterateTestSuites(null, null);
        expect(foundTests.length).toEqual(2);

        const test1 = foundTests.filter(t => t.title == "succeeds at shallow mount without props");
        expect(test1[0].related.suite.title).toEqual("Bar");

        const test2 = foundTests.filter(t => t.title == "renders an element with class \"Bar\" when mounted without props");
        expect(test2[0].related.suite.title).toEqual("for teh lulz");
    });

    it("provides all tests of all suites of a file via a single callback", () => {
        /* use an alpha test script that has two top-level suites, with one suite inside the other. */
        const foundTests = [];

        const callbacks = {
            onTest: (testCall) => {
                foundTests.push(testCall);
            }
        };

        const parser = new Parser(callbacks);
        parser.parseCodeFromFile(path.join("fixture", "baz-alpha-test.js"));
        parser.iterateTestSuites(null, null);
        expect(foundTests.length).toEqual(3);

        const test1 = foundTests.filter(t => t.title == "succeeds at full mount without props");
        expect(test1[0].related.suite.title).toEqual("Baz");

        const test2 = foundTests.filter(t => t.title == "renders an element with class \"Baz\" when mounted without props");
        expect(test2[0].related.suite.title).toEqual("renders");

        const test3 = foundTests.filter(t => t.title == "are rendered without props");
        expect(test3[0].related.suite.title).toEqual("Baz friends");
    });

    it("finds annotations above tests", () => {
        /* use a template that has one test that fails and has the annotation. */
        const foundTests = [];

        const callbacks = {
            onTest: (testCall) => {
                foundTests.push(testCall);
            }
        };

        const parser = new Parser(callbacks);
        parser.parseCodeFromFile(path.join("fixture", "baz-alpha-test.js"));
        parser.iterateTestSuites(null, null);
        expect(foundTests.length).toEqual(3);

        const test2 = foundTests.filter(t => t.title == "renders an element with class \"Baz\" when mounted without props");
        expect(test2[0].related.suite.title).toEqual("renders");
        expect(test2[0].related.annotations.length).toBeGreaterThan(0);
        expect(test2[0].related.annotations.filter(a => a.type == "LeyatiAnnotation").length).toEqual(1);
    });
});
