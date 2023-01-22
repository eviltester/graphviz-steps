const path = require('path');

module.exports = {
  entry: './build/cjs/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'graphviz-step-parser.js',
    library: {
        name: 'GraphvizSteps',
        type: 'umd',
        umdNamedDefine: true,
    }
  },
};