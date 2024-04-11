import { Ai } from './vendor/@cloudflare/ai.js';
import { fetchVideoHTML } from './fetch_transcriptions.js';
import { AutoRouter } from 'itty-router';
const { XMLParser } = require('fast-xml-parser');
import { splitTextIntoBlocks } from './utils.js';
import HTML from './chat.html'

const fs = require('fs');
const router = AutoRouter();
const he = require('he');

router.get('/', ({ params }, env) => {
	
	return new Response(HTML, {
		headers: {
			'content-type': 'text/html;charset=UTF-8',
		},
	});
});

router.get('/yt-captions/:video_id', async ({ params }, env) => {
	try {
		let video_id = decodeURIComponent(params.video_id);

		const regex = /<text[^>]*>(.*?)<\/text>/g;

		const tasks = [];
		const ai = new Ai(env.AI);

		// * fetching captions
		let captionUrl = await fetchVideoHTML(video_id);
		let data = await fetch(captionUrl);
		let captions = await data.text();
		let xml_to_json = new XMLParser().parse(captions);

		// * converting time starts to single transcribe
		let transcription = he.decode(xml_to_json.transcript.text.join(' ')).replace(/(?:\r\n|\r|\n)/g, ' ');

		// * breaking down to chunks of 2000 character.
		let blocks = splitTextIntoBlocks(transcription, 2000);
		let blocks_summary = [];

		// * summary of transcription
		for (let block of blocks) {
			const input_text = block;
			const summary = await ai.run('@cf/facebook/bart-large-cnn', { input_text });
			blocks_summary.push(summary.summary);
		}
		let summary_responses = blocks_summary;

		return Response.json({ video_id: video_id, captions: transcription, summaries: summary_responses });
	} catch (error) {
		console.log(error);
		return Response.json(error.toString(), { status: 500 });
	}
});

export default { ...router };
