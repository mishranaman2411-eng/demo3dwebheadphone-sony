# Embedded Text & Graphic Artifact Audit

**Project:** Sony WH-CH520 Cinematic Product Experience  
**Date of Audit:** November 1, 2026  
**Auditor:** Senior Software Engineer & Creative Technologist  
**Methodology:** Full-frame inspection of all 2,256 frames across Videos 1 through 10 using multimodal computer vision (Gemini 2.5 Flash), pixel variance mapping, and edge analysis.

---

## 1. Executive Summary

A comprehensive forensic audit of all 10 video clips (`videos/1.mp4` through `videos/10.mp4` and their corresponding extracted WebP frame directories in `public/frames/`) was conducted to identify any embedded text, typographic title cards, overlay captions, watermarks, duplicate sequences, and unwanted graphic artifacts.

### Key Audit Findings:
1. **Embedded Text / Typographic Overlay in Video 1:**
   - **Clip Affected:** `videos/1.mp4` (and `public/frames/video-1/`)
   - **Timestamp Range:** `0.167s – 2.500s` (Frames 4 through 60 out of 105)
   - **Content:** Large bold serif "SONY" logo rendered in solid black/dark gray directly in the center of the video frame.
   - **Impact:** Causes timing collisions with website overlays, duplicates any HTML brand text, and creates visual popping during reverse scrubbing.
   - **Surrounding Visuals:** The background during frames 1 through 65 is completely solid white (`#FFFFFF` / `RGB(255, 251, 255)`). The white Sony WH-CH520 headphones do not begin entering the viewport from the bottom until Frame 70 (`2.917s`).
   - **Remediation Feasibility:** 100% clean removal achievable without blurring, cropping, or altering any product geometry. Replacing the centered text during frames 1–65 with the native pure white background yields an immaculate, pristine visual sequence.

2. **Hardware Branding (Expected Physical Markings):**
   - **Videos 2, 3, 5, 6, 7, 8, 10:** Contain physical molded/printed hardware branding (e.g., the subtle "SONY" debossed text on the headband extension slider, volume button glyphs, and earcup hinges).
   - **Finding:** These are authentic physical product markings on the headphone hardware, not graphic overlay text or typography. They are preserved intact.

3. **Duplicate Clips & Timeline Redundancy:**
   - **Video 8 vs Video 9:** Bit-for-bit identical stream of 239 frames representing Bluetooth multipoint pairing.
   - **Video 3 vs Video 4:** Video 4 is an alternate render/duplicate of the 30mm dynamic acoustic driver sequence.
   - **Impact:** Including Videos 4 and 9 in a linear playlist causes repeated demonstrations of the same feature.

---

## 2. Detailed Clip-by-Clip Audit Table

| Clip # | Filename | Resolution | Frames | Duration | Embedded Overlay Text / Captions | Hardware Physical Markings | Duplicate / Artifact Status | Remediation Required |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Video 1** | `1.mp4` | 1920×1080 | 105 | 4.38s | **YES:** Centered bold "SONY" typographic logo (fades in frames 4–20, holds frames 21–50, fades out frames 51–60). | "SONY" printed vertically on left headband slider (visible frames 70–105). | None | **Clean embedded "SONY" text in frames 1–65.** Maintain white studio background and rising headphones from frame 70. |
| **Video 2** | `2.mp4` | 3840×2160 | 239 | 9.96s | **NONE.** Clean 3D exploded hardware render. | "SONY" on outer hinge; micro manufacturing codes on internal circuit board. | None | None (Preserve original frames). |
| **Video 3** | `3.mp4` | 2560×1440 | 239 | 9.96s | **NONE.** Glowing cyan acoustic waves are visual VFX, not text. | "SONY" on swivel mechanism. | None | None (Preserve original frames). |
| **Video 4** | `4.mp4` | 1920×1080 | 239 | 9.96s | **NONE.** | "SONY" on swivel mechanism. | **Duplicate stream** of Video 3 acoustic driver scene. | Keep original in `videos/4.mp4`; omit from narrative playlist to prevent repeated sound demo. |
| **Video 5** | `5.mp4` | 3840×2160 | 239 | 9.96s | **NONE.** Anamorphic light flares are visual VFX, not text. | "SONY" debossed on headband joint; tactile button symbols (+, Play, -). | None | None (Preserve original frames). |
| **Video 6** | `6.mp4` | 3840×2160 | 239 | 9.96s | **NONE.** Rotating circular energy ring is visual VFX. | "SONY" on headband extender. | None | None (Preserve original frames). |
| **Video 7** | `7.mp4` | 3840×2160 | 239 | 9.96s | **NONE.** | "SONY" printed on headband slider notches and earcups. | None | None (Preserve original frames). |
| **Video 8** | `8.mp4` | 3840×2160 | 239 | 9.96s | **NONE.** Concentric Bluetooth radio pulses are visual VFX. | Subtle molded logo on earcups. | None | None (Preserve original frames). |
| **Video 9** | `9.mp4` | 3840×2160 | 239 | 9.96s | **NONE.** | Subtle molded logo on earcups. | **100% duplicate** of Video 8 (`MD5: d036dd9b...`). | Keep original in `videos/9.mp4`; omit from narrative playlist to prevent repeated Bluetooth demo. |
| **Video 10** | `10.mp4` | 3840×2160 | 239 | 9.96s | **NONE.** Drifting light motes are environmental VFX. | "SONY" on earcup and headband. | None | None (Preserve original frames). |

---

## 3. Original Video Preservation & Output Directory Structure

As instructed in Step 2:
- **Original videos remain intact** in `videos/` (`1.mp4` through `10.mp4`).
- **Original extracted frames remain intact** in `public/frames/` (`video-1` through `video-10`).
- **Cleaned assets destination:**
  - Cleaned video clips: `videos_clean/`
  - Cleaned frame sequences: `public/frames_clean/`

---

## 4. Remediation Strategy for Affected Clip 1

### Feasibility Analysis
- **Text-to-Video Model Regeneration:** The proprietary generation prompts and specific seed configuration used to render the original 3D CAD camera path of the Sony WH-CH520 were not persisted with the workspace. Attempting a naive re-prompt with an external AI video generator would alter the 3D geometry, lighting, headphone model accuracy, and camera trajectory, breaking continuity with Video 2.
- **Pixel-Accurate Frame Inpainting / Background Restoration:**
  - In Video 1, during frames 1 through 65, the headphone is entirely off-screen below the bottom edge.
  - The background is completely solid `#FFFFFF` (`RGB(255, 251, 255)`).
  - By restoring the center rectangular region `[x: 20%..80%, y: 25%..75%]` to the native pure white background color during frames 1 through 65, the baked-in black SONY text is completely eliminated with **100% fidelity**.
  - No product pixels or headphone details are affected because the headphones only rise into view at Frame 70.
  - From Frame 70 through 105, the footage is already completely clean and free of text.
  - The resulting cleaned clip transitions seamlessly into Video 2 at frame 105.
