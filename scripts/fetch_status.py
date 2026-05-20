"""新潟方面サイネージ用 運行情報スクレイパー.

GitHub Actions から定期実行され、JR 越後線と新潟交通の運行情報を取得して
`data/status.json` を生成する。app.py のスクレイピング部分を切り出し、
HTTP サーバー機能を除いたもの。標準ライブラリのみで動作する。
"""

from __future__ import annotations

import json
import re
from datetime import datetime
from html import unescape
from pathlib import Path
from urllib.error import URLError
from urllib.request import Request, urlopen
from zoneinfo import ZoneInfo

# scripts/ の 1 つ上がリポジトリルート
ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / "data" / "status.json"
JST = ZoneInfo("Asia/Tokyo")

JR_ECHIGO_URL = "https://traininfo.jreast.co.jp/train_info/line.aspx?gid=5&lineid=echigoline"
NIIGATA_KOTSU_STATUS_URL = "https://www.niigata-kotsu.co.jp/~noriai/status/"


def fetch_text(url: str, timeout: int = 10) -> str:
    request = Request(
        url,
        headers={
            "User-Agent": "niigata-rush-checker/1.0 (+github pages signage)",
            "Accept-Language": "ja,en;q=0.8",
        },
    )
    with urlopen(request, timeout=timeout) as response:
        charset = response.headers.get_content_charset() or "utf-8"
        return response.read().decode(charset, errors="replace")


def html_to_text(html: str) -> str:
    text = re.sub(r"<script[\s\S]*?</script>", " ", html, flags=re.I)
    text = re.sub(r"<style[\s\S]*?</style>", " ", text, flags=re.I)
    text = re.sub(r"<[^>]+>", " ", text)
    text = unescape(text)
    return re.sub(r"\s+", " ", text).strip()


def parse_jr_status() -> dict:
    try:
        line_text = html_to_text(fetch_text(JR_ECHIGO_URL))
    except (TimeoutError, URLError, OSError) as exc:
        return {
            "ok": False,
            "source": JR_ECHIGO_URL,
            "status": "取得失敗",
            "severity": "unknown",
            "updated_at": None,
            "message": f"JR東日本の運行情報を取得できませんでした: {exc}",
        }

    updated_match = re.search(
        r"(\d{4}年\d{1,2}月\d{1,2}日\s+\d{1,2}時\d{1,2}分\s+現在)", line_text
    )
    section = line_text
    if "工事に伴う運転変更のお知らせ" in section:
        section = section.split("工事に伴う運転変更のお知らせ", 1)[-1]
    if "運行情報・運休情報" in section:
        section = section.rsplit("運行情報・運休情報", 1)[-1]
    if "遅延証明書は" in section:
        section = section.split("遅延証明書は", 1)[0]

    if "平常運転" in section:
        status, severity = "平常運転", "normal"
        message = "越後線は公式運行情報で平常運転です。"
    elif "お知らせ" in section:
        status, severity = "お知らせあり", "notice"
        message = section[:260]
    elif "遅延" in section:
        status, severity = "遅延", "delay"
        message = section[:220]
    elif "運転見合わせ" in section or "運休" in section:
        status, severity = "運休・運転見合わせ情報あり", "disrupted"
        message = section[:220]
    else:
        status, severity = "要確認", "unknown"
        message = section[:220] or "状態を判定できませんでした。"

    return {
        "ok": True,
        "source": JR_ECHIGO_URL,
        "status": status,
        "severity": severity,
        "updated_at": updated_match.group(1) if updated_match else None,
        "message": message,
    }


def parse_bus_status() -> dict:
    try:
        text = html_to_text(fetch_text(NIIGATA_KOTSU_STATUS_URL))
    except (TimeoutError, URLError, OSError) as exc:
        return {
            "ok": False,
            "source": NIIGATA_KOTSU_STATUS_URL,
            "status": "取得失敗",
            "severity": "unknown",
            "updated_at": None,
            "message": f"新潟交通の運行情報を取得できませんでした: {exc}",
        }

    time_match = re.search(
        r"(\d{1,2}月\d{1,2}日\s*\d{1,2}時\d{1,2}分|\d{1,2}時\d{1,2}分)\s*時点", text
    )
    active_area = text
    if "現在のバス運行状況" in active_area:
        active_area = active_area.split("現在のバス運行状況", 1)[-1]
    if "路線バス 道路・気象状況" in active_area:
        active_area = active_area.split("路線バス 道路・気象状況", 1)[0]
    has_route_listing = bool(
        re.search(r"[A-Z]\d{1,2}|西小針線|寺尾線|大堀線|運休|遅れ", active_area)
    )

    if "運行状況がある路線のみを表示しております" in text and not has_route_listing:
        status, severity = "大きな掲載なし", "normal"
        message = (
            "公式運行障害ページに路線別の大きな運休・遅れ掲載は見当たりません。"
            "道路渋滞による通常の遅れは掲載されない場合があります。"
        )
    else:
        status, severity = "公式ページ確認", "notice"
        start = text.find("現在のバス運行状況")
        message = text[start : start + 260] if start >= 0 else text[:260]

    return {
        "ok": True,
        "source": NIIGATA_KOTSU_STATUS_URL,
        "status": status,
        "severity": severity,
        "updated_at": time_match.group(1) if time_match else None,
        "message": message,
    }


def build_status() -> dict:
    return {
        "fetched_at": datetime.now(JST).isoformat(timespec="seconds"),
        "jr": parse_jr_status(),
        "bus": parse_bus_status(),
        "notes": [
            "JR東日本の運行情報は30分以上の遅れ、または見込みが中心です。",
            "新潟交通の公式運行情報は運休便や大幅な遅れが中心で、"
            "道路混雑による細かな遅れは掲載されない場合があります。",
        ],
    }


def main() -> None:
    try:
        data = build_status()
    except Exception as exc:  # noqa: BLE001 - 何があっても JSON は必ず書き出す
        data = {
            "fetched_at": datetime.now(JST).isoformat(timespec="seconds"),
            "jr": {
                "ok": False,
                "status": "取得失敗",
                "severity": "unknown",
                "updated_at": None,
                "message": f"スクリプトエラー: {exc}",
            },
            "bus": {
                "ok": False,
                "status": "取得失敗",
                "severity": "unknown",
                "updated_at": None,
                "message": f"スクリプトエラー: {exc}",
            },
            "notes": [],
        }

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(
        json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(f"wrote {OUTPUT}")
    print(json.dumps(data, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
