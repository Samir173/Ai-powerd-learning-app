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
        content: chunk.trim(),
        pageNumber: 0,
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

/** Find relevant chunks based on keyword matching
 * @param {Array<Object>} chunks
 * @param {string} query
 * @param {number} maxChunks
 * @returns {Array<Object<}
 */
export const findRelevantChunks = (chunks, query, maxChunks = 3) => {
  if (!chunks || chunks.length === 0 || !query) {
    return [];
  }
  //Common stop words to exclude
  const stopWords = new Set([
    "the",
    "is",
    "in",
    "and",
    "to",
    "a",
    "of",
    "that",
    "it",
    "on",
    "for",
    "with",
    "as",
    "this",
    "by",
    "an",
    "be",
    "are",
    "or",
    "from",
  ]);
  //extract and clean query words
  const queryWords = query
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 2 && !stopWords.has(word));
  if (queryWords.length === 0) {
    return chunks.slice(0, maxChunks).map((chunk) => ({
      content: chunk.content,
      chunkIndex: chunk.chunkIndex,
      pageNumber: chunk.pageNumber,
      _id: chunk._id,
    }));
  }
  const scoredChunks = chunks.map((chunk, index) => {
    const content = chunk.content.toLowerCase();
    const contentWords = content.split(/\s+/).length;
    let score = 0;
    // Check every query word
    for (const word of queryWords) {
       const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      //Exact word match
      const exactMatches = (
        content.match(new RegExp(`\\b${escapedWord}\\b`, "g")) || []
      ).length;
      score += exactMatches * 3;

      //Partial match
      const partialMatches = (
        content.match(new RegExp(escapedWord, "g")) || []
      ).length;
      score += Math.max(0, partialMatches - exactMatches) * 1.5;
    }
    //Multiple word found 
    const uniqueWordsFound = queryWords.filter(word => 
      content.includes(word)
    ).length;
    if (uniqueWordsFound > 1){
      score += uniqueWordsFound *2;
    }
    const normalizedScore = score / Math.sqrt(contentWords);
    const positionBouns = 1- (index / chunks.length) * 0.1;
    return{
      content: chunk.content,
      chunkIndex: chunk.chunkIndex,
      pageNumber: chunk.pageNumber,
      _id: chunk._id,
      score: normalizedScore * positionBouns,
      rawScore: score,
      matchedWords: uniqueWordsFound
    };
  });

  return scoredChunks
    .filter(chunk => chunk.score > 0)
    .sort ((a,b) => {
      if(b.score !== a.score){
        return b.score - a.score
      }
      if(b.matchedWords !== a.matchedWords){
        return b.matchedWords - a.matchedWords
      }
      return a.chunkIndex - b.chunkIndex;
    })
    .slice(0, maxChunks);
};
