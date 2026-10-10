"""Pinned public HTTPS requests; caller configuration and credentials never logged."""

import asyncio
import ipaddress
import socket
import httpx
from urllib.parse import urlsplit
from fastapi import HTTPException


async def public_request(
    url: str, *, method="GET", headers=None, body=None, limit=12_000_000
):
    parsed = urlsplit(url)
    if (
        parsed.scheme != "https"
        or not parsed.hostname
        or parsed.username
        or parsed.password
        or parsed.port not in (None, 443)
    ):
        raise HTTPException(422, "只允许公开 HTTPS 地址")
    host = parsed.hostname.encode("idna").decode()
    try:
        records = await asyncio.get_running_loop().getaddrinfo(
            host, 443, type=socket.SOCK_STREAM
        )
    except OSError:
        raise HTTPException(422, "无法解析供应商地址")
    addresses = {item[4][0] for item in records}
    if not addresses or any(not ipaddress.ip_address(ip).is_global for ip in addresses):
        raise HTTPException(422, "不能访问内网或保留地址")
    ip = sorted(addresses)[0]
    # Pin DNS result for the connection, preserving Host and TLS SNI verification.
    target = httpx.URL(url).copy_with(host=ip)
    try:
        async with httpx.AsyncClient(
            timeout=180, follow_redirects=False, trust_env=False
        ) as client:
            async with client.stream(
                method,
                target,
                headers={**(headers or {}), "Host": host},
                json=body,
                extensions={"sni_hostname": host},
            ) as response:
                if not 200 <= response.status_code < 300:
                    raise HTTPException(
                        502,
                        f"供应商返回状态 {response.status_code}，请检查接口与模型配置",
                    )
                chunks = bytearray()
                async for chunk in response.aiter_bytes():
                    chunks.extend(chunk)
                    if len(chunks) > limit:
                        raise HTTPException(413, "供应商响应超过大小限制")
                return bytes(chunks), response.headers.get(
                    "content-type", "application/octet-stream"
                )
    except httpx.TimeoutException:
        raise HTTPException(504, "供应商请求超时，可查看任务后手动重试")
    except httpx.HTTPError:
        raise HTTPException(502, "无法连接供应商，请检查 API 地址")
