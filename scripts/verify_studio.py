"""Local acceptance check: in-memory database and mocked providers, no paid calls.
Run: PYTHONPATH=backend backend/.venv/bin/python scripts/verify_studio.py
"""

import asyncio, json, secrets
from unittest.mock import AsyncMock, patch
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy import select
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.database import Base, get_db
from app.config import get_settings
from app.models import *
from app.models.oauth_identity import OAuthIdentity
from app.studio.models import StudioDocument, StudioRun
from app.core.security import create_access_token
from app.models.invite_code import InviteCode
from app.models.user import User
from app.studio import providers
from app.studio.schemas import GenerateRequest, Provider
from fastapi import HTTPException


async def main():
    get_settings().jwt_secret = secrets.token_urlsafe(48)
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    sessions = async_sessionmaker(engine, expire_on_commit=False)

    async def db():
        async with sessions() as session:
            yield session

    app.dependency_overrides[get_db] = db
    async with sessions() as session:
        session.add(
            InviteCode(
                code="test-admin-invite-only",
                is_admin_code=True,
                max_uses=1,
                used_count=0,
            )
        )
        session.add(
            InviteCode(
                code="test-user-invite-only",
                is_admin_code=False,
                max_uses=3,
                used_count=0,
            )
        )
        await session.commit()
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://local"
    ) as client:
        for name, invite in [
            ("admin_test", "test-admin-invite-only"),
            ("creator_one", "test-user-invite-only"),
            ("creator_two", "test-user-invite-only"),
        ]:
            response = await client.post(
                "/api/v1/auth/register",
                json={
                    "username": name,
                    "password": "test-password-000",
                    "invite_code": invite,
                },
            )
            assert response.status_code == 200, (response.status_code, response.text)
        response = await client.post(
            "/api/v1/auth/login",
            json={"account": "admin_test", "password": "test-password-000"},
        )
        assert response.status_code == 200, response.text
        admin = {"Authorization": "Bearer " + response.json()["access_token"]}
        users = (await client.get("/api/v1/admin/users", headers=admin)).json()
        first = next(u for u in users if u["username"] == "creator_one")
        second = next(u for u in users if u["username"] == "creator_two")
        h1 = {"Authorization": "Bearer " + create_access_token(first["id"])}
        h2 = {"Authorization": "Bearer " + create_access_token(second["id"])}
        assert (await client.get("/api/v1/studio/projects")).status_code == 401
        assert (await client.get("/api/v1/admin/users", headers=h1)).status_code == 403
        created = await client.post(
            "/api/v1/studio/projects", headers=h1, json={"name": "Local acceptance"}
        )
        assert created.status_code == 200, created.text
        doc = created.json()
        pid = doc["id"]
        url = "/api/v1/studio/projects/" + pid
        assert (await client.get(url, headers=h2)).status_code == 404
        data = doc["data"]
        data["script"] = "A traveler arrives at the station."
        saved = await client.put(
            url,
            headers=h1,
            json={"name": "Local acceptance", "revision": 0, "data": data},
        )
        assert saved.status_code == 200, saved.text
        conflict = await client.put(
            url, headers=h1, json={"name": "Stale", "revision": 0, "data": data}
        )
        assert conflict.status_code == 409, conflict.text
        provider = {
            "protocol": "openai",
            "baseUrl": "https://provider.example/v1",
            "apiKey": "dummy-key-never-external",
            "model": "test-model",
        }
        request = {
            "requestId": "11111111-1111-4111-8111-111111111111",
            "kind": "text",
            "targetId": "script",
            "sourceHash": "a" * 64,
            "prompt": "sample",
            "provider": provider,
        }
        stub = AsyncMock(return_value={"status": "success", "text": "fixture response"})
        with patch.object(providers, "generate", stub):
            response = await client.post(url + "/generate", headers=h1, json=request)
            assert response.status_code == 200, response.text
            again = await client.post(url + "/generate", headers=h1, json=request)
            assert again.status_code == 200, again.text
            assert stub.await_count == 1
            assert (
                await client.post(url + "/generate", headers=h2, json=request)
            ).status_code == 404
        async with sessions() as session:
            run = await session.get(StudioRun, request["requestId"])
            assert run.status == "success"
            assert "dummy-key" not in json.dumps(run.output)
            docrow = await session.get(StudioDocument, pid)
            assert "provider" not in json.dumps(docrow.data)
        assert (
            await client.get(url + "/runs/" + request["requestId"], headers=h1)
        ).json()["status"] == "success"
        assert (
            await client.get(url + "/runs/" + request["requestId"], headers=h2)
        ).status_code == 404
        changed = {**request, "sourceHash": "b" * 64}
        assert (
            await client.post(url + "/generate", headers=h1, json=changed)
        ).status_code == 409
        uncertain = {**request, "requestId": "22222222-2222-4222-8222-222222222222"}
        with patch.object(
            providers,
            "generate",
            AsyncMock(side_effect=HTTPException(504, "upstream timeout")),
        ):
            result = (
                await client.post(url + "/generate", headers=h1, json=uncertain)
            ).json()
            assert result["status"] == "uncertain"
        assert (
            await client.get(url + "/runs/" + uncertain["requestId"], headers=h1)
        ).json()["status"] == "uncertain"
        duplicate = {**uncertain, "requestId": "33333333-3333-4333-8333-333333333333"}
        stub = AsyncMock(
            return_value={"status": "success", "text": "second acknowledged attempt"}
        )
        with patch.object(providers, "generate", stub):
            reused = (
                await client.post(url + "/generate", headers=h1, json=duplicate)
            ).json()
            assert reused["id"] == uncertain["requestId"] and stub.await_count == 0
            fresh = (
                await client.post(
                    url + "/generate",
                    headers=h1,
                    json={**duplicate, "acknowledgeDuplicate": True},
                )
            ).json()
            assert fresh["status"] == "success" and stub.await_count == 1
        assert any(
            r["id"] == uncertain["requestId"]
            for r in (await client.get(url + "/runs", headers=h1)).json()
        )
        own = next(u for u in users if u["username"] == "admin_test")
        assert (
            await client.patch(
                "/api/v1/admin/users/" + own["id"],
                headers=admin,
                json={"is_active": False},
            )
        ).status_code == 400
        assert (
            await client.post(
                "/api/v1/auth/login",
                json={"account": "creator_one", "password": "字" * 30},
            )
        ).status_code == 422
        assert (
            await client.get("/api/v1/auth/google/callback?state=foreign")
        ).status_code == 400
        invalid = {**request, "sourceHash": "bad"}
        response = await client.post(url + "/generate", headers=h1, json=invalid)
        assert response.status_code == 422 and "dummy-key" not in response.text, (
            response.text
        )
        assert (await client.get("/debug/config", headers=admin)).status_code == 404
        assert (
            await client.post("/api/v1/generation/create", headers=h1, json={})
        ).status_code == 410
        codes = (await client.get("/api/v1/admin/invite-codes", headers=admin)).json()
        code = next(c for c in codes if c["code"] == "test-user-invite-only")
        assert (
            await client.delete(
                "/api/v1/admin/invite-codes/" + code["id"], headers=admin
            )
        ).status_code == 200
        assert (await client.get("/api/v1/auth/me", headers=h1)).status_code == 200
        again = await client.post(
            "/api/v1/auth/register",
            json={
                "username": "another_user",
                "password": "test-password-000",
                "invite_code": code["code"],
            },
        )
        assert again.status_code == 400
        assert (
            await client.patch(
                "/api/v1/admin/users/" + first["id"],
                headers=admin,
                json={"is_active": False},
            )
        ).status_code == 200
        assert (await client.get(url, headers=h1)).status_code == 401
        assert (await client.delete(url, headers=h2)).status_code == 404
        from app.studio.network import public_request

        try:
            await public_request("https://127.0.0.1/private")
        except Exception as e:
            assert e.status_code == 422
        else:
            raise AssertionError("private network allowed")
        from app.services.auth_service import AuthService

        async with sessions() as session:
            try:
                await AuthService(session)._get_or_create_google_user(
                    first["email"], "Attacker", "external-subject"
                )
            except Exception as e:
                assert e.status_code == 409
            else:
                raise AssertionError("unverified email was auto-linked")
    # Exercise each protocol adapter while intercepting its only HTTP boundary.
    examples = [
        (
            "text",
            {"choices": [{"message": {"content": "fixture text"}}]},
            "application/json",
            "/chat/completions",
        ),
        (
            "image",
            {"data": [{"url": "https://media.example/frame.png"}]},
            "application/json",
            "/images/generations",
        ),
        ("video", {"id": "job_123", "status": "queued"}, "application/json", "/videos"),
        ("audio", b"fixture-mp3", "audio/mpeg", "/audio/speech"),
    ]
    for kind, reply, mime, path in examples:
        config = {**provider, "protocol": "video-job" if kind == "video" else "openai"}
        req = GenerateRequest(**{**request, "kind": kind, "provider": config})
        stub = AsyncMock(
            return_value=(
                reply if isinstance(reply, bytes) else json.dumps(reply).encode(),
                mime,
            )
        )
        with patch.object(providers, "public_request", stub):
            result = await providers.generate(req)
            assert result["status"] == ("pending" if kind == "video" else "success")
            assert stub.call_args.args[0] == config["baseUrl"] + path
            assert (
                stub.call_args.kwargs["headers"]["Authorization"]
                == "Bearer " + provider["apiKey"]
            )
    with patch.object(
        providers,
        "public_request",
        AsyncMock(
            return_value=(
                b'{"id":"job_123","status":"completed","url":"https://media.example/movie.webm"}',
                "application/json",
            )
        ),
    ):
        result = await providers.poll(
            Provider(**{**provider, "protocol": "video-job"}), "job_123"
        )
        assert result["status"] == "success"
    app.dependency_overrides.clear()
    await engine.dispose()
    print(
        "PASS: auth/register/login; owner isolation; admin authorization; version conflict; persisted project; idempotent generation with mocked provider; no key in stored results or validation errors; debug removal; legacy endpoint disabled; invite revocation preserves users; disabled-user denial; private-network denial; unsafe OAuth linking and foreign callback denied; uncertain task recovery; protocol fixtures for text/image/video/audio. No external provider calls."
    )


if __name__ == "__main__":
    asyncio.run(main())
