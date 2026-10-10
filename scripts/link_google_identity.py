"""Operator-only recovery for legacy Google accounts. Dry run unless --apply.

The operator must verify BOTH the original account ownership and Google's stable
subject independently. Email equality alone is never sufficient. No public API.
Run from backend with its DATABASE_URL; no passwords or tokens are accepted.
"""

import argparse
import asyncio
from sqlalchemy import select
from app.core import database
from app.models.user import User
from app.models.oauth_identity import OAuthIdentity
from app.models.generation_task import GenerationTask  # Register relationship targets.


async def link(user_id: str, subject: str, apply: bool):
    database.init_db()
    if database.AsyncSessionLocal is None:
        raise SystemExit("DATABASE_URL is required")
    async with database.AsyncSessionLocal() as db:
        user = await db.scalar(select(User).where(User.id == user_id).with_for_update())
        if not user or not user.is_active:
            raise SystemExit("Active user not found")
        existing = await db.scalar(
            select(OAuthIdentity).where(
                (OAuthIdentity.subject == subject) | (OAuthIdentity.user_id == user_id)
            )
        )
        if existing:
            if existing.subject == subject and existing.user_id == user_id:
                print("Already linked; no change")
                return
            raise SystemExit("Identity already linked; refusing reassignment")
        print(
            f"{'APPLY' if apply else 'DRY RUN'}: bind Google subject to user {user.id} ({user.username}); role and projects unchanged"
        )
        if apply:
            db.add(OAuthIdentity(subject=subject, user_id=user.id))
            await db.commit()
    await database.engine.dispose()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--user-id", required=True)
    parser.add_argument("--verified-google-subject", required=True)
    parser.add_argument(
        "--ownership-verified",
        action="store_true",
        help="Operator has verified original account ownership and authenticated Google subject",
    )
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    if (
        not args.verified_google_subject.isdigit()
        or not 1 <= len(args.verified_google_subject) <= 255
    ):
        parser.error("Expected Google's numeric sub, not an email or an access token")
    if args.apply and not args.ownership_verified:
        parser.error("Applying requires independently verified account ownership")
    asyncio.run(link(args.user_id, args.verified_google_subject, args.apply))
