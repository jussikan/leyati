const fs = require("fs");
const path = require("path");
const rimraf = require("rimraf");
const expect = require("expect");

const TemplateEngine = require("../src/TemplateEngine");


function occurrences(substr, string) {
    const found = [];
    let pos = -1;

    while (true) {
        pos = string.indexOf(substr, pos + 1);
        if (pos < 0) {
            break;
        }
        else {
            found.push(pos);
        }
    }

    return found.length;
}

describe("TemplateEngine", () => {
    const PWD = path.resolve(path.dirname(__filename) +"/..");
    const tplFilename = path.join(PWD, "tpl", "essential.js.tpl");
    const componentName = "MyComponent";
    const resultFilename = path.join(PWD, "tmp", componentName +"-alpha-test.js");

    let templateEngine = null;

    beforeEach(() => {
        templateEngine = new TemplateEngine(tplFilename, componentName, resultFilename);
        templateEngine.setConstant("%COMPONENT_PATH%", path.join("..", "fixture", componentName));
        templateEngine.substitute();
    });

    afterEach(done => {
        rimraf(path.join(PWD, "tmp"), {}, done);
    });

    it("replaces all component name placeholders with a component's name", () => {
        const tplContents = fs.readFileSync(tplFilename, "utf-8");
        const placeholderCountBefore = occurrences("%COMPONENT%", tplContents);

        const result = templateEngine.getResult();
        const placeholderCountAfter = occurrences("%COMPONENT%", result);
        expect(placeholderCountAfter).toEqual(0);

        const componentNameCount = occurrences(componentName, result);
        expect(componentNameCount).toEqual(placeholderCountBefore + 1);
    });

    it("replaces component location placeholder with component location value", () => {
        const tplContents = fs.readFileSync(tplFilename, "utf-8");
        const placeholderCountBefore = occurrences("%COMPONENT_PATH%", tplContents);

        const result = templateEngine.getResult();
        const placeholderCountAfter = occurrences("%COMPONENT_PATH%", result);
        expect(placeholderCountAfter).toEqual(0);
        expect(placeholderCountBefore).toEqual(1);
    });

    it("saves the result as given filename", () => {
        templateEngine.save();

        expect(() => fs.statSync(resultFilename)).toNotThrow();

        const resultFileContents = fs.readFileSync(resultFilename, "utf-8");
        const result = templateEngine.getResult();
        expect(resultFileContents).toEqual(result);
    });
});
