# Media & Asset Inventory

**Project:** Sony WH-CH520 Interactive Product Experience  
**Date of Audit:** November 1, 2026  
**Auditor:** Senior Software Engineer & Technical Architect  

---

## 1. Executive Summary

A comprehensive scan of the workspace (`c:\Users\jyoti\Downloads\sony headphone`) was performed to catalog all multimedia assets, 3D models, fonts, and source files. 

### Key Findings:
- **Total Media Files Found:** 9 video files in `./videos/`
- **Unique Video Clips:** Exactly **8 unique clips** (Clips `8-upscaled-2x.mp4` and `9-upscaled-2x.mp4` are bit-for-bit identical video streams with MD5 `d036dd9b113a50a70fc6c44f867bb6e4`).
- **Total Media Size:** 101,707,049 bytes (~96.99 MB).
- **Total Running Time (8 Unique Clips):** 74.08 seconds (1,778 frames @ 24 fps).
- **Missing Asset Types:** No 3D models (`.glb`/`.gltf`), no custom web fonts (`.woff2`), and no static photographic assets were present prior to this audit.
- **Generated Inspection Previews:** 32 visual contact sheets, boundary frame comparisons, and a master overview collage were generated and archived in `tasks/previews/` for review.

---

## 2. Complete Video Asset Table

| # | Filename | File Size | Duration | Resolution | Aspect Ratio | FPS | Frames | Video Codec | Profile / Bit depth | Bitrate | Audio Stream | SHA-256 (File) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `videos/1.mp4` | 4,268,130 B (4.07 MB) | 4.375 s | 1920×1080 | 16:9 (SAR 1:1) | 24.0 | 105 | H.264 (avc1) | Main @ L4.0, 8-bit | 7.80 Mbps | None | `2FBC8EAFDA74B080DA92FB11ADFD12BC8E767FD0B2A6064AA0734CB36D4CE59F` |
| 2 | `videos/2.mp4` | 14,644,885 B (13.97 MB) | 9.958 s | 3840×2160 | 16:9 (SAR 1:1) | 24.0 | 239 | H.264 (avc1) | High @ L5.1, 8-bit | 11.76 Mbps | AAC (48kHz, stereo, 139 kbps) | `8734685AFE5B30093E7A41DB0AF5356378947721494C528198E4E5BF9C79B98A` |
| 3 | `videos/3.mp4` | 11,065,212 B (10.55 MB) | 9.958 s | 2560×1440 | 16:9 (SAR 1:1) | 24.0 | 239 | H.264 (avc1) | High @ L5.0, 8-bit | 8.89 Mbps | AAC (48kHz, stereo, 139 kbps) | `87E69BE84742BDD42FF00C49E042F0E440378F4F0D2D076C8E14BEB48B61D867` |
| 4 | `videos/5-upscaled-2x.mp4` | 11,965,007 B (11.41 MB) | 9.958 s | 3840×2160 | 16:9 (SAR 1:1) | 24.0 | 239 | H.264 (avc1) | High @ L5.1, 8-bit | 9.61 Mbps | AAC (48kHz, stereo, 139 kbps) | `A4390B9C4EFBC118B145E067FA12D6B8C24004AE40CDD97FCBAE0F88D10EC0C5` |
| 5 | `videos/6-upscaled-2x.mp4` | 13,761,279 B (13.12 MB) | 9.958 s | 3840×2160 | 16:9 (SAR 1:1) | 24.0 | 239 | H.264 (avc1) | High @ L5.1, 8-bit | 11.05 Mbps | AAC (48kHz, stereo, 139 kbps) | `8C6E8F7BF8D4CBC6E7A307F0541AE1214A2CE38D81F96B69C90C1252914030B8` |
| 6 | `videos/7-upscaled-2x.mp4` | 11,587,901 B (11.05 MB) | 9.958 s | 3840×2160 | 16:9 (SAR 1:1) | 24.0 | 239 | H.264 (avc1) | High @ L5.1, 8-bit | 9.31 Mbps | AAC (48kHz, stereo, 139 kbps) | `FC063B9306316F2B4851E7C4BBC31394F68D19DBC35C722E7B37492E08F1050B` |
| 7 | `videos/8-upscaled-2x.mp4` | 13,967,334 B (13.32 MB) | 9.958 s | 3840×2160 | 16:9 (SAR 1:1) | 24.0 | 239 | H.264 (avc1) | High @ L5.1, 8-bit | 11.22 Mbps | AAC (48kHz, stereo, 139 kbps) | `761FAA83AFA7702C51E64F9DF81AD3930FE2F1802F9A276F5DBD9F3099C7C417` |
| - | `videos/9-upscaled-2x.mp4` *(Duplicate)* | 13,967,334 B (13.32 MB) | 9.958 s | 3840×2160 | 16:9 (SAR 1:1) | 24.0 | 239 | H.264 (avc1) | High @ L5.1, 8-bit | 11.22 Mbps | AAC (48kHz, stereo, 139 kbps) | `F433B603CA86665920CB1D546ECEBD762CDEE676970BC99E6CA331ED0960DD80` |
| 8 | `videos/10.mp4` | 6,516,009 B (6.21 MB) | 9.958 s | 3840×2160 | 16:9 (SAR 1:1) | 24.0 | 239 | H.264 (avc1) | High @ L5.1, 8-bit | 5.23 Mbps | AAC (48kHz, stereo, 139 kbps) | `A653847799DD36B6F9BACEAAA28651728ED23113277C50FC7FD82E1D19987A49` |

