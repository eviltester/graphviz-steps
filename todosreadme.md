create the code to parse a Graphviz file and create a .dot file for each step e.g.
mainfile_step_000.dot

- Everything before the first STEP is included in all diagrams as the start
- Everything after the END directive is included as the end
- Everything in between are STEP sections and DIRECTIVE sections
- By default all STEPs include every previous step unless a directive says not to

All hash comments are processed, as if, they have a directive, if they don't they
are treated as a normal comment in the step.

Directive comments are not output to the output .dot file.

- There can be any number of spaces prior to #
- There can be any number of spaces after # to get to the Directive token (allows for nesting)

- It should process directives in # comments

- # END - marks the end of the diagram included in all steps
- # STEP logical_name (makes easy to refer to later)
- # DISABLE_STEP logical_name - do not include the mentioned STEP in this STEPS output


Todos:

Library:

- [x] read a graphviz dot file as string
- [x] parse dot file and find all the text
- [x] process string of graphviz content for: start, step{number, name, contents}, end
- [x] can output strings for all steps (without processing directives)
- [x] can write strings to .dot files (app poc)
- [x] process directives during output
- [x] DIRECTIVES: STEP, END, IGNORE_STEP x, UNCOMMENT_//
- MILESTONE at this point we have a poc

Self Contained App:

- [] generate a build script that runs graphviz for each of the step files
-  MILESTONE at this point we can create a series of diagrams or a blog post from each diagram

Online Rendering App:

- [x] output the library as a webpacked js for use online
- [x] call graphviz for each of the step files
- [x] generate code to render the 'steps' using d3-graphviz (i.e. skeleton app, plugin the steps)
- MILESTONE at this point we can create videos by opening the render app

Online Rendering App for use by others:

- [] add an editable text area to the app
- [] amend the skeleton app to allow advancing between steps using keys

FUTURE: add more directives and features as required

- [] run as a command line app with graphviz file as an input params
- [] other directives? amend content of a step e.g. to avoid duplicate lines in the graphviz output like highlighting nodes etc.
- [] directive params for online rendering e.g. zoom etc. to use more of d3-graphviz features
