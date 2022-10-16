const express = require('express');
const cors = require('cors');
const cheerio = require('cheerio');
const axios = require('axios');

const app = express();

const port = 8080;

app.use(cors());

app.use(express.json());

async function generateStyle(item, baseUrl) {
	// get all the css codes from the websites and create a style tag for it.. this might take a while to complete depending on the size of the array
	const response = await axios.get(item);
	const data = response.data;
	// check if the link is equal to the base url and copies the head tags because some fonts werent downloaded
	if (item === baseUrl) {
		const $ = cheerio.load(response.data);
		$('script').remove();
		$('meta').remove();
		$('noscript').remove();
		console.log('data: ', $('head').html());
		return `<style>${$('head').html()}</style>`;
	} else {
		return `<style>${data}</style>`;
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
			if (!elem.includes('.png') && !elem.includes('.judge') && !elem.includes('cdnjs')) {
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
		links: links,
		data:
			`<style>.product-grid-item-title{width:max-content !important}</style>` +
			responseFromPromise.join(''),
	});
});

app.listen(port, () => {
	console.log(`server listening on http://localhost:${port}`);
});
