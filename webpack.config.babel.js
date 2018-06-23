import webpack from 'webpack';
import path from 'path';

export default {
	context: path.resolve(__dirname, 'app'),
	entry: {
		app: './app.js'
	},

	output: {
		publicPath: 'dist/',
		path: path.resolve(__dirname, 'dist'),
		filename: '[name].js'
	},

	module: {
		rules: [
			{
				test: /\.js$/,
				use: {
					loader: 'babel-loader'
				}
			}
		]
	},

	optimization: {
	  splitChunks: {
	    name: 'vendors',
      chunks: 'all'
    }
  }
}
