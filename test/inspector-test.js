const fs = require("fs");
const path = require("path");
const rimraf = require("rimraf");
const expect = require("expect");

const Parser = require("../src/Parser");
const Runner = require("../src/Runner");

const MockMocha = require("./MockMocha");

const mockrequire = require("mockrequire");

const Inspector = mockrequire("../src/Inspector", {
    "../lib/Runner": function(testFile) {
        this._passes = undefined;
        this._suites = undefined;

        this._callbacks = {};

        this._mocha = new MockMocha();

        this.setTestFile = function setTestFile(testFile) {
            this._testFile = testFile;
            this._mocha.addFile(testFile);
        };

        if (testFile) {
            this.setTestFile(testFile);
        }

        this.run = function run() {
            const passes = [];
            const suites = [];

            const self = this;
            self.failures = null;

            if (! self._testFile) {
                throw new Error("NO TEST FILE SET");
            }

            self._runner = this._mocha.run((failures) => {
                    self.failures = failures;
                    return failures;
                })
                .on("suite", (suite) => {
                    suites.push(suite);
                })
                .on("pass", (test) => {
                    if (suites.length > 0) {
                        const latestSuite = suites[ suites.length - 1 ];
                        test.suiteTitle = latestSuite.title;
                    }

                    passes.push(test);
                })
                .on("end", () => {
                    self._callbacks.end(passes, suites, self.failures)
                })
            ;

            return self._runner;
        };

        this.on = function on(eventType, fn) {
            this._callbacks[eventType] = fn;
        };
    }
});


