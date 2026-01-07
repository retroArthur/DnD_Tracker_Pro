// Webpack Configuration for D&D Tracker
// Modern build system with optimization

const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');

module.exports = (env, argv) => {
    const isProduction = argv.mode === 'production';
    
    return {
        entry: './loader.js',
        
        output: {
            path: path.resolve(__dirname, 'dist-webpack'),
            filename: isProduction ? 'bundle.[contenthash].js' : 'bundle.js',
            clean: true,
        },
        
        module: {
            rules: [
                {
                    test: /\.css$/i,
                    use: ['style-loader', 'css-loader'],
                },
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
                        test: /[\\/]node_modules[\\/]/,
                        name: 'vendors',
                        priority: 10,
                    },
                    core: {
                        test: /[\\/]core[\\/]/,
                        name: 'core',
                        priority: 5,
                    },
                    features: {
                        test: /[\\/]features[\\/]/,
                        name: 'features',
                        priority: 3,
                    },
                },
            },
        },
        
        devtool: isProduction ? 'source-map' : 'eval-source-map',
        
        devServer: {
            static: {
                directory: path.join(__dirname, 'assets'),
            },
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
