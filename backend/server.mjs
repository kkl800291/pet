import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import crypto from 'node:crypto';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import multer from 'multer';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import Database from 'better-sqlite3';
import { WebSocketServer } from 'ws';
import {
  createSeedState,
  id,
  now,
  threadIdFor
} from '../lib/domain.js';
import { MODERATION_KEYWORDS } from '../lib/constants.js';

const ROOT_DIR = process.cwd();
const BACKEND_DIR = path.join(ROOT_DIR, 'backend');
const DATA_DIR = path.join(BACKEND_DIR, 'data');
const UPLOAD_DIR = path.join(BACKEND_DIR, 'uploads');
const DB_PATH = path.join(DATA_DIR, 'pet-loop.sqlite');
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

function envString(name, fallback = '') {
  const value = process.env[name];
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function envNumber(name, fallback) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) ? value : fallback;
}

function envBoolean(name, fallback = false) {
  const raw = envString(name, '');
  if (!raw) return fallback;
  if (['1', 'true', 'yes', 'on'].includes(raw.toLowerCase())) return true;
  if (['0', 'false', 'no', 'off'].includes(raw.toLowerCase())) return false;
  return fallback;
}

const PORT = envNumber('BACKEND_PORT', 4000);
const HOST = envString('BACKEND_HOST', '127.0.0.1');
const TRUST_PROXY = envBoolean('BACKEND_TRUST_PROXY', IS_PRODUCTION);
const COOKIE_SECURE = envBoolean('BACKEND_COOKIE_SECURE', IS_PRODUCTION);
const COOKIE_SAMESITE = envString('BACKEND_COOKIE_SAMESITE', COOKIE_SECURE ? 'none' : 'lax');
const BODY_LIMIT_MB = envNumber('BACKEND_BODY_LIMIT_MB', 2);
const UPLOAD_MAX_FILE_SIZE_MB = envNumber('BACKEND_UPLOAD_MAX_FILE_SIZE_MB', 5);
const UPLOAD_MAX_FILES = envNumber('BACKEND_UPLOAD_MAX_FILES', 3);
const GLOBAL_RATE_LIMIT_WINDOW_MS = envNumber('BACKEND_RATE_LIMIT_WINDOW_MS', 60 * 1000);
const GLOBAL_RATE_LIMIT_MAX = envNumber('BACKEND_RATE_LIMIT_MAX', 300);
const AUTH_RATE_LIMIT_MAX = envNumber('BACKEND_AUTH_RATE_LIMIT_MAX', 20);
const KEEP_ALIVE_TIMEOUT_MS = envNumber('BACKEND_KEEP_ALIVE_TIMEOUT_MS', 5 * 1000);
const HEADERS_TIMEOUT_MS = envNumber('BACKEND_HEADERS_TIMEOUT_MS', 60 * 1000);
const ALLOWED_UPLOAD_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif'
]);
const DEFAULT_SETTINGS = Object.freeze({
  defaultPostVisibility: 'public',
  dmRule: 'mutual_follow',
  moderationMode: 'hybrid',
  commentModeration: 'false',
  auditRetentionDays: '90',
  aiThreshold: '85'
});
const POST_VISIBILITY_OPTIONS = new Set(['public', 'followers', 'private']);
const DM_RULE_OPTIONS = new Set(['mutual_follow', 'comment_then_chat', 'open']);
const MODERATION_MODE_OPTIONS = new Set(['hybrid', 'manual', 'auto']);
const REPORT_ACTION_OPTIONS = new Set(['', 'ignore_report', 'warn_owner', 'remove_content', 'ban_owner']);
const HIGH_RISK_KEYWORDS = new Set(['博彩', '贷款', '投资', '返利']);
const CONTACT_SIGNAL_PATTERN = /(?:微信|vx|wx|二维码|扫码|私聊|联系方式|联系我|加我)/i;
const PROMOTION_SIGNAL_PATTERN = /(?:优惠|返利|赚钱|回报|稳赚|秒杀|折扣|福利|拉群)/i;
const LINK_SIGNAL_PATTERN = /(?:https?:\/\/|www\.|(?:[A-Za-z0-9-]+\.)+(?:com|cn|net|top|cc))/i;
const PHONE_SIGNAL_PATTERN = /(?:\+?\d[\d\s-]{5,}\d)/;

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function hashPassword(plainText) {
  const salt = crypto.randomBytes(16).toString('hex');
  const n = 16384;
  const r = 8;
  const p = 1;
  const keyLength = 64;
  const hash = crypto.scryptSync(plainText, salt, keyLength, { N: n, r, p }).toString('hex');
  return `scrypt$${n}$${r}$${p}$${salt}$${hash}`;
}

function isHashedPassword(password) {
  return typeof password === 'string' && password.startsWith('scrypt$');
}

