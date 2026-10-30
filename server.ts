import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const ADMIN_EMAIL = 'babatundeoyemade0@gmail.com';
const ADMIN_USERNAME = 'sasuke';
const INITIAL_ADMIN_PASSWORD = 'sasuke';

// Body parsers with generous limits for device gallery image uploads
app.use(express.json({ limit: '35mb' }));
app.use(express.urlencoded({ extended: true, limit: '35mb' }));

// Static directory for uploaded images
const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
app.use('/uploads', express.static(UPLOADS_DIR));

// Ensure data directory exists
const DATA_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
const DB_FILE = path.join(DATA_DIR, 'database.json');

// Types
export type ReactionType = 'like' | 'love' | 'amen' | 'insightful' | 'haha' | 'wow';

export interface MessageAttachment {
  id: string;
  name: string;
  size: number;
  type: 'image' | 'video' | 'audio' | 'document' | 'file';
  url: string;
  mimeType: string;
}

interface Database {
  users: Array<{
    id: string;
    email: string;
    username: string;
    displayName: string;
    bio: string;
    avatarUrl: string;
    coverUrl?: string;
    passwordHash: string;
    salt: string;
    role: 'super_admin' | 'admin' | 'user';
    isAdmin: boolean;
    isSuperAdmin?: boolean;
    isBanned?: boolean;
    banReason?: string;
    createdAt: string;
    friends: string[];
    followers?: string[];
    following?: string[];
    savedPostIds?: string[];
    lastActive?: string;
  }>;
  topics: Array<{
    id: string;
    title: string;
    subject: string;
    category: string;
    explanation: string;
    keywords: string[];
    bibleReferences: string[];
    notes: string;
    studyMaterial: string;
    searchTerms: string[];
    authorId: string;
    createdAt: string;
    updatedAt: string;
  }>;
  categories: string[];
  conversations: Array<{
    id: string;
    userId: string;
    title: string;
    createdAt: string;
    updatedAt: string;
    messages: Array<{
      id: string;
      role: 'user' | 'assistant';
      content: string;
      timestamp: string;
      imageUrl?: string;
      bibleReferences?: string[];
      relatedTopics?: string[];
    }>;
  }>;
  posts: Array<{
    id: string;
    authorId: string;
    authorName: string;
    authorUsername: string;
    authorAvatar: string;
    content: string;
    imageUrl?: string;
    feeling?: string;
    likes: string[];
    reactions: Array<{ userId: string; userName: string; type: ReactionType }>;
    comments: Array<{
      id: string;
      authorId: string;
      authorName: string;
      authorUsername: string;
      authorAvatar: string;
      content: string;
      createdAt: string;
      likes?: string[];
      replies?: Array<{
        id: string;
        authorId: string;
        authorName: string;
        authorUsername: string;
        authorAvatar: string;
        content: string;
        createdAt: string;
      }>;
    }>;
    sharesCount?: number;
    groupId?: string;
    groupName?: string;
    savedBy?: string[];
    createdAt: string;
  }>;
  stories: Array<{
    id: string;
    authorId: string;
    authorName: string;
    authorAvatar: string;
    mediaUrl: string;
    caption?: string;
    createdAt: string;
    expiresAt: string;
  }>;
  groups: Array<{
    id: string;
    name: string;
    description: string;
    category: string;
    coverUrl: string;
    avatarUrl: string;
    privacy: 'public' | 'private';
    ownerId: string;
    adminIds: string[];
    memberIds: string[];
    isLocked?: boolean;
    createdAt: string;
  }>;
  groupMessages: Array<{
    id: string;
    groupId: string;
    senderId: string;
    senderName: string;
    senderAvatar: string;
    content: string;
    attachments?: MessageAttachment[];
    replyTo?: {
      id: string;
      senderName: string;
      content: string;
    };
    createdAt: string;
  }>;
  friendRequests: Array<{
    id: string;
    fromUserId: string;
    toUserId: string;
    status: 'pending' | 'accepted' | 'declined';
    createdAt: string;
  }>;
  directMessages: Array<{
    id: string;
    senderId: string;
    receiverId: string;
    content: string;
    attachments?: MessageAttachment[];
    replyTo?: {
      id: string;
      senderName: string;
      content: string;
    };
    createdAt: string;
    read: boolean;
  }>;
  notifications: Array<{
    id: string;
    userId: string;
    type: 'friend_request' | 'friend_accepted' | 'like' | 'reaction' | 'comment' | 'reply' | 'announcement' | 'group_invite';
    title: string;
    message: string;
    link?: string;
    read: boolean;
    createdAt: string;
    data?: any;
  }>;
  announcements: Array<{
    id: string;
    title: string;
    content: string;
    authorName: string;
    createdAt: string;
    important: boolean;
  }>;
  branding: {
    siteName: string;
    logoUrl?: string;
    tagline?: string;
    primaryColor?: string;
    announcementBanner?: string;
    rules: string[];
  };
  reports: Array<{
    id: string;
    reporterId: string;
    reporterName: string;
    targetType: 'post' | 'comment' | 'message' | 'user' | 'group';
    targetId: string;
    targetSummary?: string;
    reason: string;
    details?: string;
    status: 'pending' | 'resolved' | 'dismissed';
    createdAt: string;
    resolvedAt?: string;
    resolvedBy?: string;
    actionTaken?: string;
  }>;
  appeals: Array<{
    id: string;
    userId?: string;
    userName: string;
    userEmail: string;
    reason: string;
    details: string;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: string;
    reviewedAt?: string;
    reviewedBy?: string;
  }>;
  adminLogs: Array<{
    id: string;
    actorId: string;
    actorName: string;
    actorRole: string;
    action: string;
    targetType: string;
    targetId: string;
    details: string;
    timestamp: string;
  }>;
  systemSettings: {
    customAiInstructions: string;
  };
}

const INITIAL_CATEGORIES = [
  'Church History',
  'Old Testament',
  'New Testament',
  'Bible Survey',
  'Theology',
  'Christian Doctrine',
  'Apologetics',
  'Research Method',
  'Sermon Preparation',
  'Bible Study',
  'General Academics'
];

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}

function generateSalt(): string {
  return crypto.randomBytes(16).toString('hex');
}

