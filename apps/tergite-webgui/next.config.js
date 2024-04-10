// Exposing a component as page, just name it [].page.tsx
// https://nextjs.org/docs/pages/api-reference/next-config-js/pageExtensions#including-non-page-files-in-the-pages-directory
module.exports = {
	pageExtensions: ['page.tsx', 'page.ts', 'page.jsx', 'page.js'],
	output: 'standalone',
};

