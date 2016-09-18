module.exports = {
    entry: __dirname + "/src/framework.js",
    output: {
        path: __dirname,
        filename: "build/neurojs-v2.js"
    },
    module: {
  loaders: [
    { test: /\.js$/, exclude: /node_modules/, loader: "babel-loader" }
  ]
}
};