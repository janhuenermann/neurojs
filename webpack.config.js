var path = require('path')

const config = {
    entry: './src/framework.js',
    output: {
        path: path.resolve(__dirname, 'build'),
        filename: 'neurojs-v2.js'
    },
    // module: {
    //   loaders: [
    //     { test: /\.js$/, exclude: /node_modules/, loader: "babel-loader" }
    //   ]
    // }
}

module.exports = config