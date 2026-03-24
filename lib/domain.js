import crypto from 'node:crypto';
import { MODERATION_KEYWORDS, POST_STATUS, REPORT_STATUS, VISIBILITY } from './constants.js';

export function now() {
  return new Date().toISOString();
}

export function id(prefix) {
  return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
}

export function initials(text = '') {
  const normalized = text.trim();
  if (!normalized) return 'PA';
  return normalized
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function shouldHoldForReview(text = '') {
  return MODERATION_KEYWORDS.some((keyword) => text.includes(keyword));
}

export function threadIdFor(ownerIdA, ownerIdB) {
  return [ownerIdA, ownerIdB].sort().join('__');
}

export function canAccessPost(post, viewerOwnerId, ownerLookup) {
  if (!post) return false;
  if (post.status !== POST_STATUS.APPROVED && post.ownerId !== viewerOwnerId) {
    return false;
  }
  if (post.visibility === VISIBILITY.PUBLIC) return true;
  if (post.visibility === VISIBILITY.PRIVATE) return post.ownerId === viewerOwnerId;
  const owner = ownerLookup.get(post.ownerId);
  if (!owner) return false;
  return owner.followers?.includes(viewerOwnerId) || post.ownerId === viewerOwnerId;
}

export function createSeedState() {
  const owner1 = {
    id: 'owner_demo',
    name: '阿柯',
    phone: '13800000000',
    avatar: '',
    status: 'active',
    createdAt: now()
  };
  const owner2 = {
    id: 'owner_mina',
    name: '米娜',
    phone: '13800000001',
    avatar: '',
    status: 'active',
    createdAt: now()
  };
  const owner3 = {
    id: 'owner_chen',
    name: '陈老师',
    phone: '13800000002',
    avatar: '',
    status: 'active',
    createdAt: now()
  };

  const pet1 = {
    id: 'pet_momo',
    ownerId: owner1.id,
    name: '糯米',
    species: '猫',
    breed: '英短',
    age: '2岁',
    sex: '母',
    avatar: '',
    tags: ['亲人', '爱睡觉'],
    notes: '对陌生声音敏感，换粮要循序渐进。',
    habits: '早上更活跃，喜欢靠窗晒太阳。',
    visibility: VISIBILITY.PUBLIC,
    createdAt: now(),
    updatedAt: now()
  };
  const pet2 = {
    id: 'pet_lucky',
    ownerId: owner2.id,
    name: '旺仔',
    species: '狗',
    breed: '柴犬',
    age: '4岁',
    sex: '公',
    avatar: '',
    tags: ['活泼', '爱散步'],
    notes: '容易兴奋，外出需牵引。',
    habits: '晚饭后会主动要出门散步。',
    visibility: VISIBILITY.PUBLIC,
    createdAt: now(),
    updatedAt: now()
  };
  const pet3 = {
    id: 'pet_cloud',
    ownerId: owner3.id,
    name: '云朵',
    species: '兔',
    breed: '垂耳兔',
    age: '1岁',
    sex: '母',
    avatar: '',
    tags: ['胆小', '安静'],
    notes: '对环境变化敏感，笼内清洁频率高。',
    habits: '白天安静，夜里会活动。',
    visibility: VISIBILITY.PUBLIC,
    createdAt: now(),
    updatedAt: now()
  };

  const posts = [
    {
      id: 'post_1',
      petId: pet1.id,
      ownerId: owner1.id,
      title: '今天精神不错',
      content: '糯米今天一整天都很黏人，午后睡了很久。提醒自己晚上补一次梳毛。',
      images: [],
      visibility: VISIBILITY.PUBLIC,
      status: POST_STATUS.APPROVED,
      likes: [owner2.id],
      comments: [
        {
          id: 'comment_1',
          ownerId: owner2.id,
          content: '看起来状态很好，记得检查掉毛量。',
          createdAt: now()
        }
      ],
      createdAt: now(),
      updatedAt: now()
    },
    {
      id: 'post_2',
      petId: pet2.id,
      ownerId: owner2.id,
      title: '今天去公园了',
      content: '旺仔在草地上跑了半小时，回家后喝水很多，精神正常。',
      images: [],
      visibility: VISIBILITY.PUBLIC,
      status: POST_STATUS.APPROVED,
      likes: [owner1.id, owner3.id],
      comments: [],
      createdAt: now(),
      updatedAt: now()
    },
    {
      id: 'post_3',
      petId: pet3.id,
      ownerId: owner3.id,
      title: '换垫料提醒',
      content: '云朵今天略微焦躁，先把笼垫更换并保持安静环境。',
      images: [],
      visibility: VISIBILITY.PUBLIC,
      status: POST_STATUS.PENDING,
      likes: [],
      comments: [],
      createdAt: now(),
      updatedAt: now()
    }
  ];

  const chats = [
    {
      id: threadIdFor(owner1.id, owner2.id),
      ownerIds: [owner1.id, owner2.id],
      messages: [
        {
          id: id('msg'),
          senderOwnerId: owner1.id,
          content: '你好，想和糯米认识一下。',
          createdAt: now()
        },
        {
          id: id('msg'),
          senderOwnerId: owner2.id,
          content: '可以呀，旺仔也很喜欢交朋友。',
          createdAt: now()
        }
      ],
      unreadByOwnerId: {}
    }
  ];

  return {
    admins: [
      {
        id: 'admin_demo',
        name: '平台管理员',
        email: 'admin@pet.local',
        password: 'admin123',
        createdAt: now()
      }
    ],
    owners: [
      {
        ...owner1,
        followers: [owner2.id]
      },
      {
        ...owner2,
        followers: [owner1.id]
      },
      {
        ...owner3,
        followers: []
      }
    ],
    pets: [pet1, pet2, pet3],
    posts,
    follows: [
      { id: id('follow'), followerOwnerId: owner1.id, targetPetId: pet2.id, createdAt: now() },
      { id: id('follow'), followerOwnerId: owner2.id, targetPetId: pet1.id, createdAt: now() }
    ],
    reports: [
      {
        id: id('report'),
        reporterOwnerId: owner3.id,
        targetType: 'post',
        targetId: 'post_3',
        reason: '内容需要人工确认',
        status: REPORT_STATUS.OPEN,
        createdAt: now(),
        resolvedAt: ''
      }
    ],
    chats
  };
}
