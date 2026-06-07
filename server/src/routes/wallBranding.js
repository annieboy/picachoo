const router      = require('express').Router();
const multer      = require('multer');
const { createClient } = require('@supabase/supabase-js');
const pool        = require('../config/db');
const requireAuth = require('../middleware/requireAuth');

// ── Specs ─────────────────────────────────────────────────────────────────────
const SPECS = {
  background: {
    maxBytes:    4 * 1024 * 1024,             // 4 MB (Vercel body limit headroom)
    allowedMime: new Set(['image/jpeg', 'image/png', 'image/webp']),
    width:  1920,
    height: 1080,
    label:  '1920 × 1080 px, JPEG / PNG / WebP, max 4 MB',
  },
  frame: {
    maxBytes:    2 * 1024 * 1024,             // 2 MB
    allowedMime: new Set(['image/png']),       // PNG only — needs transparency
    width:  600,
    height: 800,
    label:  '600 × 800 px (3:4), PNG only (transparent background), max 2 MB',
  },
};

const TOLERANCE = 0.05; // ±5% on each dimension

// ── Multer (4 MB ceiling covers the largest allowed asset) ────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024, files: 1 },
});

function wallUpload(req, res, next) {
  upload.single('asset')(req, res, err => {
    if (!err) return next();
    if (err instanceof multer.MulterError) {
      err.status  = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
      err.message = err.code === 'LIMIT_FILE_SIZE' ? 'File too large.' : err.message;
    }
    next(err);
  });
}

// ── Supabase Storage client (service role — bypasses RLS) ─────────────────────
let _sb = null;
function sb() {
  if (!_sb) _sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  return _sb;
}

// ── Dimension parser — no sharp needed ────────────────────────────────────────
// Returns { width, height } from a raw Buffer, or null if unparseable.
function parseDimensions(buf, mime) {
  try {
    if (mime === 'image/png') {
      // PNG: signature 8 bytes, IHDR chunk: 4 len + 4 "IHDR" + 4 W + 4 H
      if (buf.length < 24) return null;
      return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
    }

    if (mime === 'image/jpeg') {
      // Scan for SOF0/SOF1/SOF2 markers (0xFF 0xC0–0xC3 excluding 0xC4/0xC8)
      let i = 2;
      while (i < buf.length - 9) {
        if (buf[i] !== 0xff) { i++; continue; }
        const marker = buf[i + 1];
        if ([0xc0, 0xc1, 0xc2, 0xc3].includes(marker)) {
          return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
        }
        if (marker === 0xd9 || marker === 0xda) break;
        const segLen = buf.readUInt16BE(i + 2);
        i += 2 + segLen;
      }
      return null;
    }

    if (mime === 'image/webp') {
      // RIFF....WEBPVP8  or RIFF....WEBPVP8L
      if (buf.toString('ascii', 0, 4) !== 'RIFF') return null;
      if (buf.toString('ascii', 8, 12) !== 'WEBP') return null;
      const chunkType = buf.toString('ascii', 12, 16);
      if (chunkType === 'VP8 ') {
        // Lossy: frame tag at byte 23, width at 26-27, height at 28-29 (14-bit + 1)
        const w = (buf.readUInt16LE(26) & 0x3fff) + 1;
        const h = (buf.readUInt16LE(28) & 0x3fff) + 1;
        return { width: w, height: h };
      }
      if (chunkType === 'VP8L') {
        // Lossless: signature 0x2f then 28-bit packed dims
        const b = buf.readUInt32LE(21);
        const w = (b & 0x3fff) + 1;
        const h = ((b >> 14) & 0x3fff) + 1;
        return { width: w, height: h };
      }
      return null;
    }
  } catch { /* fall through */ }
  return null;
}

