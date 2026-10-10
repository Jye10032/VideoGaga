"""Explicit protocol adapters, inspired by Jellyfish's capability separation.

No provider object is persisted. Video-job is the documented JSON task protocol,
not a claim of compatibility with every vendor's native API.
"""

import base64
import hashlib
import json
import re
from fastapi import HTTPException
from app.studio.network import public_request
from app.studio.schemas import GenerateRequest, Provider


def fingerprint(provider: Provider):
    return hashlib.sha256(
        f"{provider.protocol}|{provider.baseUrl}|{provider.model}".encode()
    ).hexdigest()


def media_url(value):
    from urllib.parse import urlsplit

    if not isinstance(value, str) or len(value) > 2000:
        raise ValueError("invalid media URL")
    parsed = urlsplit(value)
    if (
        parsed.scheme != "https"
        or not parsed.hostname
        or parsed.username
        or parsed.password
    ):
        raise ValueError("invalid media URL")
    return value


async def generate(req: GenerateRequest):
    p = req.provider
    if (req.kind == "video") != (p.protocol == "video-job"):
        raise HTTPException(422, "此任务与所选 API 协议不匹配")
    payload = {"model": p.model}
    if req.kind == "text":
        path = "/chat/completions"
        payload.update(
            messages=[{"role": "user", "content": req.prompt}], temperature=0.7
        )
    elif req.kind == "image":
        path = "/images/generations"
        payload.update(
            prompt=req.prompt,
            n=1,
            size={"16:9": "1536x1024", "9:16": "1024x1536", "1:1": "1024x1024"}[
                req.ratio
            ],
        )
    elif req.kind == "audio":
        path = "/audio/speech"
        payload.update(input=req.prompt, voice=req.voice, response_format="mp3")
    else:
        path = "/videos"
        payload.update(prompt=req.prompt, duration=req.duration, aspect_ratio=req.ratio)
    raw, mime = await public_request(
        p.baseUrl + path,
        method="POST",
        body=payload,
        headers={"Authorization": "Bearer " + p.apiKey.get_secret_value()},
    )
    try:
        if req.kind == "audio":
            if not mime.startswith("audio/"):
                raise ValueError("expected audio")
            return {
                "status": "success",
                "media": "data:audio/mpeg;base64," + base64.b64encode(raw).decode(),
            }
        data = json.loads(raw)
        if req.kind == "text":
            value = data["choices"][0]["message"]["content"]
            if not isinstance(value, str) or not value.strip():
                raise ValueError("empty text")
            return {"status": "success", "text": value}
        if req.kind == "image":
            item = data["data"][0]
            if item.get("b64_json"):
                decoded = base64.b64decode(item["b64_json"], validate=True)
                if len(decoded) > 6_000_000:
                    raise ValueError("oversized image")
                value = "data:image/png;base64," + item["b64_json"]
            else:
                value = media_url(item["url"])
            return {"status": "success", "media": value}
        return video_result(data)
    except (ValueError, KeyError, IndexError, TypeError):
        raise HTTPException(502, "供应商返回格式与所选协议不一致")


def video_result(data):
    if data.get("status") in ("failed", "error", "cancelled"):
        return {"status": "error", "error": "供应商视频任务失败"}
    url = data.get("url") or data.get("video_url")
    if url:
        return {"status": "success", "media": media_url(url)}
    job_id = data.get("id")
    if not isinstance(job_id, str) or not re.fullmatch(r"[a-zA-Z0-9_-]{1,160}", job_id):
        raise ValueError("missing video job ID")
    return {"status": "pending", "remoteId": job_id}


async def poll(provider: Provider, remote_id: str):
    raw, _ = await public_request(
        provider.baseUrl + "/videos/" + remote_id,
        headers={"Authorization": "Bearer " + provider.apiKey.get_secret_value()},
    )
    try:
        return video_result(json.loads(raw))
    except (ValueError, TypeError, KeyError):
        raise HTTPException(502, "供应商任务查询格式不一致")
