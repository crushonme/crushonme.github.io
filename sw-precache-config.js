module.exports = {
  staticFileGlobs: [
    '!_site/service-worker.js',
	'_site/assets/**/**.*',
    '_site/images/**/**.*', 
	'_site/open-source/**.*',
	'_site/categories/**.*',
	'_site/archives/**.*',
    '_site/favicon.ico',
    '_site/**/*.json',
  ],
  stripPrefix: '_site'
};