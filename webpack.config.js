const path = require('path');
const webpack = require('webpack');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const merge = require('webpack-merge');

const isProduction = process.env.NODE_ENV === 'production';
const config = {
  entry: `./lib`,
  output: {
    library: ['feathers', 'reactive'],
    libraryTarget: 'umd',
    path: path.resolve(__dirname, 'dist')
  },
  module: {
    rules: [{
      test: /\.js/,
      exclude: /node_modules\/(?!(@feathersjs|debug|sift))/,
      loader: 'babel-loader',
      options: {
        presets: ['@babel/preset-env']
      }
    }]
  }
};

const dev = {
  mode: 'development',
  devtool: 'source-map',
  output: {
    filename: 'feathers-reactive.js'
  }
};

const prod = {
  mode: 'production',
  output: {
    filename: 'feathers-reactive.min.js'
  },
  plugins: [new UglifyJSPlugin({
    uglifyOptions: {
      ie8: false,
      comments: false,
      sourceMap: false
    }
  }), new webpack.DefinePlugin({
    'process.env.NODE_ENV': JSON.stringify('production')
  })]
};

module.exports = merge(config, isProduction ? prod : dev);
