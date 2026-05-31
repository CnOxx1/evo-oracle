"""历史风险数据存储 — 基于 SQLite 的轻量时间序列。

记录每次风险评分快照，支持按 symbol 查询历史趋势。
"""

from __future__ import annotations

import sqlite3
import time
from pathlib import Path
from typing import Any

DB_PATH = Path(__file__).parent / "risk_history.db"


class RiskHistoryStore:
    """SQLite-backed risk score history."""

    def __init__(self, db_path: Path = DB_PATH):
        self.db_path = db_path
        self._init_db()

    def _init_db(self) -> None:
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS risk_snapshots (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    symbol TEXT NOT NULL,
                    risk_score REAL NOT NULL,
                    risk_level TEXT,
                    volatility REAL,
                    macro_stance TEXT,
                    timestamp REAL NOT NULL
                )
            """)
            conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_symbol_ts
                ON risk_snapshots(symbol, timestamp)
            """)

    def record(self, symbol: str, risk_score: float, risk_level: str = "",
               volatility: float = 0.0, macro_stance: str = "") -> None:
        with sqlite3.connect(self.db_path) as conn:
            conn.execute(
                "INSERT INTO risk_snapshots (symbol, risk_score, risk_level, volatility, macro_stance, timestamp) VALUES (?, ?, ?, ?, ?, ?)",
                (symbol.upper(), risk_score, risk_level, volatility, macro_stance, time.time()),
            )

    def get_history(self, symbol: str, hours: int = 24) -> list[dict[str, Any]]:
        cutoff = time.time() - hours * 3600
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            rows = conn.execute(
                "SELECT risk_score, risk_level, volatility, macro_stance, timestamp FROM risk_snapshots WHERE symbol = ? AND timestamp > ? ORDER BY timestamp ASC",
                (symbol.upper(), cutoff),
            ).fetchall()
        return [dict(r) for r in rows]

    def get_latest(self, symbol: str) -> dict[str, Any] | None:
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            row = conn.execute(
                "SELECT risk_score, risk_level, volatility, macro_stance, timestamp FROM risk_snapshots WHERE symbol = ? ORDER BY timestamp DESC LIMIT 1",
                (symbol.upper(),),
            ).fetchone()
        return dict(row) if row else None


risk_store = RiskHistoryStore()
