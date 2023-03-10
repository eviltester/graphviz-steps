
import { dotLineSplit, getDirectiveFromLine, getStartStepsEnd, GraphvizStepParser } from "./graphvizStepParser";

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
        expect(parser.dotVersions.length).toBe(0);
    });
    
    it('can parse a simple file', () => {
        const parser = new GraphvizStepParser();
        parser.parse(simpleGraphvizDiagram);
        expect(parser.dotVersions.length).toBe(2); // step 0 (start+end) and start+step 1+end i.e. (add c)
        expect(parser.dotVersions[0]).toBe(`
digraph G {
    a -> b
    b -> end
}
`);
        expect(parser.dotVersions[1]).toBe(`
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
        expect(parser.dotVersions.length).toBe(3);
        expect(parser.dotVersions[0]).toBe(`
digraph G {
    a -> b
    b -> end
}
`);
        expect(parser.dotVersions[1]).toBe(`
digraph G {
    a -> b
    a -> c
    c -> b
    b -> end
}
`);
expect(parser.dotVersions[2]).toBe(`
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
        expect(parser.dotVersions.length).toBe(3);
        expect(parser.dotVersions[0]).toBe(`
digraph G {
    a -> b
    b -> end
}
`);
        expect(parser.dotVersions[1]).toBe(`
digraph G {
    a -> b
    a -> c
    c -> b
    b -> end
}
`);
expect(parser.dotVersions[2]).toBe(`
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


    const directiveGraphvizDiagram =`
    digraph G {
        a -> b
        # STEP add c
        #    UNCOMMENT_//
    //    a -> c
        # DIRECTIVE
        #  DISABLE_STEP add c
        # STEP add d
        a -> d
        # END
        a -> e
    }`;

    
    it('can parse a multi step dot file with directives that change included steps', () => {
        const parser = new GraphvizStepParser();
        parser.parse(directiveGraphvizDiagram);
        expect(parser.dotVersions.length).toBe(3);
        expect(parser.dotVersions[0]).toBe(`
    digraph G {
        a -> b
        a -> e
    }
`);
        expect(parser.dotVersions[1]).toBe(`
    digraph G {
        a -> b
        a -> c
        a -> e
    }
`);
expect(parser.dotVersions[2]).toBe(`
    digraph G {
        a -> b
        a -> d
        a -> e
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
        expect(getDirectiveFromLine("# STEP - this is step 1").name).toBe("STEP");
        expect(getDirectiveFromLine("# STEP - ").name).toBe("STEP");
        expect(getDirectiveFromLine("# STEP -").name).toBe("STEP");
        expect(getDirectiveFromLine("# STEP   ").name).toBe("STEP");
        expect(getDirectiveFromLine("# STEP").name).toBe("STEP");
        expect(getDirectiveFromLine("# END - this is the end").name).toBe("END");
        expect(getDirectiveFromLine("# END - ").name).toBe("END");
        expect(getDirectiveFromLine("# END -").name).toBe("END");
        expect(getDirectiveFromLine("# END").name).toBe("END");
    })

});

