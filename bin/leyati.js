#!/usr/bin/env node

const path = require("path");

if (process.argv.length <= 2) {
	const bin = path.basename(process.argv[1]);
	console.log("Usage: "+ bin +" <template file name> <test script destination> <source location> [component name]");
	process.exit(1);
}


const command = (process.argv.length === 3 && process.argv[2] === "init") ? "init" : null;

const fs = require('fs');

const config = {};
const myConfigLocation = path.join(process.cwd(), "leyati.conf.js");

if (command === "init") {
	const thisScript = process.mainModule.filename;
	const thisLocation = path.resolve(path.dirname(thisScript) +"/..");

	const initialConfigLocation = thisLocation +"/config.js";
	fs.writeFileSync(myConfigLocation, fs.readFileSync(initialConfigLocation));

	process.exit(0);
}


try {
	require(myConfigLocation)({
		set: (settings) => {
			const keys = Object.keys(settings);
			for (idx in keys) {
				var key = keys[idx];
				config[key] = settings[key];
			}
		}
	});
}
catch (e) {
	if (e.message.match(/Cannot find module/)) {
		console.error("Please call '"+ path.basename(process.argv[1]) +" init' once before running tests.");
		process.exit(1);
	}
	else {
		throw e;
	}
}

const tplFileName = path.resolve(process.argv[2]);
const testDirectory = path.resolve(process.argv[3]);

const sourceLocation = path.resolve(process.argv[4]);

const componentName = process.argv[5];


const Inspector = require("../lib/Inspector");

const glob = require("glob");

const files = fs.statSync(sourceLocation).isDirectory() ? glob.sync(sourceLocation +"/**/*.js", {}) : [sourceLocation];

require("babel-register")(config.babelOptions);
require("jsdom-global")();

const findPathMatch = (a, b) => {
	const ap = a.split("/");
	const bp = b.split("/");

	var last = null;
	var i = 0;
	do {
		if (ap[i] === bp[i]) {
			last = ap[i];
		}
		else {
			break;
		}
		++ i;
	}
	while (i < Math.min(ap.length, bp.length));

	return ap.slice(0, i).join("/");
};

const eshal = require("eshal");

const eshalCallbacks = {
	error: (message, data) => {
		console.error(message, JSON.stringify(data, null, 0));
	},
	warn: (message, data) => {
		console.warn(message, JSON.stringify(data, null, 0));
	},
	debug: (message, data) => {
		console.log(message, JSON.stringify(data, null, 0));
	}
};

files.forEach((filepath, idx) => {
	const full = path.dirname(filepath);

	const cwd = process.cwd();
	const pathMatch = findPathMatch(full, cwd);
	const componentPath = ".." + filepath.replace(pathMatch, "");

	let interpreted = null;
	try {
		interpreted = eshal.interpretDocument(filepath, null, eshalCallbacks);
	}
	catch (e) {
		console.error(e);
		return;
	}

	const namesOfComponentsWithFunctionality = interpreted.namesOfExportedFunctions
		.concat(interpreted.namesOfExportedClasses)
	;
	let componentsToInspect = [];

	if (componentName) {
		if (namesOfComponentsWithFunctionality.indexOf(componentName) >= 0) {
			componentsToInspect.push(componentName);
		}
		else {
			return;
		}
	}
	else {
		componentsToInspect = namesOfComponentsWithFunctionality;
	}

	if (componentsToInspect.length === 0) {
		console.log("No components to inspect in file "+ filepath);
	}

	componentsToInspect.forEach((foundComponentName) => {
		if (interpreted.namesOfExportedFunctions.indexOf(foundComponentName) < 0) {
			const classASTTree = interpreted.getClassByName(foundComponentName);
			const classInterp = eshal.interpretClassASTTree(classASTTree);

			if (classInterp.namesOfNonStaticFunctions.indexOf("render") < 0) {
				console.log("Component "+ foundComponentName +" does not have non-static function 'render': skipping.");
				return;
			}
		}

		const inspector = new Inspector(tplFileName, testDirectory, foundComponentName);
		inspector.options(config);

		inspector.setConstant("%COMPONENT_NAME%", foundComponentName);

		console.log("Setting COMPONENT_PATH as '"+ componentPath +"'");
		inspector.setConstant("%COMPONENT_PATH%", componentPath);

		console.log("Processing template "+ tplFileName +" for component "+ foundComponentName);
		const filenameResultAlpha = inspector.processTemplate();

		inspector.saveAlphaTestScript();
		if (config.leaveAlphaTestScript) {
			console.log("Saved alpha test script as file "+ filenameResultAlpha);
		}

		console.log("Running alpha test script");
		try {
			inspector.runTests();
		}
		catch (e) {
			console.error(e.stack);
		}
	});
});
