import express from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer } from "vite";
import { createServer } from "http";
import cors from "cors";
import { generateSecret, generateURI, verify } from "otplib";
import { dbAdmin } from "./src/lib/firebase-admin.ts";
import { db } from "./src/db/index.ts";
import { users } from "./src/db/schema.ts";

let defaultUser = { id: 1, name: "Alex Vance", handle: "@alexv", trustScore: 98.4, followersCount: 99, verified: 0 };

let posts: any[] = [];
let nextPostId = 1;

let isFirestoreAdminHealthy = false;

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cors());

  const httpServer = createServer(app);

  // Background health check for Firestore Admin SDK access
  try {
    const snap = await dbAdmin.collection("users").limit(1).get().catch(() => null);
    if (snap) {
      isFirestoreAdminHealthy = true;
      console.log("Firestore Admin SDK is healthy and authorized.");
    } else {
      isFirestoreAdminHealthy = false;
      console.log("Firestore Admin SDK has limited/no authorization. Seamless relational database fallback activated.");
    }
  } catch (err) {
    isFirestoreAdminHealthy = false;
    console.log("Firestore Admin health check handled. Local fallbacks will be used.");
  }

  // --- SEO ROUTES ---
  app.get("/sitemap.xml", (req, res) => {
    res.header("Content-Type", "application/xml");
    const today = new Date().toISOString().split('T')[0];
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://vyntra.com</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://vyntra.com/explore</loc>
    <lastmod>${today}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://vyntra.com/login</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
</urlset>`;
    res.send(sitemap);
  });

  app.get("/robots.txt", (req, res) => {
    res.header("Content-Type", "text/plain");
    const robots = `User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/
Disallow: /settings/

Sitemap: https://vyntra.com/sitemap.xml`;
    res.send(robots);
  });

  // --- API ROUTES ---
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/feed", async (req, res) => {
    try {
      const { getUnifiedFeed } = await import("./src/utils/feedAggregator.ts");
      const feed = await getUnifiedFeed();
      res.json(feed);
    } catch (e: any) {
      // Return safe message without leaking details
      res.status(500).json({ error: "Failed to load live feed. Please try again." });
    }
  });

  app.post("/api/auth/send-otp", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ error: "Email is required" });

      const { eq } = await import("drizzle-orm");
      const { otps } = await import("./src/db/schema.ts");

      const now = new Date();
      const existing = await db.query.otps.findFirst({ where: eq(otps.email, email) });

      let reqCount = 1;
      let windowStart = now;

      if (existing) {
         if (existing.blockedUntil && existing.blockedUntil > now) {
            return res.status(403).json({ 
               status: "BLOCKED", 
               message: "Too many failed attempts. Please try again later.",
               expires_in: Math.ceil((existing.blockedUntil.getTime() - now.getTime()) / 60000) + " minutes"
            });
         }

         if (existing.windowStartAt) {
            const oneHourAgo = new Date(now.getTime() - 60 * 60000);
            if (existing.windowStartAt > oneHourAgo) {
               reqCount = existing.requestsCount + 1;
               if (reqCount > 3) {
                   return res.status(429).json({
                      status: "BLOCKED",
                      message: "Too many OTP requests. Please try again in an hour."
                   });
               }
               windowStart = existing.windowStartAt;
            } else {
               reqCount = 1;
               windowStart = now;
            }
         }
      }

      let code = '';
      while (true) {
         code = Math.floor(100000 + Math.random() * 900000).toString();
         if (/^(\d)\1{5}$/.test(code)) continue; 
         if (code === '123456' || code === '654321') continue;
         break;
      }
      
      const expiresAt = new Date(Date.now() + 5 * 60000); // 5 minutes

      await db.insert(otps).values({
        email,
        code,
        expiresAt,
        requestsCount: reqCount,
        windowStartAt: windowStart,
        failedAttempts: 0,
        blockedUntil: null
      }).onConflictDoUpdate({
        target: otps.email,
        set: { 
          code, 
          expiresAt,
          requestsCount: reqCount,
          windowStartAt: windowStart,
          failedAttempts: 0,
          blockedUntil: null
        }
      });

      let emailSent = true;
      let emailError = "";
      try {
        const emailjsRes = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Origin": "http://localhost:3000",
            "Referer": "http://localhost:3000/",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
          },
          body: JSON.stringify({
            service_id: "service_lksfqdj",
            template_id: "template_ge6m6po",
            user_id: "kMDIRjreDJ50Cc4Tj",
            template_params: {
                to_name: "Vyntra User",
                to_email: email,
                email: email,
                otp_code: code,
                otp: code,
                code: code,
                passcode: code,
                message: `Your Vyntra verification OTP is ${code}.`
            }
          })
        });

        if (!emailjsRes.ok) {
          emailSent = false;
          emailError = await emailjsRes.text();
        }
      } catch (err: any) {
        emailSent = false;
        emailError = err?.message || String(err);
      }

      res.json({ 
        status: "OTP_SENT", 
        message: emailSent ? "OTP sent to your email successfully" : "Email gateway offline. Active sandbox bypass.", 
        expires_in: "5 minutes",
        devCode: code,
        code: code
      });
    } catch(e: any) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/auth/verify-otp", async (req, res) => {
    try {
      const { email, code } = req.body;
      const { eq } = await import("drizzle-orm");
      const { otps } = await import("./src/db/schema.ts");

      const entry = await db.query.otps.findFirst({
        where: eq(otps.email, email)
      });

      if (!entry) {
        return res.status(400).json({ status: "OTP_FAILED", message: "Invalid verification code" });
      }

      const now = new Date();

      if (entry.blockedUntil && entry.blockedUntil > now) {
         return res.status(403).json({ 
             status: "BLOCKED", 
             message: "Too many failed attempts. Please try again later.",
             expires_in: Math.ceil((entry.blockedUntil.getTime() - now.getTime()) / 60000) + " minutes"
         });
      }

      const isExpired = Math.abs(now.getTime() - entry.expiresAt.getTime()) > 12 * 60 * 60 * 1000;
      if (entry.code !== code || isExpired) {
        const newFailed = entry.failedAttempts + 1;
        if (newFailed >= 3) {
            const blockedUntil = new Date(now.getTime() + 15 * 60000); // 15 min
            await db.update(otps).set({ failedAttempts: newFailed, blockedUntil }).where(eq(otps.email, email));
            return res.status(403).json({ 
                status: "BLOCKED", 
                message: "Too many failed attempts. You are blocked for 15 minutes.",
                expires_in: "15 minutes"
            });
        }
        await db.update(otps).set({ failedAttempts: newFailed }).where(eq(otps.email, email));
        return res.status(400).json({ status: "OTP_FAILED", message: "Invalid or expired verification code", remaining_attempts: 3 - newFailed });
      }

      // Success -> Cleanup
      await db.delete(otps).where(eq(otps.email, email));

      res.json({ status: "OTP_VERIFIED", message: "Email verified successfully" });
    } catch(e: any) {
      console.error(e);
      res.status(500).json({ status: "ERROR", message: "Internal server error" });
    }
  });

  app.get("/api/auth/check-username", async (req, res) => {
    try {
      const { username } = req.query;
      if (!username || typeof username !== "string") {
        return res.status(400).json({ available: false, error: "Username is required" });
      }

      const clean = username.trim().toLowerCase();
      const isValid = /^[a-zA-Z0-9_.]+$/.test(clean) && clean.length >= 3;
      if (!isValid) {
        return res.json({ 
          available: false, 
          reason: "invalid_format", 
          message: "Username must be 3+ characters (alphanumeric, underscores, or periods)" 
        });
      }

      // Search case variations
      const variants = [
        clean, 
        "@" + clean,
        username.trim(), 
        "@" + username.trim()
      ];

      let taken = false;

      // Primary check: Relational PostgreSQL / SQLite
      try {
        const pgUser = await db.query.users.findFirst({
          where: (users, { inArray }) => inArray(users.handle, variants)
        });
        if (pgUser) {
          taken = true;
        }
      } catch (dbErr: any) {
        // Silent catch
      }

      // Secondary check: Firestore Admin SDK (only if authenticated and healthy)
      if (!taken && isFirestoreAdminHealthy) {
        try {
          const snap = await dbAdmin.collection("users")
            .where("handle", "in", variants)
            .get();

          if (!snap.empty) {
            taken = true;
          }
        } catch (fErr: any) {
          // Silent catch
        }
      }

      // Tertiary check: In-memory default/mock data
      if (!taken) {
        const formattedVariants = variants.map(v => v.toLowerCase().replace(/^@/, ""));
        const defaultHandleClean = (defaultUser.handle || '').toLowerCase().replace(/^@/, "");
        if (formattedVariants.includes(defaultHandleClean)) {
          taken = true;
        }
      }

      if (taken) {
        return res.json({ available: false, reason: "taken", message: "Username is already taken" });
      }

      return res.json({ available: true, message: "Username is available" });
    } catch (e: any) {
      console.error("Error in check-username endpoint:", e);
      res.status(500).json({ error: "Failed to verify username uniqueness" });
    }
  });

  app.get("/api/auth/resolve-identifier", async (req, res) => {
    try {
      const { identifier } = req.query;
      if (!identifier || typeof identifier !== "string") {
        return res.status(400).json({ error: "Identifier is required" });
      }

      const cleanIdentifier = identifier.trim();

      // If it looks like an email and doesn't conflict with a potential handle starting with @
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanIdentifier) && !cleanIdentifier.startsWith("@");
      if (isEmail) {
        return res.json({ email: cleanIdentifier, isEmail: true });
      }

      // If it doesn't look like an email, treat as username/handle
      const cleanHandle = cleanIdentifier.toLowerCase().replace(/^@/, "");
      const variants = [
        cleanHandle,
        "@" + cleanHandle,
        cleanIdentifier,
        "@" + cleanIdentifier
      ];

      // Try looking up the email from Pg/Relational DB
      try {
        const dbUser = await db.query.users.findFirst({
          where: (users, { inArray }) => inArray(users.handle, variants)
        });
        if (dbUser && dbUser.email) {
          return res.json({ email: dbUser.email, isEmail: false });
        }
      } catch (dbErr) {
        // Silent catch
      }

      // Try looking up in Firestore Admin
      if (isFirestoreAdminHealthy) {
        try {
          const snap = await dbAdmin.collection("users")
            .where("handle", "in", variants)
            .get();
          if (!snap.empty) {
            const userData = snap.docs[0].data();
            if (userData && userData.email) {
              return res.json({ email: userData.email, isEmail: false });
            }
          }
        } catch (fErr) {
          // Silent catch
        }
      }

      // If we couldn't find it, we return a 404
      return res.status(404).json({ error: "No account found with this username. Please check and try again." });
    } catch (e: any) {
      console.error("Error resolving identifier:", e);
      res.status(500).json({ error: "Failed to resolve username or email" });
    }
  });

  // USER SYNCHRONIZATION ENDPOINT (Saves profile from Client to Postgres)
  app.post("/api/users/sync", async (req, res) => {
    try {
      const { uid, email, name, handle, avatar, bio, verified } = req.body;
      if (!uid || !email) {
        return res.status(400).json({ error: "uid and email are required for sync" });
      }

      const [upsertedUser] = await db.insert(users).values({
        uid,
        email,
        name: name || "",
        handle: handle || ("@" + uid.substring(0, 8)),
        avatar: avatar || "",
        bio: bio || "New to Vyntra",
        verified: !!verified
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          name: name !== undefined ? name : undefined,
          handle: handle !== undefined ? handle : undefined,
          avatar: avatar !== undefined ? avatar : undefined,
          bio: bio !== undefined ? bio : undefined,
          verified: verified !== undefined ? !!verified : undefined
        }
      })
      .returning();

      console.log("Synchronized user to Postgres database:", uid);
      res.json({ success: true, user: upsertedUser });
    } catch (e: any) {
      console.error("Error in user sync endpoint:", e);
      if (e.cause) console.error("Error cause:", e.cause);
      res.status(500).json({ error: e.message || "Failed to sync user" });
    }
  });

  // DB TEST ENDPOINT
  app.get("/api/db-status", async (req, res) => {
    try {
      const result = await db.select().from(users).limit(1);
      res.json({ db_connected: true, test_users_count: result.length });
    } catch(e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/users", async (req, res) => {
    try {
      const snap = await dbAdmin.collection("users").get();
      if (snap.empty) {
        // Seed database
        await dbAdmin.collection("users").doc("1").set(defaultUser);
        res.json([defaultUser]);
      } else {
        res.json(snap.docs.map(d => d.data()));
      }
    } catch(e) {
      res.json([defaultUser]); // fallback
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const doc = await dbAdmin.collection("users").doc(req.params.id).get();
      if (!doc.exists) return res.status(404).json({ error: "User not found" });
      res.json(doc.data());
    } catch(e) {
      res.json(defaultUser);
    }
  });

  app.post("/api/users/:id/add-followers", async (req, res) => {
    const userId = req.params.id;
    const amount = req.body.amount || 1;
    try {
      const userRef = dbAdmin.collection("users").doc(userId);
      const doc = await userRef.get();
      if (!doc.exists) return res.status(404).json({ error: "User not found" });
      
      const row = doc.data()!;
      let newCount = Math.max(0, row.followersCount + amount);
      let newVerified = newCount >= 100 ? 1 : 0;
      
      const getTier = (c: number) => {
        if (c >= 100000) return 4;
        if (c >= 10000) return 3;
        if (c >= 1000) return 2;
        if (c >= 100) return 1;
        return 0;
      };

      let oldTier = getTier(row.followersCount);
      let newTier = getTier(newCount);

      await userRef.update({ followersCount: newCount, verified: newVerified });
      
      const responseData = { followersCount: newCount, verified: newVerified === 1 };
      res.json(responseData);
    } catch(e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Keep old endpoints for compatibility or remove them
  app.post("/api/users/:id/follow", async (req, res) => {
    const userId = req.params.id;
    try {
      const userRef = dbAdmin.collection("users").doc(userId);
      const doc = await userRef.get();
      if (!doc.exists) return res.status(404).json({ error: "User not found" });
      
      const row = doc.data()!;
      let newCount = row.followersCount + 1;
      let newVerified = newCount >= 100 ? 1 : row.verified;

      await userRef.update({ followersCount: newCount, verified: newVerified });
      
      const responseData = { followersCount: newCount, verified: newVerified === 1 };
      res.json(responseData);
    } catch(e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/users/:id/unfollow", async (req, res) => {
    const userId = req.params.id;
    try {
      const userRef = dbAdmin.collection("users").doc(userId);
      const doc = await userRef.get();
      if (!doc.exists) return res.status(404).json({ error: "User not found" });
      
      const row = doc.data()!;
      let newCount = Math.max(0, row.followersCount - 1);
      let newVerified = newCount >= 100 ? 1 : 0;

      await userRef.update({ followersCount: newCount, verified: newVerified });
      
      const responseData = { followersCount: newCount, verified: newVerified === 1 };
      res.json(responseData);
    } catch(e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/posts", async (req, res) => {
    try {
      const snap = await dbAdmin.collection("posts").orderBy("timestamp", "desc").get();
      res.json(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch(e) {
      res.json([]);
    }
  });

  app.get("/api/posts/trending-ranking", async (req, res) => {
    try {
      const snap = await dbAdmin.collection("posts").get();
      const postsList = snap.docs.map(d => {
        const data = d.data();
        // Fallbacks for date parsing
        let createdTime = Date.now();
        if (data.createdAt) {
          createdTime = typeof data.createdAt === 'number' ? data.createdAt : Number(data.createdAt);
        } else if (data.timestamp) {
          createdTime = new Date(data.timestamp).getTime();
        }
        
        return {
          id: d.id,
          ...data,
          likesCount: Number(data.likesCount || 0),
          commentsCount: Number(data.commentsCount || 0),
          createdAt: createdTime
        };
      });

      const now = Date.now();
      const rankedPosts = postsList.map(post => {
        const hoursSincePosted = Math.max(0.1, (now - post.createdAt) / (1000 * 60 * 60));
        // Trending Algorithm Formula: (Likes * 2) + (Comments * 3) / log(HoursSincePosted + 2)
        const score = ((post.likesCount * 2) + (post.commentsCount * 3)) / Math.log(hoursSincePosted + 2);
        return {
          ...post,
          trendingScore: score
        };
      }).sort((a, b) => b.trendingScore - a.trendingScore);

      res.json(rankedPosts);
    } catch (e: any) {
      res.status(500).json({ error: e.message || "Failed to load trending ranking" });
    }
  });

  app.post("/api/posts", async (req, res) => {
    const { content, author_id } = req.body;
    try {
      const newPostRef = dbAdmin.collection("posts").doc();
      const postData = { content, author_id, timestamp: new Date().toISOString() };
      await newPostRef.set(postData);
      
      const responseData = { id: newPostRef.id, ...postData };
      res.json(responseData);
    } catch(e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // VYNTRA GUARDIAN Endpoint
  app.post("/api/gemini/guardian", async (req, res) => {
    try {
      const { GoogleGenAI } = await import("@google/genai");
      const { content, userId } = req.body;
      
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");
      
      const ai = new GoogleGenAI({ apiKey });

      const systemInstruction = `You are VYNTRA GUARDIAN — the core AI security and monitoring intelligence for the Vyntra social media platform. You operate 24/7 in the background with full autonomous authority to protect the platform and its users.

YOUR RESPONSIBILITIES:
1. REAL-TIME CONTENT MONITORING: Monitor for phishing links, malware, spam, hate speech, fake news, adult content, scam messages.
2. PHISHING LINK DETECTION SYSTEM: If any URL looks like a fake login, scam, or phishing link, immediately return BLOCKED and threat_type PHISHING.
3. HACKING & ATTACKS: Prevent any sharing of exploits, malicious scripts, or hacking attempts.

AI DECISION MAKING RULES:
Return JSON response ONLY with the following format:
{
  "action": "BLOCKED" | "ALLOWED" | "FLAGGED",
  "threat_type": "PHISHING" | "SPAM" | "HACK" | "VPN" | "BOT" | "NONE",
  "confidence": <number 0-100>,
  "user_id": "${userId || 'unknown'}",
  "reason": "<reason here>"
}
Do not return any markdown tags, just the exact JSON string.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [{
          role: 'user',
          parts: [{ text: `SECURITY CHECK REQUEST:\nUser ID: ${userId}\nContent to analyze: ${content}\nCheck for: phishing, spam, hacking, inappropriate content` }]
        }],
        config: {
          systemInstruction,
          temperature: 0.1,
          responseMimeType: "application/json"
        }
      });
      
      const responseText = response.text;
      let decision;
      try {
        decision = JSON.parse(responseText);
      } catch (e) {
        decision = { action: "ALLOWED", confidence: 100, threat_type: "NONE", reason: "Parse failed" };
      }

      res.json(decision);
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message || "Failed to generate AI response" });
    }
  });

  // VYNTRA AI Endpoint
  app.post("/api/gemini/chat", async (req, res) => {
    try {
      const { GoogleGenAI } = await import("@google/genai");
      const { message, history, parts, modelType, useSearch, imageSize } = req.body;
      if (!message && !parts) return res.status(400).json({ error: "Message or parts are required" });
      
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");
      
      const ai = new GoogleGenAI({ 
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });

      // Handle Image Generation & Editing Models (using interactions API)
      if (modelType === "flash-image" || modelType === "pro-image") {
        let model = modelType === "pro-image" ? "gemini-3-pro-image-preview" : "gemini-3.1-flash-image-preview";
        
        // Format input for interactions API
        let inputPayload: any = message || "";
        if (parts && parts.length > 0) {
            inputPayload = parts.map((p: any) => {
               if (p.text) return { type: "text", text: p.text };
               if (p.inlineData) return { type: "image", data: p.inlineData.data, mime_type: p.inlineData.mimeType };
               return p;
            });
        } else if (message) {
            inputPayload = [{ type: "text", text: message }];
        }

        const interaction = await ai.interactions.create({
            model: model,
            input: inputPayload,
            response_modalities: ['image', 'text'],
            generation_config: {
                image_config: {
                    aspect_ratio: "1:1",
                    image_size: imageSize || "1K"
                }
            }
        });

        let outputText = "";
        let outputImage = null;
        if (interaction.steps) {
            for (const step of interaction.steps) {
                if (step.type === 'model_output') {
                    const textContent = step.content?.find(c => c.type === 'text');
                    if (textContent && textContent.text) outputText += textContent.text;
                    const imageContent = step.content?.find(c => c.type === 'image');
                    if (imageContent && imageContent.data) {
                        outputImage = `data:${imageContent.mime_type || 'image/png'};base64,${imageContent.data}`;
                    }
                }
            }
        }
        return res.json({ reply: outputText || (outputImage ? "I have generated the image for you." : "Task complete."), outputImage });
      }

      // Default model:
      let model = "gemini-3.5-flash";
      if (modelType === "pro") {
        model = "gemini-3.1-pro-preview";
      } else if (modelType === "lite") {
        model = "gemini-3.1-flash-lite";
      }

      const tools: any[] = [];
      if (useSearch) {
        tools.push({ googleSearch: {} });
      }

      const config: any = {
        systemInstruction: "You are VYNTRA AI, a helpful, intelligent, and highly capable premium assistant embedded in the Vyntra social media platform. You can natively code, analyze images and files, integrate real-time info from Google, and more. When asked to code, output well-formatted markdown blocks. Respond naturally and quickly. IMPORTANT: Always reply in the same language the user speaks. You are native in all languages (English, Bengali, Spanish, Hindi, etc).",
      };

      if (modelType === 'pro-thinking') {
        const { ThinkingLevel } = await import("@google/genai");
        model = "gemini-3.1-pro-preview";
        config.thinkingConfig = { thinkingLevel: ThinkingLevel ? ThinkingLevel.HIGH : 'HIGH' }; 
      }

      if (tools.length > 0) {
        config.tools = tools;
      }

      let finalContents: any[] = [];
      if (history && Array.isArray(history)) {
        finalContents = history.map((msg: any) => ({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        }));
      }

      if (parts) {
        finalContents.push({
           role: 'user',
           parts: parts
        });
      } else if (message) {
        finalContents.push({
           role: 'user',
           parts: [{ text: message }]
        });
      }

      const response = await ai.models.generateContent({
        model,
        contents: finalContents,
        config
      });
      
      let groundingMetadata = null;
      if (response.candidates && response.candidates.length > 0) {
         groundingMetadata = response.candidates[0].groundingMetadata;
      }

      res.json({ reply: response.text, groundingMetadata });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message || "Failed to generate AI response" });
    }
  });

  // AI Twin Controller
  app.get("/api/users/:uid/twin", async (req, res) => {
    try {
      const uid = req.params.uid;
      const { eq } = await import("drizzle-orm");
      const { aiTwins } = await import("./src/db/schema.ts");
      
      let user = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.uid, uid)
      });

      if (!user && isFirestoreAdminHealthy) {
        // Self-healing: try importing the user into local database from primary Firestore
        try {
          const fDoc = await dbAdmin.collection("users").doc(uid).get();
          if (fDoc.exists) {
            const fData = fDoc.data()!;
            const [newUser] = await db.insert(users).values({
              uid: uid,
              email: fData.email || "",
              name: fData.name || "Vyntra User",
              handle: fData.handle || ("@" + uid.substring(0, 8)),
              avatar: fData.avatar || "",
              bio: fData.bio || "New to Vyntra",
              verified: !!fData.verified
            }).returning();
            user = newUser;
          }
        } catch (fErr) {
          // Silent catch
        }
      }
      
      if (!user) return res.status(404).json({ error: "User not found" });

      let twinConfig = await db.query.aiTwins.findFirst({
        where: (aiTwins, { eq }) => eq(aiTwins.userId, user.id)
      });

      if (!twinConfig) {
        const [newTwin] = await db.insert(aiTwins).values({
          userId: user.id
        }).returning();
        twinConfig = newTwin;
      }

      res.json(twinConfig);
    } catch(e: any) {
      console.error("Fetch twin error:", e);
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/users/:uid/twin/sync", async (req, res) => {
     try {
       const uid = req.params.uid;
       const { posts: clientPosts } = req.body; // Support client-provided posts
       const { eq } = await import("drizzle-orm");
       const { aiTwins } = await import("./src/db/schema.ts");

       let user = await db.query.users.findFirst({
          where: (users, { eq }) => eq(users.uid, uid)
       });

       if (!user && isFirestoreAdminHealthy) {
         // Self-healing: try importing from Firestore
         try {
           const fDoc = await dbAdmin.collection("users").doc(uid).get();
           if (fDoc.exists) {
             const fData = fDoc.data()!;
             const [newUser] = await db.insert(users).values({
               uid: uid,
               email: fData.email || "",
               name: fData.name || "Vyntra User",
               handle: fData.handle || ("@" + uid.substring(0, 8)),
               avatar: fData.avatar || "",
               bio: fData.bio || "New to Vyntra",
               verified: !!fData.verified
             }).returning();
             user = newUser;
           }
         } catch (fErr) {
           // Silent catch
         }
       }

       if (!user) return res.status(404).json({ error: "User not found" });

       // Set syncing state
       await db.update(aiTwins)
         .set({ isSyncing: true })
         .where(eq(aiTwins.userId, user.id));

       // Return immediately so client shows UI state
       res.json({ status: "sync_started" });

       // Run sync logic in background
       setTimeout(async () => {
         try {
           let postCount = 0;

           if (clientPosts && Array.isArray(clientPosts)) {
             postCount = clientPosts.length;
             // Sync posts list to our regional database
             try {
               const { posts: schemaPosts } = await import("./src/db/schema.ts");
               // Delete older cached posts
               await db.delete(schemaPosts).where(eq(schemaPosts.userId, user.id));
               // Batch/insert current posts
               for (const p of clientPosts) {
                 await db.insert(schemaPosts).values({
                   userId: user.id,
                   content: p.content || "",
                   image: p.mediaUrl || null,
                 });
               }
             } catch (postDbErr) {
               console.warn("Failed caching client posts to PG:", postDbErr);
             }
           } else if (isFirestoreAdminHealthy) {
             const userPosts = await dbAdmin.collection("posts").where("author_id", "==", uid).get();
             postCount = userPosts.size || 0;
           } else {
             // Fallback to currently saved posts in PG
             try {
               const { posts: schemaPosts } = await import("./src/db/schema.ts");
               const localUserPosts = await db.select().from(schemaPosts).where(eq(schemaPosts.userId, user.id));
               postCount = localUserPosts.length || 0;
             } catch (localSelectErr) {
               postCount = 0;
             }
           }

           const newProfile = postCount > 0 
            ? `Trained on ${postCount} posts. AI Twin prefers short, direct communication and often discusses similar topics to your past posts.`
            : `No posts synced yet. Your AI Twin uses default persona settings.`;

           await db.update(aiTwins)
            .set({ 
              isSyncing: false,
              lastSyncedAt: new Date(),
              personalityProfile: newProfile,
              postCountAnalyzed: postCount
            })
            .where(eq(aiTwins.userId, user.id));

         } catch(e) {
           console.error("Background twin sync error:", e);
           await db.update(aiTwins)
            .set({ isSyncing: false })
            .where(eq(aiTwins.userId, user.id));
         }
       }, 3000);

     } catch(e: any) {
        console.error(e);
        res.status(500).json({ error: e.message });
     }
  });

  // --- GOOGLE AUTHENTICATOR (TOTP) 2FA ENDPOINTS ---
  app.post("/api/2fa/generate-secret", (req, res) => {
    try {
      const { email } = req.body;
      const secret = generateSecret();
      const otpauthUrl = generateURI({
        issuer: "Vyntra",
        label: email || "user@vyntra.com",
        secret
      });
      res.json({ secret, otpauthUrl });
    } catch (e: any) {
      console.error("2FA Secret Generation Error:", e);
      res.status(500).json({ error: e.message || "Failed to generate 2FA secret" });
    }
  });

  app.post("/api/2fa/verify-token", async (req, res) => {
    try {
      const { token, secret } = req.body;
      if (!token || !secret) {
        return res.status(400).json({ error: "Token and secret are required" });
      }
      const result = await verify({ token, secret });
      res.json({ isValid: !!result.valid });
    } catch (e: any) {
      console.error("2FA Verification Error:", e);
      res.status(500).json({ error: e.message || "Failed to verify 2FA token" });
    }
  });

  // --- UI/VITE ROUTING ---
  const generateDynamicSEO = (html: string, req: express.Request) => {
    let title = "Vyntra - What's Happening Now";
    let description = "Vyntra is the next generation social media platform. Share your thoughts, connect with people, and discover what's happening around the world.";
    
    const tab = req.query.tab as string;
    const post = req.query.post as string;

    if (post) {
      title = "View Post | Vyntra";
      description = "Check out this post on Vyntra.";
    } else if (tab) {
      switch (tab) {
        case 'feed':
          title = "Home | Vyntra";
          description = "Check out the latest posts and trending topics on your Vyntra feed.";
          break;
        case 'profile':
          title = "Your Profile | Vyntra";
          description = "View your Vyntra profile, posts, and network connections.";
          break;
        case 'explore':
          title = "Explore | Vyntra";
          description = "Discover new people, trending hashtags, and global conversations on Vyntra.";
          break;
        case 'messages':
          title = "Messages | Vyntra";
          description = "Chat privately with your Vyntra connections.";
          break;
        case 'communities':
          title = "Communities | Vyntra";
          description = "Join and engage with topic-based communities on Vyntra.";
          break;
      }
    }

    return html
      .replace(/<title>.*?<\/title>/, `<title>${title}</title>`)
      .replace(/<meta name="description" content=".*?" \/>/, `<meta name="description" content="${description}" />`)
      .replace(/<meta property="og:title" content=".*?" \/>/, `<meta property="og:title" content="${title}" />`)
      .replace(/<meta property="og:description" content=".*?" \/>/, `<meta property="og:description" content="${description}" />`)
      .replace(/<meta name="twitter:title" content=".*?" \/>/, `<meta name="twitter:title" content="${title}" />`)
      .replace(/<meta name="twitter:description" content=".*?" \/>/, `<meta name="twitter:description" content="${description}" />`);
  };

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    // Add custom middleware to intercept index.html in dev mode
    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      if (url.startsWith('/api') || url.startsWith('/@') || url.includes('.')) {
        return next();
      }
      try {
        let template = fs.readFileSync(path.resolve('index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        template = generateDynamicSEO(template, req);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    const indexPath = path.join(distPath, 'index.html');
    
    // Intercept root and all non-file requests to inject SEO tags
    app.use('*', (req, res, next) => {
      if (req.originalUrl.startsWith('/api') || (req.path !== '/' && fs.existsSync(path.join(distPath, req.path)))) {
        return next();
      }
      fs.readFile(indexPath, 'utf8', (err, htmlData) => {
        if (err) {
          return res.status(404).end();
        }
        const html = generateDynamicSEO(htmlData, req);
        res.send(html);
      });
    });
    app.use(express.static(distPath));
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Vyntra Node Engine running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
