from __future__ import annotations

import json
import os
import secrets
from dataclasses import dataclass
from http.cookiejar import CookieJar
from typing import Any
from urllib import error, parse, request


class WorkPoolAuthError(Exception):
    """Raised when WorkPool authentication or profile lookup fails."""


@dataclass(slots=True)
class WorkPoolUser:
    username: str
    display_name: str
    email: str | None
    resource_id: int | None
    wp_id: str


@dataclass(slots=True)
class WorkPoolSession:
    session_id: str
    user: WorkPoolUser
    cookie_jar: CookieJar


class WorkPoolAuthService:
    def __init__(self) -> None:
        self.base_url = os.getenv("WORKPOOL_BASE_URL", "").rstrip("/")
        self.wp_id = os.getenv("WORKPOOL_WP_ID", "").strip()
        self.timeout_seconds = float(os.getenv("WORKPOOL_TIMEOUT_SECONDS", "15"))
        raw_names = os.getenv(
            "WORKPOOL_EMAIL_PROPERTIES",
            "email,emailAddress,primaryEmail,recoveryEmail",
        )
        self.email_property_names = [name.strip() for name in raw_names.split(",") if name.strip()]
        self._sessions: dict[str, WorkPoolSession] = {}

    def login(self, username: str, password: str) -> WorkPoolSession:
        self._ensure_configured()
        cookie_jar = CookieJar()
        opener = request.build_opener(request.HTTPCookieProcessor(cookie_jar))

        payload = {
            "wp_id": self.wp_id,
            "data": json.dumps({"username": username, "password": password}),
        }
        response = self._post_json(opener, "/wservices/resource/login.do", payload)
        self._ensure_login_success(response)

        user = self._resolve_user(opener, username)
        session_id = secrets.token_urlsafe(32)
        session = WorkPoolSession(session_id=session_id, user=user, cookie_jar=cookie_jar)
        self._sessions[session_id] = session
        return session

    def get_session(self, session_id: str | None) -> WorkPoolSession | None:
        if not session_id:
            return None
        return self._sessions.get(session_id)

    def logout(self, session_id: str | None) -> None:
        if session_id:
            self._sessions.pop(session_id, None)

    def _resolve_user(self, opener: request.OpenerDirector, username: str) -> WorkPoolUser:
        mobile_user = self._lookup_mobile_user(opener, username)
        email = (mobile_user or {}).get("recoveryEmail") or None
        resource_id = self._to_int((mobile_user or {}).get("id"))

        if resource_id is not None:
            property_email = self._lookup_email_property(opener, resource_id)
            if property_email:
                email = property_email

        first_name = (mobile_user or {}).get("firstName") or ""
        surname = (mobile_user or {}).get("surname") or ""
        display_name = " ".join(part for part in [first_name, surname] if part).strip() or username

        return WorkPoolUser(
            username=(mobile_user or {}).get("username") or username,
            display_name=display_name,
            email=email,
            resource_id=resource_id,
            wp_id=self.wp_id,
        )

    def _lookup_mobile_user(self, opener: request.OpenerDirector, username: str) -> dict[str, Any] | None:
        try:
            users = self._post_form(opener, "/wservices/resource/allresources.do", {"wp_id": self.wp_id})
        except WorkPoolAuthError:
            return None

        if isinstance(users, list):
            lowered = username.casefold()
            for user in users:
                if isinstance(user, dict) and str(user.get("username", "")).casefold() == lowered:
                    return user
        return None

    def _lookup_email_property(self, opener: request.OpenerDirector, resource_id: int) -> str | None:
        for property_name in self.email_property_names:
            try:
                value = self._post_form(
                    opener,
                    "/wservices/resource/getUserProperty.do",
                    {
                        "resourceId": str(resource_id),
                        "wp_id": self.wp_id,
                        "name": property_name,
                        "type": "",
                    },
                )
            except WorkPoolAuthError:
                continue

            if isinstance(value, str) and value.strip():
                return value.strip()

        return None

    def _ensure_configured(self) -> None:
        if not self.base_url:
            raise WorkPoolAuthError("WorkPool login is not configured yet. Set WORKPOOL_BASE_URL on the server.")
        if not self.wp_id:
            raise WorkPoolAuthError("WorkPool login is not configured yet. Set WORKPOOL_WP_ID on the server.")

    def _ensure_login_success(self, response: Any) -> None:
        if isinstance(response, dict):
            code = str(response.get("code", "")).strip().lower()
            content = str(response.get("content", "")).strip()
            if code in {"success", "ok", "200", "true"}:
                return
            if code and code not in {"success", "ok", "200", "true"}:
                raise WorkPoolAuthError(content or "WorkPool login was rejected.")
            if content and any(word in content.lower() for word in ["error", "invalid", "failed"]):
                raise WorkPoolAuthError(content)
            return

        if isinstance(response, str):
            if any(word in response.lower() for word in ["error", "invalid", "failed"]):
                raise WorkPoolAuthError(response)
            return

    def _post_json(self, opener: request.OpenerDirector, path: str, payload: dict[str, Any]) -> Any:
        data = json.dumps(payload).encode("utf-8")
        req = request.Request(
            f"{self.base_url}{path}",
            data=data,
            headers={"Content-Type": "application/json", "Accept": "application/json"},
            method="POST",
        )
        return self._open_and_parse(opener, req)

    def _post_form(self, opener: request.OpenerDirector, path: str, payload: dict[str, str]) -> Any:
        data = parse.urlencode(payload).encode("utf-8")
        req = request.Request(
            f"{self.base_url}{path}",
            data=data,
            headers={"Content-Type": "application/x-www-form-urlencoded", "Accept": "application/json"},
            method="POST",
        )
        return self._open_and_parse(opener, req)

    def _open_and_parse(self, opener: request.OpenerDirector, req: request.Request) -> Any:
        try:
            with opener.open(req, timeout=self.timeout_seconds) as response:
                raw = response.read().decode("utf-8", errors="replace").strip()
        except error.HTTPError as exc:
            raw = exc.read().decode("utf-8", errors="replace").strip()
            raise WorkPoolAuthError(raw or f"WorkPool request failed with status {exc.code}.") from exc
        except error.URLError as exc:
            raise WorkPoolAuthError(f"Unable to reach WorkPool: {exc.reason}") from exc

        if not raw:
            return {}

        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            return raw

    @staticmethod
    def _to_int(value: Any) -> int | None:
        if value in (None, ""):
            return None
        try:
            return int(value)
        except (TypeError, ValueError):
            return None
