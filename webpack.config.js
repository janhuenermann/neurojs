var path = require('path')
var srcPath = path.resolve(__dirname, './src/')

const config = {
  entry: './src/framework.js',
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: 'neurojs-v2.js'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        enforce: 'pre',
        loader: 'eslint-loader',
        exclude: /node_modules/,
        include: srcPath
      },
      {
        test: /\.js$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
        include: srcPath
      }
    ]
  }
  // webpack2.2 remove preloader and loader option, use rules.
  // module: {
  //   loaders: [
  //     { test: /\.js$/, exclude: /node_modules/, loader: "babel-loader" }
  //   ]
  // }
}

module.exports = config
