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

  // Make sure overlap is smaller than the chunk size
  const safeOverlap = Math.min(overlap, Math.floor(maxChunkSize * 0.5));

  // Clean extra spaces
  const cleanedText = text.replace(/\s+/g, " ").trim();

  // Split cleaned text into sentences
  const sentences = cleanedText.split(/(?<=[.?!])\s+/);

  const finalChunks = [];
  let currentChunkText = "";
  let chunkIndex = 0;

  // Helper function to save chunks
  const saveChunk = (chunk) => {
    if (chunk && chunk.trim()) {
      finalChunks.push({
        text: chunk.trim(),
        chunkIndex: chunkIndex++,
      });
    }
  };

  for (const sentence of sentences) {
    const cleanSentence = sentence.trim();

    // Skip empty sentences
    if (!cleanSentence) {
      continue;
    }

    // -----------------------------------
    // A. Handle sentences larger than maxChunkSize
    // -----------------------------------
    if (cleanSentence.length > maxChunkSize) {
      // Save the current chunk first
      if (currentChunkText.trim()) {
        saveChunk(currentChunkText);
        currentChunkText = "";
      }

      let start = 0;

      // Move forward by maxChunkSize - overlap
      const step = Math.max(maxChunkSize - safeOverlap, 1);

      while (start < cleanSentence.length) {
        const chunk = cleanSentence.slice(start, start + maxChunkSize);

        // Stop when we reach the end
        if (start + maxChunkSize >= cleanSentence.length) {
          currentChunkText = chunk;
          break;
        }
        // Save the chunk and move forward
        saveChunk(chunk);
        start += step;
      }

      continue;
    }

    // -----------------------------------
    // B. Try adding the sentence to current chunk
    // -----------------------------------
    const testString = currentChunkText
      ? `${currentChunkText} ${cleanSentence}`
      : cleanSentence;

    if (testString.length <= maxChunkSize) {
      // Sentence fits inside the current chunk
      currentChunkText = testString;
    } else {
      // -----------------------------------
      // C. Current chunk is full, save it
      // -----------------------------------
      saveChunk(currentChunkText);

      // Calculate how much overlap can fit
      const availableSpace = maxChunkSize - cleanSentence.length - 1;

      const lookbackLength = Math.min(
        currentChunkText.length,
        safeOverlap,
        Math.max(0, availableSpace),
      );

      // Start the next chunk with overlap + new sentence
      if (lookbackLength > 0) {
        currentChunkText =
          currentChunkText.slice(-lookbackLength) + " " + cleanSentence;
      } else {
        currentChunkText = cleanSentence;
      }
    }
  }

  // Save remaining text
  if (currentChunkText.trim()) {
    saveChunk(currentChunkText);
  }

  return finalChunks;
};
