import admin from "firebase-admin";

if (!admin.apps.length) {
  try {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (privateKey) {
      if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
        privateKey = privateKey.substring(1, privateKey.length - 1);
      }
      privateKey = privateKey.replace(/\\n/g, "\n");
    }

    if (projectId && clientEmail && privateKey) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      console.log("Firebase Admin successfully initialized");
    } else {
      console.warn("Firebase Admin credentials not fully configured in environment");
    }
  } catch (error) {
    console.error("Firebase Admin initialization error:", error);
  }
}

export default admin;

export async function sendNotification(
  tokens: string[],
  title: string,
  body: string,
  priority: "high" | "normal" = "normal"
) {
  const validTokens = tokens.filter(Boolean);
  if (validTokens.length === 0) {
    console.log("No valid FCM tokens to send notification to.");
    return;
  }

  if (!admin.apps.length) {
    console.warn("Skipping notification: Firebase Admin is not initialized.");
    return;
  }

  try {
    const message = {
      notification: {
        title,
        body,
      },
      android: {
        priority: priority,
      },
      tokens: validTokens,
    };

    console.log(`Sending FCM notification: "${title}" to ${validTokens.length} tokens.`);
    const response = await admin.messaging().sendEachForMulticast(message);
    console.log(`Successfully sent ${response.successCount} messages; ${response.failureCount} failed.`);
  } catch (error) {
    console.error("Error sending FCM notification:", error);
  }
}
