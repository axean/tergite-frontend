/** @type {import('next').NextConfig} */
const nextConfig = {
	// Make this a static app
	output: 'export',

	// comment this out if we change from output: "export"
	images: { unoptimized: true },

	// Optional: Change links `/me` -> `/me/` and emit `/me.html` -> `/me/index.html`
	// trailingSlash: true,

	// Optional: Prevent automatic `/me` -> `/me/`, instead preserve `href`
	// skipTrailingSlashRedirect: true,

	// Optional: Change the output directory `out` -> `dist`
	distDir: 'dist'
};

module.exports = nextConfig;

