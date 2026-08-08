import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

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
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { firstName, lastName, email } = req.body || {};

    if (!firstName) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    const secret = process.env.MEVON_SECRET_KEY;
    if (!secret) {
        return res.status(500).json({ error: "Payment provider not configured" });
    }

    try {
        const response = await fetch("https://mevonpay.com.ng/V1/createtempva", {
            method: "POST",
            headers: {
                "Authorization": secret,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                fname: firstName,
                lname: lastName || firstName
            })
        });

        const data = await response.json();

        if (!response.ok || data.status !== true) {
            console.error("MevonPay reserve error:", data);
            return res.status(502).json({ error: data?.message || "Failed to create payment account" });
        }

        // Save reference + account number to Firestore so the webhook can match
        if (email) {
            try {
                await db.collection("princessusers").doc(email).set({
                    mevonReference: data.reference || "",
                    mevonAccountNumber: data.account_number || ""
                }, { merge: true });
            } catch (err) {
                console.error("Firestore reserve save error:", err);
            }
        }

        return res.status(200).json(data);
    } catch (err) {
        console.error("MevonPay reserve fetch error:", err);
        return res.status(500).json({ error: "Payment provider unavailable" });
    }
}
