// SECTION MARKERS
const stepMatcher = {name: "STEP", regex: /^(\s)*STEP([\s-]*)([\w \d]*)?(\s)*$/};
const endMatcher = {name: "END", regex: /^(\s)*END([\s-]*)?([\w \d]*)?(\s)*$/};
const directiveMatcher = {name: "DIRECTIVE", regex: /^(\s)*DIRECTIVE([\s-]*)?([\w \d]*)?(\s)*$/};

// INLINE STEP DIRECTIVES
const uncommentContentMatcher = {name: "UNCOMMENT_//", regex: /^(\s)*UNCOMMENT_\/\/(\s)*$/};

// GLOBALLY ACTING 
const disableStepMatcher = {name: "DISABLE_STEP", regex: /^(\s)*DISABLE_STEP([\s-]*)([\w \d]*)?(\s)*$/};
const enableStepMatcher = {name: "ENABLE_STEP", regex: /^(\s)*ENABLE_STEP([\s-]*)([\w \d]*)?(\s)*$/};

const directiveMatchers = [
                            stepMatcher,
                            endMatcher,
                            directiveMatcher,
                            uncommentContentMatcher,
                            disableStepMatcher,
                            enableStepMatcher
                        ];


export function dotLineSplit(dot: string): string[]{
    return dot.split("\n");
}

function isDirective(line: string) {
    return getDirectiveFromLine(line)!=NO_DIRECTIVE_MATCH;
}

export function getDirectiveFromLine(line: string): DirectiveInstance{
    const lineToCheck = line.trim();

    if(!lineToCheck.startsWith("#")){
        return NO_DIRECTIVE_MATCH;
    }

    // remove # and any trailing or leading spaces
    const directiveText = lineToCheck.substring(1).trim();
    const directive = getDirective(directiveText);
    return directive;
}

export function getDirective(text: string): DirectiveInstance{
    
    for (const matcher of directiveMatchers){
        const match = text.match(matcher.regex);
        if(match!=null){
            return new DirectiveInstance(matcher.name, text, match);
        }
    };

    return NO_DIRECTIVE_MATCH;
}

export function getStartStepsEnd(lines: string[]) : {start: string; steps: GraphvizStep[]; end: string} {

    let start ="";
    let steps: GraphvizStep[] = [];
    let end = "";

    let state = "START";
    let collation = "";
    let currentStep = new GraphvizStep();

    lines.forEach(line => {

        // is it a directive?
        if(isDirective(line)){
            const directive = getDirectiveFromLine(line);
            switch (directive.name) {
                case "STEP":
                    // found a step so start a new STEP
                    if(state=="STEP"){
                        
                        currentStep.content=collation;
                        steps.push(currentStep);

                        currentStep=new GraphvizStep();
                        currentStep.name=directive.getContent();
                        collation="";
                        state="STEP";
                    }
                    // end of start state
                    if(state=="START"){
                        start=collation;
                        collation="";
                        state="STEP";

                        // start of new step
                        currentStep=new GraphvizStep();
                        currentStep.name=directive.getContent();
                    }                    
                    break;
                case "DIRECTIVE":
                    // found a directive so start a new STEP of type DIRECTIVE
                    if(state=="STEP"){
                        
                        currentStep.content=collation;
                        steps.push(currentStep);

                        currentStep=new GraphvizStep();
                        currentStep.name=directive.getContent();
                        currentStep.type="DIRECTIVE";
                        collation="";
                        state="STEP";
                    }
                    // end of start state
                    if(state=="START"){
                        start=collation;
                        collation="";
                        state="STEP";

                        currentStep=new GraphvizStep();
                        currentStep.type="DIRECTIVE";
                        currentStep.name=directive.getContent();
                    }                    
                    break;                    
                case "END":
                    if(state=="STEP"){
                        
                        currentStep.content=collation;
                        steps.push(currentStep);

                        currentStep=new GraphvizStep();
                        currentStep.name=directive.getContent();
                        collation="";
                        state="END";
                    }
                    if(state=="START"){
                        start=collation;
                        collation="";
                        state="END";
                    }            
                    break;
                default:
                    // must be an inline directive for a section
                    currentStep.directives.push(directive);
                    break;
            }
        }else{
            // add line to collation
            collation = collation + line + "\n";
        }
    });

    if(collation.length>0){
        if(state=="START"){
            // could add to either start or end
            start = collation;
        }
        if(state=="END"){
            end = collation;
        }
        if(state=="STEP"){
            // big of a problem we are likely to create an invalid graph
            console.log("graph has steps but no END so likely to be malformed output, last STEP will default to END");
            // minimise the impact of the malformed steps
            // note this means that any final directives will not be processed
            end = collation;
        }
    }

    return {start, steps, end};
}



