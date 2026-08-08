import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore }                  from "firebase-admin/firestore";

if (!getApps().length) {
    initializeApp({
        credential: cert({
            projectId:   process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey:  process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n")
        })
    });
}

const db = getFirestore();

export default async function handler(req, res) {
    if (req.method === "OPTIONS") return res.status(200).end();
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const body = req.body || {};

    const reference     = body.reference      || body.data?.reference      || "";
    const accountNumber = body.account_number || body.data?.account_number || "";
    const amount        = body.amount         || body.data?.amount         || 0;
    const status        = body.status === true || body.data?.status === true;

    if (!status) {
        return res.status(200).json({ received: true });
    }

    if (!reference && !accountNumber) {
        return res.status(200).json({ received: true });
    }

    try {
        // Try matching by reference first, fall back to account number
        let snap = await db.collection("princessusers")
            .where("mevonReference", "==", reference)
            .limit(1)
            .get();

        if (snap.empty && accountNumber) {
            snap = await db.collection("princessusers")
                .where("mevonAccountNumber", "==", accountNumber)
                .limit(1)
                .get();
        }

        if (!snap.empty) {
            await snap.docs[0].ref.update({
                activated:    true,
                activatedAt:  new Date().toISOString(),
                paidAmount:   String(amount)
            });
        }
    } catch (err) {
        console.error("Firestore update failed:", err);
    }

    return res.status(200).json({ received: true });
}
