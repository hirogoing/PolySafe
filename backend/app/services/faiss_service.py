import os
import json
import numpy as np
import faiss
from sentence_transformers import SentenceTransformer

from app.config import settings


class FAISSService:
    def __init__(self):
        self.model = None
        self.index = None
        self.rules_data: list[dict] = []
        self.index_path = os.path.join(settings.faiss_data_dir, "rules.index")
        self.meta_path = os.path.join(settings.faiss_data_dir, "rules_meta.json")
        self.disabled = os.getenv("DISABLE_FAISS", "0") == "1"
        self._load_index()

    def _ensure_model(self) -> bool:
        if self.disabled:
            return False
        if self.model is not None:
            return True
        try:
            self.model = SentenceTransformer(settings.embedding_model)
            return True
        except Exception as e:
            print(f"FAISS embedding模型加载失败: {e}")
            return False

    def _load_index(self):
        if os.path.exists(self.index_path) and os.path.exists(self.meta_path):
            self.index = faiss.read_index(self.index_path)
            with open(self.meta_path, "r", encoding="utf-8") as f:
                self.rules_data = json.load(f)

    def build_index(self, rules: list[dict]):
        if self.disabled:
            return

        if not rules:
            self.index = None
            self.rules_data = []
            self._save_index()
            return

        if not self._ensure_model():
            return

        texts = [
            f"{r.get('name', '')} {r.get('description', '')} {r.get('violation_type', '')}"
            for r in rules
        ]
        embeddings = self.model.encode(texts, normalize_embeddings=True)
        embeddings = np.array(embeddings).astype("float32")

        dimension = embeddings.shape[1]
        self.index = faiss.IndexFlatIP(dimension)
        self.index.add(embeddings)
        self.rules_data = rules
        self._save_index()

    def search_similar_rules(self, query_text: str, top_k: int = 5) -> list[dict]:
        if self.disabled:
            return []

        if self.index is None or self.index.ntotal == 0:
            return []

        if not self._ensure_model():
            return []

        query_embedding = self.model.encode([query_text], normalize_embeddings=True)
        query_embedding = np.array(query_embedding).astype("float32")

        k = min(top_k, self.index.ntotal)
        scores, indices = self.index.search(query_embedding, k)

        results = []
        for score, idx in zip(scores[0], indices[0]):
            if idx < len(self.rules_data):
                rule = self.rules_data[idx].copy()
                rule["similarity"] = float(score)
                results.append(rule)
        return results

    def rebuild_from_db(self, db):
        from app.models import Rule
        db_rules = db.query(Rule).filter(Rule.is_active.is_(True)).all()
        rules = [
            {
                "id": r.id,
                "name": r.name,
                "description": r.description,
                "violation_type": r.violation_type,
                "action": r.action,
                "priority": r.priority,
                "policy_id": r.policy_id,
            }
            for r in db_rules
        ]
        self.build_index(rules)

    def _save_index(self):
        os.makedirs(settings.faiss_data_dir, exist_ok=True)
        if self.index is not None:
            faiss.write_index(self.index, self.index_path)
        with open(self.meta_path, "w", encoding="utf-8") as f:
            json.dump(self.rules_data, f, ensure_ascii=False, indent=2)


faiss_service = FAISSService()