function verifyPassword(plainText, storedPassword) {
  if (!storedPassword) return false;
  if (!isHashedPassword(storedPassword)) {
    return plainText === storedPassword;
  }

  const segments = storedPassword.split('$');
  if (segments.length !== 6) return false;

  const [, nRaw, rRaw, pRaw, salt, expectedHash] = segments;
  const n = Number(nRaw);
  const r = Number(rRaw);
  const p = Number(pRaw);

  if (!Number.isFinite(n) || !Number.isFinite(r) || !Number.isFinite(p) || !salt || !expectedHash) {
    return false;
  }

  try {
    const expected = Buffer.from(expectedHash, 'hex');
    const actual = crypto.scryptSync(plainText, salt, expected.length, { N: n, r, p });
    if (expected.length !== actual.length) return false;
    return crypto.timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

function hashIfLegacyPassword(password) {
  return isHashedPassword(password) ? password : hashPassword(password);
}

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS admins (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS owners (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT NOT NULL UNIQUE,
      avatar TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'active',
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS owner_followers (
      ownerId TEXT NOT NULL,
      followerOwnerId TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      PRIMARY KEY (ownerId, followerOwnerId)
    );

    CREATE TABLE IF NOT EXISTS pets (
      id TEXT PRIMARY KEY,
      ownerId TEXT NOT NULL,
      name TEXT NOT NULL,
      species TEXT NOT NULL,
      breed TEXT NOT NULL DEFAULT '',
      age TEXT NOT NULL DEFAULT '',
      sex TEXT NOT NULL DEFAULT '',
      avatar TEXT NOT NULL DEFAULT '',
      tagsJson TEXT NOT NULL DEFAULT '[]',
      notes TEXT NOT NULL DEFAULT '',
      habits TEXT NOT NULL DEFAULT '',
      visibility TEXT NOT NULL DEFAULT 'public',
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY(ownerId) REFERENCES owners(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS posts (
      id TEXT PRIMARY KEY,
      petId TEXT NOT NULL,
      ownerId TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      imagesJson TEXT NOT NULL DEFAULT '[]',
      visibility TEXT NOT NULL DEFAULT 'public',
      status TEXT NOT NULL DEFAULT 'pending',
      moderationSnapshotJson TEXT NOT NULL DEFAULT '{}',
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY(petId) REFERENCES pets(id) ON DELETE CASCADE,
      FOREIGN KEY(ownerId) REFERENCES owners(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS likes (
      postId TEXT NOT NULL,
      ownerId TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      PRIMARY KEY (postId, ownerId),
      FOREIGN KEY(postId) REFERENCES posts(id) ON DELETE CASCADE,
      FOREIGN KEY(ownerId) REFERENCES owners(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      postId TEXT NOT NULL,
      ownerId TEXT NOT NULL,
      content TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      FOREIGN KEY(postId) REFERENCES posts(id) ON DELETE CASCADE,
      FOREIGN KEY(ownerId) REFERENCES owners(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS follows (
      id TEXT PRIMARY KEY,
      followerOwnerId TEXT NOT NULL,
      targetPetId TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      UNIQUE(followerOwnerId, targetPetId)
    );

    CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY,
      reporterOwnerId TEXT NOT NULL,
      targetType TEXT NOT NULL,
      targetId TEXT NOT NULL,
      reason TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open',
      resolution TEXT NOT NULL DEFAULT '',
      moderationSnapshotJson TEXT NOT NULL DEFAULT '{}',
      createdAt TEXT NOT NULL,
      resolvedAt TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS owner_warnings (
      id TEXT PRIMARY KEY,
      ownerId TEXT NOT NULL,
      reportId TEXT NOT NULL,
      adminId TEXT NOT NULL,
      reason TEXT NOT NULL DEFAULT '',
      createdAt TEXT NOT NULL,
      FOREIGN KEY(ownerId) REFERENCES owners(id) ON DELETE CASCADE,
      FOREIGN KEY(reportId) REFERENCES reports(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS chats (
      id TEXT PRIMARY KEY,
      ownerIdA TEXT NOT NULL,
      ownerIdB TEXT NOT NULL,
      lastReadAtJson TEXT NOT NULL DEFAULT '{}',
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      UNIQUE(ownerIdA, ownerIdB)
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      threadId TEXT NOT NULL,
      senderOwnerId TEXT NOT NULL,
      content TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      FOREIGN KEY(threadId) REFERENCES chats(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      kind TEXT NOT NULL,
      subjectId TEXT NOT NULL,
      expiresAt TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      actorType TEXT NOT NULL,
      actorId TEXT NOT NULL,
      action TEXT NOT NULL,
      targetType TEXT NOT NULL,
      targetId TEXT NOT NULL,
      detail TEXT NOT NULL DEFAULT '',
      createdAt TEXT NOT NULL
    );
  `);
}

function seedIfNeeded() {
  const ownerCount = db.prepare('SELECT COUNT(*) AS count FROM owners').get().count;
  if (ownerCount > 0) return;

  const seed = createSeedState();

  const insertAdmin = db.prepare(
    'INSERT INTO admins (id, name, email, password, createdAt) VALUES (@id, @name, @email, @password, @createdAt)'
  );
  const insertOwner = db.prepare(
    'INSERT INTO owners (id, name, phone, avatar, status, createdAt, updatedAt) VALUES (@id, @name, @phone, @avatar, @status, @createdAt, @updatedAt)'
  );
  const insertFollower = db.prepare(
    'INSERT INTO owner_followers (ownerId, followerOwnerId, createdAt) VALUES (@ownerId, @followerOwnerId, @createdAt)'
  );
  const insertPet = db.prepare(
    'INSERT INTO pets (id, ownerId, name, species, breed, age, sex, avatar, tagsJson, notes, habits, visibility, createdAt, updatedAt) VALUES (@id, @ownerId, @name, @species, @breed, @age, @sex, @avatar, @tagsJson, @notes, @habits, @visibility, @createdAt, @updatedAt)'
  );
  const insertPost = db.prepare(
    'INSERT INTO posts (id, petId, ownerId, title, content, imagesJson, visibility, status, createdAt, updatedAt) VALUES (@id, @petId, @ownerId, @title, @content, @imagesJson, @visibility, @status, @createdAt, @updatedAt)'
  );
  const insertLike = db.prepare(
    'INSERT INTO likes (postId, ownerId, createdAt) VALUES (@postId, @ownerId, @createdAt)'
  );
  const insertComment = db.prepare(
    'INSERT INTO comments (id, postId, ownerId, content, createdAt) VALUES (@id, @postId, @ownerId, @content, @createdAt)'
  );
  const insertFollow = db.prepare(
    'INSERT INTO follows (id, followerOwnerId, targetPetId, createdAt) VALUES (@id, @followerOwnerId, @targetPetId, @createdAt)'
  );
  const insertReport = db.prepare(
    'INSERT INTO reports (id, reporterOwnerId, targetType, targetId, reason, status, resolution, createdAt, resolvedAt) VALUES (@id, @reporterOwnerId, @targetType, @targetId, @reason, @status, @resolution, @createdAt, @resolvedAt)'
  );
  const insertChat = db.prepare(
    'INSERT INTO chats (id, ownerIdA, ownerIdB, lastReadAtJson, createdAt, updatedAt) VALUES (@id, @ownerIdA, @ownerIdB, @lastReadAtJson, @createdAt, @updatedAt)'
  );
  const insertMessage = db.prepare(
    'INSERT INTO messages (id, threadId, senderOwnerId, content, createdAt) VALUES (@id, @threadId, @senderOwnerId, @content, @createdAt)'
  );

  const tx = db.transaction(() => {
    for (const admin of seed.admins) {
      insertAdmin.run({
        ...admin,
        password: hashIfLegacyPassword(admin.password)
      });
    }
    for (const owner of seed.owners) {
      insertOwner.run({
        ...owner,
        updatedAt: owner.updatedAt || owner.createdAt
      });
      for (const followerId of owner.followers || []) {
        insertFollower.run({
          ownerId: owner.id,
          followerOwnerId: followerId,
          createdAt: now()
        });
      }
    }
    for (const pet of seed.pets) {
      insertPet.run({
        ...pet,
        tagsJson: JSON.stringify(pet.tags || [])
      });
    }
    for (const post of seed.posts) {
      insertPost.run({
        ...post,
        imagesJson: JSON.stringify(post.images || [])
      });
      for (const ownerId of post.likes || []) {
        insertLike.run({
          postId: post.id,
          ownerId,
          createdAt: now()
        });
      }
      for (const comment of post.comments || []) {
        insertComment.run({
          ...comment,
          postId: post.id
        });
      }
    }
    for (const follow of seed.follows) {
      insertFollow.run(follow);
    }
    for (const report of seed.reports) {
      insertReport.run({
        ...report,
        resolution: report.resolution || '',
        resolvedAt: report.resolvedAt || ''
      });
    }
    for (const chat of seed.chats) {
      insertChat.run({
        id: chat.id,
        ownerIdA: chat.ownerIds[0],
        ownerIdB: chat.ownerIds[1],
        lastReadAtJson: JSON.stringify({
          [chat.ownerIds[0]]: chat.messages.at(-1)?.createdAt || now(),
          [chat.ownerIds[1]]: chat.messages.at(-1)?.createdAt || now()
        }),
        createdAt: now(),
        updatedAt: now()
      });
      for (const message of chat.messages) {
        insertMessage.run({
          ...message,
          threadId: chat.id
        });
      }
    }

    const insertSetting = db.prepare('INSERT INTO settings (key, value, updatedAt) VALUES (?, ?, ?)');
    for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
      insertSetting.run(key, value, now());
    }
  });

  tx();
}

function ensureDefaultSettings() {
  const existing = db.prepare('SELECT COUNT(*) AS count FROM settings').get().count;
  if (existing > 0) return;
  const insertSetting = db.prepare(
    'INSERT INTO settings (key, value, updatedAt) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updatedAt = excluded.updatedAt'
  );
  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    insertSetting.run(key, value, now());
  }
}

function migrateLegacyAdminPasswords() {
  const admins = db.prepare('SELECT id, password FROM admins').all();
  const update = db.prepare('UPDATE admins SET password = ? WHERE id = ?');
  for (const admin of admins) {
    if (!isHashedPassword(admin.password)) {
      update.run(hashPassword(admin.password), admin.id);
    }
  }
}

function hasColumn(tableName, columnName) {
  const columns = db.prepare(`PRAGMA table_info(${tableName})`).all();
  return columns.some((column) => column.name === columnName);
}

function ensureColumn(tableName, columnName, definition) {
  if (!hasColumn(tableName, columnName)) {
    db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
  }
}

function migrateSchema() {
  ensureColumn('posts', 'reviewReason', "TEXT NOT NULL DEFAULT ''");
  ensureColumn('posts', 'reviewedAt', "TEXT NOT NULL DEFAULT ''");
  ensureColumn('posts', 'reviewedByAdminId', "TEXT NOT NULL DEFAULT ''");
  ensureColumn('posts', 'deletedAt', "TEXT NOT NULL DEFAULT ''");
  ensureColumn('posts', 'deletedByAdminId', "TEXT NOT NULL DEFAULT ''");
  ensureColumn('posts', 'moderationSnapshotJson', "TEXT NOT NULL DEFAULT '{}'");

  ensureColumn('reports', 'evidenceJson', "TEXT NOT NULL DEFAULT '[]'");
  ensureColumn('reports', 'handledByAdminId', "TEXT NOT NULL DEFAULT ''");
  ensureColumn('reports', 'actionType', "TEXT NOT NULL DEFAULT ''");
  ensureColumn('reports', 'moderationSnapshotJson', "TEXT NOT NULL DEFAULT '{}'");
}

initSchema();
seedIfNeeded();
ensureDefaultSettings();
migrateLegacyAdminPasswords();
migrateSchema();

function rowToOwner(row) {
  return row
    ? {
        id: row.id,
        name: row.name,
        phone: row.phone,
        avatar: row.avatar,
        status: row.status,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt
      }
    : null;
}

function rowToAdmin(row) {
  return row
    ? {
        id: row.id,
        name: row.name,
        email: row.email,
        createdAt: row.createdAt
      }
    : null;
}

function rowToWarning(row) {
  return row
    ? {
        id: row.id,
        ownerId: row.ownerId,
        reportId: row.reportId,
        adminId: row.adminId,
        reason: row.reason,
        createdAt: row.createdAt
      }
    : null;
}

function rowToPet(row) {
  return row
    ? {
        id: row.id,
        ownerId: row.ownerId,
        name: row.name,
        species: row.species,
        breed: row.breed,
        age: row.age,
        sex: row.sex,
        avatar: row.avatar,
        tags: JSON.parse(row.tagsJson || '[]'),
        notes: row.notes,
        habits: row.habits,
        visibility: row.visibility,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt
      }
    : null;
}

function postLikes(postId) {
  return db.prepare('SELECT ownerId, createdAt FROM likes WHERE postId = ? ORDER BY createdAt ASC').all(postId);
}

function postComments(postId) {
  return db.prepare('SELECT * FROM comments WHERE postId = ? ORDER BY createdAt ASC').all(postId);
}

function clampNumber(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function normalizeAiThreshold(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return Number(DEFAULT_SETTINGS.aiThreshold);
  return clampNumber(Math.round(numeric), 0, 100);
}

function parseJson(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function normalizeTextArray(values) {
  return Array.isArray(values)
    ? values.map((value) => String(value || '').trim()).filter(Boolean)
    : [];
}

function analyzePostModeration({ title = '', content = '', images = [] }) {
  const normalized = `${title} ${content}`.trim();
  const keywordHits = MODERATION_KEYWORDS.filter((keyword) => normalized.includes(keyword));
  const signals = [];
  let score = 8;

  if (keywordHits.length) {
    score += keywordHits.length * 26;
    signals.push(`命中关键词：${keywordHits.join('、')}`);
  } else {
    signals.push('未命中显式敏感关键词');
  }

  if (CONTACT_SIGNAL_PATTERN.test(normalized)) {
    score += 24;
    signals.push('存在导流或联系方式迹象');
  }

  if (PROMOTION_SIGNAL_PATTERN.test(normalized)) {
    score += 18;
    signals.push('存在营销话术');
  }

  if (LINK_SIGNAL_PATTERN.test(normalized)) {
    score += 16;
    signals.push('存在外链或跳转信息');
  }

  if (PHONE_SIGNAL_PATTERN.test(normalized)) {
    score += 14;
    signals.push('存在疑似联系方式');
  }

  if (keywordHits.some((keyword) => HIGH_RISK_KEYWORDS.has(keyword))) {
    score += 10;
    signals.push('涉及高风险交易词');
  }

  if (images.length) {
    score += Math.min(images.length * 5, 10);
    signals.push(`图片素材 ${images.length} 张`);
  } else {
    signals.push('无图片素材');
  }

  return {
    score: clampNumber(Math.round(score), 0, 100),
    keywordHits,
    signals
  };
}

function shouldQueuePostForReview(analysis, settings) {
  if (settings.moderationMode === 'manual') return true;
  if (analysis.keywordHits.length) return true;
  return analysis.score >= normalizeAiThreshold(settings.aiThreshold);
}

function buildPostModerationSnapshot({ analysis, settings, evaluatedAt = now() }) {
  return {
    score: clampNumber(Math.round(Number(analysis.score) || 0), 0, 100),
    threshold: normalizeAiThreshold(settings.aiThreshold),
    keywordHits: normalizeTextArray(analysis.keywordHits),
    signals: normalizeTextArray(analysis.signals),
    evaluatedAt
  };
}

function getPostModerationSnapshot(row, settings = DEFAULT_SETTINGS, images = []) {
  const stored = parseJson(row?.moderationSnapshotJson, null);
  if (stored && typeof stored === 'object' && !Array.isArray(stored)) {
    return {
      score: clampNumber(Math.round(Number(stored.score) || 0), 0, 100),
      threshold: normalizeAiThreshold(stored.threshold),
      keywordHits: normalizeTextArray(stored.keywordHits),
      signals: normalizeTextArray(stored.signals),
      evaluatedAt: String(stored.evaluatedAt || row?.createdAt || '')
    };
  }

  const analysis = analyzePostModeration({
    title: row?.title || '',
    content: row?.content || '',
    images
  });

  return buildPostModerationSnapshot({
    analysis,
    settings,
    evaluatedAt: row?.createdAt || now()
  });
}

function moderationForPost({ snapshot, status = '', reviewReason = '' }) {
  const score = clampNumber(Math.round(Number(snapshot?.score) || 0), 0, 100);
  const threshold = normalizeAiThreshold(snapshot?.threshold);
  const keywordHits = normalizeTextArray(snapshot?.keywordHits);
  const signals = normalizeTextArray(snapshot?.signals);
  const exceededThreshold = score >= threshold;

  const badgeLabel = status === 'rejected'
    ? '高风险'
    : status === 'pending'
      ? '待复核'
    : status === 'approved'
      ? exceededThreshold || keywordHits.length
        ? '已审核放行'
        : '已审核'
      : exceededThreshold || keywordHits.length
        ? '待复核'
        : '低风险';

  const points = [...signals];
  if (reviewReason) {
    points.push(`审核备注：${reviewReason}`);
  } else if (status === 'pending') {
    points.push(`AI 分值 ${score}，当前阈值 ${threshold}，建议人工复核`);
  } else {
    points.push(`AI 分值 ${score}，当前阈值 ${threshold}`);
  }

  const actionSuggestion = status === 'rejected'
    ? '建议维持驳回并保留审核原因'
    : status === 'pending'
      ? '建议优先人工复核并补充处理说明'
    : status === 'approved'
      ? exceededThreshold || keywordHits.length
        ? '内容已人工放行，建议保留抽检记录'
        : '建议保留当前审核结果并继续观察'
      : exceededThreshold || keywordHits.length
        ? '建议优先人工复核并补充处理说明'
        : '建议完成抽检后处理';

  return {
    score,
    threshold,
    exceededThreshold,
    keywordHits,
    evaluatedAt: String(snapshot?.evaluatedAt || ''),
    badgeLabel,
    points,
    actionSuggestion
  };
}

function rowToPost(row, settings = getEffectiveSettings()) {
  if (!row) return null;
  const pet = rowToPet(db.prepare('SELECT * FROM pets WHERE id = ?').get(row.petId));
  const owner = rowToOwner(db.prepare('SELECT * FROM owners WHERE id = ?').get(row.ownerId));
  const images = JSON.parse(row.imagesJson || '[]');
  const snapshot = getPostModerationSnapshot(row, settings, images);
  return {
    id: row.id,
    petId: row.petId,
    ownerId: row.ownerId,
    title: row.title,
    content: row.content,
    images,
    visibility: row.visibility,
    status: row.status,
    reviewReason: row.reviewReason || '',
    reviewedAt: row.reviewedAt || '',
    reviewedByAdminId: row.reviewedByAdminId || '',
    deletedAt: row.deletedAt || '',
    deletedByAdminId: row.deletedByAdminId || '',
    likes: postLikes(row.id).map((like) => like.ownerId),
    comments: postComments(row.id).map((comment) => ({
      id: comment.id,
      ownerId: comment.ownerId,
      content: comment.content,
      createdAt: comment.createdAt
    })),
    pet,
    owner,
    moderation: moderationForPost({
      snapshot,
      status: row.status,
      reviewReason: row.reviewReason || ''
    }),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  };
}

function analyzeReportModeration({ reason = '', evidence = [], relatedPost = null }) {
  const normalized = String(reason || '');
  let score = 42;
  let reportTypeLabel = '内容违规举报';
  let keywordText = `"${normalized.slice(0, 12) || '异常描述'}"`;

  if (normalized.includes('营销') || normalized.includes('广告')) {
    score += 32;
    reportTypeLabel = '恶意营销/商业欺诈';
    keywordText = '"营销"、"广告"、"诱导购买"';
  } else if (normalized.includes('暴力') || normalized.includes('虐待')) {
    score += 36;
    reportTypeLabel = '暴力或虐待指控';
    keywordText = '"虐待"、"暴力"、"伤害"';
  } else if (normalized.includes('隐私')) {
    score += 30;
    reportTypeLabel = '隐私侵害';
    keywordText = '"隐私"、"泄露"、"联系方式"';
  } else {
    score += 20;
  }

  if (evidence.length) {
    score += Math.min(evidence.length * 6, 12);
  }

  const relatedPostScore = Number(relatedPost?.moderation?.score || 0);
  if (relatedPostScore) {
    score = Math.max(score, Math.round((score + relatedPostScore) / 2));
  }

  return {
    score: clampNumber(Math.round(score), 0, 100),
    reportTypeLabel,
    keywordText,
    relatedPostScore
  };
}

function buildReportModerationSnapshot({ analysis, settings, evaluatedAt = now() }) {
  return {
    score: clampNumber(Math.round(Number(analysis.score) || 0), 0, 100),
    threshold: normalizeAiThreshold(settings.aiThreshold),
    reportTypeLabel: String(analysis.reportTypeLabel || '内容违规举报'),
    keywordText: String(analysis.keywordText || '-'),
    relatedPostScore: clampNumber(Math.round(Number(analysis.relatedPostScore) || 0), 0, 100),
    evaluatedAt
  };
}

function getReportModerationSnapshot(row, settings = DEFAULT_SETTINGS, relatedPost = null, evidence = []) {
  const stored = parseJson(row?.moderationSnapshotJson, null);
  if (stored && typeof stored === 'object' && !Array.isArray(stored)) {
    return {
      score: clampNumber(Math.round(Number(stored.score) || 0), 0, 100),
      threshold: normalizeAiThreshold(stored.threshold),
      reportTypeLabel: String(stored.reportTypeLabel || '内容违规举报'),
      keywordText: String(stored.keywordText || '-'),
      relatedPostScore: clampNumber(Math.round(Number(stored.relatedPostScore) || 0), 0, 100),
      evaluatedAt: String(stored.evaluatedAt || row?.createdAt || '')
    };
  }

  const analysis = analyzeReportModeration({
    reason: row?.reason || '',
    evidence,
    relatedPost
  });

  return buildReportModerationSnapshot({
    analysis,
    settings,
    evaluatedAt: row?.createdAt || now()
  });
}

function rowToReport(row, settings = getEffectiveSettings()) {
  if (!row) return null;
  const relatedPost = row.targetType === 'post'
    ? rowToPost(db.prepare('SELECT * FROM posts WHERE id = ?').get(row.targetId), settings)
    : null;
  const targetPet = row.targetType === 'pet'
    ? rowToPet(db.prepare('SELECT * FROM pets WHERE id = ?').get(row.targetId))
    : null;
  const reporter = rowToOwner(db.prepare('SELECT * FROM owners WHERE id = ?').get(row.reporterOwnerId));
  const targetOwner = row.targetType === 'owner'
    ? rowToOwner(db.prepare('SELECT * FROM owners WHERE id = ?').get(row.targetId))
    : row.targetType === 'pet'
      ? rowToOwner(db.prepare('SELECT * FROM owners WHERE id = ?').get(targetPet?.ownerId || ''))
    : relatedPost?.owner || null;
  const targetSummary = row.targetType === 'post'
    ? relatedPost?.title || row.targetId
    : row.targetType === 'owner'
      ? targetOwner?.name || row.targetId
    : row.targetType === 'pet'
        ? targetPet?.name || row.targetId
        : row.targetId;
  const evidence = JSON.parse(row.evidenceJson || '[]');
  const snapshot = getReportModerationSnapshot(row, settings, relatedPost, evidence);
  return {
    id: row.id,
    reporterOwnerId: row.reporterOwnerId,
    targetType: row.targetType,
    targetId: row.targetId,
    reason: row.reason,
    status: row.status,
    resolution: row.resolution,
    evidence,
    handledByAdminId: row.handledByAdminId || '',
    actionType: row.actionType || '',
    createdAt: row.createdAt,
    resolvedAt: row.resolvedAt,
    reporter,
    post: relatedPost,
    pet: targetPet,
    targetOwner,
    targetSummary,
    moderation: moderationForReport({
      snapshot,
      status: row.status,
      targetId: row.targetId
    })
  };
}

function moderationForReport({ snapshot, status = '', targetId = '' }) {
  const score = clampNumber(Math.round(Number(snapshot?.score) || 0), 0, 100);
  const threshold = normalizeAiThreshold(snapshot?.threshold);
  const relatedPostScore = clampNumber(Math.round(Number(snapshot?.relatedPostScore) || 0), 0, 100);
  const exceededThreshold = score >= threshold;
  const priority = exceededThreshold ? 'high' : 'normal';
  return {
    score,
    threshold,
    exceededThreshold,
    priority,
    evaluatedAt: String(snapshot?.evaluatedAt || ''),
    levelText: exceededThreshold ? '高风险待优先核查' : '中风险待核查',
    reportTypeLabel: String(snapshot?.reportTypeLabel || '内容违规举报'),
    keywordText: String(snapshot?.keywordText || '-'),
    historyText: relatedPostScore
      ? `当前目标：${targetId || '-'}，关联内容风险分 ${relatedPostScore}，建议结合历史审计记录继续核查`
      : `当前目标：${targetId || '-'}，建议结合历史审计记录继续核查`,
    actionSuggestion: status === 'resolved'
      ? '该举报单已处理完成，可结合审计日志复核结果'
      : exceededThreshold
        ? '建议优先下架内容，并同步检查目标账号'
        : '建议先核验举报证据，再决定是否下架内容'
  };
}

function chatParticipants(row) {
  return [row.ownerIdA, row.ownerIdB];
}

function chatUnreadCount(row, ownerId) {
  const lastReadAt = JSON.parse(row.lastReadAtJson || '{}')[ownerId] || '';
  const messages = db
    .prepare('SELECT * FROM messages WHERE threadId = ? ORDER BY createdAt ASC')
    .all(row.id);
  return messages.filter((message) => message.senderOwnerId !== ownerId && message.createdAt > lastReadAt).length;
}

function rowToChat(row, viewerOwnerId = '') {
  if (!row) return null;
  const messages = db
    .prepare('SELECT * FROM messages WHERE threadId = ? ORDER BY createdAt ASC')
    .all(row.id)
    .map((message) => ({
      id: message.id,
      senderOwnerId: message.senderOwnerId,
      content: message.content,
      createdAt: message.createdAt
    }));
  return {
    id: row.id,
    ownerIds: chatParticipants(row),
    messages,
    unreadByOwnerId: viewerOwnerId
      ? {
          [viewerOwnerId]: chatUnreadCount(row, viewerOwnerId)
        }
      : {},
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  };
}

function getSettingsObject() {
  const rows = db.prepare('SELECT * FROM settings ORDER BY key ASC').all();
  return rows.reduce((acc, row) => {
    acc[row.key] = row.value;
    return acc;
  }, {});
}

function sanitizeSettingsInput(input = {}) {
  const partial = {};

  const defaultPostVisibility = String(input.defaultPostVisibility ?? '').trim();
  if (POST_VISIBILITY_OPTIONS.has(defaultPostVisibility)) {
    partial.defaultPostVisibility = defaultPostVisibility;
  }

  const dmRule = String(input.dmRule ?? '').trim();
  if (DM_RULE_OPTIONS.has(dmRule)) {
    partial.dmRule = dmRule;
  }

  const moderationMode = String(input.moderationMode ?? '').trim();
  if (MODERATION_MODE_OPTIONS.has(moderationMode)) {
    partial.moderationMode = moderationMode;
  }

  if (input.commentModeration !== undefined) {
    partial.commentModeration = String(String(input.commentModeration).trim() === 'true');
  }

  if (input.auditRetentionDays !== undefined) {
    const auditRetentionDays = Number(input.auditRetentionDays);
    if (Number.isFinite(auditRetentionDays)) {
      partial.auditRetentionDays = String(clampNumber(Math.round(auditRetentionDays), 30, 365));
    }
  }

  if (input.aiThreshold !== undefined) {
    partial.aiThreshold = String(normalizeAiThreshold(input.aiThreshold));
  }

  return partial;
}

function getEffectiveSettings() {
  return {
    ...DEFAULT_SETTINGS,
    ...sanitizeSettingsInput(getSettingsObject())
  };
}

function upsertSettings(partial) {
  const stmt = db.prepare(
    'INSERT INTO settings (key, value, updatedAt) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updatedAt = excluded.updatedAt'
  );
  for (const [key, value] of Object.entries(partial)) {
    if (value === undefined) continue;
    stmt.run(key, String(value), now());
  }
}

function addAuditLog({ actorType, actorId, action, targetType, targetId, detail = '' }) {
  db.prepare(
    'INSERT INTO audit_logs (id, actorType, actorId, action, targetType, targetId, detail, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(id('audit'), actorType, actorId, action, targetType, targetId, detail, now());
}

function auditActionForReport(actionType = '') {
  if (actionType === 'ignore_report') return 'ignore_report';
  if (actionType === 'warn_owner') return 'warn_owner';
  if (actionType === 'remove_content') return 'remove_content';
  if (actionType === 'ban_owner') return 'ban_owner';
  return 'resolve_report';
}

function sessionFromRequest(req, kind) {
  const token =
    req.cookies[kind === 'admin' ? 'pet_admin_session' : 'pet_owner_session'] ||
    '';
  if (!token) return null;
  const row = db.prepare('SELECT * FROM sessions WHERE token = ? AND kind = ? AND expiresAt > ?').get(token, kind, now());
  return row || null;
}

function parseCookieHeader(rawCookie = '') {
  const pairs = rawCookie.split(';');
  const result = {};
  for (const pair of pairs) {
    const [key, ...rest] = pair.split('=');
    const name = key?.trim();
    if (!name) continue;
    result[name] = decodeURIComponent(rest.join('=').trim());
  }
  return result;
}

function sessionFromUpgradeRequest(request, kind) {
  const cookies = parseCookieHeader(request.headers.cookie || '');
  const token = cookies[kind === 'admin' ? 'pet_admin_session' : 'pet_owner_session'] || '';
  if (!token) return null;
  const row = db.prepare('SELECT * FROM sessions WHERE token = ? AND kind = ? AND expiresAt > ?').get(token, kind, now());
  return row || null;
}

function getCurrentOwnerFromUpgradeRequest(request) {
  const session = sessionFromUpgradeRequest(request, 'owner');
  if (!session) return null;
  return rowToOwner(db.prepare('SELECT * FROM owners WHERE id = ?').get(session.subjectId));
}

function canAccessThread(ownerId, threadId) {
  if (!threadId) return true;
  const row = db.prepare('SELECT ownerIdA, ownerIdB FROM chats WHERE id = ?').get(threadId);
  if (!row) return false;
  return row.ownerIdA === ownerId || row.ownerIdB === ownerId;
}

function getCurrentOwner(req) {
  const session = sessionFromRequest(req, 'owner');
  if (!session) return null;
  return rowToOwner(db.prepare('SELECT * FROM owners WHERE id = ?').get(session.subjectId));
}

function getCurrentAdmin(req) {
  const session = sessionFromRequest(req, 'admin');
  if (!session) return null;
  return rowToAdmin(db.prepare('SELECT * FROM admins WHERE id = ?').get(session.subjectId));
}

function createSession(kind, subjectId) {
  const token = id(kind === 'admin' ? 'adminsess' : 'ownersess');
  const createdAt = now();
  const expiresAt = new Date(Date.now() + (kind === 'admin' ? 7 : 30) * 24 * 60 * 60 * 1000).toISOString();
  db.prepare('INSERT INTO sessions (token, kind, subjectId, expiresAt, createdAt) VALUES (?, ?, ?, ?, ?)')
    .run(token, kind, subjectId, expiresAt, createdAt);
  return { token, expiresAt };
}

function clearSession(token) {
  db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
}

function setAuthCookie(res, kind, token, expiresAt) {
  const cookieName = kind === 'admin' ? 'pet_admin_session' : 'pet_owner_session';
  res.cookie(cookieName, token, {
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: COOKIE_SAMESITE,
    path: '/',
    expires: new Date(expiresAt)
  });
}

function clearAuthCookie(res, kind) {
  const cookieName = kind === 'admin' ? 'pet_admin_session' : 'pet_owner_session';
  res.clearCookie(cookieName, { path: '/' });
}

function findOrCreateOwner(phone, name) {
  const existing = db.prepare('SELECT * FROM owners WHERE phone = ?').get(phone);
  if (existing) {
    db.prepare('UPDATE owners SET name = ?, updatedAt = ? WHERE id = ?').run(name || existing.name, now(), existing.id);
    return rowToOwner(db.prepare('SELECT * FROM owners WHERE id = ?').get(existing.id));
  }
  const owner = {
    id: id('owner'),
    name: name || `用户${phone.slice(-4)}`,
    phone,
    avatar: '',
    status: 'active',
    createdAt: now(),
    updatedAt: now()
  };
  db.prepare(
    'INSERT INTO owners (id, name, phone, avatar, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(owner.id, owner.name, owner.phone, owner.avatar, owner.status, owner.createdAt, owner.updatedAt);
  return owner;
}

function createOrUpdatePet(ownerId, payload) {
  const pet = {
    id: id('pet'),
    ownerId,
    name: payload.name,
    species: payload.species,
    breed: payload.breed || '',
    age: payload.age || '',
    sex: payload.sex || '',
    avatar: payload.avatar || '',
    tags: payload.tags || [],
    notes: payload.notes || '',
    habits: payload.habits || '',
    visibility: payload.visibility || 'public',
    createdAt: now(),
    updatedAt: now()
  };
  db.prepare(
    'INSERT INTO pets (id, ownerId, name, species, breed, age, sex, avatar, tagsJson, notes, habits, visibility, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(
    pet.id,
    pet.ownerId,
    pet.name,
    pet.species,
    pet.breed,
    pet.age,
    pet.sex,
    pet.avatar,
    JSON.stringify(pet.tags),
    pet.notes,
    pet.habits,
    pet.visibility,
    pet.createdAt,
    pet.updatedAt
  );
  return pet;
}

function createPost(ownerId, petId, payload) {
  const settings = getEffectiveSettings();
  const createdAt = now();
  const title = payload.title || '未命名日志';
  const content = payload.content || '';
  const images = payload.images || [];
  const visibility = payload.visibility || settings.defaultPostVisibility || 'public';
  const analysis = analyzePostModeration({ title, content, images });
  const status = shouldQueuePostForReview(analysis, settings) ? 'pending' : 'approved';
  const moderationSnapshot = buildPostModerationSnapshot({
    analysis,
    settings,
    evaluatedAt: createdAt
  });

  const post = {
    id: id('post'),
    petId,
    ownerId,
    title,
    content,
    images,
    visibility,
    status,
    moderationSnapshot,
    createdAt,
    updatedAt: createdAt
  };
  db.prepare(
    'INSERT INTO posts (id, petId, ownerId, title, content, imagesJson, visibility, status, moderationSnapshotJson, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(
    post.id,
    post.petId,
    post.ownerId,
    post.title,
    post.content,
    JSON.stringify(post.images),
    post.visibility,
    post.status,
    JSON.stringify(post.moderationSnapshot),
    post.createdAt,
    post.updatedAt
  );
  return rowToPost(db.prepare('SELECT * FROM posts WHERE id = ?').get(post.id));
}

function followPet(followerOwnerId, targetPetId) {
  const existing = db
    .prepare('SELECT * FROM follows WHERE followerOwnerId = ? AND targetPetId = ?')
    .get(followerOwnerId, targetPetId);
  if (existing) return existing;
  const relation = {
    id: id('follow'),
    followerOwnerId,
    targetPetId,
    createdAt: now()
  };
  db.prepare('INSERT INTO follows (id, followerOwnerId, targetPetId, createdAt) VALUES (?, ?, ?, ?)')
    .run(relation.id, relation.followerOwnerId, relation.targetPetId, relation.createdAt);
  return relation;
}

function unfollowPet(followerOwnerId, targetPetId) {
  db.prepare('DELETE FROM follows WHERE followerOwnerId = ? AND targetPetId = ?').run(followerOwnerId, targetPetId);
}

function addComment(postId, ownerId, content) {
  const comment = {
    id: id('comment'),
    postId,
    ownerId,
    content,
    createdAt: now()
  };
  db.prepare('INSERT INTO comments (id, postId, ownerId, content, createdAt) VALUES (?, ?, ?, ?, ?)')
    .run(comment.id, comment.postId, comment.ownerId, comment.content, comment.createdAt);
  return comment;
}

function toggleLike(postId, ownerId) {
  const existing = db.prepare('SELECT * FROM likes WHERE postId = ? AND ownerId = ?').get(postId, ownerId);
  if (existing) {
    db.prepare('DELETE FROM likes WHERE postId = ? AND ownerId = ?').run(postId, ownerId);
    return false;
  }
  db.prepare('INSERT INTO likes (postId, ownerId, createdAt) VALUES (?, ?, ?)').run(postId, ownerId, now());
  return true;
}

function createOwnerWarning(ownerId, reportId, adminId, reason = '') {
  const warning = {
    id: id('warning'),
    ownerId,
    reportId,
    adminId,
    reason,
    createdAt: now()
  };
  db.prepare('INSERT INTO owner_warnings (id, ownerId, reportId, adminId, reason, createdAt) VALUES (?, ?, ?, ?, ?, ?)')
    .run(warning.id, warning.ownerId, warning.reportId, warning.adminId, warning.reason, warning.createdAt);
  return warning;
}

function listOwnerWarnings(ownerId) {
  return db.prepare('SELECT * FROM owner_warnings WHERE ownerId = ? ORDER BY createdAt DESC').all(ownerId).map(rowToWarning);
}

function createReport(payload) {
  const settings = getEffectiveSettings();
  const createdAt = now();
  const relatedPost = payload.targetType === 'post'
    ? rowToPost(db.prepare('SELECT * FROM posts WHERE id = ?').get(payload.targetId), settings)
    : null;
  const moderationSnapshot = buildReportModerationSnapshot({
    analysis: analyzeReportModeration({
      reason: payload.reason,
      evidence: payload.evidence || [],
      relatedPost
    }),
    settings,
    evaluatedAt: createdAt
  });
  const report = {
    id: id('report'),
    reporterOwnerId: payload.reporterOwnerId,
    targetType: payload.targetType,
    targetId: payload.targetId,
    reason: payload.reason,
    evidence: payload.evidence || [],
    status: 'open',
    resolution: '',
    handledByAdminId: '',
    actionType: '',
    moderationSnapshot,
    createdAt,
    resolvedAt: ''
  };
  db.prepare(
    'INSERT INTO reports (id, reporterOwnerId, targetType, targetId, reason, status, resolution, evidenceJson, handledByAdminId, actionType, moderationSnapshotJson, createdAt, resolvedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(
    report.id,
    report.reporterOwnerId,
    report.targetType,
    report.targetId,
    report.reason,
    report.status,
    report.resolution,
    JSON.stringify(report.evidence),
    report.handledByAdminId,
    report.actionType,
    JSON.stringify(report.moderationSnapshot),
    report.createdAt,
    report.resolvedAt
  );
  return report;
}

function resolveReport(reportId, resolution, handledByAdminId = '', actionType = '') {
  db.prepare('UPDATE reports SET status = ?, resolution = ?, resolvedAt = ?, handledByAdminId = ?, actionType = ? WHERE id = ?')
    .run('resolved', resolution || 'resolved', now(), handledByAdminId, actionType, reportId);
}

function normalizeReportAction(actionType = '') {
  const normalized = String(actionType || '').trim();
  return REPORT_ACTION_OPTIONS.has(normalized) ? normalized : null;
}

function resolveTargetOwnerId(report) {
  if (!report) return '';
  if (report.targetType === 'owner') return report.targetId;
  if (report.targetType === 'post') return report.post?.ownerId || report.targetOwner?.id || '';
  if (report.targetType === 'pet') return report.pet?.ownerId || '';
  return report.targetOwner?.id || '';
}

function executeReportAction(reportId, resolution, adminId, actionType = '') {
  const normalizedAction = normalizeReportAction(actionType);
  if (normalizedAction === null) {
    return { error: 'invalid_report_action', statusCode: 400 };
  }

  const settings = getEffectiveSettings();
  const report = rowToReport(db.prepare('SELECT * FROM reports WHERE id = ?').get(reportId), settings);
  if (!report) {
    return { error: 'not_found', statusCode: 404 };
  }
  if (report.status === 'resolved') {
    return { error: 'report_already_resolved', statusCode: 400 };
  }

  const targetOwnerId = resolveTargetOwnerId(report);
  if ((normalizedAction === 'warn_owner' || normalizedAction === 'ban_owner') && !targetOwnerId) {
    return { error: 'report_target_not_found', statusCode: 400 };
  }
  if (normalizedAction === 'remove_content' && (report.targetType !== 'post' || !report.post?.id)) {
    return { error: 'invalid_report_action', statusCode: 400 };
  }

  const tx = db.transaction(() => {
    if (normalizedAction === 'warn_owner') {
      createOwnerWarning(targetOwnerId, report.id, adminId, resolution);
    } else if (normalizedAction === 'remove_content') {
      rejectPost(report.post.id, adminId, resolution);
    } else if (normalizedAction === 'ban_owner') {
      banOwner(targetOwnerId);
    }

    resolveReport(report.id, resolution, adminId, normalizedAction);

    addAuditLog({
      actorType: 'admin',
      actorId: adminId,
      action: auditActionForReport(normalizedAction),
      targetType: 'report',
      targetId: report.id,
      detail: resolution
    });

    if (normalizedAction === 'warn_owner') {
      addAuditLog({
        actorType: 'admin',
        actorId: adminId,
        action: 'warn_owner',
        targetType: 'owner',
        targetId: targetOwnerId,
        detail: resolution
      });
    } else if (normalizedAction === 'remove_content') {
      addAuditLog({
        actorType: 'admin',
        actorId: adminId,
        action: 'reject_post',
        targetType: 'post',
        targetId: report.post.id,
        detail: resolution
      });
    } else if (normalizedAction === 'ban_owner') {
      addAuditLog({
        actorType: 'admin',
        actorId: adminId,
        action: 'ban_owner',
        targetType: 'owner',
        targetId: targetOwnerId,
        detail: resolution
      });
    }
  });

  tx();
  return {
    ok: true,
    report: rowToReport(db.prepare('SELECT * FROM reports WHERE id = ?').get(report.id), settings)
  };
}

function banOwner(ownerId) {
  db.prepare('UPDATE owners SET status = ?, updatedAt = ? WHERE id = ?').run('banned', now(), ownerId);
}

function unbanOwner(ownerId) {
  db.prepare('UPDATE owners SET status = ?, updatedAt = ? WHERE id = ?').run('active', now(), ownerId);
}

function approvePost(postId, adminId = '') {
  db.prepare('UPDATE posts SET status = ?, reviewReason = ?, reviewedAt = ?, reviewedByAdminId = ?, updatedAt = ? WHERE id = ?')
    .run('approved', '', now(), adminId, now(), postId);
}

function rejectPost(postId, adminId = '', reviewReason = '') {
  db.prepare('UPDATE posts SET status = ?, reviewReason = ?, reviewedAt = ?, reviewedByAdminId = ?, updatedAt = ? WHERE id = ?')
    .run('rejected', reviewReason || '', now(), adminId, now(), postId);
}

function deletePost(postId, adminId = '') {
  db.prepare('UPDATE posts SET deletedAt = ?, deletedByAdminId = ?, updatedAt = ? WHERE id = ?').run(now(), adminId, now(), postId);
  db.prepare('DELETE FROM posts WHERE id = ?').run(postId);
}

function ensureChat(ownerIdA, ownerIdB) {
  const [a, b] = [ownerIdA, ownerIdB].sort();
  const threadId = threadIdFor(a, b);
  const existing = db.prepare('SELECT * FROM chats WHERE id = ?').get(threadId);
  if (existing) return existing;
  const chat = {
    id: threadId,
    ownerIdA: a,
    ownerIdB: b,
    lastReadAtJson: JSON.stringify({ [a]: now(), [b]: now() }),
    createdAt: now(),
    updatedAt: now()
  };
  db.prepare('INSERT INTO chats (id, ownerIdA, ownerIdB, lastReadAtJson, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)')
    .run(chat.id, chat.ownerIdA, chat.ownerIdB, chat.lastReadAtJson, chat.createdAt, chat.updatedAt);
  return chat;
}

function markThreadRead(threadId, ownerId) {
  const chat = db.prepare('SELECT * FROM chats WHERE id = ?').get(threadId);
  if (!chat) return;
  const lastReadAt = JSON.parse(chat.lastReadAtJson || '{}');
  lastReadAt[ownerId] = now();
  db.prepare('UPDATE chats SET lastReadAtJson = ?, updatedAt = ? WHERE id = ?')
    .run(JSON.stringify(lastReadAt), now(), threadId);
}

function addMessage(threadId, senderOwnerId, content) {
  const message = {
    id: id('msg'),
    threadId,
    senderOwnerId,
    content,
    createdAt: now()
  };
  db.prepare('INSERT INTO messages (id, threadId, senderOwnerId, content, createdAt) VALUES (?, ?, ?, ?, ?)')
    .run(message.id, message.threadId, message.senderOwnerId, message.content, message.createdAt);
  db.prepare('UPDATE chats SET updatedAt = ? WHERE id = ?').run(now(), threadId);
  return message;
}

function chatForViewer(row, viewerOwnerId = '') {
  const messages = db
    .prepare('SELECT * FROM messages WHERE threadId = ? ORDER BY createdAt ASC')
    .all(row.id)
    .map((message) => ({
      id: message.id,
      senderOwnerId: message.senderOwnerId,
      content: message.content,
      createdAt: message.createdAt
    }));
  const lastReadAt = JSON.parse(row.lastReadAtJson || '{}');
  const unread = viewerOwnerId
    ? messages.filter((message) => message.senderOwnerId !== viewerOwnerId && message.createdAt > (lastReadAt[viewerOwnerId] || '')).length
    : 0;
  return {
    id: row.id,
    ownerIds: [row.ownerIdA, row.ownerIdB],
    messages,
    unreadByOwnerId: viewerOwnerId ? { [viewerOwnerId]: unread } : {},
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  };
}

function broadcastToThread(wss, threadId, payload) {
  const message = JSON.stringify(payload);
  for (const client of wss.clients) {
    if (client.readyState === 1 && client.threadId === threadId) {
      client.send(message);
    }
  }
}

function broadcastToOwner(wss, ownerId, payload) {
  const message = JSON.stringify(payload);
  for (const client of wss.clients) {
    if (client.readyState === 1 && client.ownerId === ownerId) {
      client.send(message);
    }
  }
}

const app = express();
app.disable('x-powered-by');
if (TRUST_PROXY) {
  app.set('trust proxy', 1);
}

const DEFAULT_DEV_PORTS = [3000, 3100, 3101, 4173, 5173];
const DEFAULT_ALLOWED_ORIGINS = [
  `http://127.0.0.1:${PORT}`,
  `http://localhost:${PORT}`,
  ...DEFAULT_DEV_PORTS.flatMap((port) => [`http://127.0.0.1:${port}`, `http://localhost:${port}`])
];
const EXTRA_ALLOWED_ORIGINS = String(process.env.CORS_ORIGINS || '')
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);
const ALLOWED_ORIGINS = new Set([...DEFAULT_ALLOWED_ORIGINS, ...EXTRA_ALLOWED_ORIGINS]);

const apiLimiter = rateLimit({
  windowMs: GLOBAL_RATE_LIMIT_WINDOW_MS,
  max: GLOBAL_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'rate_limit_exceeded' }
});

const authLimiter = rateLimit({
  windowMs: GLOBAL_RATE_LIMIT_WINDOW_MS,
  max: AUTH_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'auth_rate_limit_exceeded' }
});

app.use((req, res, next) => {
  const requestId = req.headers['x-request-id'] || crypto.randomUUID();
  req.requestId = String(requestId);
  res.setHeader('x-request-id', req.requestId);
  next();
});

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: false
  })
);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || ALLOWED_ORIGINS.has(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error('cors_not_allowed'));
    },
    credentials: true
  })
);
app.use(cookieParser());
app.use(express.json({ limit: `${BODY_LIMIT_MB}mb` }));
app.use(express.urlencoded({ extended: true, limit: `${BODY_LIMIT_MB}mb` }));
app.use('/uploads', express.static(UPLOAD_DIR, {
  maxAge: IS_PRODUCTION ? '1h' : 0,
  etag: true
}));

app.use('/api', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/admin/login', authLimiter);

const upload = multer({
  dest: UPLOAD_DIR,
  limits: {
    fileSize: UPLOAD_MAX_FILE_SIZE_MB * 1024 * 1024,
    files: UPLOAD_MAX_FILES
  },
  fileFilter(_req, file, callback) {
    if (!ALLOWED_UPLOAD_MIME_TYPES.has(file.mimetype)) {
      callback(new Error('upload_invalid_type'));
      return;
    }
    callback(null, true);
  }
});

function setSessionCookie(res, kind, token, expiresAt) {
  res.cookie(kind === 'admin' ? 'pet_admin_session' : 'pet_owner_session', token, {
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: COOKIE_SAMESITE,
    path: '/',
    expires: new Date(expiresAt)
  });
}

function clearSessionCookie(res, kind) {
  res.clearCookie(kind === 'admin' ? 'pet_admin_session' : 'pet_owner_session', {
    path: '/'
  });
}

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'pet-backend', database: 'sqlite', at: now() });
});

