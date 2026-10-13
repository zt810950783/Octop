"""Runtime branding is public before setup, without exposing other settings."""

from __future__ import annotations

from pathlib import Path

import pytest

import octop.api.app as app_module
from tests.support.app import octop_client, write_octop_config


@pytest.fixture(autouse=True)
def dashboard_templates(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    source = Path(__file__).resolve().parents[2] / "dashboard"
    package = tmp_path / "package"
    dashboard = package / "dashboard"
    dashboard.mkdir(parents=True)
    for name in ("index.html", "offline.html", "manifest.json"):
        template = source / (name if name == "index.html" else f"public/{name}")
        (dashboard / name).write_text(template.read_text(encoding="utf-8"), encoding="utf-8")
    monkeypatch.setattr(app_module, "__file__", str(package / "api" / "app.py"))


async def test_branding_before_setup(tmp_octop_home: Path) -> None:
    write_octop_config(tmp_octop_home, app_name="公司办公助手")
    async with octop_client(tmp_octop_home, bind_database=False) as (client, _server):
        response = await client.get("/api/settings/branding")
        assert response.status_code == 200
        assert response.json() == {"app_name": "公司办公助手"}
        assert (await client.get("/api/settings/upload")).status_code == 503


async def test_branded_shell_and_manifest(tmp_octop_home: Path) -> None:
    write_octop_config(tmp_octop_home, app_name='办公 <助手> "A"')
    async with octop_client(tmp_octop_home) as (client, _server):
        for path in ("/", "/chat", "/index.html", "/offline.html"):
            response = await client.get(path)
            assert response.status_code == 200
            assert "办公 &lt;助手&gt; &quot;A&quot;" in response.text
            assert "__OCTOP_APP_NAME__" not in response.text
            assert response.headers["cache-control"] == "no-cache"
        manifest = await client.get("/manifest.json")
        assert manifest.status_code == 200
        assert manifest.json()["name"] == '办公 <助手> "A"'
        assert manifest.json()["short_name"] == '办公 <助手> "A"'


async def test_rebuilt_dashboard_shell_is_visible(tmp_octop_home: Path) -> None:
    async with octop_client(tmp_octop_home) as (client, _server):
        assert "rebuilt dashboard" not in (await client.get("/")).text
        index_file = Path(app_module.__file__).parent.parent / "dashboard" / "index.html"
        index_file.write_text(
            "<title>__OCTOP_APP_NAME__</title><p>rebuilt dashboard</p>", encoding="utf-8"
        )
        response = await client.get("/chat")
        assert response.status_code == 200
        assert "rebuilt dashboard" in response.text
        assert "擎云智驱办公版" in response.text
