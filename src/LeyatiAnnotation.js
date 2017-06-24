function LeyatiAnnotationObject() {
}

LeyatiAnnotationObject.prototype.toString = function toString() {
	return "LeyatiAnnotation";
};


const LeyatiAnnotation = new LeyatiAnnotationObject();

Object.defineProperty(LeyatiAnnotation, "Retain", {
	value: "leyati-retain",
	enumerable: true,
	writable: false
});

Object.defineProperty(LeyatiAnnotation, "__pattern", {
	value: '@leyati-(\\w+)',
	enumerable: true,
	writable: false
});

exports = module.exports = LeyatiAnnotation;
