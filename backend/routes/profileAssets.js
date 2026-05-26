const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');

// POST /profile-assets/:userId - Upload/Update profile asset (photo or resume)
// Accepts either a Supabase Storage URL (preferred) or a base64 fileData blob (legacy)
router.post('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { assetType, fileName, mimeType, fileData, assetUrl, storagePath } = req.body;

    if (!assetType) {
      return res.status(400).json({ error: 'assetType is required' });
    }
    if (!assetUrl && !fileData) {
      return res.status(400).json({ error: 'Either assetUrl or fileData is required' });
    }
    if (!['photo', 'resume'].includes(assetType)) {
      return res.status(400).json({ error: 'assetType must be "photo" or "resume"' });
    }

    // Size check only applies to base64 blobs
    if (fileData) {
      const fileSize = fileData.length;
      const maxSize = assetType === 'photo' ? 5 * 1024 * 1024 : 10 * 1024 * 1024;
      if (fileSize > maxSize) {
        return res.status(413).json({
          error: `File too large. Maximum size for ${assetType} is ${maxSize / 1024 / 1024}MB`,
        });
      }
    }

    const mode = assetUrl ? 'url' : 'base64';
    console.log(`[ProfileAssets] Saving ${assetType} (${mode}) for user ${userId}`);

    const asset = await prisma.profileAsset.upsert({
      where: {
        user_id_asset_type: {
          user_id: userId,
          asset_type: assetType,
        },
      },
      update: {
        file_name:    fileName    || null,
        mime_type:    mimeType    || null,
        asset_url:    assetUrl    || null,
        storage_path: storagePath || null,
        file_data:    fileData    || null,
        file_size:    fileData ? fileData.length : null,
        updatedAt:    new Date(),
      },
      create: {
        user_id:      userId,
        asset_type:   assetType,
        file_name:    fileName    || null,
        mime_type:    mimeType    || null,
        asset_url:    assetUrl    || null,
        storage_path: storagePath || null,
        file_data:    fileData    || null,
        file_size:    fileData ? fileData.length : null,
      },
    });

    console.log(`[ProfileAssets] ✓ Saved ${assetType} successfully`);

    res.json({
      id:          asset.id,
      assetType:   asset.asset_type,
      fileName:    asset.file_name,
      assetUrl:    asset.asset_url,
      storagePath: asset.storage_path,
      fileSize:    asset.file_size,
      createdAt:   asset.createdAt,
    });
  } catch (err) {
    console.error('[ProfileAssets] Save error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /profile-assets/:userId/:assetType - Get specific asset
router.get('/:userId/:assetType', async (req, res) => {
  try {
    const { userId, assetType } = req.params;

    if (!['photo', 'resume'].includes(assetType)) {
      return res.status(400).json({ error: 'assetType must be "photo" or "resume"' });
    }

    const asset = await prisma.profileAsset.findUnique({
      where: {
        user_id_asset_type: {
          user_id: userId,
          asset_type: assetType,
        },
      },
    });

    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    console.log(`[ProfileAssets] Retrieved ${assetType} for user ${userId}`);

    res.json({
      id:          asset.id,
      assetType:   asset.asset_type,
      fileName:    asset.file_name,
      mimeType:    asset.mime_type,
      assetUrl:    asset.asset_url,
      storagePath: asset.storage_path,
      fileData:    asset.file_data,   // null for URL-based assets
      fileSize:    asset.file_size,
      createdAt:   asset.createdAt,
    });
  } catch (err) {
    console.error('[ProfileAssets] Get error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /profile-assets/:userId - Get all assets for a user
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const assets = await prisma.profileAsset.findMany({
      where: { user_id: userId },
      select: {
        id:           true,
        asset_type:   true,
        file_name:    true,
        mime_type:    true,
        asset_url:    true,
        storage_path: true,
        file_data:    true,
        file_size:    true,
        createdAt:    true,
      },
    });

    console.log(`[ProfileAssets] Retrieved ${assets.length} assets for user ${userId}`);

    const result = {};
    assets.forEach(asset => {
      result[asset.asset_type] = {
        id:          asset.id,
        fileName:    asset.file_name,
        mimeType:    asset.mime_type,
        assetUrl:    asset.asset_url,
        storagePath: asset.storage_path,
        fileData:    asset.file_data,
        fileSize:    asset.file_size,
        createdAt:   asset.createdAt,
      };
    });

    res.json(result);
  } catch (err) {
    console.error('[ProfileAssets] Get all error:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /profile-assets/:userId/:assetType - Delete specific asset
router.delete('/:userId/:assetType', async (req, res) => {
  try {
    const { userId, assetType } = req.params;

    if (!['photo', 'resume'].includes(assetType)) {
      return res.status(400).json({ error: 'assetType must be "photo" or "resume"' });
    }

    await prisma.profileAsset.delete({
      where: {
        user_id_asset_type: {
          user_id: userId,
          asset_type: assetType,
        },
      },
    });

    console.log(`[ProfileAssets] Deleted ${assetType} for user ${userId}`);

    res.json({ message: 'Asset deleted successfully' });
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Asset not found' });
    }
    console.error('[ProfileAssets] Delete error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
