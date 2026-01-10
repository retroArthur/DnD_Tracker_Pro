// Webpack Configuration for D&D Tracker
// TypeScript Migration: Updated for TypeScript + ES Modules

const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');

module.exports = (env, argv) => {
    const isProduction = argv.mode === 'production';

    return {
        // Post-Migration: Entry point is main.js (loads loader.js)
        entry: './main.js',

        output: {
            path: path.resolve(__dirname, '../dist'),
            filename: isProduction ? 'bundle.[contenthash].js' : 'bundle.js',
            clean: true,
        },

        module: {
            rules: [
                {
                    test: /\.css$/i,
                    use: ['style-loader', 'css-loader'],
                },
                // TypeScript files
                {
                    test: /\.tsx?$/,
                    use: 'ts-loader',
                    exclude: /node_modules/,
                },
                // JavaScript files (for gradual migration with allowJs)
                {
                    test: /\.js$/,
                    exclude: /node_modules/,
                    use: {
                        loader: 'babel-loader',
                        options: {
                            presets: ['@babel/preset-env']
                        }
                    }
                }
            ],
        },

        // Resolve TypeScript, JavaScript, and their extensions
        resolve: {
            extensions: ['.tsx', '.ts', '.js'],
            alias: {
                '@core': path.resolve(__dirname, '../core'),
                '@utils': path.resolve(__dirname, '../utils'),
                '@features': path.resolve(__dirname, '../features'),
                '@ui': path.resolve(__dirname, '../ui'),
                '@types': path.resolve(__dirname, '../types'),
                '@systems': path.resolve(__dirname, '../systems'),
                '@render': path.resolve(__dirname, '../render'),
            }
        },

        plugins: [
            new HtmlWebpackPlugin({
                template: './index.html',
                inject: 'body',
                minify: isProduction ? {
                    collapseWhitespace: true,
                    removeComments: true,
                    removeRedundantAttributes: true,
                    useShortDoctype: true,
                } : false,
            }),
        ],

        optimization: {
            minimize: isProduction,
            minimizer: [
                new TerserPlugin({
                    terserOptions: {
                        compress: {
                            drop_console: isProduction,
                        },
                    },
                }),
                new CssMinimizerPlugin(),
            ],
            splitChunks: {
                chunks: 'all',
                cacheGroups: {
                    vendor: {
                        test: /[\/]node_modules[\/]/,
                        name: 'vendors',
                        priority: 10,
                    },
                    core: {
                        test: /[\/](src[\/])?core[\/]/,
                        name: 'core',
                        priority: 5,
                    },
                    features: {
                        test: /[\/](src[\/])?features[\/]/,
                        name: 'features',
                        priority: 3,
                    },
                },
            },
        },

        devtool: isProduction ? 'source-map' : 'eval-source-map',

        devServer: {
            static: [
                {
                    directory: path.join(__dirname, '../assets'),
                },
                {
                    directory: path.join(__dirname, '..'),
                }
            ],
            compress: true,
            port: 8080,
            hot: true,
            open: true,
        },

        performance: {
            hints: isProduction ? 'warning' : false,
            maxAssetSize: 500000,  // 500 KB
            maxEntrypointSize: 500000,
        },

        stats: {
            colors: true,
            modules: false,
            children: false,
        },
    };
};