export class DirectiveInstance{
    name: string;
    unparsed: string;
    parsed?: RegExpMatchArray;

    constructor(name:string , original:string, matchedResult?: RegExpMatchArray) {
        this.name = name;
        this.unparsed = original;
        this.parsed = matchedResult;
    }

    getContent(){
        if(this.parsed && this.parsed.length>=4){
            return this.parsed.at(3) ?? "";
        }
        return "";
    }
}

const NO_DIRECTIVE_MATCH = new DirectiveInstance("","");

export class GraphvizStep{
    type: string; // todo make a specific type or enum
    name: string;
    content: string;
    directives: DirectiveInstance[];
    enabled: boolean;

    constructor() {
        this.type = "STEP"; // might also be DIRECTIVE
        this.name = "";
        this.content = "";
        this.directives = [];
        this.enabled=true;
    }

    getProcessedContent(){
        // apply any directives to the content
        let outputContent = this.content;
        for(const directive of this.directives){
            if(directive.name=="UNCOMMENT_//"){
                // remove all comment lines from the content
                let lines = outputContent.split("\n");
                lines = lines.map((line) =>{
                    if(line.trim().startsWith("//")){
                        return line.replace("//", "");
                    }else{
                        return line;
                    }
                })
                outputContent = lines.join("\n");
            }
        }
        return outputContent;
    }
}

export class GraphvizStepParser{
    dotVersions: string[];

    constructor() {
        this.dotVersions = [];
    }

    parse(dot: string): void {

        const dotLines = dotLineSplit(dot);
        const {start, steps, end} = getStartStepsEnd(dotLines);

        this.dotVersions.push(start + end);
        let stepsToInclude = 0;
        steps.forEach(step => {
            let currStep=0;
            let stepDot = "";

            if(steps[stepsToInclude].type=="DIRECTIVE"){
                // process the global acting directives
                processStepDirectives(steps[stepsToInclude].directives,steps, stepsToInclude);
            }

            while(currStep <= stepsToInclude){
                if(steps[currStep].type=="STEP" && steps[currStep].enabled){
                    // only include STEP content in output
                    stepDot = stepDot + steps[currStep].getProcessedContent();
                }                
                currStep++;                
            }
            if(step.type=="STEP"){
                // only generate a dot file for STEPs
                this.dotVersions.push(start + stepDot + end);
            }
            
            stepsToInclude++;
        });
    }
}


function processStepDirectives(directives: DirectiveInstance[], steps: GraphvizStep[], stepsToInclude: number) {
    // for each step being processed
    for(let index=0; index<=stepsToInclude; index++){
        const step = steps[index];
        for(const directive of directives){
            if(directive.name=="DISABLE_STEP"){
                if(step.type=="STEP" && step.name==directive.getContent()){
                    step.enabled=false;
                }
            }
            if(directive.name=="ENABLE_STEP"){
                if(step.type=="STEP" && step.name==directive.getContent()){
                    step.enabled=true;
                }
            }       
        }        
    }
}