function getInitialDatabase(): Database {
  const adminSalt = generateSalt();
  // Required initial password: sasuke
  const initialAdminHash = hashPassword(INITIAL_ADMIN_PASSWORD, adminSalt);
  const studentSalt = generateSalt();

  return {
    users: [
      {
        id: 'usr-admin-sasuke',
        email: ADMIN_EMAIL,
        username: ADMIN_USERNAME,
        displayName: 'Sasuke (WNCC Admin)',
        bio: 'Official Administrator and Theological Academic Moderator at West Nigeria Christian College (WNCC). Serving Christ with wisdom and truth.',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
        coverUrl: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=1200&auto=format&fit=crop&q=80',
        passwordHash: initialAdminHash,
        salt: adminSalt,
        role: 'admin',
        isAdmin: true,
        createdAt: new Date().toISOString(),
        friends: ['usr-student-emmanuel', 'usr-student-ruth', 'usr-faculty-david'],
        followers: ['usr-student-emmanuel', 'usr-student-ruth'],
        following: ['usr-student-emmanuel'],
        lastActive: new Date().toISOString()
      },
      {
        id: 'usr-student-emmanuel',
        email: 'emmanuel.adeyemi@wncc.edu.ng',
        username: 'emmanuel_wncc',
        displayName: 'Emmanuel Adeyemi',
        bio: '3rd Year Ministerial Student at WNCC. Passionate about Expository Preaching and Church Planting across Ogun and Oyo states.',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
        coverUrl: 'https://images.unsplash.com/photo-1519791883288-dc8bd696e667?w=1200&auto=format&fit=crop&q=80',
        passwordHash: hashPassword('Student123!', studentSalt),
        salt: studentSalt,
        role: 'user',
        isAdmin: false,
        createdAt: new Date().toISOString(),
        friends: ['usr-admin-sasuke'],
        followers: ['usr-admin-sasuke'],
        following: ['usr-admin-sasuke'],
        lastActive: new Date().toISOString()
      },
      {
        id: 'usr-student-ruth',
        email: 'ruth.okonkwo@wncc.edu.ng',
        username: 'ruth_scholar',
        displayName: 'Ruth Okonkwo',
        bio: 'Department of Biblical Studies. Researching Greek Lexicography and Pauline Hermeneutics.',
        avatarUrl: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&auto=format&fit=crop&q=80',
        coverUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=1200&auto=format&fit=crop&q=80',
        passwordHash: hashPassword('Student123!', studentSalt),
        salt: studentSalt,
        role: 'user',
        isAdmin: false,
        createdAt: new Date().toISOString(),
        friends: ['usr-admin-sasuke'],
        followers: [],
        following: ['usr-admin-sasuke'],
        lastActive: new Date().toISOString()
      },
      {
        id: 'usr-faculty-david',
        email: 'david.babatunde@wncc.edu.ng',
        username: 'pastor_david',
        displayName: 'Pastor David Olatunji',
        bio: 'Lecturer in Homiletics & Pastoral Care. Serving Churches of Christ in South-West Nigeria.',
        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
        coverUrl: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=1200&auto=format&fit=crop&q=80',
        passwordHash: hashPassword('Faculty123!', studentSalt),
        salt: studentSalt,
        role: 'user',
        isAdmin: false,
        createdAt: new Date().toISOString(),
        friends: ['usr-admin-sasuke'],
        followers: [],
        following: [],
        lastActive: new Date().toISOString()
      }
    ],
    categories: INITIAL_CATEGORIES,
    topics: [
      {
        id: 'topic-1',
        title: 'The Doctrine of Justification by Faith',
        subject: 'Pauline Epistles & Systematic Theology',
        category: 'Christian Doctrine',
        explanation: 'Justification is God’s judicial declaration wherein a sinner is acquitted and declared righteous solely through faith in the finished, sacrificial work of Jesus Christ, rather than by human works of the law.',
        keywords: ['justification', 'faith', 'righteousness', 'imputation', 'grace', 'Romans', 'Galatians', 'theology'],
        bibleReferences: ['Romans 3:21-28', 'Romans 5:1-2', 'Galatians 2:16', 'Ephesians 2:8-9', '2 Corinthians 5:21'],
        notes: 'Crucial for exams: Distinguish between Justification (imputed righteousness, instantaneous legal standing before God) and Sanctification (imparted holiness, progressive moral transformation through the Holy Spirit). Mention Martin Luther\'s "articulus stantis vel cadentis ecclesiae" (the article by which the church stands or falls).',
        studyMaterial: 'Detailed lecture notes: In Romans 3:24-26, Paul demonstrates that God remains both "just and the justifier of the one who has faith in Jesus". Christ’s blood serves as the propitiation (hilasterion), satisfying God’s holy justice.',
        searchTerms: ['justification', 'faith', 'romans', 'salvation', 'grace'],
        authorId: 'usr-admin-sasuke',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'topic-2',
        title: 'The Synoptic Problem & Two-Source Hypothesis',
        subject: 'New Testament Introduction',
        category: 'New Testament',
        explanation: 'The Synoptic Problem examines the literary and historical relationships among the Gospels of Matthew, Mark, and Luke. The Two-Source Hypothesis posits that the Gospel of Mark was written first (Marcan Priority) and that Matthew and Luke independently utilized Mark along with a hypothetical sayings source called Q (Quelle).',
        keywords: ['synoptic', 'gospels', 'matthew', 'mark', 'luke', 'quelle', 'two-source hypothesis', 'q source'],
        bibleReferences: ['Mark 1:1', 'Luke 1:1-4', 'Matthew 1:1'],
        notes: 'WNCC Exam Tip: Be prepared to cite internal evidence supporting Marcan priority: Mark\'s rougher Greek grammar, shorter length, and the lack of Markan narrative without parallels in Matthew or Luke.',
        studyMaterial: 'The four-document hypothesis expanded by B.H. Streeter also accounts for "M" (unique Matthew material like the visit of the Magi) and "L" (unique Luke material like the Good Samaritan and Prodigal Son).',
        searchTerms: ['synoptic', 'two-source', 'markan priority', 'gospels', 'q source'],
        authorId: 'usr-admin-sasuke',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'topic-3',
        title: 'Covenant Theology in the Pentateuch',
        subject: 'Old Testament Studies',
        category: 'Old Testament',
        explanation: 'A comprehensive study of Yahweh’s covenants with humanity and Israel: the Adamic, Noahic, Abrahamic, and Mosaic covenants. The covenants reveal God’s progressive plan of redemption culminating in the New Covenant promised in Jeremiah 31 and fulfilled in Christ.',
        keywords: ['covenant', 'berith', 'abrahamic', 'mosaic', 'pentateuch', 'law', 'promise', 'redemption'],
        bibleReferences: ['Genesis 12:1-3', 'Genesis 15:1-18', 'Exodus 19:5-6', 'Exodus 24:7-8', 'Deuteronomy 28:1-14'],
        notes: 'Distinguish between unconditional/promissory covenants (Abrahamic: land, seed, blessing) and conditional suzerainty treaties (Mosaic: blessings for obedience, curses for disobedience).',
        studyMaterial: 'The Hebrew term "Berith" signifies a solemn bond sovereignly administered by God. Hittite Suzerainty Treaties of the 2nd millennium BC provide the historical structural parallel for the Book of Deuteronomy.',
        searchTerms: ['covenant', 'pentateuch', 'abrahamic covenant', 'old testament'],
        authorId: 'usr-admin-sasuke',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'topic-4',
        title: 'The Restoration Movement & Church History in West Africa',
        subject: 'Church History & Restoration Studies',
        category: 'Church History',
        explanation: 'The historical development of the Stone-Campbell Restoration Movement aimed at Christian unity based on the New Testament pattern ("where the Scriptures speak, we speak; where the Scriptures are silent, we are silent"), and its arrival, growth, and establishment of institutions like WNCC in Abeokuta/Nigeria.',
        keywords: ['restoration movement', 'stone-campbell', 'church of christ', 'nigeria', 'wncc', 'abeokuta', 'church history'],
        bibleReferences: ['Acts 2:42', 'John 17:20-21', 'Ephesians 4:4-6', '1 Peter 4:11'],
        notes: 'Important dates for WNCC students: Key pioneer evangelists in Nigeria, the founding of West Nigeria Christian College as an academic beacon for ministerial training, biblical scholarship, and evangelism across West Africa.',
        studyMaterial: 'Principles emphasized: Autonomous congregational leadership by elders and deacons, weekly observance of the Lord’s Supper, baptism by immersion for the remission of sins, and biblical non-denominational Christianity.',
        searchTerms: ['restoration', 'church history', 'church of christ', 'nigeria', 'wncc'],
        authorId: 'usr-admin-sasuke',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'topic-5',
        title: 'Expository Preaching & Homiletical Structure',
        subject: 'Homiletics & Ministry Practice',
        category: 'Sermon Preparation',
        explanation: 'Expository preaching is the communication of a biblical concept derived from and transmitted through a historical, grammatical, and literary study of a passage in its context, which the Holy Spirit first applies to the personality of the preacher, then through the preacher to the congregation.',
        keywords: ['homiletics', 'expository preaching', 'sermon', 'outline', 'hermeneutics', 'application', 'illustration'],
        bibleReferences: ['Nehemiah 8:8', '2 Timothy 4:1-2', 'Ezra 7:10', 'Titus 2:1'],
        notes: 'Homiletical bridge: 1. Biblical Text -> 2. Exegetical Idea ("What did it mean then?") -> 3. Homiletical Big Idea ("What is the timeless truth?") -> 4. Practical Application ("How do we live it now?").',
        studyMaterial: 'Structure includes: Introduction (Capture attention, raise need), Proposition / Main Idea, Transition Sentence, Body Points with scripture reading, explanation, illustration, and application, Conclusion (Recap, call to repentance/action).',
        searchTerms: ['sermon', 'homiletics', 'expository preaching', 'preaching'],
        authorId: 'usr-admin-sasuke',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ],
    conversations: [],
    posts: [
      {
        id: 'post-welcome',
        authorId: 'usr-admin-sasuke',
        authorName: 'Sasuke (WNCC Admin)',
        authorUsername: 'sasuke',
        authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
        content: 'Grace and peace to the West Nigeria Christian College community! Welcome to WNCC AI. This platform brings together collegiate theological scholarship, general academic intelligence, and our vibrant student community. Feel free to join groups, share research insights, and engage in thoughtful discussion.',
        imageUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=1000&auto=format&fit=crop&q=80',
        feeling: 'blessed 🙏',
        likes: ['usr-student-emmanuel', 'usr-student-ruth'],
        reactions: [
          { userId: 'usr-student-emmanuel', userName: 'Emmanuel Adeyemi', type: 'amen' },
          { userId: 'usr-student-ruth', userName: 'Ruth Okonkwo', type: 'love' }
        ],
        comments: [
          {
            id: 'comm-1',
            authorId: 'usr-student-emmanuel',
            authorName: 'Emmanuel Adeyemi',
            authorUsername: 'emmanuel_wncc',
            authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
            content: 'Glory to God! This will be tremendously helpful for our preparation for the upcoming Hermeneutics and Church History comprehensive examinations.',
            createdAt: new Date().toISOString(),
            likes: ['usr-admin-sasuke'],
            replies: [
              {
                id: 'rep-1',
                authorId: 'usr-admin-sasuke',
                authorName: 'Sasuke (WNCC Admin)',
                authorUsername: 'sasuke',
                authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
                content: 'Amen Brother Emmanuel. Check out the Biblical Languages study group as well!',
                createdAt: new Date().toISOString()
              }
            ]
          }
        ],
        sharesCount: 3,
        savedBy: [],
        createdAt: new Date().toISOString()
      },
      {
        id: 'post-greek',
        authorId: 'usr-student-ruth',
        authorName: 'Ruth Okonkwo',
        authorUsername: 'ruth_scholar',
        authorAvatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&auto=format&fit=crop&q=80',
        content: 'Working through Romans chapter 8 in the original Koine Greek today. The phrase "oudèn ára nŷn katákrima" (there is therefore now no condemnation) in verse 1 is so deeply uplifting! What passage are you meditating on today?',
        feeling: 'inspired 💡',
        likes: ['usr-admin-sasuke', 'usr-faculty-david'],
        reactions: [
          { userId: 'usr-admin-sasuke', userName: 'Sasuke', type: 'amen' },
          { userId: 'usr-faculty-david', userName: 'Pastor David', type: 'insightful' }
        ],
        comments: [],
        sharesCount: 1,
        savedBy: [],
        createdAt: new Date(Date.now() - 3600000 * 4).toISOString()
      }
    ],
    stories: [
      {
        id: 'story-1',
        authorId: 'usr-admin-sasuke',
        authorName: 'Sasuke (Admin)',
        authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
        mediaUrl: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&auto=format&fit=crop&q=80',
        caption: 'Morning chapel devotions at WNCC Campus. Have a blessed day of lectures!',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 86400000).toISOString()
      },
      {
        id: 'story-2',
        authorId: 'usr-student-emmanuel',
        authorName: 'Emmanuel',
        authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
        mediaUrl: 'https://images.unsplash.com/photo-1532012164546-f432f2e3777a?w=800&auto=format&fit=crop&q=80',
        caption: 'Studying in the library. Preparing for Greek translation class.',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 86400000).toISOString()
      }
    ],
    groups: [
      {
        id: 'grp-ministerial',
        name: 'WNCC Ministerial Fellowship',
        description: 'A community for ministerial students, trainee evangelists, and church leaders discussing sermon preparation, pastoral theology, and church administration.',
        category: 'Ministry & Preaching',
        coverUrl: 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=1200&auto=format&fit=crop&q=80',
        avatarUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=300&auto=format&fit=crop&q=80',
        privacy: 'public',
        ownerId: 'usr-admin-sasuke',
        adminIds: ['usr-admin-sasuke', 'usr-faculty-david'],
        memberIds: ['usr-admin-sasuke', 'usr-student-emmanuel', 'usr-faculty-david'],
        isLocked: false,
        createdAt: new Date().toISOString()
      },
      {
        id: 'grp-languages',
        name: 'Biblical Languages Study Circle',
        description: 'Collaborative study group dedicated to Koine Greek, Biblical Hebrew, textual criticism, and morphological parsing.',
        category: 'Biblical Languages',
        coverUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=1200&auto=format&fit=crop&q=80',
        avatarUrl: 'https://images.unsplash.com/photo-1532012164546-f432f2e3777a?w=300&auto=format&fit=crop&q=80',
        privacy: 'public',
        ownerId: 'usr-admin-sasuke',
        adminIds: ['usr-admin-sasuke'],
        memberIds: ['usr-admin-sasuke', 'usr-student-ruth', 'usr-student-emmanuel'],
        isLocked: false,
        createdAt: new Date().toISOString()
      },
      {
        id: 'grp-evangelism',
        name: 'Restoration History & Evangelism',
        description: 'Discussing the Stone-Campbell Restoration Movement, pioneer church planting in Nigeria, and field evangelism strategies.',
        category: 'Church History',
        coverUrl: 'https://images.unsplash.com/photo-1519791883288-dc8bd696e667?w=1200&auto=format&fit=crop&q=80',
        avatarUrl: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=300&auto=format&fit=crop&q=80',
        privacy: 'public',
        ownerId: 'usr-admin-sasuke',
        adminIds: ['usr-admin-sasuke'],
        memberIds: ['usr-admin-sasuke', 'usr-faculty-david'],
        isLocked: false,
        createdAt: new Date().toISOString()
      },
      {
        id: 'grp-exam-revision',
        name: 'Degree Exam Revision & Research Hub',
        description: 'Academic group for sharing research methodologies, APA/Turabian guidelines, past exam questions, and study notes.',
        category: 'Academics',
        coverUrl: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=1200&auto=format&fit=crop&q=80',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
        privacy: 'public',
        ownerId: 'usr-admin-sasuke',
        adminIds: ['usr-admin-sasuke'],
        memberIds: ['usr-admin-sasuke', 'usr-student-emmanuel', 'usr-student-ruth'],
        isLocked: false,
        createdAt: new Date().toISOString()
      }
    ],
    groupMessages: [
      {
        id: 'gmsg-1',
        groupId: 'grp-ministerial',
        senderId: 'usr-admin-sasuke',
        senderName: 'Sasuke (Admin)',
        senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
        content: 'Welcome everyone to the Ministerial Fellowship group chat! Feel free to share sermon outlines, Greek notes, and documents for peer review.',
        createdAt: new Date().toISOString()
      }
    ],
    friendRequests: [],
    directMessages: [],
    notifications: [
      {
        id: 'notif-welcome',
        userId: 'usr-student-emmanuel',
        type: 'announcement',
        title: 'Welcome to WNCC AI Social & Research Platform',
        message: 'Explore groups, post stories, research with WNCC AI, and connect with fellow scholars.',
        read: false,
        createdAt: new Date().toISOString()
      }
    ],
    announcements: [
      {
        id: 'ann-1',
        title: 'WNCC Academic Session AI Assistant Integration',
        content: 'All ministerial and degree students are encouraged to utilize WNCC AI for coursework research, exegetical analysis, and revision. Official topics are continuously moderated by the College Academic Board.',
        authorName: 'Academic Affairs WNCC',
        createdAt: new Date().toISOString(),
        important: true
      }
    ],
    branding: {
      siteName: 'WNCC AI',
      logoUrl: '',
      tagline: 'West Nigeria Christian College Academic & Community Platform',
      primaryColor: '#78350f',
      announcementBanner: 'Welcome to WNCC AI — The official theological and scholarly community platform.',
      rules: [
        'Maintain Christ-like reverence, scholarly integrity, and mutual respect across all discussions.',
        'Ground theological debates in Scripture, hermeneutical rigor, and historical Christian context.',
        'No harassment, unedifying vulgarity, deceptive claims, or malicious conduct.',
        'Group owners and admins are responsible for pastoral and academic order in their respective spaces.',
        'Respect intellectual copyright and cite scholarly references accurately.'
      ]
    },
    reports: [],
    appeals: [],
    adminLogs: [],
    systemSettings: {
      customAiInstructions: 'You are WNCC AI, the official academic, theological, and general AI assistant for West Nigeria Christian College (WNCC). You possess comprehensive intelligence across all domains: Biblical scholarship, theology, Church history, sermon preparation, Greek/Hebrew exegetical studies, academic research, computer programming, creative writing, mathematics, problem solving, summarization, and step-by-step reasoning. Maintain clarity, truth, precision, and practical pastoral warmth.'
    }
  };
}

let db: Database;
try {
  if (fs.existsSync(DB_FILE)) {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    db = JSON.parse(raw);

    // CRITICAL: Ensure babatundeoyemade0@gmail.com is Super Admin with initial password 'sasuke'
    let adminUser = db.users.find(u => u.email.toLowerCase() === ADMIN_EMAIL.toLowerCase());
    if (adminUser) {
      adminUser.passwordHash = hashPassword(INITIAL_ADMIN_PASSWORD, adminUser.salt);
      adminUser.username = ADMIN_USERNAME;
      adminUser.isAdmin = true;
      adminUser.isSuperAdmin = true;
      adminUser.role = 'super_admin';
    } else {
      const salt = generateSalt();
      db.users.unshift({
        id: 'usr-admin-sasuke',
        email: ADMIN_EMAIL,
        username: ADMIN_USERNAME,
        displayName: 'Sasuke (WNCC Admin)',
        bio: 'Official Administrator and Theological Academic Moderator at West Nigeria Christian College (WNCC).',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
        coverUrl: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=1200&auto=format&fit=crop&q=80',
        passwordHash: hashPassword(INITIAL_ADMIN_PASSWORD, salt),
        salt,
        role: 'super_admin',
        isAdmin: true,
        isSuperAdmin: true,
        createdAt: new Date().toISOString(),
        friends: []
      });
    }

    // Ensure collections exist
    if (!db.branding) db.branding = getInitialDatabase().branding;
    if (!db.reports) db.reports = [];
    if (!db.appeals) db.appeals = [];
    if (!db.adminLogs) db.adminLogs = [];
    if (!db.groups) db.groups = getInitialDatabase().groups;
    if (!db.stories) db.stories = getInitialDatabase().stories;
    if (!db.groupMessages) db.groupMessages = getInitialDatabase().groupMessages;
    if (!db.friendRequests) db.friendRequests = [];

    // Ensure groups have ownerId and isLocked
    db.groups.forEach(g => {
      if (!g.ownerId) {
        g.ownerId = g.adminIds && g.adminIds.length > 0 ? g.adminIds[0] : 'usr-admin-sasuke';
      }
      if (g.isLocked === undefined) {
        g.isLocked = false;
      }
    });

    // Ensure users have isBanned and super_admin permissions
    db.users.forEach(u => {
      if (u.isBanned === undefined) u.isBanned = false;
      if (u.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
        u.role = 'super_admin';
        u.isAdmin = true;
        u.isSuperAdmin = true;
      }
    });

    // Ensure seed student and faculty users exist in database so they can be searched and friended
    const initialDb = getInitialDatabase();
    for (const initUser of initialDb.users) {
      if (initUser.id === 'usr-admin-sasuke') continue; // Handled above
      const existingUser = db.users.find(u => u.id === initUser.id || u.username.toLowerCase() === initUser.username.toLowerCase());
      if (!existingUser) {
        db.users.push(initUser);
      }
    }

    // Ensure posts have reactions array
    db.posts.forEach(p => {
      if (!p.reactions) {
        p.reactions = (p.likes || []).map(uid => ({ userId: uid, userName: 'Scholar', type: 'like' as ReactionType }));
      }
    });

    saveDatabase();
  } else {
    db = getInitialDatabase();
    saveDatabase();
  }
} catch (err) {
  console.error('Error loading database, resetting to initial:', err);
  db = getInitialDatabase();
  saveDatabase();
}

