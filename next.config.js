/** @type {import('next').NextConfig} */
const nextConfig = {
	output: 'standalone',

	// comment this out if we change from output: "export"
	images: {
		remotePatterns: [
			{
				protocol: 'https',
				hostname: '*.qal9000.se'
			},
			{
				protocol: 'http',
				hostname: 'localhost',
				port: '3000'
			},
			{
				protocol: 'http',
				hostname: '127.0.0.1',
				port: '3000'
			}
		]
	}

	// Optional: Change links `/me` -> `/me/` and emit `/me.html` -> `/me/index.html`
	// trailingSlash: true,

	// Optional: Prevent automatic `/me` -> `/me/`, instead preserve `href`
	// skipTrailingSlashRedirect: true,

	// Optional: Change the output directory `out` -> `dist`
	// distDir: 'dist'
};

module.exports = nextConfig;

