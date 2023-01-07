
export function dotLineSplit(dot: string): string[]{
    return dot.split("\n");
}

function isDirective(line: string) {
    const lineToCheck = line.trim();

    if(!lineToCheck.startsWith("#")){
        return false;
    }

    // remove # and any spaces
    const directiveText = lineToCheck.substring(1).trim();

    if(directiveText.startsWith("STEP ") || directiveText.startsWith("END")){
        return true;
    }

    return false;
}

function getDirectiveName(line: string){
    const lineToCheck = line.trim();

    if(!lineToCheck.startsWith("#")){
        return "";
    }

    // remove # and any spaces
    const directiveText = lineToCheck.substring(1).trim();

    if(directiveText.startsWith("STEP ")){
        return "STEP";
    }
    if(directiveText.startsWith("END")){
        return "END";
    }

    return "";
}

export function getStartStepsEnd(lines: string[]) : {start: string; steps: string[]; end: string} {

    let start ="";
    let steps: string[] = [];
    let end = "";

    let state = "START";
    let collation = "";

    lines.forEach(line => {

        // is it a directive?
        if(isDirective(line)){
            const directiveName = getDirectiveName(line);
            switch (directiveName) {
                case "STEP":
                    // found a step so start a new STEP
                    if(state=="STEP"){
                        steps.push(collation);
                        collation="";
                        state="STEP";
                    }
                    // end of start state
                    if(state=="START"){
                        start=collation;
                        collation="";
                        state="STEP";
                    }                    
                    break;
                case "END":
                    if(state=="STEP"){
                        steps.push(collation);
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
                    console.log("unhandled directive " + directiveName);
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
            end = collation;
        }
    }

    return {start, steps, end};
}

export class GraphvizStepParser{
    steps: string[];

    constructor() {
        this.steps = [];
    }

    parse(dot: string): void {

        const dotLines = dotLineSplit(dot);
        const {start, steps, end} = getStartStepsEnd(dotLines);

        this.steps.push(start + end);
        let stepsToInclude = 0;
        steps.forEach(step => {
            let currStep=0;
            let stepDot = "";
            while(currStep <= stepsToInclude){
                stepDot = stepDot + steps[currStep];
                currStep++;                
            }
            this.steps.push(start + stepDot + end);
            stepsToInclude++;
        });
    }
}