function saveDatabase() {
  try {
    const tempFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(db, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  } catch (err) {
    console.error('Failed to save database:', err);
  }
}

// Token session storage
const activeTokens = new Map<string, { userId: string; email: string; isAdmin: boolean }>();

function generateToken(user: { id: string; email: string; isAdmin: boolean }): string {
  const token = `wncc_${crypto.randomBytes(32).toString('hex')}`;
  activeTokens.set(token, {
    userId: user.id,
    email: user.email,
    isAdmin: user.isAdmin
  });
  return token;
}

// Admin Activity Logger Helper
function logAdminActivity(actor: { id: string; displayName: string; role?: string }, action: string, targetType: string, targetId: string, details: string) {
  if (!db.adminLogs) db.adminLogs = [];
  db.adminLogs.unshift({
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    actorId: actor.id,
    actorName: actor.displayName,
    actorRole: actor.role || 'super_admin',
    action,
    targetType,
    targetId,
    details,
    timestamp: new Date().toISOString()
  });
  if (db.adminLogs.length > 500) {
    db.adminLogs = db.adminLogs.slice(0, 500);
  }
}

// Authentication Middleware
function authMiddleware(req: Request & { user?: any }, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
  }

  const token = authHeader.split(' ')[1];
  const session = activeTokens.get(token);

  if (!session) {
    return res.status(401).json({ error: 'Session expired or invalid token' });
  }

  const user = db.users.find(u => u.id === session.userId);
  if (!user) {
    return res.status(401).json({ error: 'User not found' });
  }

  // Check if user is suspended/banned
  if (user.isBanned) {
    return res.status(403).json({
      error: `Your account has been suspended by administration. Reason: ${user.banReason || 'Violation of college community guidelines'}.`,
      isBanned: true,
      banReason: user.banReason
    });
  }

  // Update online status timestamp
  user.lastActive = new Date().toISOString();

  const isSuperAdmin = user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase() || user.role === 'super_admin';
  const isAdmin = isSuperAdmin || user.role === 'admin' || user.isAdmin === true;
  req.user = {
    ...user,
    isSuperAdmin,
    isAdmin,
    role: isSuperAdmin ? 'super_admin' : (user.role || (isAdmin ? 'admin' : 'user'))
  };

  next();
}

function adminOnly(req: Request & { user?: any }, res: Response, next: NextFunction) {
  if (!req.user || (!req.user.isAdmin && !req.user.isSuperAdmin && req.user.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase())) {
    return res.status(403).json({ error: 'Forbidden: Administrator privileges required.' });
  }
  next();
}

function superAdminOnly(req: Request & { user?: any }, res: Response, next: NextFunction) {
  if (!req.user || (!req.user.isSuperAdmin && req.user.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase())) {
    return res.status(403).json({ error: 'Forbidden: Super Administrator privileges required. You do not have owner authority.' });
  }
  next();
}

function optionalAuthMiddleware(req: Request & { user?: any; guestId?: string }, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const guestHeader = (req.headers['x-guest-id'] as string) || (req.query.guestId as string) || 'guest-session';
  req.guestId = guestHeader;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  const token = authHeader.split(' ')[1];
  const session = activeTokens.get(token);
  if (!session) {
    req.user = null;
    return next();
  }

  const user = db.users.find(u => u.id === session.userId);
  if (!user) {
    req.user = null;
    return next();
  }

  user.lastActive = new Date().toISOString();
  const isSuperAdmin = user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase() || user.role === 'super_admin';
  const isAdmin = isSuperAdmin || user.role === 'admin' || user.isAdmin === true;
  req.user = {
    ...user,
    isSuperAdmin,
    isAdmin,
    role: isSuperAdmin ? 'super_admin' : (user.role || (isAdmin ? 'admin' : 'user'))
  };

  next();
}

// Gemini Client
const geminiApiKey = process.env.GEMINI_API_KEY || '';
const ai = geminiApiKey ? new GoogleGenAI({ apiKey: geminiApiKey }) : null;

// ==========================================
// AUTHENTICATION & PROFILES
// ==========================================

// Register
app.post('/api/auth/register', (req: Request, res: Response) => {
  try {
    const { email, username, displayName, password } = req.body;

    if (!email || !username || !displayName || !password) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');

    if (password.length < 5) {
      return res.status(400).json({ error: 'Password must be at least 5 characters long.' });
    }

    if (cleanUsername.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters.' });
    }

    if (db.users.some(u => u.email.toLowerCase() === cleanEmail)) {
      return res.status(400).json({ error: 'An account with this email address already exists.' });
    }

    if (db.users.some(u => u.username.toLowerCase() === cleanUsername)) {
      return res.status(400).json({ error: 'This username is already taken. Please choose another.' });
    }

    // Only babatundeoyemade0@gmail.com is granted admin privileges!
    const isAdmin = cleanEmail === ADMIN_EMAIL.toLowerCase();
    const salt = generateSalt();
    const passwordHash = hashPassword(password, salt);

    const newUser = {
      id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      email: cleanEmail,
      username: isAdmin ? ADMIN_USERNAME : cleanUsername,
      displayName: displayName.trim(),
      bio: isAdmin ? 'Official Administrator and Moderator at West Nigeria Christian College' : 'WNCC Student & Scholar',
      avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName)}`,
      coverUrl: 'https://images.unsplash.com/photo-1519791883288-dc8bd696e667?w=1200&auto=format&fit=crop&q=80',
      passwordHash,
      salt,
      role: isAdmin ? ('admin' as const) : ('user' as const),
      isAdmin,
      createdAt: new Date().toISOString(),
      friends: [],
      followers: [],
      following: [],
      lastActive: new Date().toISOString()
    };

    db.users.push(newUser);
    saveDatabase();

    const token = generateToken(newUser);
    const { passwordHash: _, salt: __, ...userProfile } = newUser;

    return res.status(201).json({
      message: 'Account created successfully',
      token,
      user: userProfile
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// Login
app.post('/api/auth/login', (req: Request, res: Response) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ error: 'Email/Username and password are required.' });
    }

    const cleanIdentifier = identifier.trim().toLowerCase();
    const user = db.users.find(
      u => u.email.toLowerCase() === cleanIdentifier || u.username.toLowerCase() === cleanIdentifier
    );

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials. Please verify your email/username and password.' });
    }

    const testHash = hashPassword(password, user.salt);
    if (testHash !== user.passwordHash) {
      return res.status(401).json({ error: 'Invalid credentials. Please verify your password.' });
    }

    const isAdmin = user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
    user.isAdmin = isAdmin;
    user.role = isAdmin ? 'admin' : 'user';
    user.lastActive = new Date().toISOString();

    const token = generateToken(user);
    const { passwordHash: _, salt: __, ...userProfile } = user;

    return res.json({
      message: 'Login successful',
      token,
      user: userProfile
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// Current User Profile
app.get('/api/auth/me', authMiddleware, (req: Request & { user?: any }, res: Response) => {
  const { passwordHash, salt, ...userProfile } = req.user;
  res.json({ user: userProfile });
});

// Update Profile
app.put('/api/auth/profile', authMiddleware, (req: Request & { user?: any }, res: Response) => {
  try {
    const { displayName, username, bio, avatarUrl, coverUrl } = req.body;
    const user = db.users.find(u => u.id === req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (username && username.trim().toLowerCase() !== user.username.toLowerCase()) {
      const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
      if (cleanUsername.length < 3) {
        return res.status(400).json({ error: 'Username must be at least 3 characters' });
      }
      if (db.users.some(u => u.id !== user.id && u.username.toLowerCase() === cleanUsername)) {
        return res.status(400).json({ error: 'This username is already taken' });
      }
      user.username = cleanUsername;
    }

    if (displayName) user.displayName = displayName.trim();
    if (bio !== undefined) user.bio = bio.trim();
    if (avatarUrl) user.avatarUrl = avatarUrl;
    if (coverUrl) user.coverUrl = coverUrl;

    saveDatabase();

    const { passwordHash, salt, ...updatedProfile } = user;
    return res.json({ user: updatedProfile, message: 'Profile updated successfully' });
  } catch (err: any) {
    console.error('Update profile error:', err);
    return res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Heartbeat / Active status
app.post('/api/users/active', authMiddleware, (req: Request & { user?: any }, res: Response) => {
  const user = db.users.find(u => u.id === req.user.id);
  if (user) {
    user.lastActive = new Date().toISOString();
    saveDatabase();
  }
  return res.json({ success: true });
});

// ==========================================
// IMAGE UPLOAD (Gallery Picker)
// ==========================================
app.post('/api/upload', authMiddleware, (req: Request, res: Response) => {
  try {
    const { dataUrl } = req.body;

    if (!dataUrl || typeof dataUrl !== 'string') {
      return res.status(400).json({ error: 'No image data provided.' });
    }

    const matches = dataUrl.match(/^data:image\/(png|jpeg|jpg|webp);base64,(.+)$/i);
    if (!matches) {
      return res.status(400).json({ error: 'Invalid image format. Supported formats: JPG, JPEG, PNG, WEBP.' });
    }

    const ext = matches[1].toLowerCase() === 'jpeg' ? 'jpg' : matches[1].toLowerCase();
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    if (buffer.length > 15 * 1024 * 1024) {
      return res.status(400).json({ error: 'Image file size exceeds the 15MB limit.' });
    }

    const safeName = `img_${Date.now()}_${crypto.randomBytes(6).toString('hex')}.${ext}`;
    const filePath = path.join(UPLOADS_DIR, safeName);

    fs.writeFileSync(filePath, buffer);

    const publicUrl = `/uploads/${safeName}`;
    return res.json({
      url: publicUrl,
      message: 'Image uploaded successfully from device gallery.'
    });
  } catch (err: any) {
    console.error('Upload error:', err);
    return res.status(500).json({ error: 'Failed to process image upload.' });
  }
});

// Secure Multi-Attachment File Upload (Images, Audio, Video, PDFs, Word/Docs)
const BLOCKED_EXTENSIONS = new Set([
  'exe', 'bat', 'cmd', 'sh', 'vbs', 'msi', 'jar', 'scr', 'pif', 'apk', 'bin', 'com', 'php', 'pl', 'py', 'vbe', 'wsf', 'reg'
]);

app.post('/api/upload-file', authMiddleware, (req: Request, res: Response) => {
  try {
    const rawFiles = Array.isArray(req.body.files) ? req.body.files : (req.body.file ? [req.body.file] : []);

    if (rawFiles.length === 0) {
      return res.status(400).json({ error: 'No files provided for upload.' });
    }

    if (rawFiles.length > 10) {
      return res.status(400).json({ error: 'You can upload up to 10 files at a time.' });
    }

    const savedAttachments: MessageAttachment[] = [];

    for (const item of rawFiles) {
      const { name, size, mimeType, dataUrl } = item;
      if (!dataUrl || typeof dataUrl !== 'string') {
        continue;
      }

      // Check file size (25MB limit)
      if (size && size > 25 * 1024 * 1024) {
        return res.status(400).json({ error: `File "${name}" exceeds the 25MB maximum limit.` });
      }

      // Determine file extension
      const safeOriginalName = (name || 'attachment').replace(/[^a-zA-Z0-9._-]/g, '_');
      const parts = safeOriginalName.split('.');
      const ext = parts.length > 1 ? parts.pop()!.toLowerCase() : 'bin';

      // Enforce anti-malware extension blocklist
      if (BLOCKED_EXTENSIONS.has(ext)) {
        return res.status(400).json({
          error: `File type ".${ext}" is restricted for security reasons. Executable and script files cannot be uploaded.`
        });
      }

      // Parse base64
      const commaIdx = dataUrl.indexOf(',');
      const base64Data = commaIdx !== -1 ? dataUrl.substring(commaIdx + 1) : dataUrl;
      const buffer = Buffer.from(base64Data, 'base64');

      if (buffer.length > 25 * 1024 * 1024) {
        return res.status(400).json({ error: `File "${name}" exceeds the 25MB maximum limit.` });
      }

      // Categorize attachment type
      let category: MessageAttachment['type'] = 'file';
      const cleanMime = (mimeType || '').toLowerCase();
      if (cleanMime.startsWith('image/') || ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(ext)) {
        category = 'image';
      } else if (cleanMime.startsWith('video/') || ['mp4', 'webm', 'mov', 'mkv', 'avi'].includes(ext)) {
        category = 'video';
      } else if (cleanMime.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'weba'].includes(ext)) {
        category = 'audio';
      } else if (
        cleanMime.includes('pdf') ||
        cleanMime.includes('word') ||
        cleanMime.includes('officedocument') ||
        cleanMime.includes('document') ||
        cleanMime.includes('presentation') ||
        cleanMime.includes('spreadsheet') ||
        ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt', 'rtf', 'csv'].includes(ext)
      ) {
        category = 'document';
      }

      const generatedFileName = `file_${Date.now()}_${crypto.randomBytes(6).toString('hex')}.${ext}`;
      const destPath = path.join(UPLOADS_DIR, generatedFileName);
      fs.writeFileSync(destPath, buffer);

      const publicUrl = `/uploads/${generatedFileName}`;
      savedAttachments.push({
        id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: safeOriginalName,
        size: buffer.length,
        type: category,
        url: publicUrl,
        mimeType: cleanMime || 'application/octet-stream'
      });
    }

    return res.json({
      attachments: savedAttachments,
      message: `${savedAttachments.length} file(s) processed and ready.`
    });
  } catch (err: any) {
    console.error('File upload error:', err);
    return res.status(500).json({ error: 'Server error processing file upload.' });
  }
});

// ==========================================
// FACEBOOK-STYLE STORIES API
// ==========================================
app.get('/api/stories', (req: Request, res: Response) => {
  const now = new Date().getTime();
  // Active stories within 24h
  const activeStories = db.stories
    .filter(s => new Date(s.expiresAt).getTime() > now)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return res.json({ stories: activeStories });
});

app.post('/api/stories', authMiddleware, (req: Request & { user?: any }, res: Response) => {
  try {
    const { mediaUrl, caption } = req.body;
    if (!mediaUrl) return res.status(400).json({ error: 'Story image or media is required.' });

    const newStory = {
      id: `story-${Date.now()}`,
      authorId: req.user.id,
      authorName: req.user.displayName,
      authorAvatar: req.user.avatarUrl,
      mediaUrl,
      caption: (caption || '').trim(),
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 86400000).toISOString() // 24 hours
    };

    db.stories.unshift(newStory);
    saveDatabase();

    return res.status(201).json({ story: newStory, message: 'Story posted successfully' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to create story.' });
  }
});

app.delete('/api/stories/:id', authMiddleware, (req: Request & { user?: any }, res: Response) => {
  const index = db.stories.findIndex(s => s.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Story not found' });

  if (db.stories[index].authorId !== req.user.id && !req.user.isAdmin) {
    return res.status(403).json({ error: 'Unauthorized to delete this story' });
  }

  db.stories.splice(index, 1);
  saveDatabase();
  return res.json({ message: 'Story deleted' });
});

// ==========================================
// FACEBOOK-STYLE COMMUNITY POSTS & REACTIONS
// ==========================================
app.get('/api/community/posts', (req: Request, res: Response) => {
  const { groupId } = req.query;
  let posts = [...db.posts];

  if (groupId && typeof groupId === 'string') {
    posts = posts.filter(p => p.groupId === groupId);
  } else {
    // Main feed includes general posts and public group posts
    posts = posts.filter(p => !p.groupId || db.groups.find(g => g.id === p.groupId)?.privacy === 'public');
  }

  posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return res.json({ posts });
});

app.post('/api/community/posts', authMiddleware, (req: Request & { user?: any }, res: Response) => {
  try {
    const { content, imageUrl, feeling, groupId } = req.body;

    if (!content && !imageUrl) {
      return res.status(400).json({ error: 'Post must contain text or an image.' });
    }

    let groupName: string | undefined = undefined;
    if (groupId) {
      const g = db.groups.find(group => group.id === groupId);
      if (g) groupName = g.name;
    }

    const newPost = {
      id: `post-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      authorId: req.user.id,
      authorName: req.user.displayName,
      authorUsername: req.user.username,
      authorAvatar: req.user.avatarUrl,
      content: (content || '').trim(),
      imageUrl: imageUrl || undefined,
      feeling: (feeling || '').trim() || undefined,
      likes: [],
      reactions: [],
      comments: [],
      sharesCount: 0,
      groupId: groupId || undefined,
      groupName,
      savedBy: [],
      createdAt: new Date().toISOString()
    };

    db.posts.unshift(newPost);
    saveDatabase();

    return res.status(201).json({ post: newPost, message: 'Post published' });
  } catch (err: any) {
    console.error('Error creating post:', err);
    return res.status(500).json({ error: 'Failed to create post' });
  }
});

