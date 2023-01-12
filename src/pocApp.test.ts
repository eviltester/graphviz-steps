import { GraphvizStepParser } from "./library/graphvizStepParser";

describe("prototype file reading and writing", () => {

    function readAndParseFile(filePath:string): GraphvizStepParser{

        const fs = require('fs');
    
        const parser = new GraphvizStepParser();
    
        try {
            const data = fs.readFileSync(filePath, 'utf8');
    
            parser.parse(data);
    
    
          } catch (err) {
            console.error(err);
          }
    
          return parser;
    }

    it("can write all the dot files from a file", ()=>{

        const path = require('path');

        const inputFolder = path.resolve( __dirname,  `../examples/`);
        const inputFileName = `001-meta-model-of-software-testing.test.dot`;
        const outputFolder = path.resolve( __dirname,  `../examples/output/`);

        const parsed=readAndParseFile(path.resolve(inputFolder,inputFileName));

        const fs = require('fs');

        if (!fs.existsSync(outputFolder)){
            fs.mkdirSync(outputFolder, { recursive: true });
        }

        let fileCount = 0;

        for(const dotFileContent of parsed.dotVersions){
            let outputFileName = inputFileName + "_" + fileCount.toString().padStart(4,"0") + ".dot";
            try {
                fs.writeFileSync(path.resolve(outputFolder, outputFileName), dotFileContent);
                // file written successfully
              } catch (err) {
                console.error("ERROR Writing " + outputFileName);
                console.error(err);
              }
            fileCount++;
        }
    });

    it("can create an animation html from a template", ()=>{

        const path = require('path');

        const inputFolder = path.resolve( __dirname,  `../examples/`);
        const inputFileName = `001-meta-model-of-software-testing.test.dot`;
        const templateName =`demo-template.html`;
        const outputFolder = path.resolve( __dirname,  `../examples/output/`);

        const parsed=readAndParseFile(path.resolve(inputFolder,inputFileName));

        const fs = require('fs');
        const outputTemplate = fs.readFileSync(path.resolve(inputFolder,templateName), 'utf8');


        if (!fs.existsSync(outputFolder)){
            fs.mkdirSync(outputFolder, { recursive: true });
        }

        let dotForTemplate = "";

        for(const dotFileContent of parsed.dotVersions){
            let writeDotFileContent = dotFileContent.replace(/\\l/gm, "\\\\l");
            dotForTemplate = dotForTemplate + "`\n" + writeDotFileContent + "`,\n";
        }

        const demoOutput = outputTemplate.replace("// INSERT DOT DATA HERE",dotForTemplate);
        try {
            fs.writeFileSync(path.resolve(outputFolder, inputFileName + ".demo.html"), demoOutput);
            // file written successfully
          } catch (err) {
            console.error("ERROR Writing Demo HTML");
            console.error(err);
          }
    });
});