app.get('/readyz', (_req, res) => {
  try {
    db.prepare('SELECT 1 AS ok').get();
    fs.accessSync(DATA_DIR, fs.constants.R_OK | fs.constants.W_OK);
    fs.accessSync(UPLOAD_DIR, fs.constants.R_OK | fs.constants.W_OK);
    res.json({ ok: true, service: 'pet-backend', ready: true, at: now() });
  } catch {
    res.status(503).json({ ok: false, service: 'pet-backend', ready: false, error: 'dependency_unavailable', at: now() });
  }
});

app.get('/api/me', (req, res) => {
  const owner = getCurrentOwner(req);
  const admin = getCurrentAdmin(req);
  res.json({
    owner,
    admin
  });
});

app.post('/api/auth/login', (req, res) => {
  const phone = String(req.body.phone || '').trim();
  const name = String(req.body.name || '').trim();
  if (!phone) return res.status(400).json({ error: 'phone_required' });
  const owner = findOrCreateOwner(phone, name);
  const { token, expiresAt } = createSession('owner', owner.id);
  setSessionCookie(res, 'owner', token, expiresAt);
  res.json({ owner, token, expiresAt });
});

app.post('/api/admin/login', (req, res) => {
  const email = String(req.body.email || '').trim();
  const password = String(req.body.password || '').trim();
  const admin = db.prepare('SELECT * FROM admins WHERE email = ?').get(email);
  if (!admin || !verifyPassword(password, admin.password)) {
    return res.status(401).json({ error: 'invalid_credentials' });
  }
  const { token, expiresAt } = createSession('admin', admin.id);
  setSessionCookie(res, 'admin', token, expiresAt);
  res.json({ admin: rowToAdmin(admin), token, expiresAt });
});