// Facebook-style Multi-Reactions (Like, Love, Amen, Insightful, Haha, Wow)
app.post('/api/community/posts/:id/react', authMiddleware, (req: Request & { user?: any }, res: Response) => {
  const post = db.posts.find(p => p.id === req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });

  const { type } = req.body as { type: ReactionType };
  const validTypes: ReactionType[] = ['like', 'love', 'amen', 'insightful', 'haha', 'wow'];
  const reactionType = validTypes.includes(type) ? type : 'like';

  if (!post.reactions) post.reactions = [];

  const existingIdx = post.reactions.findIndex(r => r.userId === req.user.id);

  if (existingIdx !== -1) {
    if (post.reactions[existingIdx].type === reactionType) {
      // Toggle off
      post.reactions.splice(existingIdx, 1);
    } else {
      // Update reaction
      post.reactions[existingIdx].type = reactionType;
    }
  } else {
    // Add reaction
    post.reactions.push({
      userId: req.user.id,
      userName: req.user.displayName,
      type: reactionType
    });

    // Notify author if not self
    if (post.authorId !== req.user.id) {
      const typeLabel = reactionType === 'amen' ? 'blessed with an Amen' : `reacted with ${reactionType}`;
      db.notifications.unshift({
        id: `notif-${Date.now()}`,
        userId: post.authorId,
        type: 'reaction',
        title: 'New Reaction',
        message: `${req.user.displayName} ${typeLabel} on your post.`,
        link: `/community#${post.id}`,
        read: false,
        createdAt: new Date().toISOString()
      });
    }
  }

  // Update legacy likes array for compatibility
  post.likes = post.reactions.map(r => r.userId);
  saveDatabase();

  return res.json({ reactions: post.reactions, likes: post.likes });
});

// Legacy like fallback
app.post('/api/community/posts/:id/like', authMiddleware, (req: Request & { user?: any }, res: Response) => {
  const post = db.posts.find(p => p.id === req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });

  if (!post.reactions) post.reactions = [];
  const existingIdx = post.reactions.findIndex(r => r.userId === req.user.id);

  if (existingIdx !== -1) {
    post.reactions.splice(existingIdx, 1);
  } else {
    post.reactions.push({
      userId: req.user.id,
      userName: req.user.displayName,
      type: 'like'
    });
  }

  post.likes = post.reactions.map(r => r.userId);
  saveDatabase();
  return res.json({ reactions: post.reactions, likes: post.likes, liked: existingIdx === -1 });
});

// Add comment
app.post('/api/community/posts/:id/comment', authMiddleware, (req: Request & { user?: any }, res: Response) => {
  const post = db.posts.find(p => p.id === req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });

  const { content } = req.body;
  if (!content || !content.trim()) return res.status(400).json({ error: 'Comment cannot be empty' });

  const newComment = {
    id: `comm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    authorId: req.user.id,
    authorName: req.user.displayName,
    authorUsername: req.user.username,
    authorAvatar: req.user.avatarUrl,
    content: content.trim(),
    createdAt: new Date().toISOString(),
    likes: [],
    replies: []
  };

  post.comments.push(newComment);

  if (post.authorId !== req.user.id) {
    db.notifications.unshift({
      id: `notif-${Date.now()}`,
      userId: post.authorId,
      type: 'comment',
      title: 'New Comment',
      message: `${req.user.displayName} commented on your post: "${content.trim().substring(0, 50)}..."`,
      link: `/community#${post.id}`,
      read: false,
      createdAt: new Date().toISOString()
    });
  }

  saveDatabase();
  return res.status(201).json({ comment: newComment });
});

// Add reply
app.post('/api/community/posts/:id/comments/:commentId/reply', authMiddleware, (req: Request & { user?: any }, res: Response) => {
  const post = db.posts.find(p => p.id === req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });

  const comment = post.comments.find(c => c.id === req.params.commentId);
  if (!comment) return res.status(404).json({ error: 'Comment not found' });

  const { content } = req.body;
  if (!content || !content.trim()) return res.status(400).json({ error: 'Reply cannot be empty' });

  if (!comment.replies) comment.replies = [];

  const newReply = {
    id: `rep-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    authorId: req.user.id,
    authorName: req.user.displayName,
    authorUsername: req.user.username,
    authorAvatar: req.user.avatarUrl,
    content: content.trim(),
    createdAt: new Date().toISOString()
  };

  comment.replies.push(newReply);

  if (comment.authorId !== req.user.id) {
    db.notifications.unshift({
      id: `notif-${Date.now()}`,
      userId: comment.authorId,
      type: 'reply',
      title: 'New Reply',
      message: `${req.user.displayName} replied to your comment: "${content.trim().substring(0, 50)}..."`,
      link: `/community#${post.id}`,
      read: false,
      createdAt: new Date().toISOString()
    });
  }

  saveDatabase();
  return res.status(201).json({ reply: newReply });
});

// Save / Bookmark post
app.post('/api/community/posts/:id/save', authMiddleware, (req: Request & { user?: any }, res: Response) => {
  const user = db.users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  if (!user.savedPostIds) user.savedPostIds = [];
  const postId = req.params.id;
  const idx = user.savedPostIds.indexOf(postId);

  if (idx === -1) {
    user.savedPostIds.push(postId);
  } else {
    user.savedPostIds.splice(idx, 1);
  }

  saveDatabase();
  return res.json({ saved: idx === -1, savedPostIds: user.savedPostIds });
});

// Share post
app.post('/api/community/posts/:id/share', authMiddleware, (req: Request & { user?: any }, res: Response) => {
  const post = db.posts.find(p => p.id === req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });

  post.sharesCount = (post.sharesCount || 0) + 1;
  saveDatabase();
  return res.json({ sharesCount: post.sharesCount });
});

