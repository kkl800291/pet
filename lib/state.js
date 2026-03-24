import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createSeedState, id, now, shouldHoldForReview, threadIdFor } from './domain.js';
import { OWNER_STATUS, POST_STATUS, REPORT_STATUS, VISIBILITY } from './constants.js';

const dataDir = path.join(process.cwd(), 'data');
const stateFile = path.join(dataDir, 'state.json');

let cache = null;
let writeChain = Promise.resolve();

async function ensureLoaded() {
  if (cache) return cache;
  if (!existsSync(stateFile)) {
    await fs.mkdir(dataDir, { recursive: true });
    cache = createSeedState();
    await fs.writeFile(stateFile, JSON.stringify(cache, null, 2), 'utf8');
    return cache;
  }
  const raw = await fs.readFile(stateFile, 'utf8');
  cache = JSON.parse(raw);
  return cache;
}

async function persist(nextState) {
  cache = nextState;
  writeChain = writeChain.then(async () => {
    await fs.mkdir(dataDir, { recursive: true });
    await fs.writeFile(stateFile, JSON.stringify(nextState, null, 2), 'utf8');
  });
  await writeChain;
  return cache;
}

export async function getState() {
  return structuredClone(await ensureLoaded());
}

export async function updateState(mutator) {
  const current = await ensureLoaded();
  const draft = structuredClone(current);
  const result = await mutator(draft);
  await persist(draft);
  return result ?? draft;
}

export async function findOwner(ownerId) {
  const state = await ensureLoaded();
  return state.owners.find((owner) => owner.id === ownerId) || null;
}

export async function findAdmin(adminId) {
  const state = await ensureLoaded();
  return state.admins.find((admin) => admin.id === adminId) || null;
}

export async function findPet(petId) {
  const state = await ensureLoaded();
  return state.pets.find((pet) => pet.id === petId) || null;
}

export async function findPost(postId) {
  const state = await ensureLoaded();
  return state.posts.find((post) => post.id === postId) || null;
}

export async function findChat(threadKey) {
  const state = await ensureLoaded();
  return state.chats.find((chat) => chat.id === threadKey) || null;
}

export async function createOrUpdateOwner({ phone, name }) {
  return updateState((draft) => {
    const existing = draft.owners.find((owner) => owner.phone === phone);
    if (existing) {
      existing.name = name || existing.name;
      existing.status = existing.status || OWNER_STATUS.ACTIVE;
      existing.updatedAt = now();
      return existing;
    }
    const owner = {
      id: id('owner'),
      phone,
      name: name || `用户${phone.slice(-4)}`,
      avatar: '',
      status: OWNER_STATUS.ACTIVE,
      followers: [],
      createdAt: now(),
      updatedAt: now()
    };
    draft.owners.unshift(owner);
    return owner;
  });
}

export async function createOrUpdatePet(ownerId, payload) {
  return updateState((draft) => {
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
      visibility: payload.visibility || VISIBILITY.PUBLIC,
      createdAt: now(),
      updatedAt: now()
    };
    draft.pets.unshift(pet);
    return pet;
  });
}

export async function updatePet(petId, patch) {
  return updateState((draft) => {
    const pet = draft.pets.find((item) => item.id === petId);
    if (!pet) return null;
    Object.assign(pet, patch, { updatedAt: now() });
    return pet;
  });
}

export async function createPost(ownerId, petId, payload) {
  return updateState((draft) => {
    const post = {
      id: id('post'),
      ownerId,
      petId,
      title: payload.title || '未命名日志',
      content: payload.content || '',
      images: payload.images || [],
      visibility: payload.visibility || VISIBILITY.PUBLIC,
      status: shouldHoldForReview(`${payload.title || ''} ${payload.content || ''}`) ? POST_STATUS.PENDING : POST_STATUS.APPROVED,
      likes: [],
      comments: [],
      createdAt: now(),
      updatedAt: now()
    };
    draft.posts.unshift(post);
    return post;
  });
}

export async function toggleLike(postId, ownerId) {
  return updateState((draft) => {
    const post = draft.posts.find((item) => item.id === postId);
    if (!post) return null;
    const index = post.likes.indexOf(ownerId);
    if (index >= 0) {
      post.likes.splice(index, 1);
    } else {
      post.likes.push(ownerId);
    }
    post.updatedAt = now();
    return post;
  });
}

export async function addComment(postId, ownerId, content) {
  return updateState((draft) => {
    const post = draft.posts.find((item) => item.id === postId);
    if (!post) return null;
    const comment = {
      id: id('comment'),
      ownerId,
      content,
      createdAt: now()
    };
    post.comments.push(comment);
    post.updatedAt = now();
    return comment;
  });
}

