module.exports = function(config) {
	config.set({
		createTestScriptEvenIfAllTestsFail: true,
		leaveAlphaTestScript: false,
		babelOptions: {
			"presets": ["es2015", "stage-0", "react"]
		},
		babylonOptions: {
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
		},
		mochaOptions: {
			reporter: "dot",
			ui: "bdd"
		}
	});
};