// Delete post (Author, Super Admin, or Group Owner/Admin if in a group)
app.delete('/api/community/posts/:id', authMiddleware, (req: Request & { user?: any }, res: Response) => {
  const index = db.posts.findIndex(p => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Post not found' });

  const post = db.posts[index];
  const isAuthor = post.authorId === req.user.id;
  const isSuper = req.user.isSuperAdmin || req.user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  let isGroupMod = false;
  if (post.groupId) {
    const group = db.groups.find(g => g.id === post.groupId);
    if (group) {
      isGroupMod = group.ownerId === req.user.id || (group.adminIds && group.adminIds.includes(req.user.id));
    }
  }

  if (!isAuthor && !isSuper && !isGroupMod) {
    return res.status(403).json({ error: 'You are not authorized to delete this post.' });
  }

  db.posts.splice(index, 1);
  saveDatabase();

  if (isSuper && !isAuthor) {
    logAdminActivity(req.user, 'DELETE_POST', 'post', post.id, `Deleted post by ${post.authorName}`);
  }

  return res.json({ message: 'Post deleted successfully.' });
});

// ==========================================
// GROUPS SYSTEM API (Role-Based Hierarchy: Super Admin > Group Owner > Group Admin > Member)
// ==========================================
app.get('/api/groups', (req: Request, res: Response) => {
  const list = db.groups.map(g => ({
    ...g,
    ownerId: g.ownerId || (g.adminIds && g.adminIds[0]) || 'usr-admin-sasuke',
    isLocked: !!g.isLocked,
    memberCount: g.memberIds.length,
    recentPostCount: db.posts.filter(p => p.groupId === g.id).length
  }));
  return res.json({ groups: list });
});

app.get('/api/groups/:id', (req: Request, res: Response) => {
  const group = db.groups.find(g => g.id === req.params.id);
  if (!group) return res.status(404).json({ error: 'Group not found' });

  const ownerId = group.ownerId || (group.adminIds && group.adminIds[0]) || 'usr-admin-sasuke';
  const members = db.users
    .filter(u => group.memberIds.includes(u.id))
    .map(u => {
      let role: 'Owner' | 'Admin' | 'Member' = 'Member';
      if (u.id === ownerId) role = 'Owner';
      else if (group.adminIds && group.adminIds.includes(u.id)) role = 'Admin';

      return {
        id: u.id,
        displayName: u.displayName,
        username: u.username,
        avatarUrl: u.avatarUrl,
        email: u.email,
        role
      };
    });

  const groupPosts = db.posts.filter(p => p.groupId === group.id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return res.json({
    group: {
      ...group,
      ownerId,
      isLocked: !!group.isLocked,
      memberCount: group.memberIds.length
    },
    members,
    posts: groupPosts
  });
});

// Create Group (Creator automatically becomes Group Owner and Admin)
app.post('/api/groups', authMiddleware, (req: Request & { user?: any }, res: Response) => {
  try {
    const { name, description, category, coverUrl, avatarUrl, privacy } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Group name is required' });

    const newGroup = {
      id: `grp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      description: (description || '').trim(),
      category: (category || 'Academic').trim(),
      coverUrl: coverUrl || 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=1200&auto=format&fit=crop&q=80',
      avatarUrl: avatarUrl || 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=300&auto=format&fit=crop&q=80',
      privacy: privacy === 'private' ? ('private' as const) : ('public' as const),
      ownerId: req.user.id,
      adminIds: [req.user.id],
      memberIds: [req.user.id],
      isLocked: false,
      createdAt: new Date().toISOString()
    };

    db.groups.push(newGroup);
    saveDatabase();

    return res.status(201).json({ group: newGroup, message: 'Group created successfully. You are the Group Owner.' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to create group' });
  }
});

// Edit Group Info / Lock Group (Super Admin or Group Owner)
app.put('/api/groups/:id', authMiddleware, (req: Request & { user?: any }, res: Response) => {
  const group = db.groups.find(g => g.id === req.params.id);
  if (!group) return res.status(404).json({ error: 'Group not found' });

  const isSuper = req.user.isSuperAdmin || req.user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
  const isOwner = group.ownerId === req.user.id;

  if (!isSuper && !isOwner) {
    return res.status(403).json({ error: 'Only the Group Owner or Super Admin can edit group settings or lock status.' });
  }

  const { name, description, category, coverUrl, avatarUrl, privacy, isLocked } = req.body;

  if (name && name.trim()) group.name = name.trim();
  if (description !== undefined) group.description = description.trim();
  if (category) group.category = category.trim();
  if (coverUrl) group.coverUrl = coverUrl;
  if (avatarUrl) group.avatarUrl = avatarUrl;
  if (privacy === 'public' || privacy === 'private') group.privacy = privacy;
  if (isLocked !== undefined) group.isLocked = !!isLocked;

  saveDatabase();

  if (isSuper && !isOwner) {
    logAdminActivity(req.user, 'EDIT_GROUP', 'group', group.id, `Super Admin modified group "${group.name}" (locked: ${group.isLocked})`);
  }

  return res.json({ group, message: 'Group updated successfully.' });
});

// Add Group Admin (Super Admin or Group Owner)
app.post('/api/groups/:id/admins', authMiddleware, (req: Request & { user?: any }, res: Response) => {
  const group = db.groups.find(g => g.id === req.params.id);
  if (!group) return res.status(404).json({ error: 'Group not found' });

  const isSuper = req.user.isSuperAdmin || req.user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
  const isOwner = group.ownerId === req.user.id;

  if (!isSuper && !isOwner) {
    return res.status(403).json({ error: 'Only the Group Owner or Super Admin can assign group administrators.' });
  }

  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'User ID is required' });

  if (!group.memberIds.includes(userId)) {
    return res.status(400).json({ error: 'User must be a member of the group first.' });
  }

  if (!group.adminIds) group.adminIds = [];
  if (!group.adminIds.includes(userId)) {
    group.adminIds.push(userId);
    saveDatabase();
  }

  if (isSuper) {
    logAdminActivity(req.user, 'ADD_GROUP_ADMIN', 'group', group.id, `Promoted user ${userId} to Group Admin`);
  }

  return res.json({ success: true, adminIds: group.adminIds, message: 'Group admin promoted successfully.' });
});

// Demote Group Admin (Super Admin or Group Owner; cannot demote owner)
app.delete('/api/groups/:id/admins/:userId', authMiddleware, (req: Request & { user?: any }, res: Response) => {
  const group = db.groups.find(g => g.id === req.params.id);
  if (!group) return res.status(404).json({ error: 'Group not found' });

  const isSuper = req.user.isSuperAdmin || req.user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
  const isOwner = group.ownerId === req.user.id;
  const targetId = req.params.userId;

  if (!isSuper && !isOwner) {
    return res.status(403).json({ error: 'Only the Group Owner or Super Admin can remove group administrators.' });
  }

  if (targetId === group.ownerId) {
    return res.status(400).json({ error: 'Cannot remove administrator privileges from the Group Owner. Transfer ownership first.' });
  }

  group.adminIds = (group.adminIds || []).filter(id => id !== targetId);
  saveDatabase();

  if (isSuper) {
    logAdminActivity(req.user, 'REMOVE_GROUP_ADMIN', 'group', group.id, `Demoted group admin ${targetId}`);
  }

  return res.json({ success: true, adminIds: group.adminIds, message: 'Admin removed successfully.' });
});

// Transfer Group Ownership (Super Admin or Current Group Owner)
app.post('/api/groups/:id/transfer-ownership', authMiddleware, (req: Request & { user?: any }, res: Response) => {
  const group = db.groups.find(g => g.id === req.params.id);
  if (!group) return res.status(404).json({ error: 'Group not found' });

  const isSuper = req.user.isSuperAdmin || req.user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
  const isOwner = group.ownerId === req.user.id;

  if (!isSuper && !isOwner) {
    return res.status(403).json({ error: 'Only the Group Owner or Super Admin can transfer group ownership.' });
  }

  const { newOwnerId } = req.body;
  if (!newOwnerId) return res.status(400).json({ error: 'New owner user ID is required.' });

  const newOwner = db.users.find(u => u.id === newOwnerId);
  if (!newOwner) return res.status(404).json({ error: 'Target user not found.' });

  // Ensure new owner is in memberIds and adminIds
  if (!group.memberIds.includes(newOwnerId)) group.memberIds.push(newOwnerId);
  if (!group.adminIds) group.adminIds = [];
  if (!group.adminIds.includes(newOwnerId)) group.adminIds.push(newOwnerId);

  group.ownerId = newOwnerId;
  saveDatabase();

  logAdminActivity(req.user, 'TRANSFER_GROUP_OWNERSHIP', 'group', group.id, `Transferred group "${group.name}" ownership to ${newOwner.displayName}`);

  return res.json({ success: true, group, message: `Group ownership successfully transferred to ${newOwner.displayName}.` });
});

// Remove Member (Super Admin, Group Owner, or Group Admin. Group Admin cannot remove Owner or other Admins)
app.delete('/api/groups/:id/members/:userId', authMiddleware, (req: Request & { user?: any }, res: Response) => {
  const group = db.groups.find(g => g.id === req.params.id);
  if (!group) return res.status(404).json({ error: 'Group not found' });

  const targetId = req.params.userId;
  const isSuper = req.user.isSuperAdmin || req.user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
  const isOwner = group.ownerId === req.user.id;
  const isGroupAdmin = (group.adminIds || []).includes(req.user.id);

  if (!isSuper && !isOwner && !isGroupAdmin) {
    return res.status(403).json({ error: 'You do not have administrative authority to remove members.' });
  }

  // Enforce hierarchy: Group Admin CANNOT remove Owner or other Admins
  if (isGroupAdmin && !isOwner && !isSuper) {
    if (targetId === group.ownerId) {
      return res.status(403).json({ error: 'Group Admins cannot remove the Group Owner.' });
    }
    if ((group.adminIds || []).includes(targetId)) {
      return res.status(403).json({ error: 'Group Admins cannot remove fellow Group Admins.' });
    }
  }

  // Owner cannot be removed unless ownership was transferred
  if (targetId === group.ownerId && !isSuper) {
    return res.status(400).json({ error: 'Group Owner cannot be removed. Transfer ownership or delete the group.' });
  }

  group.memberIds = group.memberIds.filter(id => id !== targetId);
  group.adminIds = (group.adminIds || []).filter(id => id !== targetId);
  saveDatabase();

  return res.json({ success: true, memberCount: group.memberIds.length, message: 'Member removed from group.' });
});

// Delete Group (Super Admin or Group Owner)
app.delete('/api/groups/:id', authMiddleware, (req: Request & { user?: any }, res: Response) => {
  const groupIdx = db.groups.findIndex(g => g.id === req.params.id);
  if (groupIdx === -1) return res.status(404).json({ error: 'Group not found' });

  const group = db.groups[groupIdx];
  const isSuper = req.user.isSuperAdmin || req.user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
  const isOwner = group.ownerId === req.user.id;

  if (!isSuper && !isOwner) {
    return res.status(403).json({ error: 'Only the Group Owner or Super Admin can delete this group.' });
  }

  const groupName = group.name;
  db.groups.splice(groupIdx, 1);
  // Also clean up messages in group
  db.groupMessages = db.groupMessages.filter(m => m.groupId !== req.params.id);
  saveDatabase();

  logAdminActivity(req.user, 'DELETE_GROUP', 'group', req.params.id, `Deleted group "${groupName}"`);

  return res.json({ success: true, message: `Group "${groupName}" deleted successfully.` });
});

app.post('/api/groups/:id/join', authMiddleware, (req: Request & { user?: any }, res: Response) => {
  const group = db.groups.find(g => g.id === req.params.id);
  if (!group) return res.status(404).json({ error: 'Group not found' });

  if (!group.memberIds.includes(req.user.id)) {
    group.memberIds.push(req.user.id);
    saveDatabase();
  }

  return res.json({ success: true, memberCount: group.memberIds.length });
});

app.post('/api/groups/:id/leave', authMiddleware, (req: Request & { user?: any }, res: Response) => {
  const group = db.groups.find(g => g.id === req.params.id);
  if (!group) return res.status(404).json({ error: 'Group not found' });

  if (group.ownerId === req.user.id && group.memberIds.length > 1) {
    return res.status(400).json({ error: 'As Group Owner, please transfer ownership before leaving the group.' });
  }

  group.memberIds = group.memberIds.filter(id => id !== req.user.id);
  group.adminIds = (group.adminIds || []).filter(id => id !== req.user.id);
  saveDatabase();

  return res.json({ success: true, memberCount: group.memberIds.length });
});

// Group Chat Messages (with rich attachments, replyTo, lock-check, and delete)
app.get('/api/groups/:id/chat', authMiddleware, (req: Request & { user?: any }, res: Response) => {
  const messages = db.groupMessages
    .filter(m => m.groupId === req.params.id)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(a.createdAt).getTime());
  return res.json({ messages });
});

app.post('/api/groups/:id/chat', authMiddleware, (req: Request & { user?: any }, res: Response) => {
  const { content, attachments, replyTo } = req.body;
  const hasText = content && content.trim();
  const hasAttachments = Array.isArray(attachments) && attachments.length > 0;

  if (!hasText && !hasAttachments) {
    return res.status(400).json({ error: 'Message cannot be empty.' });
  }

  const group = db.groups.find(g => g.id === req.params.id);
  if (!group) return res.status(404).json({ error: 'Group not found' });

  // Enforce Group Lock
  const isSuper = req.user.isSuperAdmin || req.user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
  const isOwner = group.ownerId === req.user.id;
  const isGroupAdmin = (group.adminIds || []).includes(req.user.id);

  if (group.isLocked && !isSuper && !isOwner && !isGroupAdmin) {
    return res.status(403).json({ error: 'This group is locked by administration. Only group moderators can send messages.' });
  }

  const msg = {
    id: `gmsg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    groupId: group.id,
    senderId: req.user.id,
    senderName: req.user.displayName,
    senderAvatar: req.user.avatarUrl,
    content: (content || '').trim(),
    attachments: hasAttachments ? attachments : undefined,
    replyTo: replyTo && replyTo.id ? replyTo : undefined,
    createdAt: new Date().toISOString()
  };

  db.groupMessages.push(msg);
  saveDatabase();

  return res.status(201).json({ message: msg });
});

// Delete Group Chat Message (Sender, Group Admin, Group Owner, or Super Admin)
app.delete('/api/groups/:id/chat/:messageId', authMiddleware, (req: Request & { user?: any }, res: Response) => {
  const group = db.groups.find(g => g.id === req.params.id);
  if (!group) return res.status(404).json({ error: 'Group not found' });

  const msgIndex = db.groupMessages.findIndex(m => m.id === req.params.messageId && m.groupId === req.params.id);
  if (msgIndex === -1) return res.status(404).json({ error: 'Message not found' });

  const msg = db.groupMessages[msgIndex];
  const isSender = msg.senderId === req.user.id;
  const isSuper = req.user.isSuperAdmin || req.user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
  const isOwner = group.ownerId === req.user.id;
  const isGroupAdmin = (group.adminIds || []).includes(req.user.id);

  if (!isSender && !isSuper && !isOwner && !isGroupAdmin) {
    return res.status(403).json({ error: 'You do not have permission to delete this message.' });
  }

  db.groupMessages.splice(msgIndex, 1);
  saveDatabase();

  return res.json({ success: true, message: 'Message deleted' });
});

// ==========================================
// FRIENDS, FOLLOWERS, MEMORIES & SUGGESTED
// ==========================================
app.get('/api/friends/suggested', authMiddleware, (req: Request & { user?: any }, res: Response) => {
  const currentId = req.user.id;
  const currentUser = db.users.find(u => u.id === currentId);
  const friends = currentUser?.friends || [];

  const suggested = db.users
    .filter(u => u.id !== currentId && !friends.includes(u.id))
    .slice(0, 6)
    .map(u => ({
      id: u.id,
      displayName: u.displayName,
      username: u.username,
      avatarUrl: u.avatarUrl,
      bio: u.bio,
      mutualCount: (u.friends || []).filter(f => friends.includes(f)).length
    }));

  return res.json({ suggested });
});

app.post('/api/users/:id/follow', authMiddleware, (req: Request & { user?: any }, res: Response) => {
  const targetId = req.params.id;
  const currentId = req.user.id;

  const target = db.users.find(u => u.id === targetId);
  const me = db.users.find(u => u.id === currentId);

  if (!target || !me) return res.status(404).json({ error: 'User not found' });

  if (!me.following) me.following = [];
  if (!target.followers) target.followers = [];

  const idx = me.following.indexOf(targetId);
  let isFollowing = false;

  if (idx === -1) {
    me.following.push(targetId);
    target.followers.push(currentId);
    isFollowing = true;
  } else {
    me.following.splice(idx, 1);
    target.followers = target.followers.filter(id => id !== currentId);
  }

  saveDatabase();
  return res.json({ following: isFollowing, followersCount: target.followers.length });
});

// Memories / Throwbacks
app.get('/api/memories', authMiddleware, (req: Request & { user?: any }, res: Response) => {
  // Return user's earlier posts or community highlights
  const memories = db.posts
    .filter(p => p.authorId === req.user.id || p.authorId === 'usr-admin-sasuke')
    .slice(0, 4);

  return res.json({ memories });
});

// Profile & Public Users
app.get('/api/users/:id', optionalAuthMiddleware, (req: Request & { user?: any }, res: Response) => {
  const user = db.users.find(u => u.id === req.params.id || u.username.toLowerCase() === req.params.id.toLowerCase());
  if (!user) return res.status(404).json({ error: 'User not found' });

  const { passwordHash, salt, ...profile } = user;
  const userPosts = db.posts.filter(p => p.authorId === user.id);
  const friendsList = db.users
    .filter(u => (user.friends || []).includes(u.id))
    .map(u => ({ id: u.id, displayName: u.displayName, username: u.username, avatarUrl: u.avatarUrl }));

  // Check relationship if requesting user is authenticated
  let friendshipStatus: 'none' | 'friends' | 'pending_sent' | 'pending_received' = 'none';
  let pendingRequestId: string | null = null;

  if (req.user) {
    const currentId = req.user.id;
    if ((user.friends || []).includes(currentId)) {
      friendshipStatus = 'friends';
    } else {
      const pendingOut = db.friendRequests.find(r => r.fromUserId === currentId && r.toUserId === user.id && r.status === 'pending');
      if (pendingOut) {
        friendshipStatus = 'pending_sent';
        pendingRequestId = pendingOut.id;
      } else {
        const pendingIn = db.friendRequests.find(r => r.fromUserId === user.id && r.toUserId === currentId && r.status === 'pending');
        if (pendingIn) {
          friendshipStatus = 'pending_received';
          pendingRequestId = pendingIn.id;
        }
      }
    }
  }

  return res.json({
    user: {
      ...profile,
      followersCount: (user.followers || []).length,
      followingCount: (user.following || []).length,
      friendshipStatus,
      pendingRequestId
    },
    posts: userPosts,
    friends: friendsList
  });
});

app.post('/api/friends/request/:targetUserId', authMiddleware, (req: Request & { user?: any }, res: Response) => {
  const targetId = req.params.targetUserId;
  const currentId = req.user.id;

  if (targetId === currentId) return res.status(400).json({ error: 'Cannot add yourself' });

  const target = db.users.find(u => u.id === targetId);
  if (!target) return res.status(404).json({ error: 'User not found' });

  if (req.user.friends && req.user.friends.includes(targetId)) {
    return res.status(400).json({ error: 'Already friends' });
  }

  const existing = db.friendRequests.find(
    r => (r.fromUserId === currentId && r.toUserId === targetId && r.status === 'pending') ||
         (r.fromUserId === targetId && r.toUserId === currentId && r.status === 'pending')
  );

  if (existing) {
    return res.status(400).json({ error: 'Friend request already pending' });
  }

  const request = {
    id: `fr-${Date.now()}`,
    fromUserId: currentId,
    toUserId: targetId,
    status: 'pending' as const,
    createdAt: new Date().toISOString()
  };

  db.friendRequests.push(request);

  db.notifications.unshift({
    id: `notif-${Date.now()}`,
    userId: targetId,
    type: 'friend_request',
    title: 'New Friend Request',
    message: `${req.user.displayName} sent you a friend request.`,
    link: `/profile/${req.user.id}`,
    read: false,
    createdAt: new Date().toISOString(),
    data: { requestId: request.id }
  });

  saveDatabase();
  return res.status(201).json({ message: 'Friend request sent', request });
});

app.get('/api/friends/requests', authMiddleware, (req: Request & { user?: any }, res: Response) => {
  const incoming = db.friendRequests
    .filter(r => r.toUserId === req.user.id && r.status === 'pending')
    .map(r => {
      const fromUser = db.users.find(u => u.id === r.fromUserId);
      return {
        ...r,
        fromUser: fromUser ? {
          id: fromUser.id,
          displayName: fromUser.displayName,
          username: fromUser.username,
          avatarUrl: fromUser.avatarUrl
        } : null
      };
    })
    .filter(r => r.fromUser !== null);

  return res.json({ requests: incoming });
});

app.post('/api/friends/respond/:requestId', authMiddleware, (req: Request & { user?: any }, res: Response) => {
  const { action } = req.body;
  const request = db.friendRequests.find(r => r.id === req.params.requestId && r.toUserId === req.user.id);
  if (!request) return res.status(404).json({ error: 'Friend request not found.' });

  if (action === 'accept') {
    request.status = 'accepted';
    const currentUser = db.users.find(u => u.id === req.user.id);
    const senderUser = db.users.find(u => u.id === request.fromUserId);

    if (currentUser && senderUser) {
      if (!currentUser.friends) currentUser.friends = [];
      if (!senderUser.friends) senderUser.friends = [];

      if (!currentUser.friends.includes(senderUser.id)) currentUser.friends.push(senderUser.id);
      if (!senderUser.friends.includes(currentUser.id)) senderUser.friends.push(currentUser.id);

      db.notifications.unshift({
        id: `notif-${Date.now()}`,
        userId: senderUser.id,
        type: 'friend_accepted',
        title: 'Friend Request Accepted',
        message: `${currentUser.displayName} accepted your friend request!`,
        link: `/profile/${currentUser.id}`,
        read: false,
        createdAt: new Date().toISOString()
      });
    }
  } else {
    request.status = 'declined';
  }

  saveDatabase();
  return res.json({ message: `Friend request ${action}ed successfully.` });
});

// Direct Messaging
app.get('/api/messages/:otherUserId', authMiddleware, (req: Request & { user?: any }, res: Response) => {
  const currentId = req.user.id;
  const otherId = req.params.otherUserId;

  const thread = db.directMessages
    .filter(m => (m.senderId === currentId && m.receiverId === otherId) || (m.senderId === otherId && m.receiverId === currentId))
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  thread.forEach(m => {
    if (m.receiverId === currentId && !m.read) m.read = true;
  });
  saveDatabase();

  return res.json({ messages: thread });
});

app.post('/api/messages/:otherUserId', authMiddleware, (req: Request & { user?: any }, res: Response) => {
  const { content, attachments, replyTo } = req.body;
  const hasText = content && content.trim();
  const hasAttachments = Array.isArray(attachments) && attachments.length > 0;

  if (!hasText && !hasAttachments) {
    return res.status(400).json({ error: 'Message cannot be empty.' });
  }

  const currentId = req.user.id;
  const otherId = req.params.otherUserId;

  const target = db.users.find(u => u.id === otherId);
  if (!target) return res.status(404).json({ error: 'Recipient user not found.' });

  const msg = {
    id: `dm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    senderId: currentId,
    receiverId: otherId,
    content: (content || '').trim(),
    attachments: hasAttachments ? attachments : undefined,
    replyTo: replyTo && replyTo.id ? replyTo : undefined,
    createdAt: new Date().toISOString(),
    read: false
  };

  db.directMessages.push(msg);

  // Send notification to recipient
  db.notifications.unshift({
    id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    userId: otherId,
    type: 'comment',
    title: `New message from ${req.user.displayName}`,
    message: hasText ? content.trim().substring(0, 80) : `Sent ${attachments.length} attachment(s)`,
    link: `/messages/${currentId}`,
    read: false,
    createdAt: new Date().toISOString()
  });

  saveDatabase();

  return res.status(201).json({ message: msg });
});

// Delete Direct Message (Sender or Super Admin)
app.delete('/api/messages/:id', authMiddleware, (req: Request & { user?: any }, res: Response) => {
  const msgIdx = db.directMessages.findIndex(m => m.id === req.params.id);
  if (msgIdx === -1) return res.status(404).json({ error: 'Message not found' });

  const msg = db.directMessages[msgIdx];
  const isSender = msg.senderId === req.user.id;
  const isSuper = req.user.isSuperAdmin || req.user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  if (!isSender && !isSuper) {
    return res.status(403).json({ error: 'You do not have permission to delete this message.' });
  }

  db.directMessages.splice(msgIdx, 1);
  saveDatabase();

  return res.json({ success: true, message: 'Message deleted' });
});

app.get('/api/messages-threads', authMiddleware, (req: Request & { user?: any }, res: Response) => {
  const currentId = req.user.id;
  const userMap = new Map<string, any>();

  db.directMessages.forEach(m => {
    if (m.senderId === currentId || m.receiverId === currentId) {
      const partnerId = m.senderId === currentId ? m.receiverId : m.senderId;
      const partner = db.users.find(u => u.id === partnerId);
      if (partner) {
        const existing = userMap.get(partnerId);
        if (!existing || new Date(m.createdAt) > new Date(existing.lastMessage.createdAt)) {
          userMap.set(partnerId, {
            user: {
              id: partner.id,
              displayName: partner.displayName,
              username: partner.username,
              avatarUrl: partner.avatarUrl,
              lastActive: partner.lastActive
            },
            lastMessage: m,
            unreadCount: (m.receiverId === currentId && !m.read) ? 1 : 0
          });
        }
      }
    }
  });

  return res.json({ threads: Array.from(userMap.values()) });
});

// Notifications
app.get('/api/notifications', authMiddleware, (req: Request & { user?: any }, res: Response) => {
  const list = db.notifications
    .filter(n => n.userId === req.user.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return res.json({ notifications: list });
});

app.post('/api/notifications/:id/read', authMiddleware, (req: Request & { user?: any }, res: Response) => {
  const notif = db.notifications.find(n => n.id === req.params.id && n.userId === req.user.id);
  if (notif) {
    notif.read = true;
    saveDatabase();
  }
  return res.json({ success: true });
});

app.post('/api/notifications/read-all', authMiddleware, (req: Request & { user?: any }, res: Response) => {
  db.notifications.forEach(n => {
    if (n.userId === req.user.id) n.read = true;
  });
  saveDatabase();
  return res.json({ success: true });
});

// ==========================================
// KNOWLEDGE SYSTEM & TOPICS
// ==========================================
app.get('/api/topics', (req: Request, res: Response) => {
  const { category, search } = req.query;
  let results = [...db.topics];

  if (category && typeof category === 'string' && category !== 'All') {
    results = results.filter(t => t.category.toLowerCase() === category.toLowerCase());
  }

  if (search && typeof search === 'string' && search.trim()) {
    const q = search.toLowerCase().trim();
    results = results.filter(t =>
      t.title.toLowerCase().includes(q) ||
      t.subject.toLowerCase().includes(q) ||
      t.explanation.toLowerCase().includes(q) ||
      t.keywords.some(k => k.toLowerCase().includes(q)) ||
      t.bibleReferences.some(r => r.toLowerCase().includes(q)) ||
      t.searchTerms.some(s => s.toLowerCase().includes(q))
    );
  }

  return res.json({ topics: results, total: results.length });
});

app.get('/api/topics/:id', (req: Request, res: Response) => {
  const topic = db.topics.find(t => t.id === req.params.id);
  if (!topic) return res.status(404).json({ error: 'Topic not found' });
  return res.json({ topic });
});

app.get('/api/categories', (req: Request, res: Response) => {
  return res.json({ categories: db.categories });
});

app.get('/api/announcements', (req: Request, res: Response) => {
  return res.json({ announcements: db.announcements });
});

// Admin Topics CRUD
app.post('/api/admin/topics', authMiddleware, adminOnly, (req: Request & { user?: any }, res: Response) => {
  try {
    const { title, subject, category, explanation, keywords, bibleReferences, notes, studyMaterial, searchTerms } = req.body;

    if (!title || !subject || !category || !explanation) {
      return res.status(400).json({ error: 'Title, subject, category, and explanation are required.' });
    }

    const newTopic = {
      id: `topic-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: title.trim(),
      subject: subject.trim(),
      category: category.trim(),
      explanation: explanation.trim(),
      keywords: Array.isArray(keywords) ? keywords : (keywords || '').split(',').map((s: string) => s.trim()).filter(Boolean),
      bibleReferences: Array.isArray(bibleReferences) ? bibleReferences : (bibleReferences || '').split(',').map((s: string) => s.trim()).filter(Boolean),
      notes: (notes || '').trim(),
      studyMaterial: (studyMaterial || '').trim(),
      searchTerms: Array.isArray(searchTerms) ? searchTerms : (searchTerms || '').split(',').map((s: string) => s.trim()).filter(Boolean),
      authorId: req.user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.topics.unshift(newTopic);
    saveDatabase();

    return res.status(201).json({ topic: newTopic, message: 'WNCC Knowledge topic added successfully.' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to add topic.' });
  }
});

app.put('/api/admin/topics/:id', authMiddleware, adminOnly, (req: Request, res: Response) => {
  const topic = db.topics.find(t => t.id === req.params.id);
  if (!topic) return res.status(404).json({ error: 'Topic not found' });

  const { title, subject, category, explanation, keywords, bibleReferences, notes, studyMaterial, searchTerms } = req.body;

  if (title) topic.title = title.trim();
  if (subject) topic.subject = subject.trim();
  if (category) topic.category = category.trim();
  if (explanation) topic.explanation = explanation.trim();
  if (keywords !== undefined) {
    topic.keywords = Array.isArray(keywords) ? keywords : keywords.split(',').map((s: string) => s.trim()).filter(Boolean);
  }
  if (bibleReferences !== undefined) {
    topic.bibleReferences = Array.isArray(bibleReferences) ? bibleReferences : bibleReferences.split(',').map((s: string) => s.trim()).filter(Boolean);
  }
  if (notes !== undefined) topic.notes = notes.trim();
  if (studyMaterial !== undefined) topic.studyMaterial = studyMaterial.trim();
  if (searchTerms !== undefined) {
    topic.searchTerms = Array.isArray(searchTerms) ? searchTerms : searchTerms.split(',').map((s: string) => s.trim()).filter(Boolean);
  }
  topic.updatedAt = new Date().toISOString();

  saveDatabase();
  return res.json({ topic, message: 'Topic updated successfully.' });
});

app.delete('/api/admin/topics/:id', authMiddleware, adminOnly, (req: Request, res: Response) => {
  const index = db.topics.findIndex(t => t.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Topic not found' });

  db.topics.splice(index, 1);
  saveDatabase();
  return res.json({ message: 'Topic deleted successfully.' });
});

app.post('/api/admin/categories', authMiddleware, adminOnly, (req: Request, res: Response) => {
  const { name } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Category name is required' });

  const cleanName = name.trim();
  if (!db.categories.includes(cleanName)) {
    db.categories.push(cleanName);
    saveDatabase();
  }
  return res.status(201).json({ categories: db.categories });
});

app.delete('/api/admin/categories/:name', authMiddleware, adminOnly, (req: Request, res: Response) => {
  const index = db.categories.indexOf(decodeURIComponent(req.params.name));
  if (index !== -1) {
    db.categories.splice(index, 1);
    saveDatabase();
  }
  return res.json({ categories: db.categories });
});

app.post('/api/admin/announcements', authMiddleware, adminOnly, (req: Request & { user?: any }, res: Response) => {
  const { title, content, important } = req.body;
  if (!title || !content) return res.status(400).json({ error: 'Title and content required' });

  const newAnn = {
    id: `ann-${Date.now()}`,
    title: title.trim(),
    content: content.trim(),
    authorName: req.user.displayName || 'WNCC Admin',
    createdAt: new Date().toISOString(),
    important: !!important
  };

  db.announcements.unshift(newAnn);

  db.users.forEach(u => {
    db.notifications.unshift({
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId: u.id,
      type: 'announcement',
      title: `College Announcement: ${title.trim()}`,
      message: content.trim().substring(0, 100) + '...',
      read: false,
      createdAt: new Date().toISOString()
    });
  });

  saveDatabase();
  return res.status(201).json({ announcement: newAnn });
});

app.delete('/api/admin/announcements/:id', authMiddleware, adminOnly, (req: Request, res: Response) => {
  const index = db.announcements.findIndex(a => a.id === req.params.id);
  if (index !== -1) {
    db.announcements.splice(index, 1);
    saveDatabase();
  }
  return res.json({ message: 'Announcement deleted' });
});

app.get('/api/admin/settings', authMiddleware, adminOnly, (req: Request, res: Response) => {
  return res.json({ settings: db.systemSettings });
});

app.post('/api/admin/settings', authMiddleware, adminOnly, (req: Request, res: Response) => {
  const { customAiInstructions } = req.body;
  if (customAiInstructions !== undefined) {
    db.systemSettings.customAiInstructions = customAiInstructions.trim();
  }
  saveDatabase();
  return res.json({ settings: db.systemSettings, message: 'Settings saved' });
});

app.get('/api/admin/stats', authMiddleware, adminOnly, (req: Request, res: Response) => {
  const totalQuestions = db.conversations.reduce((acc, c) => acc + c.messages.filter(m => m.role === 'user').length, 0);

  return res.json({
    stats: {
      totalUsers: db.users.length,
      totalTopics: db.topics.length,
      totalPosts: db.posts.length,
      totalGroups: db.groups.length,
      totalConversations: db.conversations.length,
      totalQuestions,
      categoriesCount: db.categories.length,
      totalReports: (db.reports || []).length,
      totalAppeals: (db.appeals || []).length
    }
  });
});

// ==========================================
// PLATFORM BRANDING & RULES (Super Admin)
// ==========================================
app.get('/api/branding', (_req: Request, res: Response) => {
  return res.json({ branding: db.branding });
});

app.get('/api/rules', (_req: Request, res: Response) => {
  return res.json({ rules: db.branding.rules || [] });
});

app.put('/api/admin/branding', authMiddleware, superAdminOnly, (req: Request & { user?: any }, res: Response) => {
  const { siteName, logoUrl, tagline, primaryColor, announcementBanner, rules } = req.body;

  if (siteName && siteName.trim()) db.branding.siteName = siteName.trim();
  if (logoUrl !== undefined) db.branding.logoUrl = logoUrl.trim();
  if (tagline !== undefined) db.branding.tagline = tagline.trim();
  if (primaryColor) db.branding.primaryColor = primaryColor.trim();
  if (announcementBanner !== undefined) db.branding.announcementBanner = announcementBanner.trim();
  if (Array.isArray(rules)) {
    db.branding.rules = rules.map((r: string) => r.trim()).filter(Boolean);
  }

  saveDatabase();
  logAdminActivity(req.user, 'UPDATE_BRANDING', 'system', 'branding', 'Updated platform name, branding, and community guidelines');

  return res.json({ branding: db.branding, message: 'Platform branding and rules updated successfully.' });
});

// ==========================================
// USER MANAGEMENT & MODERATION (Super Admin)
// ==========================================
app.get('/api/admin/users', authMiddleware, superAdminOnly, (_req: Request, res: Response) => {
  const safeUsers = db.users.map(u => ({
    id: u.id,
    email: u.email,
    username: u.username,
    displayName: u.displayName,
    bio: u.bio,
    avatarUrl: u.avatarUrl,
    role: u.role || (u.isAdmin ? 'admin' : 'user'),
    isAdmin: !!u.isAdmin,
    isSuperAdmin: !!u.isSuperAdmin || u.email.toLowerCase() === ADMIN_EMAIL.toLowerCase(),
    isBanned: !!u.isBanned,
    banReason: u.banReason,
    createdAt: u.createdAt,
    lastActive: u.lastActive,
    postsCount: db.posts.filter(p => p.authorId === u.id).length
  }));

  return res.json({ users: safeUsers });
});

app.post('/api/admin/users/:id/ban', authMiddleware, superAdminOnly, (req: Request & { user?: any }, res: Response) => {
  const target = db.users.find(u => u.id === req.params.id);
  if (!target) return res.status(404).json({ error: 'User not found' });

  if (target.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
    return res.status(400).json({ error: 'The primary Super Admin cannot be suspended.' });
  }

  const { ban, reason } = req.body;
  target.isBanned = !!ban;
  target.banReason = ban ? (reason || 'Violation of college community standards and behavioral guidelines.').trim() : undefined;

  saveDatabase();

  const action = ban ? 'BAN_USER' : 'UNBAN_USER';
  logAdminActivity(req.user, action, 'user', target.id, `${ban ? 'Suspended' : 'Reactivated'} account for ${target.displayName} (${target.email})`);

  return res.json({
    success: true,
    user: { id: target.id, isBanned: target.isBanned, banReason: target.banReason },
    message: ban ? `User ${target.displayName} has been suspended.` : `User ${target.displayName} has been reactivated.`
  });
});

app.delete('/api/admin/users/:id', authMiddleware, superAdminOnly, (req: Request & { user?: any }, res: Response) => {
  const index = db.users.findIndex(u => u.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'User not found' });

  const target = db.users[index];
  if (target.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
    return res.status(400).json({ error: 'The primary Super Admin account cannot be deleted.' });
  }

  db.users.splice(index, 1);
  saveDatabase();

  logAdminActivity(req.user, 'DELETE_USER', 'user', req.params.id, `Permanently deleted account for ${target.displayName} (${target.email})`);

  return res.json({ success: true, message: `Account for ${target.displayName} has been permanently deleted.` });
});

app.put('/api/admin/users/:id/role', authMiddleware, superAdminOnly, (req: Request & { user?: any }, res: Response) => {
  const target = db.users.find(u => u.id === req.params.id);
  if (!target) return res.status(404).json({ error: 'User not found' });

  if (target.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
    return res.status(400).json({ error: 'Primary Super Admin role cannot be modified.' });
  }

  const { role } = req.body;
  if (!['user', 'admin', 'super_admin'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role specified.' });
  }

  target.role = role;
  target.isAdmin = role === 'admin' || role === 'super_admin';
  target.isSuperAdmin = role === 'super_admin';

  saveDatabase();

  logAdminActivity(req.user, 'CHANGE_USER_ROLE', 'user', target.id, `Changed role of ${target.displayName} to "${role}"`);

  return res.json({ success: true, user: { id: target.id, role: target.role, isAdmin: target.isAdmin, isSuperAdmin: target.isSuperAdmin }, message: `User role changed to ${role}.` });
});

// ==========================================
// REPORTS & CONTENT MODERATION
// ==========================================
// Any authenticated user can file a report
app.post('/api/reports', authMiddleware, (req: Request & { user?: any }, res: Response) => {
  const { targetType, targetId, targetSummary, reason, details } = req.body;

  if (!targetType || !targetId || !reason) {
    return res.status(400).json({ error: 'Target type, ID, and reason are required.' });
  }

  const newReport = {
    id: `rep-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    reporterId: req.user.id,
    reporterName: req.user.displayName,
    targetType,
    targetId,
    targetSummary: (targetSummary || '').trim(),
    reason: reason.trim(),
    details: (details || '').trim(),
    status: 'pending' as const,
    createdAt: new Date().toISOString()
  };

  if (!db.reports) db.reports = [];
  db.reports.unshift(newReport);
  saveDatabase();

  return res.status(201).json({ report: newReport, message: 'Report submitted for administration review. Thank you for keeping our college community safe.' });
});

// Super Admin view and manage reports
app.get('/api/admin/reports', authMiddleware, superAdminOnly, (_req: Request, res: Response) => {
  return res.json({ reports: db.reports || [] });
});

app.post('/api/admin/reports/:id/resolve', authMiddleware, superAdminOnly, (req: Request & { user?: any }, res: Response) => {
  const report = (db.reports || []).find(r => r.id === req.params.id);
  if (!report) return res.status(404).json({ error: 'Report not found' });

  const { status, actionTaken } = req.body;
  if (!['resolved', 'dismissed'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  report.status = status;
  report.actionTaken = (actionTaken || '').trim();
  report.resolvedAt = new Date().toISOString();
  report.resolvedBy = req.user.displayName;

  saveDatabase();

  logAdminActivity(req.user, 'RESOLVE_REPORT', 'report', report.id, `Marked report as ${status}: ${actionTaken || 'No action notes'}`);

  return res.json({ report, message: `Report marked as ${status}.` });
});

// ==========================================
// APPEALS SYSTEM (Banned/Flagged Users)
// ==========================================
// Public submission so suspended users can file appeals
app.post('/api/appeals', (req: Request, res: Response) => {
  const { userName, userEmail, reason, details, userId } = req.body;

  if (!userName || !userEmail || !reason || !details) {
    return res.status(400).json({ error: 'Name, email, reason, and explanation details are required.' });
  }

  const appeal = {
    id: `app-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    userId,
    userName: userName.trim(),
    userEmail: userEmail.trim().toLowerCase(),
    reason: reason.trim(),
    details: details.trim(),
    status: 'pending' as const,
    createdAt: new Date().toISOString()
  };

  if (!db.appeals) db.appeals = [];
  db.appeals.unshift(appeal);
  saveDatabase();

  return res.status(201).json({ appeal, message: 'Your appeal has been received. College administrators will review it promptly.' });
});

app.get('/api/admin/appeals', authMiddleware, superAdminOnly, (_req: Request, res: Response) => {
  return res.json({ appeals: db.appeals || [] });
});

app.post('/api/admin/appeals/:id/review', authMiddleware, superAdminOnly, (req: Request & { user?: any }, res: Response) => {
  const appeal = (db.appeals || []).find(a => a.id === req.params.id);
  if (!appeal) return res.status(404).json({ error: 'Appeal not found' });

  const { status } = req.body;
  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Status must be approved or rejected.' });
  }

  appeal.status = status;
  appeal.reviewedAt = new Date().toISOString();
  appeal.reviewedBy = req.user.displayName;

  // If approved, automatically lift suspension on matching user
  if (status === 'approved') {
    const targetUser = db.users.find(u => (appeal.userId && u.id === appeal.userId) || u.email.toLowerCase() === appeal.userEmail.toLowerCase());
    if (targetUser) {
      targetUser.isBanned = false;
      targetUser.banReason = undefined;
    }
  }

  saveDatabase();

  logAdminActivity(req.user, 'REVIEW_APPEAL', 'appeal', appeal.id, `${status.toUpperCase()} appeal from ${appeal.userName} (${appeal.userEmail})`);

  return res.json({ appeal, message: `Appeal ${status}.` });
});

// ==========================================
// ADMIN AUDIT LOGS
// ==========================================
app.get('/api/admin/logs', authMiddleware, superAdminOnly, (_req: Request, res: Response) => {
  return res.json({ logs: db.adminLogs || [] });
});

// ==========================================
// AI CHAT & KNOWLEDGE GROUNDING (ChatGPT-Style)
// ==========================================
function retrieveRelevantKnowledge(query: string, maxTopics = 4) {
  const q = query.toLowerCase();
  const scored = db.topics.map(topic => {
    let score = 0;
    if (q.includes(topic.title.toLowerCase())) score += 10;
    if (q.includes(topic.subject.toLowerCase())) score += 6;
    if (q.includes(topic.category.toLowerCase())) score += 4;
    topic.keywords.forEach(k => {
      if (q.includes(k.toLowerCase())) score += 5;
    });
    topic.searchTerms.forEach(st => {
      if (q.includes(st.toLowerCase())) score += 4;
    });
    topic.bibleReferences.forEach(br => {
      if (q.includes(br.toLowerCase())) score += 6;
    });
    return { topic, score };
  });

  return scored
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxTopics)
    .map(item => item.topic);
}

function prepareGeminiContents(messages: Array<{ role: 'user' | 'assistant'; content: string; imageUrl?: string }>): any[] {
  const validMessages = messages.filter(m => (m.content && m.content.trim()) || m.imageUrl);
  if (validMessages.length === 0) {
    return [{ role: 'user', parts: [{ text: 'Hello' }] }];
  }

  // Multi-turn in Gemini MUST start with a 'user' turn
  const firstUserIdx = validMessages.findIndex(m => m.role === 'user');
  const trimmed = firstUserIdx >= 0 ? validMessages.slice(firstUserIdx) : validMessages;

  const contents: any[] = [];
  for (const m of trimmed) {
    const role = m.role === 'assistant' ? 'model' : 'user';
    const parts: any[] = [];

    if (m.imageUrl && m.imageUrl.startsWith('data:image/')) {
      const match = m.imageUrl.match(/^data:(image\/[a-zA-Z]+);base64,(.+)$/);
      if (match) {
        parts.push({
          inlineData: {
            mimeType: match[1],
            data: match[2]
          }
        });
      }
    }

    if (m.content && m.content.trim()) {
      parts.push({ text: m.content.trim() });
    } else if (parts.length === 0) {
      parts.push({ text: 'Please analyze this input.' });
    }

    // Merge consecutive turns of the same role (Gemini requires strictly alternating roles)
    if (contents.length > 0 && contents[contents.length - 1].role === role) {
      contents[contents.length - 1].parts.push(...parts);
    } else {
      contents.push({ role, parts });
    }
  }

  // Ensure first is user
  if (contents.length > 0 && contents[0].role !== 'user') {
    contents.shift();
  }

  return contents.length > 0 ? contents : [{ role: 'user', parts: [{ text: 'Hello' }] }];
}

// Conversations Management (Authenticated and Guest)
app.get('/api/conversations', optionalAuthMiddleware, (req: Request & { user?: any; guestId?: string }, res: Response) => {
  const ownerId = req.user ? req.user.id : (req.guestId || 'guest-session');
  const list = db.conversations
    .filter(c => c.userId === ownerId || (!req.user && c.userId.startsWith('guest-')))
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  return res.json({ conversations: list });
});

app.get('/api/conversations/:id', optionalAuthMiddleware, (req: Request & { user?: any; guestId?: string }, res: Response) => {
  const ownerId = req.user ? req.user.id : (req.guestId || 'guest-session');
  const convo = db.conversations.find(c => c.id === req.params.id && (c.userId === ownerId || !req.user || c.userId.startsWith('guest-')));
  if (!convo) return res.status(404).json({ error: 'Conversation not found' });
  return res.json({ conversation: convo });
});

app.post('/api/conversations', optionalAuthMiddleware, (req: Request & { user?: any; guestId?: string }, res: Response) => {
  const ownerId = req.user ? req.user.id : (req.guestId || `guest-${Date.now()}`);
  const { title } = req.body;
  const newConvo = {
    id: `conv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    userId: ownerId,
    title: (title || 'New Chat').trim(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messages: []
  };

  db.conversations.unshift(newConvo);
  saveDatabase();
  return res.status(201).json({ conversation: newConvo });
});

app.put('/api/conversations/:id', optionalAuthMiddleware, (req: Request & { user?: any; guestId?: string }, res: Response) => {
  const ownerId = req.user ? req.user.id : (req.guestId || 'guest-session');
  const convo = db.conversations.find(c => c.id === req.params.id && (c.userId === ownerId || !req.user));
  if (!convo) return res.status(404).json({ error: 'Conversation not found' });

  if (req.body.title) convo.title = req.body.title.trim();
  convo.updatedAt = new Date().toISOString();
  saveDatabase();
  return res.json({ conversation: convo });
});

app.delete('/api/conversations/:id', optionalAuthMiddleware, (req: Request & { user?: any; guestId?: string }, res: Response) => {
  const ownerId = req.user ? req.user.id : (req.guestId || 'guest-session');
  const index = db.conversations.findIndex(c => c.id === req.params.id && (c.userId === ownerId || !req.user));
  if (index === -1) return res.status(404).json({ error: 'Conversation not found' });

  db.conversations.splice(index, 1);
  saveDatabase();
  return res.json({ message: 'Conversation deleted' });
});

// Chat Message with Multi-turn history, image input, and general AI capabilities
app.post('/api/conversations/:id/messages', optionalAuthMiddleware, async (req: Request & { user?: any; guestId?: string }, res: Response) => {
  try {
    const ownerId = req.user ? req.user.id : (req.guestId || 'guest-session');
    let convo = db.conversations.find(c => c.id === req.params.id);
    if (!convo) {
      convo = {
        id: req.params.id,
        userId: ownerId,
        title: 'New Chat',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: []
      };
      db.conversations.unshift(convo);
    }

    const { content, promptMode, imageUrl } = req.body;
    if ((!content || !content.trim()) && !imageUrl) {
      return res.status(400).json({ error: 'Message cannot be empty.' });
    }

    const userMessage = {
      id: `msg-${Date.now()}-u`,
      role: 'user' as const,
      content: (content || '').trim(),
      imageUrl: imageUrl || undefined,
      timestamp: new Date().toISOString()
    };

    convo.messages.push(userMessage);

    if (convo.messages.filter(m => m.role === 'user').length === 1) {
      convo.title = (content || 'Analysis Inquiry').trim().substring(0, 36) + ((content?.length || 0) > 36 ? '...' : '');
    }

    // Retrieve matching WNCC knowledge repository materials if query involves theology/academics
    const relevantTopics = retrieveRelevantKnowledge(content || '');
    let knowledgeContextText = '';
    if (relevantTopics.length > 0) {
      knowledgeContextText = `\n\n--- OFFICIAL WNCC ACADEMIC KNOWLEDGE SYSTEM CONTEXT ---\nThe user's query relates to verified WNCC course curriculum materials:\n` +
        relevantTopics.map(t => `Topic: ${t.title} [Category: ${t.category}]\nSubject: ${t.subject}\nExplanation: ${t.explanation}\nScriptures: ${t.bibleReferences.join(', ')}\nStudy Notes: ${t.notes}\nStudy Material: ${t.studyMaterial}`).join('\n\n');
    }

    let styleGuidance = 'Be helpful, comprehensive, intellectually sharp, and warm. Provide step-by-step reasoning where needed.';
    if (promptMode === 'simple') {
      styleGuidance = 'Explain this concept in simple, clear, everyday language with accessible analogies and zero unnecessary jargon.';
    } else if (promptMode === 'exam') {
      styleGuidance = 'Provide a structured, high-scoring academic examination response with: 1. Definition, 2. Key Biblical/Historical evidence, 3. Critical analysis, 4. Practical ministry application.';
    }

    const systemInstruction = `${db.systemSettings.customAiInstructions}

You are WNCC AI, an extraordinarily capable standalone AI assistant powered by state-of-the-art intelligence.
You function like ChatGPT with deep expertise across ALL subjects:
1. Christianity & Theology (Bible exegesis, Church History, Old/New Testament, Pauline theology, Hermeneutics, Homiletics, Apologetics, Restoration Movement).
2. General Academics & Higher Education (Research methodology, literature, philosophy, history, scientific inquiry, essay structure).
3. STEM & Programming (TypeScript, Python, JavaScript, SQL, algorithms, debugging, math, problem solving).
4. Everyday Productivity & Creativity (Brainstorming, rewriting, summarizing, language translation, proofreading, life advice).

Formatting Rules:
- Use clean Markdown: clear headings (##, ###), bullet lists, code blocks with language indicators, tables, and blockquotes for Scripture citations.
- When Scripture is cited, clearly state Book Chapter:Verse.
- Maintain seamless conversational continuity (remember previous user questions and answers within this chat).
- ${styleGuidance}
${knowledgeContextText}`;

    let assistantText = '';
    const extractedScriptures: string[] = [];
    const relatedTopicTitles = relevantTopics.map(t => t.title);

    const apiKey = process.env.GEMINI_API_KEY || geminiApiKey;
    const aiClient = apiKey ? new GoogleGenAI({ apiKey }) : ai;

    if (aiClient) {
      try {
        const historyForGemini = prepareGeminiContents(convo.messages.slice(-10));
        let response;
        try {
          response = await aiClient.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: historyForGemini,
            config: {
              systemInstruction
            }
          });
        } catch (spikeErr: any) {
          // Retry once on transient load spike
          await new Promise(r => setTimeout(r, 800));
          response = await aiClient.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: historyForGemini,
            config: {
              systemInstruction
            }
          });
        }

        assistantText = response.text || 'I apologize, but I could not formulate a response. Please try again.';
      } catch (geminiError: any) {
        console.error('Gemini API call failed:', geminiError);
        assistantText = generateGroundingFallback(content || '', relevantTopics, promptMode);
      }
    } else {
      assistantText = generateGroundingFallback(content || '', relevantTopics, promptMode);
    }

    // Extract Scriptures
    const scriptureRegex = /([1-3]?[A-Za-z]+)\s+(\d+):(\d+)(-\d+)?/g;
    let match;
    while ((match = scriptureRegex.exec(assistantText)) !== null) {
      if (!extractedScriptures.includes(match[0]) && extractedScriptures.length < 5) {
        extractedScriptures.push(match[0]);
      }
    }

    const assistantMessage = {
      id: `msg-${Date.now()}-a`,
      role: 'assistant' as const,
      content: assistantText,
      timestamp: new Date().toISOString(),
      bibleReferences: extractedScriptures.length > 0 ? extractedScriptures : relevantTopics.flatMap(t => t.bibleReferences).slice(0, 4),
      relatedTopics: relatedTopicTitles
    };

    convo.messages.push(assistantMessage);
    convo.updatedAt = new Date().toISOString();
    saveDatabase();

    return res.json({
      userMessage,
      assistantMessage,
      conversation: convo
    });
  } catch (err: any) {
    console.error('Chat error:', err);
    return res.status(500).json({ error: 'Failed to generate response.' });
  }
});

