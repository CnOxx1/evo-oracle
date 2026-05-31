"""自定义告警规则存储 — SQLite 持久化。"""

from __future__ import annotations
import json
import sqlite3
import time
import uuid
from pathlib import Path
from typing import Any

DB_PATH = Path(__file__).parent / "alert_rules.db"


class AlertRuleStore:
    def __init__(self, db_path: Path = DB_PATH):
        self.db_path = db_path
        self._init_db()

    def _init_db(self) -> None:
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS rules (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    symbol TEXT NOT NULL,
                    metric TEXT NOT NULL,
                    operator TEXT NOT NULL,
                    threshold REAL NOT NULL,
                    enabled INTEGER DEFAULT 1,
                    created_at REAL NOT NULL
                )
            """)

    def list_rules(self) -> list[dict[str, Any]]:
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            rows = conn.execute("SELECT * FROM rules ORDER BY created_at DESC").fetchall()
        return [dict(r) for r in rows]

    def create_rule(self, name: str, symbol: str, metric: str, operator: str, threshold: float) -> dict[str, Any]:
        rule_id = str(uuid.uuid4())[:8]
        now = time.time()
        with sqlite3.connect(self.db_path) as conn:
            conn.execute(
                "INSERT INTO rules (id, name, symbol, metric, operator, threshold, enabled, created_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?)",
                (rule_id, name, symbol.upper(), metric, operator, threshold, now),
            )
        return {"id": rule_id, "name": name, "symbol": symbol.upper(), "metric": metric, "operator": operator, "threshold": threshold, "enabled": 1, "created_at": now}

    def delete_rule(self, rule_id: str) -> bool:
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute("DELETE FROM rules WHERE id = ?", (rule_id,))
        return cursor.rowcount > 0

    def toggle_rule(self, rule_id: str) -> bool:
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("UPDATE rules SET enabled = CASE WHEN enabled = 1 THEN 0 ELSE 1 END WHERE id = ?", (rule_id,))
        return True

    def evaluate_rules(self, current_data: dict[str, dict[str, Any]]) -> list[dict[str, Any]]:
        """评估所有规则，返回触发的告警。"""
        rules = self.list_rules()
        triggered = []
        for rule in rules:
            if not rule["enabled"]:
                continue
            symbol_data = current_data.get(rule["symbol"], {})
            value = symbol_data.get(rule["metric"])
            if value is None:
                continue
            if _check_condition(value, rule["operator"], rule["threshold"]):
                triggered.append({
                    "rule_id": rule["id"],
                    "rule_name": rule["name"],
                    "symbol": rule["symbol"],
                    "metric": rule["metric"],
                    "current_value": value,
                    "threshold": rule["threshold"],
                    "operator": rule["operator"],
                    "triggered_at": time.time(),
                })
        return triggered


def _check_condition(value: float, operator: str, threshold: float) -> bool:
    if operator == ">":
        return value > threshold
    elif operator == "<":
        return value < threshold
    elif operator == ">=":
        return value >= threshold
    elif operator == "<=":
        return value <= threshold
    elif operator == "==":
        return value == threshold
    return False


rule_store = AlertRuleStore()
