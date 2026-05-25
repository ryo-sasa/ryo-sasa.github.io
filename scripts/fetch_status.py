"""新潟方面サイネージ用 運行情報スクレイパー.

GitHub Actions から定期実行され、JR 越後線と新潟交通の運行情報を取得して
`data/status.json` を生成する。app.py のスクレイピング部分を切り出し、
HTTP サーバー機能を除いたもの。標準ライブラリのみで動作する。
"""

from __future__ import annotations

import json
import random
import re
import time
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

# 越後線の運行情報は「信越エリア」のまとめページに掲載されている。
# 旧 line.aspx の個別ページは構造が変わりやすいため、エリアページ内の
# 越後線リンク（href に lineid=echigoline を含む <a>）から状態を読み取る。
JR_AREA_URL = "https://traininfo.jreast.co.jp/train_info/shinetsu.aspx"
JR_LINE_ID = "echigoline"  # 越後線
JR_LINE_PAGE = (
    "https://traininfo.jreast.co.jp/train_info/line.aspx?gid=5&lineid=echigoline"
)
NIIGATA_KOTSU_STATUS_URL = "https://www.niigata-kotsu.co.jp/~noriai/status/"


# 一般的なブラウザに近いヘッダー。素朴な User-Agent はボット判定で
# 弾かれることがあるため、Chrome 相当の文字列を送る。
BROWSER_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "ja,en-US;q=0.8,en;q=0.6",
}


def fetch_text(url: str, timeout: int = 12, retries: int = 4) -> str:
    """URL を取得して本文テキストを返す。

    JR 東日本サイトは Akamai 配下で、住宅IPからでも稀に 403 を返す
    （データセンターIPからはほぼ常に 403）。一時的な遮断を吸収するため、
    指数バックオフ（ジッター付き）で粘り強くリトライする。
    """
    last_exc: Exception = URLError("unknown error")
    for attempt in range(retries + 1):
        try:
            request = Request(url, headers=BROWSER_HEADERS)
            with urlopen(request, timeout=timeout) as response:
                charset = response.headers.get_content_charset() or "utf-8"
                return response.read().decode(charset, errors="replace")
        except (TimeoutError, URLError, OSError) as exc:
            last_exc = exc
            if attempt < retries:
                # 2,4,8,16 秒 + 0〜1.5 秒のジッターで待つ
                time.sleep(2 ** (attempt + 1) + random.uniform(0, 1.5))
    raise last_exc


def html_to_text(html: str) -> str:
    text = re.sub(r"<script[\s\S]*?</script>", " ", html, flags=re.I)
    text = re.sub(r"<style[\s\S]*?</style>", " ", text, flags=re.I)
    text = re.sub(r"<[^>]+>", " ", text)
    text = unescape(text)
    return re.sub(r"\s+", " ", text).strip()


