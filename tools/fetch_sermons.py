"""
Fetch latest sermons from a YouTube channel and write them to data/sermons.json.

Requirements:
- Python 3.8+
- Install dependencies: pip install google-api-python-client python-dotenv
- Create a .env file next to this script with: YOUTUBE_API_KEY=your_api_key_here

Usage:
  python tools/fetch_sermons.py --channel-handle @firstchurchcookevilleupc --max-results 30

Notes:
- The script resolves the channel handle to a channelId, then pulls uploads playlist videos.
- Output JSON matches the website schema (youtubeId, title, description, date, thumbnail, url).
- Existing data/data/sermons.json will be overwritten.
"""
from __future__ import annotations
import argparse
import json
import os
from datetime import datetime
from typing import Any, Dict, List, Optional

from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from dotenv import load_dotenv

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(ROOT, "data")
OUTPUT_JSON = os.path.join(DATA_DIR, "sermons.json")


def load_api_key() -> str:
    load_dotenv(os.path.join(ROOT, ".env"))
    api_key = os.getenv("YOUTUBE_API_KEY")
    if not api_key:
        raise RuntimeError("Missing YOUTUBE_API_KEY. Set it in .env or environment variables.")
    return api_key


def youtube_client(api_key: str):
    return build("youtube", "v3", developerKey=api_key)


def resolve_channel_id(yt, channel_handle: Optional[str], channel_id: Optional[str]) -> str:
    if channel_id:
        return channel_id
    if not channel_handle:
        raise ValueError("Provide --channel-id or --channel-handle")

    # Use search with forHandle endpoint is not in v3; we parse from channels?forUsername is deprecated.
    # The handle can be searched as a channel type and we pick exact match if possible.
    q = channel_handle.lstrip("@")
    resp = yt.search().list(part="snippet", q=q, type="channel", maxResults=5).execute()
    items = resp.get("items", [])
    if not items:
        raise RuntimeError(f"No channel found for handle {channel_handle}")

    # Try exact handle match from snippet.customUrl or title heuristic
    for it in items:
        snippet = it.get("snippet", {})
        if snippet.get("channelTitle", "").replace(" ", "").lower() == q.replace(" ", "").lower():
            return it["snippet"]["channelId"]
    # fallback to first
    return items[0]["snippet"]["channelId"]


def get_uploads_playlist_id(yt, channel_id: str) -> str:
    resp = yt.channels().list(part="contentDetails", id=channel_id, maxResults=1).execute()
    items = resp.get("items", [])
    if not items:
        raise RuntimeError(f"Channel not found: {channel_id}")
    return items[0]["contentDetails"]["relatedPlaylists"]["uploads"]


def fetch_videos_from_playlist(yt, playlist_id: str, max_results: int = 50) -> List[Dict[str, Any]]:
    videos: List[Dict[str, Any]] = []
    page_token = None
    remaining = max_results
    while remaining > 0:
        page_size = min(50, remaining)
        resp = yt.playlistItems().list(
            part="snippet,contentDetails",
            playlistId=playlist_id,
            maxResults=page_size,
            pageToken=page_token,
        ).execute()
        for item in resp.get("items", []):
            snippet = item.get("snippet", {})
            content = item.get("contentDetails", {})
            if snippet.get("title") == "Private video" or snippet.get("title") == "Deleted video":
                continue
            video_id = content.get("videoId")
            if not video_id:
                continue
            videos.append(
                {
                    "id": video_id,
                    "title": snippet.get("title", ""),
                    "description": snippet.get("description", ""),
                    "publishedAt": snippet.get("publishedAt", ""),
                    "thumbnails": snippet.get("thumbnails", {}),
                    "url": f"https://www.youtube.com/watch?v={video_id}",
                }
            )
        page_token = resp.get("nextPageToken")
        if not page_token:
            break
        remaining -= page_size
    return videos


def normalize_sermons(videos: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    # Optionally sort by date desc and keep essential fields
    def parse_dt(s: str) -> float:
        try:
            return datetime.fromisoformat(s.replace("Z", "+00:00")).timestamp()
        except Exception:
            return 0.0

    videos_sorted = sorted(videos, key=lambda v: parse_dt(v.get("publishedAt", "")), reverse=True)

    normalized: List[Dict[str, Any]] = []
    for v in videos_sorted:
        thumbs = v.get("thumbnails", {})
        thumb = thumbs.get("maxres") or thumbs.get("standard") or thumbs.get("high") or thumbs.get("medium") or thumbs.get("default") or {}
        normalized.append(
            {
                "youtubeId": v.get("id"),
                "title": v.get("title"),
                "description": v.get("description"),
                "date": v.get("publishedAt"),
                "thumbnail": thumb.get("url"),
                "url": v.get("url"),
            }
        )
    return normalized


def write_sermons_json(sermons: List[Dict[str, Any]]):
    os.makedirs(DATA_DIR, exist_ok=True)
    with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
        json.dump(sermons, f, ensure_ascii=False, indent=2)


def main():
    parser = argparse.ArgumentParser(description="Fetch sermons from a YouTube channel")
    parser.add_argument("--channel-id", help="YouTube channel ID (e.g., UCxxxxxxxx)")
    parser.add_argument("--channel-handle", help="YouTube channel handle (e.g., @firstchurchcookevilleupc)")
    parser.add_argument("--max-results", type=int, default=50, help="Maximum number of videos to fetch")
    args = parser.parse_args()

    api_key = load_api_key()
    yt = youtube_client(api_key)

    try:
        cid = resolve_channel_id(yt, args.channel_handle, args.channel_id)
        uploads_pid = get_uploads_playlist_id(yt, cid)
        videos = fetch_videos_from_playlist(yt, uploads_pid, max_results=args.max_results)
        sermons = normalize_sermons(videos)
        write_sermons_json(sermons)
        print(f"Wrote {len(sermons)} sermons to {OUTPUT_JSON}")
    except HttpError as e:
        print("YouTube API error:", e)
        raise


if __name__ == "__main__":
    main()