export async function followPet(followerOwnerId, targetPetId) {
  return updateState((draft) => {
    const existing = draft.follows.find((follow) => follow.followerOwnerId === followerOwnerId && follow.targetPetId === targetPetId);
    if (existing) return existing;
    const relation = {
      id: id('follow'),
      followerOwnerId,
      targetPetId,
      createdAt: now()
    };
    draft.follows.push(relation);
    const targetPet = draft.pets.find((pet) => pet.id === targetPetId);
    const targetOwner = draft.owners.find((owner) => owner.id === targetPet?.ownerId);
    if (targetOwner && !targetOwner.followers.includes(followerOwnerId)) {
      targetOwner.followers.push(followerOwnerId);
    }
    return relation;
  });
}

export async function unfollowPet(followerOwnerId, targetPetId) {
  return updateState((draft) => {
    draft.follows = draft.follows.filter((follow) => !(follow.followerOwnerId === followerOwnerId && follow.targetPetId === targetPetId));
    const targetPet = draft.pets.find((pet) => pet.id === targetPetId);
    const targetOwner = draft.owners.find((owner) => owner.id === targetPet?.ownerId);
    if (targetOwner) {
      targetOwner.followers = targetOwner.followers.filter((ownerId) => ownerId !== followerOwnerId);
    }
  });
}

export async function createReport({ reporterOwnerId, targetType, targetId, reason }) {
  return updateState((draft) => {
    const report = {
      id: id('report'),
      reporterOwnerId,
      targetType,
      targetId,
      reason,
      status: REPORT_STATUS.OPEN,
      createdAt: now(),
      resolvedAt: ''
    };
    draft.reports.unshift(report);
    return report;
  });
}

export async function resolveReport(reportId, resolution) {
  return updateState((draft) => {
    const report = draft.reports.find((item) => item.id === reportId);
    if (!report) return null;
    report.status = REPORT_STATUS.RESOLVED;
    report.resolvedAt = now();
    report.resolution = resolution || 'resolved';
    return report;
  });
}

export async function banOwner(ownerId) {
  return updateState((draft) => {
    const owner = draft.owners.find((item) => item.id === ownerId);
    if (!owner) return null;
    owner.status = OWNER_STATUS.BANNED;
    owner.updatedAt = now();
    return owner;
  });
}

export async function unbanOwner(ownerId) {
  return updateState((draft) => {
    const owner = draft.owners.find((item) => item.id === ownerId);
    if (!owner) return null;
    owner.status = OWNER_STATUS.ACTIVE;
    owner.updatedAt = now();
    return owner;
  });
}

export async function approvePost(postId) {
  return updateState((draft) => {
    const post = draft.posts.find((item) => item.id === postId);
    if (!post) return null;
    post.status = POST_STATUS.APPROVED;
    post.updatedAt = now();
    return post;
  });
}

export async function rejectPost(postId) {
  return updateState((draft) => {
    const post = draft.posts.find((item) => item.id === postId);
    if (!post) return null;
    post.status = POST_STATUS.REJECTED;
    post.updatedAt = now();
    return post;
  });
}

export async function createMessage(threadId, senderOwnerId, content) {
  return updateState((draft) => {
    let chat = draft.chats.find((item) => item.id === threadId);
    if (!chat) {
      const parts = threadId.split('__');
      chat = {
        id: threadId,
        ownerIds: parts,
        messages: [],
        unreadByOwnerId: {}
      };
      draft.chats.unshift(chat);
    }
    const message = {
      id: id('msg'),
      senderOwnerId,
      content,
      createdAt: now()
    };
    chat.messages.push(message);
    for (const ownerId of chat.ownerIds) {
      if (ownerId !== senderOwnerId) {
        chat.unreadByOwnerId[ownerId] = (chat.unreadByOwnerId[ownerId] || 0) + 1;
      }
    }
    return { chat, message };
  });
}

export async function markThreadRead(threadId, ownerId) {
  return updateState((draft) => {
    const chat = draft.chats.find((item) => item.id === threadId);
    if (!chat) return null;
    chat.unreadByOwnerId[ownerId] = 0;
    return chat;
  });
}

export function buildOwnerLookup(state) {
  return new Map(state.owners.map((owner) => [owner.id, owner]));
}

export function buildPetLookup(state) {
  return new Map(state.pets.map((pet) => [pet.id, pet]));
}

export function getThreadParticipants(threadId) {
  return threadId.split('__');
}

export function computeThreadIdFromPets(petA, petB) {
  return threadIdFor(petA.ownerId, petB.ownerId);
}