app.post('/api/logout', (req, res) => {
  const ownerToken = req.cookies.pet_owner_session;
  const adminToken = req.cookies.pet_admin_session;
  if (ownerToken) clearSession(ownerToken);
  if (adminToken) clearSession(adminToken);
  clearSessionCookie(res, 'owner');
  clearSessionCookie(res, 'admin');
  res.json({ ok: true });
});

app.get('/api/feed', (_req, res) => {
  const rows = db.prepare('SELECT * FROM posts WHERE status = ? ORDER BY createdAt DESC').all('approved');
  res.json({
    items: rows.map(rowToPost)
  });
});

app.get('/api/pets', (req, res) => {
  const ownerId = req.query.ownerId;
  const rows = ownerId
    ? db.prepare('SELECT * FROM pets WHERE ownerId = ? ORDER BY createdAt DESC').all(ownerId)
    : db.prepare('SELECT * FROM pets ORDER BY createdAt DESC').all();
  res.json({ items: rows.map(rowToPet) });
});

app.get('/api/pets/:petId', (req, res) => {
  const pet = rowToPet(db.prepare('SELECT * FROM pets WHERE id = ?').get(req.params.petId));
  if (!pet) return res.status(404).json({ error: 'not_found' });
  const posts = db.prepare('SELECT * FROM posts WHERE petId = ? ORDER BY createdAt DESC').all(req.params.petId).map(rowToPost);
  const owner = rowToOwner(db.prepare('SELECT * FROM owners WHERE id = ?').get(pet.ownerId));
  res.json({ pet, owner, posts });
});

