const path = require('path')

module.exports = (env, argv) => ({
    mode: argv.mode || "development",
    entry: {
        app: "./src/app.ts"
    },
    output: {
        path: path.resolve(__dirname, 'public', 'dist'),
        filename: '[name].js',
        clean: true
    },
    resolve: {
        extensions: ['.ts', 'tsx', '.js']
    },
    devtool: argv.mode === "production" ? false : 'source-map',
    plugins: [],
    module: {
        rules: [{
            test: /\.tsx?$/,
            loader: 'ts-loader',
            exclude: /node_modules/
        }]
    }
})
