const path = require('path');
const webpack = require('webpack');
const merge = require('webpack-merge').default;

const isProduction = process.env.NODE_ENV === 'production';
const config = {
  entry: `./lib`,
  output: {
    library: {
      name: ['feathers', 'reactive'],
      type: 'umd'
    },
    path: path.resolve(__dirname, 'dist')
  },
  module: {
    rules: [
      {
        test: /\.js/,
        exclude: /node_modules\/(?!(@feathersjs|debug|sift))/,
        loader: 'babel-loader',
        options: {
          presets: ['@babel/preset-env']
        }
      }
    ]
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
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production')
    })
  ]
};

module.exports = merge(config, isProduction ? prod : dev);
