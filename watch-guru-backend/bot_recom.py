import json
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from sentence_transformers import SentenceTransformer
import sys
import io

# Add this at the top of your script (before any prints)
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

class RecommendationEngine:
    def __init__(self, embeddings_path: str, model_name: str = 'all-MiniLM-L6-v2'):
        self.model = SentenceTransformer(model_name, device='cpu')
        with open(embeddings_path, "r", encoding="utf-8") as f:
            raw = json.load(f)
        self.embeddings = {
            k: {
                "embedding": np.array(v["embedding"]),
                "metadata": v["metadata"]
            }
            for k, v in raw.items()
        }

    def _generate_query_embedding(self, title: str, description: str, genres: list[str]):
        query_sentence = f"{title.strip()}. {description.strip()}. Genres include: {', '.join(genres)}."
        return self.model.encode(query_sentence)

    def _find_similar(self, query_vector, threshold=0.3, top_n=3):
        similarities = []
        for content_id, data in self.embeddings.items():
            sim = cosine_similarity([query_vector], [data["embedding"]])[0][0]
            if sim >= threshold:
                similarities.append({
                    "content_id": content_id,
                    "similarity": sim,
                    "metadata": data["metadata"]
                })
        return sorted(similarities, key=lambda x: -x["similarity"])[:top_n]

    def recommend(self, title: str, description: str, genres: list[str]) -> str:
        query_vec = self._generate_query_embedding(title, description, genres)
        matches = self._find_similar(query_vec)
        if not matches:
            return "🤔 Sorry, couldn't find a strong match. Try refining your input."

        output = ["🎬 Top Movie Recommendations:\n"]
        for i, match in enumerate(matches, 1):
            meta = match["metadata"]
            output.append(
                f"{i}. {meta['title']} "
                f"   - Genre: {meta['genres']}\n"
                f"   - Director: {meta['director']}\n"
                f"   - Language: {meta['language']}\n"
            )
        return "\n".join(output)

if __name__ == "__main__":
    if len(sys.argv) < 4:
        print(
            "Usage: python bot_recom.py '<title>' '<description>' '[\"genre1\", \"genre2\"]'\n"
            "Example: python bot_recom.py 'Nani' 'A fun Telugu movie' '[\"comedy\", \"romantic\"]'",
            file=sys.stderr
        )
        sys.exit(1)

    title = sys.argv[1]
    description = sys.argv[2]
    try:
        genres = json.loads(sys.argv[3])  # Parse JSON string
    except json.JSONDecodeError:
        print("Error: Invalid genres format. Use JSON array like '[\"comedy\", \"romantic\"]'", file=sys.stderr)
        sys.exit(1)

    engine = RecommendationEngine("component_embeddings.json")
    result = engine.recommend(title, description, genres)
    print(result)