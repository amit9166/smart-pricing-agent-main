import os
import chromadb
from chromadb.utils import embedding_functions
import google.generativeai as genai

# Setup client persistence directory
CHROMA_PATH = os.getenv("CHROMA_DB_PATH", "./chroma_db")
client = chromadb.PersistentClient(path=CHROMA_PATH)

class GeminiEmbeddingFunction(chromadb.EmbeddingFunction):
    """
    Custom Chroma embedding function using Google Gemini API.
    Includes a fallback dummy embedding if key is missing or API errors.
    """
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        if self.api_key:
            genai.configure(api_key=self.api_key)

    def __call__(self, input: chromadb.Documents) -> chromadb.Embeddings:
        if not self.api_key:
            return self._fallback_embeddings(input)
        try:
            embeddings = []
            for text in input:
                response = genai.embed_content(
                    model="models/text-embedding-004",
                    content=text,
                    task_type="retrieval_document"
                )
                embeddings.append(response['embedding'])
            return embeddings
        except Exception as e:
            print(f"[Chroma Memory] Gemini embedding error: {e}. Falling back...")
            return self._fallback_embeddings(input)

    def _fallback_embeddings(self, texts):
        # Deterministic lightweight term vector for startup stability
        embeddings = []
        for text in texts:
            vec = [0.0] * 768
            # Simple hash-based token encoding for simulation
            for i, word in enumerate(text.split()):
                idx = hash(word) % 768
                vec[idx] += 1.0
            # Normalize vector
            norm = sum(x**2 for x in vec) ** 0.5
            if norm > 0:
                vec = [x / norm for x in vec]
            embeddings.append(vec)
        return embeddings

# Initialize vector memory collection
embedding_fn = GeminiEmbeddingFunction()
collection = client.get_or_create_collection(
    name="ecommerce_pricing_memory",
    embedding_function=embedding_fn
)

def add_decision_memory(decision_id: str, product_id: str, description: str, metadata: dict):
    """
    Stores an agent pricing decision and its reasoning.
    """
    try:
        # Metadata must only have string, int, float, bool
        cleaned_meta = {
            "product_id": str(product_id),
            "sku": str(metadata.get("sku", "")),
            "old_price": float(metadata.get("old_price", 0.0)),
            "new_price": float(metadata.get("new_price", 0.0)),
            "rule_applied": str(metadata.get("rule_applied", "None")),
            "confidence": float(metadata.get("confidence", 1.0))
        }
        collection.add(
            ids=[decision_id],
            documents=[description],
            metadatas=[cleaned_meta]
        )
        print(f"[Chroma Memory] Saved pricing decision memory for ID: {decision_id}")
        return True
    except Exception as e:
        print(f"[Chroma Memory] Error saving decision memory: {e}")
        return False

def query_similar_decisions(query_text: str, n_results: int = 3) -> list:
    """
    Retrieves historical price decisions matching current sentiment/market trends.
    """
    try:
        results = collection.query(
            query_texts=[query_text],
            n_results=n_results
        )
        
        parsed_results = []
        if results and results.get("ids") and len(results["ids"][0]) > 0:
            for i in range(len(results["ids"][0])):
                parsed_results.append({
                    "id": results["ids"][0][i],
                    "document": results["documents"][0][i],
                    "metadata": results["metadatas"][0][i],
                    "distance": results["distances"][0][i] if "distances" in results else 0.0
                })
        return parsed_results
    except Exception as e:
        print(f"[Chroma Memory] Error querying memory: {e}")
        return []
