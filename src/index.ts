// create the code to parse a Graphviz file and create a .dot file for each step e.g.
// mainfile_step_000.dot

/*
    Everything before the first STEP is included in all diagrams as the start
    Everything after the END directive is included as the end
    Everything in between are STEP sections and INALL sections
    By default all STEPs include every previous step unless a directive says not to

    All hash comments are processed, as if, they have a directive, if they don't they
    are treated as a normal comment in the step.

    Directive comments are not output to the output .dot file.

    There can be any number of spaces prior to #
    There can be any number of spaces after # to get to the Directive token (allows for nesting)

    It should process directives in # comments

    # END - marks the end of the diagram included in all steps
    # STEP logical_name (makes easy to refer to later)
    # IGNORE_STEP logical_name - do not include the mentioned STEP in this STEPS output

    e.g.

*/

// read a graphviz file
// parse file and find all the text
// process string of graphviz content for: start, step{number, name, contents}, end
// output strings for all steps (without processing directives)
// write strings to .dot files
// process directives during output
// MILESTONE at this point we have a poc
// generate a build script that runs graphviz for each of the step files
// MILESTONE at this point we can create a series of diagrams or a blog post from each diagram
// call graphviz for each of the step files
// generate code to render the 'steps' using d3-graphviz (i.e. skeleton app, plugin the steps)
// MILESTONE at this point we can create videos by opening the render app
// amend the skeleton app to allow advancing between steps using keys
// FUTURE: add more directives and features as required
// - run as a command line app with graphviz file as an input params
// - etc.