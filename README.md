## Description

Inspector Leyati runs unit tests from templates for a collection of React components and saves the successful and retained into a final unit test script.

The location and name of a component are placed into given template that is saved as an "alpha test script". The tests in this script are run and those passed are written to a final test script. Failed tests are not written to the final test script unless they have the annotation `@leyati-retain` right above them.


Leyati uses [babel](https://babeljs.io/), [babylon](https://github.com/babel/babylon), and [Mocha](https://mochajs.org/).



## Installation

`npm install --save eshal`



## API

`bin/leyati.js  <command>`
  (commands: "init")


`bin/leyati.js  <template file name> <test script destination> <source location> [component name]`

- Inspector

`new Inspector(templateFilename, testsPath, componentName)`

`inspector.options(config)`

The shape of `code` is as follows and can be found in config.js:
```
{
	createTestScriptEvenIfAllTestsFail: true,
	leaveAlphaTestScript: false,
	babelOptions: {...},
	babylonOptions: {...},
	mochaOptions: {...}
}
```


`inspector.setConstant(name, value)`

Set `value` for a placeholder that is found in given template by `name`.


`inspector.on(eventType, fn)`

Set callbacks for events. For now there is only one, "finalized", that is called after all tests in a script have been run and the final test script been written.


`inspector.processTemplate()`

Replaces placeholders in given template file with the given constants.


`inspector.saveAlphaTestScript()`

Saves the source code processed in `processTemplate()` as an alpha test script.


`inspector.runTests()`

Runs the tests in an alpha test script and saves the successful and retained into a final unit test script.


`inspector.run()`

Calls `processTemplate()`, `saveAlphaTestScript()`, and `runTests()`.


- LeyatiAnnotation

A singleton that provides all available Leyati annotations and a RegExp pattern for them.



### Example

```
const Inspector = require("leyati").Inspector;
const inspector = new Inspector("tpl/essential.js.tpl", "tests", "Foo");
inspector.options({...});

inspector.setConstant("%COMPONENT_NAME%", "Foo");
inspector.setConstant("%COMPONENT_PATH%", "src/Foo.js");

inspector.run();
```


The placeholder format in the templates bundled with Leyati is "%<placeholder name>%", but Leyati accepts any format.


- Remarks

Leyati/Inspector uses [eshal](https://github.com/jussikan/eshal) to find out the names of exported components in an ES6 file so naming testable components is not necessary on the command line.



### Output

Writes alpha and final test scripts. By default, an alpha test script is removed after a final test script is written.