app.post('/api/pets', (req, res) => {
  const owner = getCurrentOwner(req);
  if (!owner) return res.status(401).json({ error: 'unauthorized' });
  const payload = {
    name: String(req.body.name || '').trim(),
    species: String(req.body.species || '').trim(),
    breed: String(req.body.breed || '').trim(),
    age: String(req.body.age || '').trim(),
    sex: String(req.body.sex || '').trim(),
    tags: String(req.body.tags || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
    notes: String(req.body.notes || '').trim(),
    habits: String(req.body.habits || '').trim()
  };
  if (!payload.name || !payload.species) return res.status(400).json({ error: 'name_and_species_required' });
  const pet = createOrUpdatePet(owner.id, payload);
  res.status(201).json({ pet });
});

app.post('/api/posts', upload.single('file'), (req, res) => {
  const owner = getCurrentOwner(req);
  if (!owner) return res.status(401).json({ error: 'unauthorized' });
  const petId = String(req.body.petId || '').trim();
  const pet = rowToPet(db.prepare('SELECT * FROM pets WHERE id = ?').get(petId));
  if (!pet) return res.status(404).json({ error: 'pet_not_found' });
  const images = req.file ? [`/uploads/${req.file.filename}`] : [];
  const post = createPost(owner.id, petId, {
    title: String(req.body.title || '').trim(),
    content: String(req.body.content || '').trim(),
    visibility: String(req.body.visibility || '').trim(),
    images
  });
  res.status(201).json({ post });
});

app.get('/api/posts/:postId', (req, res) => {
  const post = rowToPost(db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.postId));
  if (!post) return res.status(404).json({ error: 'not_found' });
  res.json({ post });
});

