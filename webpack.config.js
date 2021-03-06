"use strict";
var HtmlWebpackPlugin = require('html-webpack-plugin');
var ExtractTextPlugin = require('extract-text-webpack-plugin');

var webpackConfig = {
    entry: ['./app/src/init.js', './app/css/autocomplete.base.css', './app/css/autocomplete.theme.css'],

    output: {path: __dirname + '/dist', filename: "autocompletewoosmap.js", publicPath: ""},

    module: {
        loaders: []
    },

    devServer: {
        disableHostCheck: true
    },

    plugins: [
        new HtmlWebpackPlugin({
            template: 'sample/index.html',
            inject: 'head'
        }),
        new HtmlWebpackPlugin({
            filename: 'address.html',
            template: 'sample/address.html',
            inject: 'head'
        }),
        new HtmlWebpackPlugin({
            filename: 'basic.html',
            template: 'sample/basic.html',
            inject: 'head'
        }),
        new ExtractTextPlugin("autocompletewoosmap.css")
    ]
};
webpackConfig.module.loaders.push({
    test: /\.js$/,
    loader: "eslint-loader",
    exclude: /node_modules/
});
webpackConfig.module.loaders.push({
    test: /\.css$/,
    exclude: /node_modules/,
    loader: ExtractTextPlugin.extract({fallback: "style-loader", use: "css-loader"})
});

module.exports = webpackConfig;