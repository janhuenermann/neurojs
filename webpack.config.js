var path = require('path')

const config = {
    entry: './src/framework.js',
    output: {
        path: path.resolve(__dirname, 'build'),
        filename: 'neurojs-v2.js'
    },
    mode: "development"
}

module.exports = config
