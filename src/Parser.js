const fs = require("fs");
const babylon = require("babylon");
const _ = require("lodash");

const LeyatiAnnotation = require("./LeyatiAnnotation");


function Parser(callbacks, customBabylonOptions) {
	this._callbacks = callbacks;
	this._options = customBabylonOptions
		? customBabylonOptions
		: {
			parser: "babel-eslint",
			plugins: [
				"babel",
				"import",
				"jsx",
			    "react",
			    "react-intl"
			],
			presets: [
				["es2015",
				 {
				      "loose": true,
				      "modules": false
				 }],
				"react",
				"stage-0"
			],
			sourceType: "module"
		}
	;
	this._sourceFile = undefined;
	this._sourceCode = undefined;
	this._sourceSetAt = undefined;
	this._result = undefined;
	this._lastParsedAt = undefined;
}

Parser.prototype.sourceFile = function sourceFile(filename) {
	if (filename) {
		this._sourceFile = filename;
		this._sourceCode = null;
		this._sourceSetAt = (new Date()).getTime();
	}
	else {
		return this._sourceFile;
	}
};

Parser.prototype.sourceCode = function sourceCode(str) {
	if (str) {
		this._sourceCode = str;
		this._sourceFile = null;
		this._sourceSetAt = (new Date()).getTime();
	}
	else {
		return this._sourceCode;
	}
};

Parser.prototype.parseCodeFromFile = function parseCodeFromFile(filename) {
	const str = fs.readFileSync(filename, "utf8");
	this._sourceCode = str;
	this.parseCodeInString(str);
};

Parser.prototype.parseCodeInString = function parseCodeInString(str) {
	this.sourceCode(str);
	this._result = babylon.parse(this._sourceCode, this._options);
	this._lastParsedAt = (new Date()).getTime();
};

function parseCommentForMyAnnotation(comment) {
	return comment.value.match(new RegExp(".*"+ LeyatiAnnotation.__pattern +"[\\s.]*"));
}

function makeAnnotationFromComment(comment) {
	const annotation = comment;

	let parsed = parseCommentForMyAnnotation(comment);
	try {
		annotation.rawValue = parsed[0].trim();
		annotation.value = parsed[1];
	}
	catch (e) {
		return null;
	}

	annotation.type = ""+LeyatiAnnotation;

	return annotation;
}

Parser.prototype.filterIdentifierByCalleeName = function filterIdentifierByCalleeName(identifier, names) {
	return names.indexOf(identifier.callee.name) >= 0;
};

Parser.prototype.findSuiteCalls = function findSuiteCalls(exprBody) {
	return exprBody.filter((expr) => {
		return this.filterIdentifierByCalleeName(expr, ["describe", "suite"]);
	});
};

Parser.prototype.findTestCalls = function findTestCalls(node) {
	return this.findIdentifiers(node, true)
		.filter((expr) => {
			return this.filterIdentifierByCalleeName(expr, ["it", "test"]);
		})
	;
};

Parser.prototype.getLeadingCommentsForTest = function getLeadingCommentsForTest(/* ExpressionStatement */ exprStmt) {
	return exprStmt.leadingComments;
};

Parser.prototype.getMyAnnotationsAmongComments = function getMyAnnotationsAmongComments(comments) {
	return comments.map((cmt) => {
			return makeAnnotationFromComment(cmt);
		})
		.filter((a) => null !== a)
	;
};

function getTestOrSuiteTitle(call) {
	const title = call.arguments[0].type == "StringLiteral" ? call.arguments[0].value : null;
	return title;
}

function onTests(/* Array<ExpressionStatement> */ exprStatements, parentSuite, parser) {
	/* go through exprStatements; check for annotations;
	 * for those with annotations, find the test calls and bind the annotations on them.
	 */
	exprStatements.forEach((exprStmt) => {
		const comments = parser.getLeadingCommentsForTest(exprStmt);
		const annotations = comments && parser.getMyAnnotationsAmongComments(comments);

		const testCall = exprStmt.expression.type == "CallExpression"
					  && parser.filterIdentifierByCalleeName(exprStmt.expression, ["it", "test"])
					  && exprStmt.expression
		;

		if (testCall) {
			if (! ('related' in testCall)) {
				testCall.related = {};
			}
			testCall.related.annotations = annotations ? annotations : [];
			testCall.related.suite = parentSuite;

			const title = getTestOrSuiteTitle(testCall);
			if (title) {
				testCall.title = title;
			}

			parser._callbacks && parser._callbacks.onTest && parser._callbacks.onTest(testCall);
		}
	});
}

Parser.prototype.parseSuiteCall = function parseSuiteCall(/* CallExpression */ exprBody) {
	/* check the it() calls and possible other describe()s and suite()s.
	 */
	const functions = exprBody.arguments.filter((arg) => {
		return arg.type == "ArrowFunctionExpression" || arg.type == "FunctionExpression";
	});
	functions.map((fn) => {
		this.iterateTestSuites(fn.body, exprBody);
	});


	const testCalls = functions.map((fn) => fn.body.body)
		.filter((expressionStatements) =>
			this.findTestCalls(expressionStatements).length > 0
		)
	;

	onTests(_.flatten(testCalls), exprBody, this);
};

Parser.prototype.findIdentifiers = function findIdentifiers(/* Array<ExpressionStatement> */ expressions) {
	return expressions
		.filter(node => node.type == "ExpressionStatement")
		.filter(es => es.expression.type == "CallExpression")
		.map(expr => expr.expression)
	;
};

function onSuite(/* CallExpression */ suiteCall, parentSuite, parser) {
	if (! ('related' in suiteCall)) {
		suiteCall.related = {};
	}

	suiteCall.related.parentSuite = parentSuite;
	suiteCall.title = getTestOrSuiteTitle(suiteCall);

	parser.parseSuiteCall(suiteCall);
}

function onSuiteIdentifiers(expressions, parentSuite, parser) {
	const suiteCalls = expressions && expressions.filter((expr) => {
		return parser.filterIdentifierByCalleeName(expr, ["describe", "suite"]);
	});

	suiteCalls.forEach((sc) => {
		onSuite(sc, parentSuite, parser);
	});
}

Parser.prototype.iterateTestSuites = function iterateTestSuites(node, parentSuite) {
	if (! node) {
		if (! this._result.program) {
			throw new Error("Code not parsed yet. Call parseCodeInString() or parseCodeFromFile() for that.");
		}

		node = this._result.program;
	}

	const identifiers = this.findIdentifiers(node.body);
	onSuiteIdentifiers(identifiers, parentSuite, this);
};

exports = module.exports = Parser;
