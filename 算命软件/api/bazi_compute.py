#!/usr/bin/env python3
"""
八字排盘 JSON API — 接收出生信息，返回结构化命盘数据
被 server.js 通过子进程调用
"""
import sys, json, os

# 添加 engine 路径
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'bazi-skill-dist', 'app'))
from engine.bazi_engine import paipan

def main():
    """从 stdin 读取 JSON，输出 JSON 到 stdout"""
    raw = sys.stdin.read()
    try:
        data = json.loads(raw)
    except:
        print(json.dumps({"error": "Invalid JSON input"}), flush=True)
        sys.exit(1)

    try:
        result = paipan(
            name=data.get("name", "匿名"),
            gender=data.get("gender", "未知"),
            year=data["year"],
            month=data["month"],
            day=data["day"],
            hour=data.get("hour", 12),
            minute=data.get("minute", 0),
            longitude=data.get("longitude", 120.0),
        )
        print(json.dumps(result, ensure_ascii=False), flush=True)
    except Exception as e:
        print(json.dumps({"error": str(e)}), ensure_ascii=False, flush=True)
        sys.exit(1)

if __name__ == "__main__":
    main()
