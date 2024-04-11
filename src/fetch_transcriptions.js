function extractCaptionsJSON(html, videoId) {
	const splittedHTML = html.split('"captions":');
	if (splittedHTML.length <= 1) {
		if (videoId.startsWith('http://') || videoId.startsWith('https://')) {
			throw new Error('invalid video');
		}
		if (html.includes('class="g-recaptcha"')) {
			throw new Error('too many requests');
		}
		if (!html.includes('"playabilityStatus":')) {
			throw new Error('invalid video');
		}
		throw new Error('transcription disabled');
	}

	const captionsJSON = JSON.parse(splittedHTML[1].split(',"videoDetails"')[0].replace('\\n', '')).playerCaptionsTracklistRenderer;

	if (!captionsJSON) {
		throw new Error('trans');
	}

	if (!('captionTracks' in captionsJSON)) {
		throw new Error('Non transcription available');
	}

	return captionsJSON;
}

function fetchHTML(videoId, consent_cookie) {
	return fetch('https://www.youtube.com/watch?v={video_id}'.replace('{video_id}', videoId), {
		headers: {
			'Accept-Language': 'en-US',
		},
	}).then((response) => response.text());
}

export function fetchVideoHTML(videoId) {
	return fetchHTML(videoId)
		.then((html) => {
			if (html.includes('action="https://consent.youtube.com/s"')) {
				throw 'consent cookie issue, Pls try again later.';
			}
			return html;
		})
		.then((html) => {
			return extractCaptionsJSON(html, videoId);
		})
		.then((captionData) => captionData.captionTracks[0].baseUrl);
}
