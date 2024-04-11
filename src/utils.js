export function splitTextIntoBlocks(text, blockSize) {
	const sentences = text.split(/[.!?]/);
	const blocks = [];
	let currentBlock = '';

	sentences.forEach((sentence) => {
		if (currentBlock.length + sentence.length <= blockSize) {
			currentBlock += sentence + '.';
		} else {
			blocks.push(currentBlock.trim());
			currentBlock = sentence + '.';
		}
	});

	if (currentBlock.length > 0) {
		blocks.push(currentBlock.trim());
	}

	return blocks;
}
