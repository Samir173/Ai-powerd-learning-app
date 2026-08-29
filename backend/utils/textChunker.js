/**
 * Splits raw text into clean chunks using local sentence splitting and smart overlapping.
 * Runs 100% locally on your machine with no network API calls.
 * 
 * @param {string} text - The raw text string from the PDF parser.
 * @param {number} maxChunkSize - Target maximum character size per chunk (default 800).
 * @param {number} overlap - How many characters to repeat from the previous chunk (default 100).
 * @returns {Array<{text: string, chunkIndex: number}>} Clean chunk array.
 */
export const chunkText = (text, maxChunkSize = 800, overlap = 100) => {
  if (!text || text.trim().length === 0) {
    return [];
  }

  // 1. Local String Operation: Split text by sentence endings (. ! ?) using regular expressions
  const sentences = text.split(/(?<=[.?!])\s+/);
  
  const finalChunks = [];
  let currentChunkText = "";
  let chunkIndex = 0;

  for (const sentence of sentences) {
    // Combine existing text chunk buffer with the new sentence
    const testString = currentChunkText ? `${currentChunkText} ${sentence}` : sentence;

    //A. If it safely fits within the configured maxChunkSize
    if (testString.length <= maxChunkSize) {
      currentChunkText = testString;
    } else {
      // B. Save the text buffer before it spills over your limit
      if (currentChunkText.trim()) {
        finalChunks.push({
          text: currentChunkText.trim(),
          chunkIndex: chunkIndex++
        });

        // LOCAL OVERLAP LOGIC: Extract trailing characters safely
        const lookbackLength = Math.min(currentChunkText.length, overlap);
        
        // Start the next chunk using the end of the previous chunk for natural context flow
        currentChunkText = currentChunkText.slice(-lookbackLength) + " " + sentence;
      } else {
        // C. Hard-slicing fallback for sentences that exceed maxChunkSize
        let i = 0;
        while (i < sentence.length) {
          const hardSlice = sentence.slice(i, i + maxChunkSize);
          finalChunks.push({
            text: hardSlice.trim(),
            chunkIndex: chunkIndex++
          });
          i += (maxChunkSize - overlap) > 0 ? (maxChunkSize - overlap) : maxChunkSize;
        }
        currentChunkText = "";
      }
    }
  }

  // 2. Clear out any remaining trailing text blocks
  if (currentChunkText.trim()) {
    finalChunks.push({
      text: currentChunkText.trim(),
      chunkIndex: chunkIndex++
    });
  }

  return finalChunks;
};