---

## 3. Duplicate Video Analysis: Clip 8 vs Clip 9

A deep inspection of `videos/8-upscaled-2x.mp4` and `videos/9-upscaled-2x.mp4` revealed:
- **Identical File Sizes:** Both files measure exactly `13,967,334` bytes.
- **Identical Raw Stream Decoded Hash:** `MD5=d036dd9b113a50a70fc6c44f867bb6e4`.
- **Reason for File Hash Discrepancy:** The container metadata records different creation timestamps:
  - `8-upscaled-2x.mp4`: `creation_time: 2026-11-01T07:31:29.000000Z`
  - `9-upscaled-2x.mp4`: `creation_time: 2026-11-01T07:31:59.000000Z` (created 30 seconds later by the same tool, `Mediabunny v1.61.6`).
- **Conclusion:** `videos/9-upscaled-2x.mp4` is a redundant duplicate of `videos/8-upscaled-2x.mp4`. The web experience requires only one of these files.

---

## 4. Missing Video 4 and Resolution Discrepancies

1. **Missing "4.mp4":**  
   There is no file named `4.mp4` in the project. However, continuity analysis confirms that `3.mp4` directly flows into `5-upscaled-2x.mp4` seamlessly:
   - `3.mp4` ends with the headphone centered against a black floor/background at frame 238.
   - `5-upscaled-2x.mp4` starts at frame 0 with the headphone at that exact spatial coordinate against that exact black background.
   - Therefore, no visual narrative is missing between 3 and 5.

2. **Resolution Inconsistency:**
   - **4K UHD (3840×2160):** Clips 2, 5, 6, 7, 8, 10
   - **2K QHD (2560×1440):** Clip 3
   - **Full HD (1920×1080):** Clip 1
   - **Impact:** All clips share the 16:9 aspect ratio and square pixels (SAR 1:1), so they scale cleanly inside modern CSS containers (`object-fit: contain` or `object-fit: cover`). However, downloading ~97 MB of uncompressed 4K video over cellular connections will cause severe page load latency. A web-optimized multi-resolution encoding step (1080p WebM + H.264) is strongly recommended for production.

---

## 5. Generated Visual Previews & Inspection Artifacts

To enable visual inspection without loading full video players, contact sheets and boundary frames were extracted into `tasks/previews/`:

| Artifact | File Path | Purpose |
|---|---|---|
| **Master Sequence Overview** | `tasks/previews/master_sequence_overview.jpg` | 8-panel montage showing mid-point frame of every clip |
| **Grid Contact Sheets (3×3)** | `tasks/previews/[clip]_grid.jpg` | 9 evenly spaced keyframes across each clip's duration |
| **First Boundary Frames** | `tasks/previews/[clip]_f0.jpg` | Exact first frame (frame index 0) of each video |
| **Last Boundary Frames** | `tasks/previews/[clip]_fLast.jpg` | Exact last frame (frame index N-1) of each video |
| **Transition Comparisons** | `tasks/previews/transition_[A]_to_[B].jpg` | Side-by-side verification of consecutive boundary frames |
