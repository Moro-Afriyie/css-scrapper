const express = require('express');
const cors = require('cors');
const cheerio = require('cheerio');
const axios = require('axios');
require('dotenv').config();

const app = express();

const port = process.env.PORT || 3030;

app.use(cors());

app.use(express.json());

async function generateStyle(item, baseUrl) {
	try {
		// get all the css codes from the websites and create a style tag for it.. this might take a while to complete depending on the size of the array
		const response = await axios.get(item);
		const data = response.data;
		// check if the link is equal to the base url and copies the head tags because some fonts werent downloaded
		if (item === baseUrl) {
			const $ = cheerio.load(response.data);
			$('script').remove();
			$('meta').remove();
			$('noscript').remove();
			return `<style>${$('head').html()}</style>`;
		} else {
			return `<style>${data}</style>`;
		}
	} catch (error) {
		return '';
	}
}

app.post('/', async (req, res) => {
	const response = await axios.get(req.body.website);
	const websiteHtml = response.data;
	const $ = cheerio.load(websiteHtml);
	const links = [];

	// gets all the links with href in the head tag
	$('head')
		.find('link')
		.attr('href', (item, elem) => {
			if (
				(elem.includes('cdn') ||
					elem.includes('css') ||
					elem === req.body.website ||
					elem.includes('fonts')) &&
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

	const responseFromPromise = await Promise.all([
		...links.map((item) => generateStyle(item, req.body.website)),
	]);

	res.json({
		success: true,
		website: req.body.website,
		// links: links,
		data:
			`<style>@media (min-width: 992px){.product-grid-item-title{width:max-content !important}}</style>` +
			responseFromPromise.join(''),
	});
});

// app.get('/autoimmune', async (req, res) => {
// 	try {
// 		const baseUrl = 'https://autoimmune-institute.com/';
// 		const response = await axios.get(baseUrl);

// 		const websiteHtml = response.data;
// 		const $ = cheerio.load(websiteHtml);
// 		const links = [];

// 		// gets all the links with href in the head tag
// 		$('head')
// 			.find('link')
// 			.attr('href', (item, elem) => {
// 				if (
// 					(elem.includes('cdn') ||
// 						elem.includes('css') ||
// 						elem === baseUrl ||
// 						elem.includes('fonts')) &&
// 					!elem.includes('.png') &&
// 					!elem.includes('.judge') &&
// 					!elem.includes('cdnjs')
// 				) {
// 					if (elem.includes('https') || elem.includes('http')) {
// 						links.push(elem);
// 					} else {
// 						links.push(`https:${elem}`);
// 					}
// 				}
// 			});
// 		res.json({ data: links });
// 	} catch (error) {
// 		console.log('error: ', error);
// 	}
// });

app.listen(port, () => {
	console.log(`server listening on http://localhost:${port}`);
});
