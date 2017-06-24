const Parser = require("../src/Parser");

exports = module.exports = function MockMocha(options) {
    this.files = [];

    this.addFile = (file) => {
        this.files.push(file);
    };

    this.callbacks = {};

    const self = this;

    const InnerRunner = {
        on: (eventType, callback) => {
            self.callbacks[eventType] = callback;
            return InnerRunner;
        },
        run: (fnMochaEnd) => {
            return InnerRunner;
        }
    };


    this.fnMochaEnd = null;

    this.run = (fnMochaEnd) => {
        const suites = [];
        const passes = [];

        const onSuite = (suite) => {
            const exists = suites.filter(s => s.title == suite.title);
            if (exists.length == 0) {
                suites.push(suite);
            }
        };

        self.fnMochaEnd = fnMochaEnd;

        new Promise((resolve, reject) => {
                const foundTests = [];

                const callbacks = {
                    onTest: (testCall) => {
                        foundTests.push(testCall);
                    }
                };

                const parser = new Parser(callbacks);
                parser.parseCodeFromFile(self.files[0]);
                parser.iterateTestSuites(null, null);

                foundTests.forEach(t => {
                    t.pass = t.title.match(/__PASS__$/) !== null && (! t.title.match(/__FAIL__$/) !== null);

                    t.retained = t.related && t.related.annotations && t.related.annotations.filter(a => a.value == "retain").length > 0;

                    passes.push(t);

                    onSuite({
                        title: t.related.suite.title,
                        tests: null
                    });
                });

                suites.forEach(s => 
                    s.tests = passes.filter(t => t.related.suite.title == s.title)
                );

                resolve(suites);
            })
            .then(suites => {
                let failures = 0;

                suites.forEach(s => {
                    self.callbacks.suite({
                        title: s.title
                    });

                    s.tests.forEach(t => {
                        if (t.pass) {
                            self.callbacks.pass(t);
                        }
                        else {
                            ++ failures;
                        }
                    })
                });

                fnMochaEnd(failures);

                self.callbacks.end(passes, suites, failures);
            })
        ;

        return InnerRunner;
    };
}