// ── POST /api/events/:eventId/wall-branding ───────────────────────────────────
// Multipart body: asset (file), type ('background' | 'frame')
// Pro-only. Validates specs, uploads to Supabase Storage, updates event row.
router.post('/:eventId/wall-branding', requireAuth, wallUpload, async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const assetType   = req.body.type;

    if (!['background', 'frame'].includes(assetType)) {
      return res.status(400).json({ error: 'type must be background or frame' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const spec = SPECS[assetType];
    const file = req.file;

    // ── 1. Verify ownership + pro tier ────────────────────────────────────
    const { rows: eventRows } = await pool.query(
      `SELECT e.id, h.tier
       FROM events e
       JOIN hosts h ON h.id = e.host_id
       WHERE e.id = $1 AND h.auth_id = $2`,
      [eventId, req.user.authId],
    );
    if (!eventRows.length) {
      return res.status(404).json({ error: 'Event not found' });
    }
    const tier   = eventRows[0].tier ?? 'free';
    const isPro  = ['pro', 'pro_annual', 'business_annual'].includes(tier);
    if (!isPro) {
      return res.status(403).json({ error: 'Custom wall branding is a Pro feature. Upgrade to unlock.' });
    }

    // ── 2. Validate MIME type ─────────────────────────────────────────────
    if (!spec.allowedMime.has(file.mimetype)) {
      const allowed = [...spec.allowedMime].join(', ');
      return res.status(415).json({
        error: `Invalid file type for ${assetType}. Required: ${allowed}.`,
        spec:  spec.label,
      });
    }

    // ── 3. Validate file size ─────────────────────────────────────────────
    if (file.size > spec.maxBytes) {
      return res.status(413).json({
        error: `File too large. Maximum for ${assetType} is ${spec.maxBytes / 1024 / 1024} MB.`,
        spec:  spec.label,
      });
    }

    // ── 4. Validate dimensions ────────────────────────────────────────────
    const dims = parseDimensions(file.buffer, file.mimetype);
    if (!dims) {
      return res.status(422).json({ error: 'Could not read image dimensions. Ensure the file is a valid image.' });
    }
    const wOk = Math.abs(dims.width  - spec.width)  / spec.width  <= TOLERANCE;
    const hOk = Math.abs(dims.height - spec.height) / spec.height <= TOLERANCE;
    if (!wOk || !hOk) {
      return res.status(422).json({
        error: `Wrong dimensions. Got ${dims.width} × ${dims.height} px, required ${spec.width} × ${spec.height} px (±5%).`,
        spec:  spec.label,
        got:   dims,
      });
    }

    // ── 5. Upload to Supabase Storage ─────────────────────────────────────
    const ext      = file.mimetype.split('/')[1].replace('jpeg', 'jpg');
    const path     = `${eventId}/${assetType}.${ext}`;
    const { error: storageErr } = await sb()
      .storage
      .from('wall-assets')
      .upload(path, file.buffer, {
        contentType: file.mimetype,
        upsert:      true,           // overwrite if host re-uploads
      });

    if (storageErr) {
      console.error('[wall-branding] storage upload error:', storageErr);
      return res.status(500).json({ error: 'Failed to store asset. Try again.' });
    }

    const { data: { publicUrl } } = sb()
      .storage
      .from('wall-assets')
      .getPublicUrl(path);

    // Bust CDN cache with a version param so browsers pick up replacements
    const url = `${publicUrl}?v=${Date.now()}`;

    // ── 6. Persist URL on event ───────────────────────────────────────────
    const col = assetType === 'background' ? 'wall_background_url' : 'wall_frame_url';
    const { rows: updated } = await pool.query(
      `UPDATE events SET ${col} = $1
       WHERE id = $2
       RETURNING id, wall_background_url, wall_frame_url`,
      [url, eventId],
    );

    res.json({ event: updated[0], url });
  } catch (err) {
    next(err);
  }
});

// ── DELETE /api/events/:eventId/wall-branding/:type ──────────────────────────
router.delete('/:eventId/wall-branding/:type', requireAuth, async (req, res, next) => {
  try {
    const { eventId, type } = req.params;
    if (!['background', 'frame'].includes(type)) {
      return res.status(400).json({ error: 'type must be background or frame' });
    }

    // Verify ownership
    const { rows } = await pool.query(
      `SELECT e.id FROM events e
       JOIN hosts h ON h.id = e.host_id
       WHERE e.id = $1 AND h.auth_id = $2`,
      [eventId, req.user.authId],
    );
    if (!rows.length) return res.status(404).json({ error: 'Event not found' });

    // Remove from storage (best-effort — don't fail if already gone)
    const extensions = ['jpg', 'png', 'webp'];
    await Promise.allSettled(
      extensions.map(ext =>
        sb().storage.from('wall-assets').remove([`${eventId}/${type}.${ext}`]),
      ),
    );

    const col = type === 'background' ? 'wall_background_url' : 'wall_frame_url';
    const { rows: updated } = await pool.query(
      `UPDATE events SET ${col} = NULL WHERE id = $1
       RETURNING id, wall_background_url, wall_frame_url`,
      [eventId],
    );

    res.json({ event: updated[0] });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/wall-branding/specs ─────────────────────────────────────────────
// Public — returns the upload specifications so the UI can display them.
router.get('/wall-branding/specs', (_req, res) => {
  res.json({
    background: { ...SPECS.background, allowedMime: [...SPECS.background.allowedMime] },
    frame:      { ...SPECS.frame,      allowedMime: [...SPECS.frame.allowedMime]      },
  });
});

module.exports = router;