app.post('/api/posts/:postId/like', (req, res) => {
  const owner = getCurrentOwner(req);
  if (!owner) return res.status(401).json({ error: 'unauthorized' });
  const ok = toggleLike(req.params.postId, owner.id);
  res.json({ ok, post: rowToPost(db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.postId)) });
});

app.post('/api/posts/:postId/comments', (req, res) => {
  const owner = getCurrentOwner(req);
  if (!owner) return res.status(401).json({ error: 'unauthorized' });
  const content = String(req.body.content || '').trim();
  if (!content) return res.status(400).json({ error: 'content_required' });
  const comment = addComment(req.params.postId, owner.id, content);
  res.status(201).json({ comment });
});

app.post('/api/posts/:postId/report', upload.array('evidenceFile', 3), (req, res) => {
  const owner = getCurrentOwner(req) || { id: 'anonymous' };
  const rawEvidence = Array.isArray(req.body.evidence)
    ? req.body.evidence
    : req.body.evidence
      ? [req.body.evidence]
      : [];
  const uploadedEvidence = Array.isArray(req.files)
    ? req.files.map((file) => `/uploads/${file.filename}`)
    : [];
  const evidence = [...rawEvidence.map((item) => String(item || '').trim()).filter(Boolean), ...uploadedEvidence];
  const report = createReport({
    reporterOwnerId: owner.id,
    targetType: 'post',
    targetId: req.params.postId,
    reason: String(req.body.reason || '内容需要人工确认').trim(),
    evidence
  });
  res.status(201).json({ report });
});

