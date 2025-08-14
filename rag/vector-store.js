// Vector Store - Belge ve chunk'ları depolama/arama
class VectorStore {
    constructor() {
        this.documents = new Map(); // Belgeleri depola
        this.index = new Map(); // Arama indeksi
        this.storageKey = 'pixelf_vector_store';
        this.loadFromStorage();
    }

    // Belge ekle
    addDocument(document) {
        try {
            console.log('📚 Belge vector store\'a ekleniyor:', document.name);
            
            // Belgeyi depola
            this.documents.set(document.id, document);
            
            // Arama indeksini güncelle
            this.updateSearchIndex(document);
            
            // Depolamayı kaydet
            this.saveToStorage();
            
            console.log('✅ Belge başarıyla eklendi. Toplam belge:', this.documents.size);
            return true;
            
        } catch (error) {
            console.error('❌ Belge eklenirken hata:', error);
            return false;
        }
    }

    // Belge sil
    removeDocument(documentId) {
        try {
            const document = this.documents.get(documentId);
            if (!document) return false;
            
            // Belgeyi sil
            this.documents.delete(documentId);
            
            // İndeksten temizle
            this.removeFromSearchIndex(document);
            
            // Depolamayı güncelle
            this.saveToStorage();
            
            console.log('🗑️ Belge silindi:', document.name);
            return true;
            
        } catch (error) {
            console.error('❌ Belge silinirken hata:', error);
            return false;
        }
    }