def load_previous() -> dict:
    """前回生成した status.json を読み込む。無ければ空 dict。"""
    try:
        return json.loads(OUTPUT.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return {}


# 実データが取れていない状態を表すステータス。これらは前回値として
# 再利用しない（再利用すると失敗状態が固定化してしまうため）。
_NON_DATA_STATUS = {"取得失敗", "要確認"}


def stale_from_previous(
    prev: dict, key: str, exc: Exception, source: str, label: str
) -> dict:
    """取得失敗時に、前回の正常値があればそれを「前回値」として返す。

    一時的な 403 でサイネージが空欄/「取得失敗」になるのを防ぎ、
    直近の正常値に「最新取得は失敗」の注記を添えて表示し続ける。
    前回も失敗していた場合のみ「取得失敗」を返す。
    """
    prev_block = (prev or {}).get(key) or {}
    prev_status = prev_block.get("status")
    if prev_status and prev_status not in _NON_DATA_STATUS:
        note = "最新の取得に失敗したため前回の情報を表示しています。"
        prev_fetched = (prev or {}).get("fetched_at")
        if prev_fetched:
            note += f"（前回取得 {prev_fetched}）"
        return {
            **prev_block,
            "ok": False,
            "stale": True,
            "source": source,
            "message": f"{note} {prev_block.get('message', '')}".strip(),
        }
    return {
        "ok": False,
        "source": source,
        "status": "取得失敗",
        "severity": "unknown",
        "updated_at": None,
        "message": f"{label}の運行情報を取得できませんでした: {exc}",
    }


def parse_jr_status(prev: dict | None = None) -> dict:
    """信越エリアの運行情報ページから越後線の状態を取得する。"""
    try:
        html = fetch_text(JR_AREA_URL)
    except (TimeoutError, URLError, OSError) as exc:
        return stale_from_previous(prev or {}, "jr", exc, JR_LINE_PAGE, "JR東日本")

    full_text = html_to_text(html)
    updated_match = re.search(
        r"(\d{4}年\d{1,2}月\d{1,2}日\s*\d{1,2}時\d{1,2}分\s*現在)", full_text
    )
    updated_at = updated_match.group(1) if updated_match else None

    # 越後線のステータスリンク（href に lineid=echigoline を含む <a>）を探す。
    # リンクのテキストが「平常運転」「お知らせ 越後線は…」等そのまま状態を表す。
    link_match = re.search(
        r"<a\b[^>]*lineid=" + re.escape(JR_LINE_ID) + r"\b[^>]*>([\s\S]*?)</a>",
        html,
        flags=re.I,
    )
    if not link_match:
        return {
            "ok": False,
            "source": JR_LINE_PAGE,
            "status": "要確認",
            "severity": "unknown",
            "updated_at": updated_at,
            "message": (
                "JR運行情報ページの構造が変わった可能性があります。"
                "公式ページで越後線の状況をご確認ください。"
            ),
        }

    status_text = html_to_text(link_match.group(1))

    # JR 東日本のラベル（先頭語）で重大度を判定する。
    # お知らせ本文中に「運休」を含むことがあるため、必ず先頭語で見る。
    if status_text.startswith("平常運転"):
        status, severity = "平常運転", "normal"
        message = "越後線は公式運行情報で平常運転です。"
    elif status_text.startswith("運転見合わせ"):
        status, severity = "運転見合わせ", "disrupted"
        message = status_text[:260]
    elif status_text.startswith("運休"):
        status, severity = "運休情報あり", "disrupted"
        message = status_text[:260]
    elif status_text.startswith("遅延"):
        status, severity = "遅延", "delay"
        message = status_text[:260]
    elif status_text.startswith("お知らせ"):
        status, severity = "お知らせあり", "notice"
        body = status_text[len("お知らせ") :].strip()
        message = (body or status_text)[:260]
    else:
        status, severity = "要確認", "unknown"
        message = status_text[:260] or "状態を判定できませんでした。"

    return {
        "ok": True,
        "source": JR_LINE_PAGE,
        "status": status,
        "severity": severity,
        "updated_at": updated_at,
        "message": message,
    }


def parse_bus_status(prev: dict | None = None) -> dict:
    try:
        text = html_to_text(fetch_text(NIIGATA_KOTSU_STATUS_URL))
    except (TimeoutError, URLError, OSError) as exc:
        return stale_from_previous(
            prev or {}, "bus", exc, NIIGATA_KOTSU_STATUS_URL, "新潟交通"
        )

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


def build_status(prev: dict | None = None) -> dict:
    return {
        "fetched_at": datetime.now(JST).isoformat(timespec="seconds"),
        "jr": parse_jr_status(prev),
        "bus": parse_bus_status(prev),
        "notes": [
            "JR東日本の運行情報は30分以上の遅れ、または見込みが中心です。",
            "新潟交通の公式運行情報は運休便や大幅な遅れが中心で、"
            "道路混雑による細かな遅れは掲載されない場合があります。",
        ],
    }


def main() -> None:
    prev = load_previous()
    try:
        data = build_status(prev)
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