describe("Inspector", () => {
    const PWD = path.resolve(path.dirname(__filename) +"/..");
    const tplFilename = path.join(PWD, "tpl", "essential.js.tpl");
    const componentName = "Foo";
    const componentPath = path.join(PWD, "fixture", componentName);
    const testsPath = path.join(PWD, "tmp");
    const config = {
        createTestScriptEvenIfAllTestsFail: true,
        leaveAlphaTestScript: true
    };

    beforeEach(() => {
        rimraf.sync(testsPath, {});
    });

    after(() => {
        rimraf.sync(testsPath, {});
    });

    it("creates an alpha test script", () => {
        const runner = new Runner();

        const inspector = new Inspector(tplFilename, testsPath, componentName);
        inspector.options(config);

        inspector.setConstant("%COMPONENT_PATH%", componentPath);
        inspector.setConstant("%COMPONENT_NAME%", componentName);

        const alphaScriptFilename = inspector.processTemplate();
        inspector.saveAlphaTestScript();

        expect(() => inspector.runTests()).toNotThrow();
    });

    it("runs tests from an alpha test script", (done) => {
        const inspector = new Inspector(tplFilename, testsPath, componentName);
        inspector.options(config);

        inspector.setConstant("%COMPONENT_PATH%", componentPath);
        inspector.setConstant("%COMPONENT_NAME%", componentName);

        const alphaScriptFilename = inspector.processTemplate();
        inspector.saveAlphaTestScript();

        inspector.on("finalized", (passes, suites, failures, alphaScriptFilename, finalScriptFilename) => {
            expect(passes.length + suites.length + failures).toBeGreaterThan(1);
            expect(passes.length + failures).toBeGreaterThan(0);
            expect(failures).toNotBe(null);
            done();
        });

        expect(() => fs.statSync(alphaScriptFilename)).toNotThrow();

        expect(() => inspector.runTests()).toNotThrow();
    });

    it("writes a final test script", (done) => {
        const inspector = new Inspector(tplFilename, testsPath, componentName);
        inspector.options(config);

        inspector.setConstant("%COMPONENT_PATH%", componentPath);
        inspector.setConstant("%COMPONENT_NAME%", componentName);

        const alphaScriptFilename = inspector.processTemplate();
        inspector.saveAlphaTestScript();

        inspector.on("finalized", (passes, suites, failures, alphaScriptFilename, finalScriptFilename) => {
            expect(() => fs.statSync(finalScriptFilename)).toNotThrow();
            done();
        });

        expect(() => inspector.runTests()).toNotThrow();
    });

    it("leaves failed, non-retained tests out of a final test script", (done) => {
        const inspector = new Inspector(path.join(PWD, "fixture", "some_retained_one_failing.js.tpl"), testsPath, componentName);
        inspector.options(config);

        inspector.setConstant("%COMPONENT_PATH%", componentPath);
        inspector.setConstant("%COMPONENT_NAME%", componentName);

        const alphaScriptFilename = inspector.processTemplate();
        inspector.saveAlphaTestScript();

        inspector.on("finalized", (passes, suites, failures, alphaScriptFilename, finalScriptFilename) => {
            /* -need collection of tests and info on which of them are annotated
             * -read the contents of the final test script
             * -see if the annotated tests are there.
             *
             * need Parser.
             * need an alpha test script that has some annotated tests that fail.
             */
            const alphaTestCalls = [];
            const finalTestCalls = [];

            const alphaParser = new Parser({
                onTest: (testCall) => alphaTestCalls.push(testCall)
            });
            const finalParser = new Parser({
                onTest: (testCall) => finalTestCalls.push(testCall)
            });


            const alphaSource = fs.readFileSync(alphaScriptFilename, {encoding: "utf8"});
            alphaParser.parseCodeInString(alphaSource);
            alphaParser.iterateTestSuites(null, null);

            const finalSource = fs.readFileSync(finalScriptFilename, {encoding: "utf8"});
            finalParser.parseCodeInString(finalSource);
            finalParser.iterateTestSuites(null, null);

            const retainedTests = [];
            const nonRetainedTests = [];

            alphaTestCalls.forEach(t => {
                const annotations = t.related && t.related.annotations && t.related.annotations;
                if (! annotations) return;

                if (annotations.filter(a => a.value == "retain").length > 0) {
                    retainedTests.push(t);
                }
                else {
                    nonRetainedTests.push(t);
                }
            });

            expect(passes.length).toEqual(retainedTests.length, "Number of passes ("+ passes.length +") must equal to number of retained tests ("+ retainedTests.length +")");
            expect(nonRetainedTests.length).toEqual(1, "One non-retained test should have been found");
            expect(failures).toNotBe(null);
            expect(alphaTestCalls.length - passes.length).toEqual(failures, "Alpha test script should have "+ failures +" failed test(s)");

            done();
        });

        expect(() => inspector.runTests()).toNotThrow();
    });

    it("writes a final test script even if all tests fail (by default)", (done) => {
        const inspector = new Inspector(path.join(PWD, "fixture", "essential.js.tpl"), testsPath, componentName);
        inspector.options(config);

        inspector.setConstant("%COMPONENT_PATH%", componentPath);
        inspector.setConstant("%COMPONENT_NAME%", componentName);

        const alphaScriptFilename = inspector.processTemplate();
        inspector.saveAlphaTestScript();

        inspector.on("finalized", (passes, suites, failures, alphaScriptFilename, finalScriptFilename) => {
            expect(passes.length).toEqual(0);
            expect(failures).toBeGreaterThan(0);

            const alphaTestCalls = [];
            const finalTestCalls = [];

            const alphaParser = new Parser({
                onTest: (testCall) => alphaTestCalls.push(testCall)
            });
            const finalParser = new Parser({
                onTest: (testCall) => finalTestCalls.push(testCall)
            });

            const alphaSource = fs.readFileSync(alphaScriptFilename, {encoding: "utf8"});
            alphaParser.parseCodeInString(alphaSource);
            alphaParser.iterateTestSuites(null, null);

            const finalSource = fs.readFileSync(finalScriptFilename, {encoding: "utf8"});
            finalParser.parseCodeInString(finalSource);
            finalParser.iterateTestSuites(null, null);

            expect(alphaTestCalls.map(t => t.title).sort())
                .toEqual(finalTestCalls.map(t => t.title).sort());

            done();
        });

        expect(() => inspector.runTests()).toNotThrow();
    });

    it("retains annotated, failed tests in the final test script", (done) => {
        /* -need collection of tests, which of them are annotated
         * -read the contents of the final test script
         * -see if the annotated tests are there.
         *
         * need Parser.
         * need an alpha test script that has some annotated tests that fail.
         */

        const inspector = new Inspector(path.join(PWD, "fixture", "some_passing_one_retained_failing.js.tpl"), testsPath, componentName);
        inspector.options(config);

        inspector.setConstant("%COMPONENT_PATH%", componentPath);
        inspector.setConstant("%COMPONENT_NAME%", componentName);

        const alphaScriptFilename = inspector.processTemplate();
        inspector.saveAlphaTestScript();

        inspector.on("finalized", (passes, suites, failures, alphaScriptFilename, finalScriptFilename) => {
            const alphaTestCalls = [];
            const finalTestCalls = [];

            const alphaParser = new Parser({
                onTest: (testCall) => alphaTestCalls.push(testCall)
            });
            const finalParser = new Parser({
                onTest: (testCall) => finalTestCalls.push(testCall)
            });

            const alphaSource = fs.readFileSync(alphaScriptFilename, {encoding: "utf8"});
            alphaParser.parseCodeInString(alphaSource);
            alphaParser.iterateTestSuites(null, null);

            const finalSource = fs.readFileSync(finalScriptFilename, {encoding: "utf8"});
            finalParser.parseCodeInString(finalSource);
            finalParser.iterateTestSuites(null, null);

            const retainedTests = [];
            const nonRetainedTests = [];

            alphaTestCalls.forEach(t => {
                const annotations = t.related && t.related.annotations && t.related.annotations;
                if (! annotations) return;

                if (annotations.filter(a => a.value == "retain").length > 0) {
                    retainedTests.push(t);
                }
                else {
                    nonRetainedTests.push(t);
                }
            });


            const titlesOfTestsInFinalSource = finalTestCalls.map(t => t.title);

            expect(titlesOfTestsInFinalSource)
                .toContain(retainedTests.map(t => t.title));

            expect(nonRetainedTests.map(t => t.title).sort())
                .toEqual(passes.map(t => t.title).sort());

            expect(finalTestCalls.length).toEqual(alphaTestCalls.length);

            done();
        });

        expect(() => inspector.runTests()).toNotThrow();
    });

    it("does not write own annotations into the final test script", (done) => {
        /* -check that no own annotations are present in the final test script.
         *
         * need an alpha test script that has at least one annotated test
         */
        const inspector = new Inspector(path.join(PWD, "fixture", "one_retained_failing_one_retained_passing.js.tpl"), testsPath, componentName);
        inspector.options(config);

        inspector.setConstant("%COMPONENT_PATH%", componentPath);
        inspector.setConstant("%COMPONENT_NAME%", componentName);

        const alphaScriptFilename = inspector.processTemplate();
        inspector.saveAlphaTestScript();

        inspector.on("finalized", (passes, suites, failures, alphaScriptFilename, finalScriptFilename) => {
            const alphaTestCalls = [];

            const alphaParser = new Parser({
                onTest: (testCall) => alphaTestCalls.push(testCall)
            });

            const alphaSource = fs.readFileSync(alphaScriptFilename, {encoding: "utf8"});
            alphaParser.parseCodeInString(alphaSource);
            alphaParser.iterateTestSuites(null, null);


            const finalTestCalls = [];

            const finalParser = new Parser({
                onTest: (testCall) => finalTestCalls.push(testCall)
            });

            const finalSource = fs.readFileSync(finalScriptFilename, {encoding: "utf8"});
            finalParser.parseCodeInString(finalSource);
            finalParser.iterateTestSuites(null, null);

            expect(finalTestCalls.length).toBeGreaterThan(1);

            const titlesOfFinalTests = finalTestCalls.map(t => t.title);
            titlesOfFinalTests.forEach(title => {
                expect(alphaTestCalls.map(t => t.title)).toContain(title);
            });

            expect(finalTestCalls.filter(t => {
                if (t.related) {
                    if (t.related.annotations) {
                        return t.related.annotations.filter(a => a.type == "LeyatiAnnotation").length > 0;
                    }
                }

                return false;
            }).length).toEqual(0);

            done();
        });

        expect(() => inspector.runTests()).toNotThrow();
    });
});
