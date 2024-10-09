const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
	console.log("dfdf");

    app.use(
		"/api",
        createProxyMiddleware({
            target: "http://localhost:5000/",
            changeOrigin: true
			//pathRewrite: {'^/api' : ''}
        })
    );

};