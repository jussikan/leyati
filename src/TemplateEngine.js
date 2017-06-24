const fs = require("fs");
const path = require("path");
const _ = require("lodash");

exports = module.exports = TemplateEngine;

function TemplateEngine(templateFilename, componentName, resultFilename) {
	this._templateFilename = templateFilename;
	this._componentName = componentName;
	this._resultFilename = resultFilename;
	this._data = {};
}

TemplateEngine.prototype.setConstant = function setConstant(name, value) {
	this._data[name] = value;
};

TemplateEngine.prototype.getConstant = function getConstant(name) {
	return this._data[name];
};

TemplateEngine.prototype.resultFilename = function resultFilename(f) {
	if (f) {
		this._resultFilename = f;
	}
	else {
		return this._resultFilename;
	}
};

TemplateEngine.prototype.getResult = function getResult() {
	return this._result;
};

TemplateEngine.prototype.save = function save() {
	if (! this._result) {
		throw new Error("Template not processed!");
	}

	const parts = this._resultFilename.split(path.sep);

	_.chain(parts)
	  .takeRight(parts.length - 1).take(parts.length - 2)
	  .value()
		.forEach((dir, index, parts) => {
			const parent = parts.slice(0, index).join(path.sep);
			const dirPath = path.resolve(path.sep + parent, dir);

			if (! fs.existsSync(dirPath)) {
				fs.mkdirSync(dirPath);
			}
		}
	);

	fs.writeFileSync(this._resultFilename, this._result, "utf8");
};

TemplateEngine.prototype.substitute = function substitute() {
	const template = fs.readFileSync(this._templateFilename, "utf8");
	// this._result = template.replace(/%COMPONENT_NAME%/g, this._componentName);
	this._result = template;

	const datakeys = Object.keys(this._data);
	if (datakeys.length > 0) {
		datakeys.forEach(name => {
			const value = this._data[name];

			if (typeof value == "undefined") {
				console.error("Value for '" + name + "' not set");
				return;
			}
			this._result = this._result.replace(new RegExp(name, "g"), value);
		});
	}
};
