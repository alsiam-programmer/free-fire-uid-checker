const express = require("express");

const app = express();
const PORT = process.env.PORT || 5000;

const DEFAULT_UID = "2834031346";
const API_URL =
  "https://apis.rrrtopup.com/api/v1/player-nickname";

app.set("view engine", "ejs");
app.set("views", __dirname);

app.get("/", async (req, res) => {
  const rawUid = req.query.uid;

  const uid =
    typeof rawUid === "string" && rawUid.trim()
      ? rawUid.trim()
      : DEFAULT_UID;

  let player = null;
  let error = null;

  try {
    if (!/^\d{5,20}$/.test(uid)) {
      throw new Error("সঠিক Free Fire UID লিখুন।");
    }

    const url = new URL(API_URL);
    url.searchParams.set("id", uid);

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error("Player information পাওয়া যায়নি।");
    }

    const result = await response.json();

    if (!result.success || !result.data) {
      throw new Error("এই UID-এর তথ্য পাওয়া যায়নি।");
    }

    player = result.data;
  } catch (err) {
    error = err.message || "কিছু একটা সমস্যা হয়েছে।";
  }

  res.set("Cache-Control", "no-store");

  return res.status(200).render("player", {
    player,
    uid,
    error,
    isOwnProfile: uid === DEFAULT_UID,
  });
});

app.listen(PORT, () => {
  console.log(`Server running: http://localhost:${PORT}`);
});