import base64
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Literal, Optional

from dotenv import load_dotenv
from emergentintegrations.llm.chat import ImageContent, LlmChat, UserMessage
from emergentintegrations.llm.openai.image_generation import OpenAIImageGeneration
from fastapi import APIRouter, FastAPI, HTTPException
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field
from starlette.middleware.cors import CORSMiddleware
import logging


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


class Preset(BaseModel):
    id: str
    label: str
    prompt: str


class ToolGroup(BaseModel):
    id: str
    label: str
    icon: str
    presets: List[Preset]


class EditRequest(BaseModel):
    source_image_base64: str = Field(..., min_length=120)
    provider: Literal["gemini", "openai"] = "gemini"
    category: Literal["body", "makeup", "clothing", "pose"]
    preset_id: str
    preset_label: str
    prompt: str = ""
    intensity: int = Field(default=55, ge=0, le=100)


class EditResponse(BaseModel):
    id: str
    created_at: str
    provider: str
    category: str
    preset_label: str
    prompt: str
    intensity: int
    result_image_base64: str
    source_image_base64: Optional[str] = None
    provider_note: Optional[str] = None


class GooglePhotosStatus(BaseModel):
    configured: bool
    message: str


TOOL_GROUPS = [
    ToolGroup(
        id="body",
        label="Body",
        icon="body-outline",
        presets=[
            Preset(id="snatched", label="Sculpted waist", prompt="subtly sculpt waist and balance body proportions"),
            Preset(id="tall", label="Longer legs", prompt="lengthen legs naturally while preserving realistic anatomy"),
            Preset(id="athletic", label="Athletic tone", prompt="add graceful athletic definition and posture"),
        ],
    ),
    ToolGroup(
        id="makeup",
        label="Makeup",
        icon="color-palette-outline",
        presets=[
            Preset(id="natural", label="Soft natural", prompt="apply natural complexion polish, soft blush, and clean brows"),
            Preset(id="glam", label="Glam glow", prompt="add glamorous evening makeup with luminous skin and defined eyes"),
            Preset(id="editorial", label="Editorial", prompt="create high-fashion editorial makeup with precise accents"),
        ],
    ),
    ToolGroup(
        id="clothing",
        label="Clothes",
        icon="shirt-outline",
        presets=[
            Preset(id="luxury", label="Luxury suit", prompt="change outfit to an elegant luxury tailored look"),
            Preset(id="street", label="Streetwear", prompt="change outfit to elevated modern streetwear"),
            Preset(id="evening", label="Evening look", prompt="change clothing to a dramatic evening fashion look"),
        ],
    ),
    ToolGroup(
        id="pose",
        label="Pose",
        icon="accessibility-outline",
        presets=[
            Preset(id="shoulder", label="Over shoulder", prompt="adjust pose to looking confidently over the shoulder"),
            Preset(id="runway", label="Runway stance", prompt="adjust pose to a poised runway fashion stance"),
            Preset(id="seated", label="Seated pose", prompt="recompose into a relaxed editorial seated pose"),
        ],
    ),
]


def _strip_data_uri(image_value: str) -> str:
    if "," in image_value and image_value.strip().lower().startswith("data:image"):
        return image_value.split(",", 1)[1]
    return image_value


def _to_data_uri(image_base64: str, mime_type: str = "image/png") -> str:
    if image_base64.startswith("data:image"):
        return image_base64
    return f"data:{mime_type};base64,{image_base64}"


def _validate_image_base64(image_value: str) -> str:
    raw = _strip_data_uri(image_value).strip()
    try:
        base64.b64decode(raw, validate=True)
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Invalid image data") from exc
    return raw


def _system_prompt() -> str:
    return (
        "You are a premium portrait retouching and fashion image editor. "
        "Edit only the provided adult reference image, preserve identity and key facial features, "
        "keep anatomy realistic, avoid artifacts, and output one polished photorealistic image."
    )