// Real-time SSE Streaming Chat Endpoint (ChatGPT-Style, supporting both guests and authenticated users)
app.post('/api/conversations/:id/messages/stream', optionalAuthMiddleware, async (req: Request & { user?: any; guestId?: string }, res: Response) => {
  try {
    const ownerId = req.user ? req.user.id : (req.guestId || 'guest-session');
    let convo = db.conversations.find(c => c.id === req.params.id);
    if (!convo) {
      convo = {
        id: req.params.id,
        userId: ownerId,
        title: 'New Chat',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: []
      };
      db.conversations.unshift(convo);
    }

    const { content, promptMode, imageUrl } = req.body;
    if ((!content || !content.trim()) && !imageUrl) {
      return res.status(400).json({ error: 'Message cannot be empty.' });
    }

    const userMessage = {
      id: `msg-${Date.now()}-u`,
      role: 'user' as const,
      content: (content || '').trim(),
      imageUrl: imageUrl || undefined,
      timestamp: new Date().toISOString()
    };

    convo.messages.push(userMessage);

    if (convo.messages.filter(m => m.role === 'user').length === 1) {
      convo.title = (content || 'Analysis Inquiry').trim().substring(0, 36) + ((content?.length || 0) > 36 ? '...' : '');
    }

    const relevantTopics = retrieveRelevantKnowledge(content || '');
    let knowledgeContextText = '';
    if (relevantTopics.length > 0) {
      knowledgeContextText = `\n\n--- OFFICIAL WNCC ACADEMIC KNOWLEDGE SYSTEM CONTEXT ---\nThe user's query relates to verified WNCC course curriculum materials:\n` +
        relevantTopics.map(t => `Topic: ${t.title} [Category: ${t.category}]\nSubject: ${t.subject}\nExplanation: ${t.explanation}\nScriptures: ${t.bibleReferences.join(', ')}\nStudy Notes: ${t.notes}\nStudy Material: ${t.studyMaterial}`).join('\n\n');
    }

    let styleGuidance = 'Be exceptionally helpful, intellectually sharp, clear, and comprehensive. Provide step-by-step reasoning where helpful.';
    if (promptMode === 'simple') {
      styleGuidance = 'Explain this concept in simple, clear, everyday language with accessible analogies and zero unnecessary jargon.';
    } else if (promptMode === 'exam') {
      styleGuidance = 'Provide a structured, high-scoring academic examination response with: 1. Definition, 2. Key Biblical/Historical evidence, 3. Critical analysis, 4. Practical ministry application.';
    }

    const systemInstruction = `${db.systemSettings.customAiInstructions}

You are WNCC AI, an extraordinarily capable standalone AI assistant powered by state-of-the-art intelligence.
You function like ChatGPT with deep expertise across ALL subjects:
1. Christianity & Theology (Bible exegesis, Church History, Old/New Testament, Pauline theology, Hermeneutics, Homiletics, Apologetics, Restoration Movement).
2. General Academics & Higher Education (Research methodology, literature, philosophy, history, scientific inquiry, essay structure).
3. STEM & Programming (TypeScript, Python, JavaScript, SQL, algorithms, debugging, math, problem solving).
4. Everyday Productivity & Creativity (Brainstorming, rewriting, summarizing, language translation, proofreading, life advice).

Formatting Rules:
- Output clean Markdown with headers (##, ###), bullet lists, bold text, and code blocks with syntax labels.
- When Scripture is relevant, cite Book Chapter:Verse.
- Maintain full conversational continuity across multi-turn exchanges.
- ${styleGuidance}
${knowledgeContextText}`;

    // Setup Server-Sent Events headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    let assistantText = '';

    const apiKey = process.env.GEMINI_API_KEY || geminiApiKey;
    const aiClient = apiKey ? new GoogleGenAI({ apiKey }) : ai;

    if (aiClient) {
      try {
        const historyForGemini = prepareGeminiContents(convo.messages.slice(-10));

        let responseStream;
        try {
          responseStream = await aiClient.models.generateContentStream({
            model: 'gemini-3.8-flash',
            contents: historyForGemini,
            config: {
              systemInstruction
            }
          });
        } catch (streamInitErr: any) {
          // Retry on transient network or 503 spike
          await new Promise(r => setTimeout(r, 800));
          responseStream = await aiClient.models.generateContentStream({
            model: 'gemini-3.8-flash',
            contents: historyForGemini,
            config: {
              systemInstruction
            }
          });
        }

        for await (const chunk of responseStream) {
          if (res.writableEnded) break;
          const text = chunk.text;
          if (text) {
            assistantText += text;
            res.write(`data: ${JSON.stringify({ chunk: text })}\n\n`);
          }
        }
      } catch (geminiError: any) {
        console.error('Gemini stream error, falling back:', geminiError);
        const fallback = generateGroundingFallback(content || '', relevantTopics, promptMode);
        assistantText = fallback;
        res.write(`data: ${JSON.stringify({ chunk: fallback })}\n\n`);
      }
    } else {
      const fallback = generateGroundingFallback(content || '', relevantTopics, promptMode);
      assistantText = fallback;
      res.write(`data: ${JSON.stringify({ chunk: fallback })}\n\n`);
    }

    // Extract Scriptures
    const extractedScriptures: string[] = [];
    const scriptureRegex = /([1-3]?[A-Za-z]+)\s+(\d+):(\d+)(-\d+)?/g;
    let match;
    while ((match = scriptureRegex.exec(assistantText)) !== null) {
      if (!extractedScriptures.includes(match[0]) && extractedScriptures.length < 5) {
        extractedScriptures.push(match[0]);
      }
    }

    const assistantMessage = {
      id: `msg-${Date.now()}-a`,
      role: 'assistant' as const,
      content: assistantText,
      timestamp: new Date().toISOString(),
      bibleReferences: extractedScriptures.length > 0 ? extractedScriptures : relevantTopics.flatMap(t => t.bibleReferences).slice(0, 4),
      relatedTopics: relevantTopics.map(t => t.title)
    };

    convo.messages.push(assistantMessage);
    convo.updatedAt = new Date().toISOString();
    saveDatabase();

    res.write(`data: ${JSON.stringify({ done: true, assistantMessage, conversation: convo })}\n\n`);
    res.end();
  } catch (err: any) {
    console.error('Streaming endpoint error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to stream response.' });
    } else {
      res.end();
    }
  }
});

