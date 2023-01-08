import { dir } from "console";
import { dotLineSplit, getDirectiveName, getStartStepsEnd, GraphvizStepParser } from "./graphvizStepParser";

const simpleGraphvizDiagram =`
digraph G {
    a -> b
    # STEP add c
    a -> c
    c -> b
    # END
    b -> end
}`;

const simpleTwoStepGraphvizDiagram =`
digraph G {
    a -> b
    # STEP add c
    a -> c
    c -> b
    # STEP add d
    a -> d
    d -> b
    # END
    b -> end
}`;



describe("Basic Parser Functionality", () => {

    it("by default has no data", ()=>{
        const parser = new GraphvizStepParser();
        expect(parser.steps.length).toBe(0);
    });
    
    it('can parse a simple file', () => {
        const parser = new GraphvizStepParser();
        parser.parse(simpleGraphvizDiagram);
        expect(parser.steps.length).toBe(2); // step 0 (start+end) and start+step 1+end i.e. (add c)
        expect(parser.steps[0]).toBe(`
digraph G {
    a -> b
    b -> end
}
`);
        expect(parser.steps[1]).toBe(`
digraph G {
    a -> b
    a -> c
    c -> b
    b -> end
}
`);
    });

    it('can parse a multi step dot file', () => {
        const parser = new GraphvizStepParser();
        parser.parse(simpleTwoStepGraphvizDiagram);
        expect(parser.steps.length).toBe(3);
        expect(parser.steps[0]).toBe(`
digraph G {
    a -> b
    b -> end
}
`);
        expect(parser.steps[1]).toBe(`
digraph G {
    a -> b
    a -> c
    c -> b
    b -> end
}
`);
expect(parser.steps[2]).toBe(`
digraph G {
    a -> b
    a -> c
    c -> b
    a -> d
    d -> b
    b -> end
}
`);
    });

    it('can handle a malformed multi step dot file with missing END', () => {
        const parser = new GraphvizStepParser();
        parser.parse(simpleTwoStepGraphvizDiagram.replace("# END", "# STEP end step"));
        expect(parser.steps.length).toBe(3);
        expect(parser.steps[0]).toBe(`
digraph G {
    a -> b
    b -> end
}
`);
        expect(parser.steps[1]).toBe(`
digraph G {
    a -> b
    a -> c
    c -> b
    b -> end
}
`);
expect(parser.steps[2]).toBe(`
digraph G {
    a -> b
    a -> c
    c -> b
    a -> d
    d -> b
    b -> end
}
`);
    });
});

describe("Basic Parser Functions", () => {

    it("can split a dot file into lines", ()=>{
        const lines = dotLineSplit(simpleGraphvizDiagram);
        expect(lines.length).toBe(9);
    });

    it("can group lines into start, steps and end", ()=>{
        const {start, steps, end} = getStartStepsEnd(dotLineSplit(simpleGraphvizDiagram));
        expect(start).toBe(`
digraph G {
    a -> b
`);
        expect(steps.length).toBe(1);
        expect(end).toBe(`    b -> end
}
`); 
    });

    it("can match directives", ()=>{
        expect(getDirectiveName("# STEP - this is step 1")).toBe("STEP");
        expect(getDirectiveName("# STEP - ")).toBe("STEP");
        expect(getDirectiveName("# STEP -")).toBe("STEP");
        expect(getDirectiveName("# STEP   ")).toBe("STEP");
        expect(getDirectiveName("# STEP")).toBe("STEP");
        expect(getDirectiveName("# END - this is the end")).toBe("END");
        expect(getDirectiveName("# END - ")).toBe("END");
        expect(getDirectiveName("# END -")).toBe("END");
        expect(getDirectiveName("# END")).toBe("END");
    })

});