def _build_instruction(request: EditRequest) -> str:
    custom_prompt = request.prompt.strip()
    strength = "subtle" if request.intensity < 35 else "balanced" if request.intensity < 75 else "dramatic"
    instruction = (
        f"Apply a {strength} {request.category} edit. Preset: {request.preset_label}. "
        f"Core edit: {custom_prompt or 'use the selected preset tastefully'}. "
        f"Intensity: {request.intensity}/100. Preserve the same person, image quality, lighting direction, "
        "skin texture, and believable proportions unless the user specifically asked otherwise."
    )
    return instruction


async def _edit_with_gemini(request: EditRequest, source_base64: str) -> Dict[str, str]:
    api_key = os.getenv("EMERGENT_LLM_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="AI key is not configured")

    chat = LlmChat(
        api_key=api_key,
        session_id=f"photo-edit-{uuid.uuid4()}",
        system_message=_system_prompt(),
    )
    chat.with_model("gemini", "gemini-3.1-flash-image-preview").with_params(modalities=["image", "text"])
    message = UserMessage(text=_build_instruction(request), file_contents=[ImageContent(source_base64)])
    text, images = await chat.send_message_multimodal_response(message)
    if not images:
        raise HTTPException(status_code=502, detail=text or "Gemini did not return an image")
    first_image = images[0]
    return {
        "image": _to_data_uri(first_image["data"], first_image.get("mime_type", "image/png")),
        "note": text or "Edited with Gemini image model",
    }


async def _generate_with_openai(request: EditRequest) -> Dict[str, str]:
    api_key = os.getenv("EMERGENT_LLM_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="AI key is not configured")

    generator = OpenAIImageGeneration(api_key=api_key)
    prompt = (
        "Create a premium photorealistic fashion portrait variation inspired by this edit brief. "
        f"Category: {request.category}. Preset: {request.preset_label}. "
        f"Instruction: {request.prompt.strip() or _build_instruction(request)}. "
        "Cinematic dark studio lighting, editorial quality, realistic anatomy, refined styling."
    )
    try:
        images = await generator.generate_images(prompt=prompt, model="gpt-image-1", number_of_images=1, quality="medium")
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"OpenAI image generation failed: {exc}") from exc
    if not images:
        raise HTTPException(status_code=502, detail="OpenAI did not return an image")
    encoded = base64.b64encode(images[0]).decode("utf-8")
    return {
        "image": _to_data_uri(encoded, "image/png"),
        "note": "OpenAI generated a fresh fashion image from your edit brief.",
    }

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Personal Photo Lab API", "ai_ready": bool(os.getenv("EMERGENT_LLM_KEY"))}


@api_router.get("/presets", response_model=List[ToolGroup])
async def get_presets():
    return TOOL_GROUPS


@api_router.get("/google-photos/status", response_model=GooglePhotosStatus)
async def google_photos_status():
    configured = bool(os.getenv("GOOGLE_PHOTOS_CLIENT_ID"))
    return GooglePhotosStatus(
        configured=configured,
        message=(
            "Google Photos OAuth is configured."
            if configured
            else "Google Photos needs OAuth client IDs before importing can be enabled."
        ),
    )


@api_router.post("/edits", response_model=EditResponse)
async def create_edit(request: EditRequest):
    source_base64 = _validate_image_base64(request.source_image_base64)
    if request.provider == "openai":
        result = await _generate_with_openai(request)
    else:
        result = await _edit_with_gemini(request, source_base64)

    created_at = datetime.now(timezone.utc).isoformat()
    edit_response = EditResponse(
        id=str(uuid.uuid4()),
        created_at=created_at,
        provider=request.provider,
        category=request.category,
        preset_label=request.preset_label,
        prompt=request.prompt,
        intensity=request.intensity,
        result_image_base64=result["image"],
        source_image_base64=_to_data_uri(source_base64, "image/jpeg"),
        provider_note=result.get("note"),
    )
    await db.edits.insert_one(edit_response.model_dump())
    return edit_response


@api_router.get("/edits", response_model=List[EditResponse])
async def get_recent_edits():
    cursor = db.edits.find({}, {"_id": 0}).sort("created_at", -1).limit(20)
    edits = await cursor.to_list(length=20)
    return [EditResponse(**edit) for edit in edits]

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