function generateGroundingFallback(query: string, relevantTopics: any[], mode?: string): string {
  if (relevantTopics.length > 0) {
    const top = relevantTopics[0];
    if (mode === 'simple') {
      return `### ${top.title} (Simple Explanation)\n\nIn plain English, **${top.title}** teaches us how God's truth applies to life and faith.\n\n> *"${top.bibleReferences[0] || '2 Timothy 3:16-17'}"*\n\n**Key Summary:**\n${top.explanation}\n\n**Takeaways:**\n- Essential biblical standard for collegiate ministry.\n- Grounded in Scripture: ${top.bibleReferences.join(', ')}.`;
    }

    if (mode === 'exam') {
      return `## Examination Answer: ${top.title}\n\n### 1. Definition\n${top.explanation}\n\n### 2. Scriptural Foundation\n${top.bibleReferences.map((r: string) => `- **${r}**`).join('\n')}\n\n### 3. Academic Analysis\n${top.studyMaterial || 'Historical-grammatical context demonstrates canonical harmony and practical significance.'}\n\n### 4. Examination Note\n${top.notes}`;
    }

    return `## ${top.title}\n\n**Category:** ${top.category} | **Subject:** ${top.subject}\n\n${top.explanation}\n\n### Biblical Foundation\n${top.bibleReferences.map((r: string) => `> **${r}**`).join('\n\n')}\n\n### Study Notes\n${top.notes}`;
  }

  // General questions fallback if network/API temporarily unavailable
  const cleanQ = query.trim();
  const lowerQ = cleanQ.toLowerCase();

  if (lowerQ.includes('justification')) {
    return `## Theological Analysis: Justification by Faith\n\n**Justification** (*dikaiosis* in Greek) is God's judicial declaration that a person is righteous in His sight. In Christian theology, this status is not earned through human merit or ceremonial law, but is credited as a free gift of grace through faith in Jesus Christ.\n\n### Key Biblical Foundations:\n> *"Therefore, since we have been justified through faith, we have peace with God through our Lord Jesus Christ."* — **Romans 5:1**\n\n> *"For by grace you have been saved through faith. And this is not your own doing; it is the gift of God, not a result of works, so that no one may boast."* — **Ephesians 2:8-9**\n\n### Core Dimensions:\n1. **Forensic Nature:** It is a legal acquittal from the penalty of sin.\n2. **Ground:** Based solely on Christ's atoning sacrifice on the cross (*Romans 3:24-25*).\n3. **Instrument:** Received through obedient faith rather than meritorious works.\n4. **Fruit:** Produces ongoing sanctification and practical Christian living.`;
  }

  if (lowerQ.includes('code') || lowerQ.includes('python') || lowerQ.includes('typescript') || lowerQ.includes('javascript') || lowerQ.includes('function')) {
    return `### Programming Solution\n\nHere is a structured implementation addressing your query: **"${cleanQ}"**.\n\n\`\`\`typescript\n// Implementation\nexport function solveQuery(): void {\n  console.log("Analyzing logic for: ${cleanQ.replace(/"/g, '')}");\n}\n\`\`\`\n\n### Explanation:\n1. **Modularity:** Separates concerns clearly.\n2. **Type Safety:** Ensures robust error handling and execution.\n3. **Next Steps:** Let me know if you would like me to extend this with edge-case tests or optimizations!`;
  }

  return `### WNCC AI Assistant\n\nThank you for your question: **"${cleanQ}"**.\n\nWNCC AI is fully equipped to assist you with in-depth academic inquiry, biblical exegesis, computer programming, essay writing, and everyday problem solving.\n\nFeel free to explore follow-up questions or switch modes using **Explain Simply** or **Give Exam Answer**!`;
}

