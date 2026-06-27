# Vyntra Security & Code Generation Guidelines

## Vyntra Secure Code Generator Rules
1. CONSOLE SECURITY
   - Always disable all console methods in production-like scripts.
   - Detect DevTools open and block access if found.
   - Block right-click context menu.
   - Block developer shortcuts (F12, Ctrl+Shift+I/J, Ctrl+U).

2. OTP SECURITY
   - NEVER store OTP in JS variables, localStorage, sessionStorage, cookies, etc.
   - Store OTP in Firebase Firestore only (server-side only).
   - OTP verification must happen purely backend/Firebase.

3. FIREBASE KEY SECURITY
   - Config variables must be stored in environment variables, obfuscated if in frontend.
   - Use strict Firebase Security Rules.

4. CODE OBFUSCATION
   - Use minified names (a, b, c) for sensitive logic.
   - Encode sensitive strings in Base64 where possible.

5. WHAT CAN BE VISIBLE IN BROWSER
   - Allowed: HTML structure, CSS, UI event handlers, loading states, generic error text.
   - Never show: OTP logic, password hashing, Firebase secret keys, user verification logic, DB query structure.

6. ANTI-TAMPER PROTECTION
   - Use integrity checks on critical functions/scripts.
   - Freeze critical objects (e.g., `Object.freeze(window.firebaseConfig)`).

7. SESSION SECURITY
   - Expire sessions after 30 mins of inactivity.
   - Use Firebase Auth tokens only.
   - Never store auth data in localStorage.

8. INPUT SANITIZATION
   - Sanitize all input (strip tags, javascript block, etc.) before writing to Firebase.

9. ERROR MESSAGES
   - Generic user-facing messages only. Log real errors securely (no console.log).

---

## Vyntra Firebase Security Rules Generator

**CORE SECURITY PRINCIPLES**
1. DEFAULT DENY EVERYTHING
2. AUTHENTICATION REQUIRED (including email verification checks).
3. DATA OWNERSHIP (users only access their own data).

**COLLECTIONS RULES**
- /otps: Read MUST BE false, Write MUST BE false.
- /users/{userId}: Read if auth.uid == userId, Create if email_verified, Update only [name, bio, avatar, updatedAt], Delete false.
- /posts/{postId}: Read any authenticated, Create if email_verified + length constraints + userId matches + no harmful fields, Update/Delete only owner.
- /posts/{postId}/comments: Read any authenticated, Create if email_verified + length constraints + userId match, Update false, Delete only owner.
- /messages/{chatId}/msgs: Read if sender/receiver, Create if email_verified + senderId match + length constraints, Update false, Delete false.
- /notifications/{userId}: Read if auth.uid == userId, Create any authenticated, Update only [read, readAt], Delete only owner.
- /security_logs, /blocked, /rate_limits: Strict limits (no bulk reads, often entirely false).
- /databases/{database}/documents/{document=**}: DEFAULT DENY EVERYTHING.

**OUTPUT FORMAT**
Whenever creating/updating rules, output the full `rules_version = '2';` block followed by a "SECURITY SUMMARY:" that lists what is accessible, blocked, risks, and recommendations.
