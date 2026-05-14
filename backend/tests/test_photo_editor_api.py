import uuid


# Core API availability and schema checks for photo editor MVP endpoints
def test_api_root_returns_service_status(api_client, base_url):
    response = api_client.get(f"{base_url}/api/")
    assert response.status_code == 200

    data = response.json()
    assert data["message"] == "Personal Photo Lab API"
    assert isinstance(data["ai_ready"], bool)


# Preset tools list and categories contract used by frontend editor panel
def test_presets_returns_expected_tool_groups(api_client, base_url):
    response = api_client.get(f"{base_url}/api/presets")
    assert response.status_code == 200

    data = response.json()
    assert isinstance(data, list) and len(data) >= 4

    returned_ids = {group["id"] for group in data}
    assert {"body", "makeup", "clothing", "pose"}.issubset(returned_ids)

    first = data[0]
    assert isinstance(first["presets"], list) and len(first["presets"]) >= 1
    assert {"id", "label", "prompt"}.issubset(first["presets"][0].keys())


# Google Photos status should indicate setup-required when OAuth IDs are missing
def test_google_photos_status_has_message_and_flag(api_client, base_url):
    response = api_client.get(f"{base_url}/api/google-photos/status")
    assert response.status_code == 200

    data = response.json()
    assert isinstance(data["configured"], bool)
    assert isinstance(data["message"], str) and len(data["message"].strip()) > 0


# Recent edits feed should always return a list consumable by frontend history strip
def test_recent_edits_returns_list(api_client, base_url):
    response = api_client.get(f"{base_url}/api/edits")
    assert response.status_code == 200

    data = response.json()
    assert isinstance(data, list)
    if data:
        sample = data[0]
        assert "id" in sample and isinstance(sample["id"], str)
        assert "result_image_base64" in sample and isinstance(sample["result_image_base64"], str)


# Edit creation input validation: missing/short image should be rejected before provider call
def test_create_edit_rejects_short_source_image(api_client, base_url):
    payload = {
        "source_image_base64": "data:image/png;base64,aGVsbG8=",
        "provider": "gemini",
        "category": "body",
        "preset_id": "snatched",
        "preset_label": "Sculpted waist",
        "prompt": "Subtle edit",
        "intensity": 55,
    }
    response = api_client.post(f"{base_url}/api/edits", json=payload)
    assert response.status_code == 422


# Edit creation schema validation for provider/category enum bounds
def test_create_edit_rejects_invalid_provider(api_client, base_url):
    payload = {
        "source_image_base64": "data:image/png;base64," + ("A" * 160),
        "provider": "invalid-provider",
        "category": "body",
        "preset_id": "snatched",
        "preset_label": "Sculpted waist",
        "prompt": f"TEST_{uuid.uuid4()}",
        "intensity": 55,
    }
    response = api_client.post(f"{base_url}/api/edits", json=payload)
    assert response.status_code == 422