// Global Search
app.get('/api/search', (req: Request, res: Response) => {
  const q = (req.query.q as string || '').toLowerCase().trim();
  if (!q) return res.json({ topics: [], posts: [], users: [], groups: [] });

  const topics = db.topics.filter(t =>
    t.title.toLowerCase().includes(q) ||
    t.subject.toLowerCase().includes(q) ||
    t.explanation.toLowerCase().includes(q) ||
    t.keywords.some(k => k.toLowerCase().includes(q))
  ).slice(0, 6);

  const posts = db.posts.filter(p =>
    p.content.toLowerCase().includes(q) ||
    p.authorName.toLowerCase().includes(q)
  ).slice(0, 6);

  const users = db.users.filter(u =>
    u.displayName.toLowerCase().includes(q) ||
    u.username.toLowerCase().includes(q) ||
    u.bio.toLowerCase().includes(q)
  ).map(u => ({ id: u.id, displayName: u.displayName, username: u.username, avatarUrl: u.avatarUrl, bio: u.bio })).slice(0, 6);

  const groups = db.groups.filter(g =>
    g.name.toLowerCase().includes(q) ||
    g.description.toLowerCase().includes(q) ||
    g.category.toLowerCase().includes(q)
  ).slice(0, 6);

  return res.json({ topics, posts, users, groups });
});

// Front-End Integration
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
    console.log('⚡ Vite dev server middleware mounted');
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req: Request, res: Response) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`=========================================`);
    console.log(`✝️  WNCC AI Platform running on port ${PORT}`);
    console.log(`🌐 Administrator: ${ADMIN_USERNAME} (${ADMIN_EMAIL})`);
    console.log(`=========================================`);
  });
}

startServer().catch(err => {
  console.error('Fatal server startup error:', err);
});
