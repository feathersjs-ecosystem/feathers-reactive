const path = require('path');
const webpack = require('webpack');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');

const isProduction = process.env.NODE_ENV === 'production';
const output = isProduction ? 'feathers-reactive.min.js' : 'feathers-reactive.js';

const config = {
  entry: `./lib`,
  output: {
    library: ['feathers', 'reactive'],
    libraryTarget: 'umd',
    path: path.resolve(__dirname, 'dist'),
    filename: `${output}`
  },
  module: {
    rules: [{
      test: /\.js/,
      exclude: /node_modules\/(?!(@feathersjs))/,
      loader: 'babel-loader'
    }]
  },
  plugins: []
};

if (!isProduction) {
  Object.assign(config, {
    mode: 'development',
    devtool: 'source-map'
  });
} else {
  Object.assign(config, {
    mode: 'production',
    plugins: [new UglifyJSPlugin({
      uglifyOptions: {
        ie8: false,
        comments: false,
        sourceMap: false
      }
    }), new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production')
    })]
  });
}

module.exports = config;
