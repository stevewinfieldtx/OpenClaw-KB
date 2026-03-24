/**
 * Sliding-window chunker with paragraph-boundary awareness
 *
 * Strategy:
 * 1. Split on paragraph boundaries (double newline)
 * 2. Accumulate paragraphs into ~400-token chunks
 * 3. 100-token overlap between consecutive chunks
 * 4. Prefix each chunk with video title for RAG attribution
 */

const AVG_CHARS_PER_TOKEN = 4; // rough approximation

export interface ChunkResult {
  content: string;
  tokenCount: number;
  chunkIndex: number;
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / AVG_CHARS_PER_TOKEN);
}

function splitIntoSentences(text: string): string[] {
  // Split on sentence boundaries (period/question/exclamation followed by space or newline)
  return text
    .split(/(?<=[.!?])\s+/)
    .filter((s) => s.trim().length > 0);
}

export function chunkTranscript(
  rawText: string,
  videoTitle: string,
  targetTokens: number = 400,
  overlapTokens: number = 100
): ChunkResult[] {
  if (!rawText || rawText.trim().length === 0) {
    return [];
  }

  const prefix = `[Video: ${videoTitle}] `;
  const prefixTokens = estimateTokens(prefix);
  const effectiveTarget = targetTokens - prefixTokens;

  // Split into paragraphs
  const paragraphs = rawText
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  // If no paragraph breaks, split on single newlines
  const segments =
    paragraphs.length <= 1
      ? rawText
          .split(/\n/)
          .map((p) => p.trim())
          .filter((p) => p.length > 0)
      : paragraphs;

  const chunks: ChunkResult[] = [];
  let currentParts: string[] = [];
  let currentTokens = 0;

  for (const segment of segments) {
    const segTokens = estimateTokens(segment);

    // If single segment exceeds target, split by sentences
    if (segTokens > effectiveTarget * 1.5) {
      // Flush current accumulation first
      if (currentParts.length > 0) {
        const text = prefix + currentParts.join('\n\n');
        chunks.push({
          content: text,
          tokenCount: estimateTokens(text),
          chunkIndex: chunks.length,
        });
      }

      // Split large segment into sentence-based chunks
      const sentences = splitIntoSentences(segment);
      currentParts = [];
      currentTokens = 0;

      for (const sentence of sentences) {
        const sentTokens = estimateTokens(sentence);
        if (currentTokens + sentTokens > effectiveTarget && currentParts.length > 0) {
          const text = prefix + currentParts.join(' ');
          chunks.push({
            content: text,
            tokenCount: estimateTokens(text),
            chunkIndex: chunks.length,
          });

          // Overlap: keep last ~overlapTokens worth of sentences
          let overlapTokenCount = 0;
          const overlapParts: string[] = [];
          for (let i = currentParts.length - 1; i >= 0; i--) {
            const t = estimateTokens(currentParts[i]);
            if (overlapTokenCount + t > overlapTokens) break;
            overlapParts.unshift(currentParts[i]);
            overlapTokenCount += t;
          }
          currentParts = overlapParts;
          currentTokens = overlapTokenCount;
        }
        currentParts.push(sentence);
        currentTokens += sentTokens;
      }

      continue;
    }

    if (currentTokens + segTokens > effectiveTarget && currentParts.length > 0) {
      // Flush current chunk
      const text = prefix + currentParts.join('\n\n');
      chunks.push({
        content: text,
        tokenCount: estimateTokens(text),
        chunkIndex: chunks.length,
      });

      // Overlap: keep last paragraph(s) up to overlapTokens
      let overlapTokenCount = 0;
      const overlapParts: string[] = [];
      for (let i = currentParts.length - 1; i >= 0; i--) {
        const t = estimateTokens(currentParts[i]);
        if (overlapTokenCount + t > overlapTokens) break;
        overlapParts.unshift(currentParts[i]);
        overlapTokenCount += t;
      }
      currentParts = overlapParts;
      currentTokens = overlapTokenCount;
    }

    currentParts.push(segment);
    currentTokens += segTokens;
  }

  // Flush remaining
  if (currentParts.length > 0) {
    const text = prefix + currentParts.join('\n\n');
    chunks.push({
      content: text,
      tokenCount: estimateTokens(text),
      chunkIndex: chunks.length,
    });
  }

  return chunks;
}