    // Semantic arama (basit)
    semanticSearch(query, limit = 5) {
        const results = [];
        const queryWords = this.preprocessQuery(query);
        
        this.documents.forEach(document => {
            document.chunks.forEach(chunk => {
                const score = this.calculateSimilarity(queryWords, chunk.content);
                if (score > 0.1) { // Minimum threshold
                    results.push({
                        documentId: document.id,
                        documentName: document.name,
                        chunkId: chunk.id,
                        content: chunk.content,
                        score: score,
                        context: this.getContext(document, chunk)
                    });
                }
            });
        });
        
        return results
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);
    }

    // Belge içinde arama
    searchInDocument(documentId, query, limit = 3) {
        const document = this.documents.get(documentId);
        if (!document) return [];
        
        const queryWords = this.preprocessQuery(query);
        const results = [];
        
        document.chunks.forEach(chunk => {
            const score = this.calculateSimilarity(queryWords, chunk.content);
            if (score > 0) {
                results.push({
                    chunkId: chunk.id,
                    content: chunk.content,
                    score: score,
                    context: this.getContext(document, chunk)
                });
            }
        });
        
        return results
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);
    }

    // Sorgu ön işleme
    preprocessQuery(query) {
        return query.toLowerCase()
            .replace(/[^\w\sğüşıöçĞÜŞIÖÇ]/g, '')
            .split(' ')
            .filter(word => word.length > 2)
            .filter(word => !this.isStopWord(word));
    }

    // Stop word kontrolü (Türkçe)
    isStopWord(word) {
        const stopWords = [
            'bir', 've', 'bu', 'da', 'de', 'ile', 'için', 'olan', 'var', 'yok',
            'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'any', 'can'
        ];
        return stopWords.includes(word);
    }

    // Benzerlik hesaplama (basit)
    calculateSimilarity(queryWords, text) {
        const textWords = text.toLowerCase().split(' ');
        let matches = 0;
        let totalMatches = 0;
        
        queryWords.forEach(queryWord => {
            textWords.forEach(textWord => {
                if (textWord.includes(queryWord) || queryWord.includes(textWord)) {
                    matches++;
                }
                if (textWord === queryWord) {
                    totalMatches += 2; // Exact match bonus
                }
            });
        });
        
        return (matches + totalMatches) / (queryWords.length * Math.sqrt(textWords.length));
    }

    // Chunk context'i al
    getContext(document, chunk) {
        const chunkIndex = chunk.id;
        const prevChunk = document.chunks[chunkIndex - 1];
        const nextChunk = document.chunks[chunkIndex + 1];
        
        return {
            previous: prevChunk ? prevChunk.content.substring(0, 100) + '...' : null,
            current: chunk.content,
            next: nextChunk ? nextChunk.content.substring(0, 100) + '...' : null,
            position: `${chunkIndex + 1}/${document.chunks.length}`
        };
    }

    // Arama indeksini güncelle
    updateSearchIndex(document) {
        document.chunks.forEach(chunk => {
            const words = chunk.content.toLowerCase().split(' ');
            words.forEach(word => {
                if (word.length > 2 && !this.isStopWord(word)) {
                    if (!this.index.has(word)) {
                        this.index.set(word, new Set());
                    }
                    this.index.get(word).add({
                        documentId: document.id,
                        chunkId: chunk.id
                    });
                }
            });
        });
    }

    // İndeksten kaldır
    removeFromSearchIndex(document) {
        this.index.forEach((locations, word) => {
            const filtered = Array.from(locations).filter(
                loc => loc.documentId !== document.id
            );
            if (filtered.length === 0) {
                this.index.delete(word);
            } else {
                this.index.set(word, new Set(filtered));
            }
        });
    }

    // Tüm belgeleri getir
    getAllDocuments() {
        return Array.from(this.documents.values());
    }

    // Belge getir
    getDocument(documentId) {
        return this.documents.get(documentId);
    }

    // İstatistikler
    getStats() {
        const totalChunks = Array.from(this.documents.values())
            .reduce((sum, doc) => sum + doc.chunks.length, 0);
        
        const totalWords = Array.from(this.documents.values())
            .reduce((sum, doc) => sum + doc.metadata.wordCount, 0);
        
        return {
            documentCount: this.documents.size,
            chunkCount: totalChunks,
            totalWords: totalWords,
            indexSize: this.index.size,
            storageSize: this.calculateStorageSize()
        };
    }

    // Depolama boyutu hesapla
    calculateStorageSize() {
        try {
            const data = JSON.stringify(Array.from(this.documents.values()));
            return Math.round(data.length / 1024) + ' KB';
        } catch (e) {
            return 'Bilinmiyor';
        }
    }

    // LocalStorage'a kaydet
    saveToStorage() {
        try {
            const data = {
                documents: Array.from(this.documents.entries()),
                timestamp: new Date().toISOString()
            };
            localStorage.setItem(this.storageKey, JSON.stringify(data));
        } catch (e) {
            console.warn('Vector store kaydedilemedi:', e);
        }
    }

    // LocalStorage'dan yükle
    loadFromStorage() {
        try {
            const data = localStorage.getItem(this.storageKey);
            if (data) {
                const parsed = JSON.parse(data);
                this.documents = new Map(parsed.documents);
                
                // İndeksi yeniden oluştur
                this.rebuildIndex();
                
                console.log('📚 Vector store yüklendi:', this.documents.size, 'belge');
            }
        } catch (e) {
            console.warn('Vector store yüklenemedi:', e);
        }
    }

    // İndeksi yeniden oluştur
    rebuildIndex() {
        this.index.clear();
        this.documents.forEach(document => {
            this.updateSearchIndex(document);
        });
    }

    // Depolamayı temizle
    clearStorage() {
        this.documents.clear();
        this.index.clear();
        localStorage.removeItem(this.storageKey);
        console.log('🗑️ Vector store temizlendi');
    }

    // Belge önerisi
    suggestSimilarDocuments(documentId, limit = 3) {
        const document = this.documents.get(documentId);
        if (!document) return [];
        
        const results = [];
        const sourceTopics = document.metadata.topics;
        
        this.documents.forEach((otherDoc, otherId) => {
            if (otherId === documentId) return;
            
            const similarity = this.calculateTopicSimilarity(
                sourceTopics, 
                otherDoc.metadata.topics
            );
            
            if (similarity > 0.2) {
                results.push({
                    document: otherDoc,
                    similarity: similarity
                });
            }
        });
        
        return results
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, limit);
    }

    // Konu benzerliği hesapla
    calculateTopicSimilarity(topics1, topics2) {
        if (!topics1 || !topics2) return 0;
        
        const intersection = topics1.filter(topic => topics2.includes(topic));
        const union = [...new Set([...topics1, ...topics2])];
        
        return intersection.length / union.length;
    }
}

// Global olarak kullanılabilir hale getir
window.VectorStore = VectorStore;