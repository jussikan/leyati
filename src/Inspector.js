const fs = require("fs");
const path = require("path");
const _ = require("lodash");

const TemplateEngine = require("../lib/TemplateEngine");
const Runner = require("../lib/Runner");
const Parser = require("../lib/Parser");
const LeyatiAnnotation = require("./LeyatiAnnotation");


function Inspector(templateFilename, testsPath, componentName) {
	this._templateFilename = templateFilename;
	this._componentName = componentName;
	this._testsPath = testsPath;
	this._finalScriptFilename = componentName && path.join(testsPath, firstCharToLower(componentName) +"-test.js");
	this._data = {};
	this._options = {
		createTestScriptEvenIfAllTestsFail: true,
		leaveAlphaTestScript: false,
		babylonOptions: null,
		mochaOptions: null
	};
	this._callbacks = {};
	this._result = null;
	this._templateEngine = new TemplateEngine(templateFilename, componentName);
	this._runner = null;
}

Inspector.prototype.options = function options(options) {
	if (options) {
		_.mapKeys(options, (value, key) => {
			if (key in this._options) {
				this._options[key] = value;
			}
		});
	}
	else {
		return this._options;
	}
};

Inspector.prototype.on = function on(eventType, fn) {
	if ("finalized" == eventType) {
		this._callbacks[eventType] = fn;
		return;
	}

	this._runner.on(eventType, fn);
};

Inspector.prototype.setConstant = function setConstant(name, value) {
	this._templateEngine.setConstant(name, value);
};

Inspector.prototype.getConstant = function getConstant(name) {
	return this._templateEngine.getConstant(name);
};

function firstCharToLower(str) {
	return str.charAt(0).toLowerCase() + str.slice(1);
}

Inspector.prototype.processTemplate = function processTemplate() {
	this._alphaScriptFilename = path.join(
		this._testsPath,
		"/%COMPONENT_NAME%-alpha-test.js".replace(/%COMPONENT_NAME%/g, firstCharToLower(this._componentName))
	);

	this._templateEngine.resultFilename(this._alphaScriptFilename);

	try {
		this._templateEngine.substitute();
	}
	catch (e) {
		if (e.message.match(/no such file or directory/)) {
			throw new Error("Template not processed: no such file '"+ this._templateFilename +"'");
		}
		else {
			throw e;
		}
	}

	return this._alphaScriptFilename;
};

Inspector.prototype.saveAlphaTestScript = function saveAlphaTestScript() {
	this._templateEngine.save();
};

Inspector.prototype.runTests = function runTests() {
	const self = this;

	this._runner = new Runner(this._alphaScriptFilename, this._options.mochaOptions);

	this._runner.on("end", (passes, suites, failures) => {
		try {
			onEnd.bind(self)(passes, suites, failures, self._alphaScriptFilename, self._finalScriptFilename);
		}
		catch (e) {
			console.error(e.stack);

			try {
				fs.statSync(self._finalScriptFilename);
			}
			catch (e1) {
				self._finalScriptFilename = null;
			}
		}

		self._callbacks
			&& self._callbacks.finalized
			&& self._callbacks.finalized(passes, suites, failures, self._alphaScriptFilename, self._finalScriptFilename);
		;

		return self._finalScriptFilename;
	});

	this._runner.run();
};

function onEnd(passes, suites, failures, alphaScriptFilename, finalScriptFilename) {
	if (passes.length == 0 && failures > 0) {
		console.log("No tests passed.");

		if (! this._options.createTestScriptEvenIfAllTestsFail) {
			return;
		}
	}


	const alphaSource = fs.readFileSync(alphaScriptFilename, "utf8");

	let finalSource = null;
	try {
		finalSource = constructFinalTestScript.bind(this)(passes, suites, alphaSource);
	}
	catch (e) {
		throw new Error("An error occurred during construction of final test script: "+ e.message);
	}

	fs.writeFileSync(finalScriptFilename, finalSource);

	if (! this._options.leaveAlphaTestScript) {
		fs.unlinkSync(alphaScriptFilename);
	}
}

function constructFinalTestScript(passes, suites, alphaSourceCode) {
	const testCalls = [];

	const parser = new Parser({
			onTest: (testCall) => {
				testCalls.push(testCall);
			}
		},
		this._options.babylonOptions
	);
	parser.parseCodeInString(alphaSourceCode);
	parser.iterateTestSuites(null, null);

	const titlesOfPassedTests = passes.map(test => test.title);

	testCalls.forEach((tc) => {
		if (tc.arguments.length > 0 && tc.arguments[0].type == "StringLiteral") {
			const title = tc.arguments[0].value;
			tc.passed = titlesOfPassedTests.indexOf(title) >= 0;
		}
	});

	let finalTestScript = alphaSourceCode;

	const markedAsRetained = (annotations) =>
		annotations.filter((a) => a.value == "retain").length > 0;

	const ownAnnotations = _.flatten(testCalls.filter(t =>
			t.related && t.related.annotations
				&& t.related.annotations.filter(a => a.type == ""+LeyatiAnnotation).length > 0
		)
		.map(t => t.related.annotations))
	;

	const callsToRemove = testCalls.filter((tc) => {
		let remove = true;
		let retained = null;

		if (tc.passed) {
			remove = false;
		}
		else {
			retained = Boolean(tc.related && tc.related.annotations
				&& tc.related.annotations && markedAsRetained(tc.related.annotations));

			if (retained) {
				remove = false;
			}
		}

		return remove;
	});

	callsToRemove.forEach((tc) => {
		/* TODO? get the original function body as code! */
		const code = alphaSourceCode.substr(tc.start, tc.end - tc.start + 1);
		finalTestScript = finalTestScript.replace(code, "");
	});

	ownAnnotations.forEach(a => {
		const string = alphaSourceCode.substr(a.start, a.end - a.start);
		finalTestScript = finalTestScript.replace(string, "");
	});

	return finalTestScript;
}

Inspector.prototype.run = function run() {
	this.processTemplate();
	this.saveAlphaTestScript();
	this.runTests();
};

exports = module.exports = Inspector;
