"""Small per-process burst guard; production ingress must also enforce shared limits."""
from collections import OrderedDict, deque
from time import monotonic
from fastapi import HTTPException, Request

_attempts: OrderedDict[str, deque] = OrderedDict()

async def auth_rate_limit(request: Request):
    # Do not trust an arbitrary X-Forwarded-For value supplied by the caller.
    key = request.client.host if request.client else "unknown"
    now = monotonic()
    bucket = _attempts.setdefault(key, deque())
    _attempts.move_to_end(key)
    while bucket and bucket[0] < now - 60:
        bucket.popleft()
    if len(bucket) >= 15:
        raise HTTPException(429, "尝试次数过多，请一分钟后重试", headers={"Retry-After": "60"})
    bucket.append(now)
    while len(_attempts) > 10000:
        _attempts.popitem(last=False)