app.post('/api/follows', (req, res) => {
  const owner = getCurrentOwner(req);
  if (!owner) return res.status(401).json({ error: 'unauthorized' });
  const targetPetId = String(req.body.targetPetId || '').trim();
  if (!targetPetId) return res.status(400).json({ error: 'targetPetId_required' });
  if (String(req.body.action || 'follow') === 'unfollow') {
    unfollowPet(owner.id, targetPetId);
    return res.json({ ok: true, action: 'unfollow' });
  }
  const relation = followPet(owner.id, targetPetId);
  res.status(201).json({ relation });
});

app.get('/api/chats', (req, res) => {
  const owner = getCurrentOwner(req);
  if (!owner) return res.status(401).json({ error: 'unauthorized' });
  const rows = db
    .prepare('SELECT * FROM chats WHERE ownerIdA = ? OR ownerIdB = ? ORDER BY updatedAt DESC')
    .all(owner.id, owner.id);
  res.json({ items: rows.map((row) => chatForViewer(row, owner.id)) });
});

app.get('/api/chats/:threadId', (req, res) => {
  const owner = getCurrentOwner(req);
  if (!owner) return res.status(401).json({ error: 'unauthorized' });
  const row = db.prepare('SELECT * FROM chats WHERE id = ?').get(req.params.threadId);
  if (!row) return res.status(404).json({ error: 'not_found' });
  res.json({ chat: chatForViewer(row, owner.id) });
});

app.post('/api/chats/:threadId/messages', (req, res) => {
  const owner = getCurrentOwner(req);
  if (!owner) return res.status(401).json({ error: 'unauthorized' });
  const chat = db.prepare('SELECT * FROM chats WHERE id = ?').get(req.params.threadId);
  if (!chat) return res.status(404).json({ error: 'not_found' });
  const participants = [chat.ownerIdA, chat.ownerIdB];
  if (!participants.includes(owner.id)) return res.status(403).json({ error: 'forbidden' });
  const content = String(req.body.content || '').trim();
  if (!content) return res.status(400).json({ error: 'content_required' });
  const message = addMessage(chat.id, owner.id, content);
  markThreadRead(chat.id, owner.id);
  broadcastToThread(wss, chat.id, { type: 'chat_update', threadId: chat.id, message });
  for (const participant of participants) {
    broadcastToOwner(wss, participant, { type: 'chat_update', threadId: chat.id, message });
  }
  res.status(201).json({ message });
});

app.get('/api/admin/dashboard', (req, res) => {
  const admin = getCurrentAdmin(req);
  if (!admin) return res.status(401).json({ error: 'unauthorized' });
  res.json({
    owners: db.prepare('SELECT COUNT(*) AS count FROM owners').get().count,
    pets: db.prepare('SELECT COUNT(*) AS count FROM pets').get().count,
    pendingPosts: db.prepare('SELECT COUNT(*) AS count FROM posts WHERE status = ?').get('pending').count,
    openReports: db.prepare('SELECT COUNT(*) AS count FROM reports WHERE status = ?').get('open').count,
    auditLogs: db.prepare('SELECT COUNT(*) AS count FROM audit_logs').get().count
  });
});

app.get('/api/admin/posts', (req, res) => {
  const admin = getCurrentAdmin(req);
  if (!admin) return res.status(401).json({ error: 'unauthorized' });
  const status = String(req.query.status || '').trim();
  const settings = getEffectiveSettings();
  const rows = status
    ? db.prepare('SELECT * FROM posts WHERE status = ? ORDER BY createdAt DESC').all(status)
    : db.prepare('SELECT * FROM posts ORDER BY createdAt DESC').all();
  res.json({ items: rows.map((row) => rowToPost(row, settings)) });
});

app.get('/api/admin/posts/:postId', (req, res) => {
  const admin = getCurrentAdmin(req);
  if (!admin) return res.status(401).json({ error: 'unauthorized' });
  const settings = getEffectiveSettings();
  const post = rowToPost(db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.postId), settings);
  if (!post) return res.status(404).json({ error: 'not_found' });
  res.json({ post });
});

app.post('/api/admin/posts/:postId/approve', (req, res) => {
  const admin = getCurrentAdmin(req);
  if (!admin) return res.status(401).json({ error: 'unauthorized' });
  approvePost(req.params.postId, admin.id);
  addAuditLog({
    actorType: 'admin',
    actorId: admin.id,
    action: 'approve_post',
    targetType: 'post',
    targetId: req.params.postId
  });
  res.json({ ok: true });
});

app.post('/api/admin/posts/:postId/reject', (req, res) => {
  const admin = getCurrentAdmin(req);
  if (!admin) return res.status(401).json({ error: 'unauthorized' });
  const reviewReason = String(req.body.reason || '').trim();
  rejectPost(req.params.postId, admin.id, reviewReason);
  addAuditLog({
    actorType: 'admin',
    actorId: admin.id,
    action: 'reject_post',
    targetType: 'post',
    targetId: req.params.postId,
    detail: reviewReason
  });
  res.json({ ok: true });
});

app.delete('/api/admin/posts/:postId', (req, res) => {
  const admin = getCurrentAdmin(req);
  if (!admin) return res.status(401).json({ error: 'unauthorized' });
  deletePost(req.params.postId, admin.id);
  addAuditLog({
    actorType: 'admin',
    actorId: admin.id,
    action: 'delete_post',
    targetType: 'post',
    targetId: req.params.postId
  });
  res.json({ ok: true });
});

app.get('/api/admin/users', (req, res) => {
  const admin = getCurrentAdmin(req);
  if (!admin) return res.status(401).json({ error: 'unauthorized' });
  const rows = db.prepare('SELECT * FROM owners ORDER BY createdAt DESC').all();
  res.json({ items: rows.map(rowToOwner) });
});

