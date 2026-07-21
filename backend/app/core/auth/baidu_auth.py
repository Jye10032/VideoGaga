import time
import hashlib
import hmac
import urllib.parse


class BaiduAuth:
    """百度 BCE 鉴权模块"""

    def __init__(self, ak: str, sk: str, host: str):
        self.ak = ak
        self.sk = sk
        self.host = host

    def generate_timestamp(self) -> str:
        return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

    def _normalize(self, msg: str) -> str:
        if isinstance(msg, bytes):
            msg = msg.decode('utf-8')
        return urllib.parse.quote(str(msg), safe='-_.~')

    def _normalize_uri(self, uri: str) -> str:
        return urllib.parse.quote(uri, safe='-_.~/')

    def generate_authorization(self, method: str, path: str, timestamp: str, period: str = "1800") -> str:
        auth_string_prefix = f"bce-auth-v1/{self.ak}/{timestamp}/{period}"
        signing_key = hmac.new(
            self.sk.encode('utf-8'),
            auth_string_prefix.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()

        headers_to_sign = {
            "host": self.host,
            "x-bce-date": timestamp
        }
        canonical_headers = "\n".join([
            f"{self._normalize(k)}:{self._normalize(v)}"
            for k, v in sorted(headers_to_sign.items())
        ])

        canonical_request = "\n".join([
            method.upper(),
            self._normalize_uri(path),
            "",
            canonical_headers
        ])

        signature = hmac.new(
            signing_key.encode('utf-8'),
            canonical_request.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()

        signed_headers = ";".join(sorted(headers_to_sign.keys()))
        return f"bce-auth-v1/{self.ak}/{timestamp}/{period}/{signed_headers}/{signature}"

    def get_headers(self, method: str, path: str, request_id: str) -> dict:
        timestamp = self.generate_timestamp()
        return {
            "Host": self.host,
            "Content-Type": "application/json",
            "x-bce-request-id": request_id,
            "x-bce-date": timestamp,
            "Authorization": self.generate_authorization(method, path, timestamp)
        }
