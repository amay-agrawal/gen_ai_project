import { ILLMClient } from '../llm/LLMClient.js';
export declare class RagService {
    private llm;
    constructor(llm: ILLMClient);
    /**
     * Full ingestion pipeline: parse → chunk → embed → store
     */
    ingestDocument(params: {
        documentId: string;
        orgId: string;
        fileName: string;
        fileType: string;
        buffer: Buffer;
    }): Promise<void>;
    /**
     * Retrieves relevant chunks for a query using text search.
     * In production with ChromaDB running, this would use vector similarity search.
     */
    retrieve(params: {
        query: string;
        orgId: string;
        topK?: number;
        docType?: string;
    }): Promise<Array<{
        text: string;
        documentId: string;
        score: number;
        metadata: any;
    }>>;
    /**
     * Deletes a document and all its chunks/vectors.
     */
    deleteDocument(documentId: string): Promise<void>;
    /**
     * Chunks text into ~500-token windows with 50-token overlap.
     * Splits on structural boundaries first (headings, paragraphs).
     */
    private chunkText;
    private extractSection;
}
//# sourceMappingURL=rag.service.d.ts.map