app.get('/api/admin/owners/:ownerId', (req, res) => {
  const admin = getCurrentAdmin(req);
  if (!admin) return res.status(401).json({ error: 'unauthorized' });
  const owner = rowToOwner(db.prepare('SELECT * FROM owners WHERE id = ?').get(req.params.ownerId));
  if (!owner) return res.status(404).json({ error: 'not_found' });
  const pets = db.prepare('SELECT * FROM pets WHERE ownerId = ? ORDER BY createdAt DESC').all(owner.id).map(rowToPet);
  const settings = getEffectiveSettings();
  const posts = db.prepare('SELECT * FROM posts WHERE ownerId = ? ORDER BY createdAt DESC').all(owner.id).map((row) => rowToPost(row, settings));
  const audits = db
    .prepare('SELECT * FROM audit_logs WHERE targetId = ? OR actorId = ? ORDER BY createdAt DESC LIMIT 200')
    .all(owner.id, owner.id);
  const warnings = listOwnerWarnings(owner.id);
  res.json({ owner, pets, posts, audits, warnings });
});

app.post('/api/admin/owners/:ownerId/ban', (req, res) => {
  const admin = getCurrentAdmin(req);
  if (!admin) return res.status(401).json({ error: 'unauthorized' });
  const reason = String(req.body.reason || '').trim();
  banOwner(req.params.ownerId);
  addAuditLog({
    actorType: 'admin',
    actorId: admin.id,
    action: 'ban_owner',
    targetType: 'owner',
    targetId: req.params.ownerId,
    detail: reason
  });
  res.json({ ok: true });
});

app.post('/api/admin/owners/:ownerId/unban', (req, res) => {
  const admin = getCurrentAdmin(req);
  if (!admin) return res.status(401).json({ error: 'unauthorized' });
  const reason = String(req.body.reason || '').trim();
  unbanOwner(req.params.ownerId);
  addAuditLog({
    actorType: 'admin',
    actorId: admin.id,
    action: 'unban_owner',
    targetType: 'owner',
    targetId: req.params.ownerId,
    detail: reason
  });
  res.json({ ok: true });
});

app.get('/api/admin/pets', (req, res) => {
  const admin = getCurrentAdmin(req);
  if (!admin) return res.status(401).json({ error: 'unauthorized' });
  const rows = db.prepare('SELECT * FROM pets ORDER BY createdAt DESC').all();
  res.json({ items: rows.map(rowToPet) });
});

app.get('/api/admin/pets/:petId', (req, res) => {
  const admin = getCurrentAdmin(req);
  if (!admin) return res.status(401).json({ error: 'unauthorized' });
  const pet = rowToPet(db.prepare('SELECT * FROM pets WHERE id = ?').get(req.params.petId));
  if (!pet) return res.status(404).json({ error: 'not_found' });
  const owner = rowToOwner(db.prepare('SELECT * FROM owners WHERE id = ?').get(pet.ownerId));
  const settings = getEffectiveSettings();
  const posts = db.prepare('SELECT * FROM posts WHERE petId = ? ORDER BY createdAt DESC').all(pet.id).map((row) => rowToPost(row, settings));
  res.json({ pet, owner, posts });
});

app.get('/api/admin/reports', (req, res) => {
  const admin = getCurrentAdmin(req);
  if (!admin) return res.status(401).json({ error: 'unauthorized' });
  const settings = getEffectiveSettings();
  const rows = db.prepare('SELECT * FROM reports ORDER BY createdAt DESC').all();
  res.json({ items: rows.map((row) => rowToReport(row, settings)) });
});

app.get('/api/admin/reports/:reportId', (req, res) => {
  const admin = getCurrentAdmin(req);
  if (!admin) return res.status(401).json({ error: 'unauthorized' });
  const settings = getEffectiveSettings();
  const report = rowToReport(db.prepare('SELECT * FROM reports WHERE id = ?').get(req.params.reportId), settings);
  if (!report) return res.status(404).json({ error: 'not_found' });
  res.json({ report });
});

app.post('/api/admin/reports/:reportId/resolve', (req, res) => {
  const admin = getCurrentAdmin(req);
  if (!admin) return res.status(401).json({ error: 'unauthorized' });
  const resolution = String(req.body.resolution || 'resolved by admin').trim();
  const actionType = String(req.body.actionType || '').trim();
  const result = executeReportAction(req.params.reportId, resolution, admin.id, actionType);
  if (!result.ok) {
    return res.status(result.statusCode || 400).json({ error: result.error || 'report_action_failed' });
  }
  res.json({ ok: true, report: result.report });
});

app.get('/api/admin/config', (req, res) => {
  const admin = getCurrentAdmin(req);
  if (!admin) return res.status(401).json({ error: 'unauthorized' });
  res.json({ settings: getEffectiveSettings() });
});

app.patch('/api/admin/config', (req, res) => {
  const admin = getCurrentAdmin(req);
  if (!admin) return res.status(401).json({ error: 'unauthorized' });
  const partial = sanitizeSettingsInput(req.body || {});
  upsertSettings(partial);
  addAuditLog({
    actorType: 'admin',
    actorId: admin.id,
    action: 'update_config',
    targetType: 'settings',
    targetId: 'global',
    detail: JSON.stringify(partial)
  });
  res.json({ ok: true, settings: getEffectiveSettings() });
});

app.get('/api/admin/audits', (req, res) => {
  const admin = getCurrentAdmin(req);
  if (!admin) return res.status(401).json({ error: 'unauthorized' });
  const rows = db.prepare('SELECT * FROM audit_logs ORDER BY createdAt DESC LIMIT 200').all();
  res.json({ items: rows });
});

app.get('/api/admin/audits/:auditId', (req, res) => {
  const admin = getCurrentAdmin(req);
  if (!admin) return res.status(401).json({ error: 'unauthorized' });
  const audit = db.prepare('SELECT * FROM audit_logs WHERE id = ?').get(req.params.auditId);
  if (!audit) return res.status(404).json({ error: 'not_found' });
  res.json({ audit });
});

app.get('/api/admin/comments', (req, res) => {
  const admin = getCurrentAdmin(req);
  if (!admin) return res.status(401).json({ error: 'unauthorized' });
  const rows = db.prepare(`
    SELECT c.id, c.postId, c.ownerId, c.content, c.createdAt,
           o.name AS ownerName, o.status AS ownerStatus,
           p.title AS postTitle, p.status AS postStatus
    FROM comments c
    LEFT JOIN owners o ON o.id = c.ownerId
    LEFT JOIN posts p ON p.id = c.postId
    ORDER BY c.createdAt DESC
    LIMIT 300
  `).all();
  res.json({ items: rows });
});

app.delete('/api/admin/comments/:commentId', (req, res) => {
  const admin = getCurrentAdmin(req);
  if (!admin) return res.status(401).json({ error: 'unauthorized' });
  const comment = db.prepare('SELECT * FROM comments WHERE id = ?').get(req.params.commentId);
  if (!comment) return res.status(404).json({ error: 'not_found' });
  db.prepare('DELETE FROM comments WHERE id = ?').run(req.params.commentId);
  addAuditLog({
    actorType: 'admin',
    actorId: admin.id,
    action: 'delete_comment',
    targetType: 'comment',
    targetId: req.params.commentId,
    detail: JSON.stringify({ content: comment.content?.slice(0, 100), postId: comment.postId })
  });
  res.json({ ok: true });
});

app.post('/api/uploads', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'missing_file' });
  res.json({ url: `/uploads/${req.file.filename}` });
});

app.post('/api/chats/:threadId/read', (req, res) => {
  const owner = getCurrentOwner(req);
  if (!owner) return res.status(401).json({ error: 'unauthorized' });
  markThreadRead(req.params.threadId, owner.id);
  res.json({ ok: true });
});

app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'not_found' });
});

app.use((error, req, res, _next) => {
  if (error instanceof multer.MulterError) {
    const uploadError = error.code === 'LIMIT_FILE_SIZE' ? 'upload_file_too_large' : 'upload_rejected';
    res.status(400).json({ error: uploadError, requestId: req.requestId });
    return;
  }

  if (error?.message === 'upload_invalid_type') {
    res.status(400).json({ error: 'upload_invalid_type', requestId: req.requestId });
    return;
  }

  if (error?.message === 'cors_not_allowed') {
    res.status(403).json({ error: 'cors_not_allowed', requestId: req.requestId });
    return;
  }

  console.error(`[backend] request ${req.requestId} failed`, error);
  res.status(500).json({ error: 'internal_error', requestId: req.requestId });
});

const server = http.createServer(app);
server.keepAliveTimeout = KEEP_ALIVE_TIMEOUT_MS;
server.headersTimeout = HEADERS_TIMEOUT_MS;
const wss = new WebSocketServer({ noServer: true });

wss.on('connection', (socket, request, context) => {
  socket.threadId = context.threadId || '';
  socket.ownerId = context.ownerId || '';
  socket.send(JSON.stringify({ type: 'connected', threadId: socket.threadId, ownerId: socket.ownerId }));
  socket.on('message', (raw) => {
    try {
      const payload = JSON.parse(raw.toString());
      if (payload.type === 'ping') {
        socket.send(JSON.stringify({ type: 'pong', at: now() }));
      }
    } catch {
      socket.send(JSON.stringify({ type: 'error', message: 'invalid payload' }));
    }
  });
});

server.on('upgrade', (request, socket, head) => {
  const url = new URL(request.url || '/', `http://${request.headers.host || HOST}`);
  if (url.pathname !== '/ws') {
    socket.destroy();
    return;
  }
  const owner = getCurrentOwnerFromUpgradeRequest(request);
  if (!owner) {
    socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
    socket.destroy();
    return;
  }
  wss.handleUpgrade(request, socket, head, (ws) => {
    const threadId = url.searchParams.get('threadId') || '';
    if (!canAccessThread(owner.id, threadId)) {
      ws.close(1008, 'forbidden');
      return;
    }
    const ownerId = owner.id;
    wss.emit('connection', ws, request, { threadId, ownerId });
  });
});

server.listen(PORT, HOST, () => {
  console.log(`Backend REST API ready at http://${HOST}:${PORT}`);
});
