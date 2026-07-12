import { DocModel } from '../models/Document.js';
import { DocumentChunk } from '../models/DocumentChunk.js';
import { RAG_DEFAULTS } from '@ai-outreach/shared';
// Dynamic imports for file parsers
async function parsePDF(buffer) {
    const pdfParse = (await import('pdf-parse')).default;
    const result = await pdfParse(buffer);
    return result.text;
}
async function parseDOCX(buffer) {
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
}
async function parseXLSX(buffer) {
    const XLSX = await import('xlsx');
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const lines = [];
    for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(sheet);
        for (const row of json) {
            const entries = Object.entries(row)
                .map(([k, v]) => `${k}: ${v}`)
                .join(' | ');
            lines.push(entries);
        }
    }
    return lines.join('\n');
}
async function parseCSV(buffer) {
    const { parse } = await import('csv-parse/sync');
    const records = parse(buffer.toString('utf-8'), {
        columns: true,
        skip_empty_lines: true,
    });
    return records
        .map((row) => Object.entries(row)
        .map(([k, v]) => `${k}: ${v}`)
        .join(' | '))
        .join('\n');
}
export class RagService {
    llm;
    constructor(llm) {
        this.llm = llm;
    }
    /**
     * Full ingestion pipeline: parse → chunk → embed → store
     */
    async ingestDocument(params) {
        const { documentId, orgId, fileName, fileType, buffer } = params;
        try {
            // Step 1: Parse file to text
            let text;
            switch (fileType) {
                case 'pdf':
                    text = await parsePDF(buffer);
                    break;
                case 'docx':
                    text = await parseDOCX(buffer);
                    break;
                case 'xlsx':
                    text = await parseXLSX(buffer);
                    break;
                case 'csv':
                    text = await parseCSV(buffer);
                    break;
                default:
                    throw new Error(`Unsupported file type: ${fileType}`);
            }
            if (!text || text.trim().length === 0) {
                throw new Error('No text content extracted from document');
            }
            // Step 2: Chunk the text
            const chunks = this.chunkText(text);
            // Step 3: Generate embeddings and store chunks
            const chunkDocs = [];
            for (let i = 0; i < chunks.length; i++) {
                const chunkText = chunks[i];
                // Generate embedding
                let embedding;
                try {
                    embedding = await this.llm.embed(chunkText);
                }
                catch {
                    console.warn(`[RAG] Failed to embed chunk ${i}, storing without vector`);
                    embedding = [];
                }
                const vectorId = `${documentId}_chunk_${i}`;
                chunkDocs.push({
                    documentId,
                    orgId,
                    chunkIndex: i,
                    text: chunkText,
                    vectorId,
                    metadata: {
                        page: Math.floor(i / 3) + 1, // approximate page
                        section: this.extractSection(chunkText),
                    },
                });
            }
            // Bulk insert chunks
            await DocumentChunk.insertMany(chunkDocs);
            // Update document status
            await DocModel.findByIdAndUpdate(documentId, {
                status: 'indexed',
                chunkCount: chunks.length,
            });
            console.log(`[RAG] Indexed ${chunks.length} chunks from ${fileName}`);
        }
        catch (error) {
            console.error(`[RAG] Ingestion failed for ${fileName}:`, error);
            await DocModel.findByIdAndUpdate(documentId, { status: 'failed' });
            throw error;
        }
    }
    /**
     * Retrieves relevant chunks for a query using text search.
     * In production with ChromaDB running, this would use vector similarity search.
     */
    async retrieve(params) {
        const { query, orgId, topK = RAG_DEFAULTS.DEFAULT_TOP_K, docType } = params;
        // Build filter
        const filter = { orgId };
        // Get document IDs if filtering by docType
        if (docType) {
            const docs = await DocModel.find({ orgId, docType, status: 'indexed' }).select('_id');
            filter.documentId = { $in: docs.map((d) => d._id) };
        }
        // Strategy: Use MongoDB text search as fallback for MVP
        // In production, this would query ChromaDB with embeddings
        const keywords = query.split(/\s+/).filter((w) => w.length > 2);
        const regexPattern = keywords.map((k) => `(?=.*${escapeRegex(k)})`).join('');
        let chunks = await DocumentChunk.find({
            ...filter,
            text: { $regex: new RegExp(regexPattern, 'i') },
        })
            .limit(topK * 2)
            .lean();
        // If regex search found nothing, try individual keyword matching
        if (chunks.length === 0) {
            chunks = await DocumentChunk.find({
                ...filter,
                text: { $regex: new RegExp(keywords.join('|'), 'i') },
            })
                .limit(topK * 2)
                .lean();
        }
        // Score by keyword frequency (simple BM25 approximation)
        const scored = chunks.map((chunk) => {
            let score = 0;
            const lowerText = chunk.text.toLowerCase();
            for (const kw of keywords) {
                const regex = new RegExp(escapeRegex(kw.toLowerCase()), 'g');
                const matches = lowerText.match(regex);
                score += matches ? matches.length : 0;
            }
            return {
                text: chunk.text,
                documentId: chunk.documentId.toString(),
                score,
                metadata: chunk.metadata,
            };
        });
        // Sort by score descending, take top-K
        scored.sort((a, b) => b.score - a.score);
        return scored.slice(0, topK);
    }
    /**
     * Deletes a document and all its chunks/vectors.
     */
    async deleteDocument(documentId) {
        await DocumentChunk.deleteMany({ documentId });
        await DocModel.findByIdAndDelete(documentId);
    }
    /**
     * Chunks text into ~500-token windows with 50-token overlap.
     * Splits on structural boundaries first (headings, paragraphs).
     */
    chunkText(text) {
        const chunks = [];
        const avgCharsPerToken = 4;
        const chunkSizeChars = RAG_DEFAULTS.CHUNK_SIZE_TOKENS * avgCharsPerToken;
        const overlapChars = RAG_DEFAULTS.CHUNK_OVERLAP_TOKENS * avgCharsPerToken;
        // First, split on structural boundaries
        const sections = text.split(/\n{2,}|\r\n{2,}/);
        let currentChunk = '';
        for (const section of sections) {
            if (currentChunk.length + section.length <= chunkSizeChars) {
                currentChunk += (currentChunk ? '\n\n' : '') + section;
            }
            else {
                if (currentChunk) {
                    chunks.push(currentChunk.trim());
                }
                // If section itself is too large, split it further
                if (section.length > chunkSizeChars) {
                    const words = section.split(/\s+/);
                    currentChunk = '';
                    for (const word of words) {
                        if (currentChunk.length + word.length + 1 > chunkSizeChars) {
                            chunks.push(currentChunk.trim());
                            // Overlap: keep last portion
                            const overlapStart = Math.max(0, currentChunk.length - overlapChars);
                            currentChunk = currentChunk.slice(overlapStart) + ' ' + word;
                        }
                        else {
                            currentChunk += (currentChunk ? ' ' : '') + word;
                        }
                    }
                }
                else {
                    currentChunk = section;
                }
            }
        }
        if (currentChunk.trim()) {
            chunks.push(currentChunk.trim());
        }
        return chunks.filter((c) => c.length > 20);
    }
    extractSection(text) {
        // Try to extract a heading from the first line
        const firstLine = text.split('\n')[0].trim();
        if (firstLine.length < 100 && firstLine.length > 3) {
            return firstLine;
        }
        return '';
    }
}
function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
//# sourceMappingURL=rag.service.js.map