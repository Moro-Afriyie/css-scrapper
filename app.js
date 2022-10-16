const express = require('express');
const cors = require('cors');
const cheerio = require('cheerio');
const axios = require('axios');

const app = express();

const port = 8080;

app.use(cors());

const scrappingURL = 'https://thejellybee.com/';

async function generateStyle(item) {
	// get all the css codes from the websites and create a style tag for it.. this might take a while to complete depending on the size of the array
	const response = await axios.get(item);
	const data = response.data;
	return `<style>${data}</style>`;
}

app.get('/', async (req, res) => {
	const response = await axios.get(scrappingURL);
	const websiteHtml = response.data;
	const $ = cheerio.load(websiteHtml);
	const links = [];

	// gets all the links with href in the head tag
	$('head')
		.find('link')
		.attr('href', (item, elem) => {
			if (
				(elem.includes('cdn') || elem.includes('.css')) &&
				!elem.includes('.png') &&
				!elem.includes('.judge') &&
				!elem.includes('cdnjs')
			) {
				if (elem.includes('https') || elem.includes('http')) {
					links.push(elem);
				} else {
					links.push(`https:${elem}`);
				}
			}
		});

	const responseFromPromise = await Promise.all([...links.map((item) => generateStyle(item))]);

	res.json({
		success: true,
		website: scrappingURL,
		data: '<style>body, html{height: auto !important;}</style>' + responseFromPromise.join(''),
	});
});

app.listen(port, () => {
	console.log(`server listening on http://localhost:${port}`);
});
