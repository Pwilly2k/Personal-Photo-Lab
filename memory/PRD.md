# Personal Photo Lab — Product Requirements Document

## Problem Statement
Build a mobile app for adjusting body proportions, detailed make-up editing, clothing changing, and posing using personal photos from Google Photos and the device.

## Architecture
- **Frontend:** Expo SDK 54 React Native mobile app with a premium dark editor UI.
- **Backend:** FastAPI API under `/api`, connected to MongoDB for edit history.
- **AI:** Backend uses `EMERGENT_LLM_KEY` with Gemini image editing and OpenAI GPT Image 1 generation support.
- **Storage:** MongoDB stores recent edit records and generated base64 image data.

## User Personas
- **Creator:** Wants fast fashion/body/pose variations for social or portfolio visuals.
- **Beauty editor:** Wants makeup presets plus detailed prompt-level changes.
- **Styling explorer:** Wants quick clothing concepts from device photos.

## Core Requirements
- Import images from device gallery and camera.
- Provide setup-ready Google Photos entry point until OAuth client IDs are available.
- Offer four edit categories: Body, Makeup, Clothing, Pose.
- Support preset chips, intensity control, and free-text prompts.
- Allow provider selection between Gemini and OpenAI Image 1.
- Show generated result, compare before/after, and recent edit history.

## Implemented — 2026-05-14
- Built mobile-first Expo editor with cinematic dark UI, image canvas, import actions, provider selector, tool categories, presets, intensity control, and prompt input.
- Added FastAPI endpoints: `/api/`, `/api/presets`, `/api/google-photos/status`, `/api/edits` POST/GET.
- Integrated Gemini image editing and OpenAI GPT Image 1 generation via backend `EMERGENT_LLM_KEY`.
- Added MongoDB-backed recent edit history and before/after hold-to-compare UI.
- Added visible in-app feedback banners for missing photo validation and Google Photos setup-required guidance.
- Added device gallery/camera permissions in Expo config.

## Validation
- Backend API smoke tests passed for root, presets, Google Photos status, edit history, and validation paths.
- Expo mobile preview loads and renders the complete editor UI.
- Self-tested visible banners for “Import a photo first” and “Google Photos setup required”.

## Remaining Backlog
### P0
- Add Google Photos OAuth client IDs and complete picker/import flow.
- Validate end-to-end AI image editing with a real portrait sample in mobile preview.

### P1
- Add save/share generated image actions.
- Add edit detail view with prompt/provider metadata.
- Add stronger mobile-native slider drag behavior.

### P2
- Add onboarding tips and preset collections.
- Add local caching for source photos and previous prompts.
- Add batch edit queue.

## Next Tasks
1. Provide Google Photos OAuth credentials to enable real Google Photos import.
2. Test a real portrait through Gemini editing and tune prompt quality.
3. Add save/share controls for completed edits.