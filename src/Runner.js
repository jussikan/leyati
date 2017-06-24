const Mocha = require("mocha");

function Runner(testFile, mochaOptions) {
	this._passes = undefined;
	this._suites = undefined;
	this._callbacks = {};
	this._mocha = new Mocha(mochaOptions
		? mochaOptions
		: {
			reporter: "dot",
			ui: "bdd"
		}
	);
	this._testFile = testFile;

	if (testFile) this._mocha.addFile(testFile);
}

Runner.prototype.setTestFile = function setTestFile(testFile) {
	this._testFile = testFile;
	this._mocha.addFile(testFile);
};

Runner.prototype.setMochaOptions = function setMochaOptions(mochaOptions) {
	this._mocha.setup(mochaOptions);
};

Runner.prototype.getPasses = function getPasses() {
	return this._passes;
};

Runner.prototype.run = function run() {
	this._passes = [];
	this._suites = [];

	const self = this;

	if (! this._testFile) {
		throw new Error("NO TEST FILE SET");
	}

	this._runner = this._mocha.run(
		function(_failures) {
			self._failures = _failures;
			return self._failures;
		})
		.on("suite", function(suite) {
			self._suites.push(suite);
		})
		.on("pass", function(test) {
			if (self._suites.length > 0) {
				const latestSuite = self._suites[ self._suites.length - 1 ];
				test.suiteTitle = latestSuite.title;
			}

			self._passes.push(test);
		})
		.on("end", function() {
			self._callbacks
				&& self._callbacks.end
				&& self._callbacks.end(self._passes, self._suites, self._failures);
		})
	;

	return this._runner;
};

Runner.prototype.on = function on(eventType, fn) {
	this._callbacks[eventType] = fn;
};

exports = module.exports = Runner;
