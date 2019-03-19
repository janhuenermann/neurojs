var path = require('path')

const config = {
    entry: './src/entry.js',
    output: {
        path: path.resolve(__dirname, 'build'),
        filename: 'bundle.js'
    },
    mode: "development",
    devtool: false
}

module.exports = config
