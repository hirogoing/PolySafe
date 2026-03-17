from app.services.faiss_service import faiss_service


def judge(ai_result: dict, db=None) -> dict:
    confidence = ai_result.get("confidence", 0.0)
    violation_types = ai_result.get("violation_types", [])
    risk_desc = ai_result.get("risk_description", "")

    similar_rules = []
    if risk_desc:
        query = f"{' '.join(violation_types)} {risk_desc}"
        similar_rules = faiss_service.search_similar_rules(query, top_k=5)

    block_rules = [r for r in similar_rules if r.get("action") == "block" and r.get("similarity", 0) > 0.3]
    review_rules = [r for r in similar_rules if r.get("action") == "review" and r.get("similarity", 0) > 0.3]

    if confidence >= 0.8 and (block_rules or ai_result.get("violation_detected")):
        action = "block"
        reason = "高置信度违规，命中拦截规则"
    elif confidence <= 0.3 and not block_rules and not review_rules:
        action = "pass"
        reason = "低风险内容，未命中违规规则"
    else:
        action = "review"
        reason = "置信度中等或命中复核规则，需人工复核"

    matched = [
        {"id": r["id"], "name": r["name"], "action": r["action"], "similarity": round(r["similarity"], 3)}
        for r in similar_rules if r.get("similarity", 0) > 0.3
    ]

    return {
        "action": action,
        "reason": reason,
        "matched_rules": matched,
    }
