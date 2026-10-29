
const express = require("express");

const app = express();
const PORT = process.env.PORT || 5000;

const FF_API_URL =
  "https://apis.mangotopup.com/api/v1/ff-id-checker";

const OWN_UID = "2834031346";

app.set("view engine", "ejs");
app.set("views", __dirname);

app.use(express.static("public"));

app.get("/", async (req, res) => {
  const uid = String(req.query.uid || "").trim();

  const renderPage = (player = null, error = null, status = 200) => {
    return res.status(status).render("player", {
      uid,
      player,
      isOwnProfile: uid === OWN_UID,
      error,
    });
  };

  if (!uid) {
    return renderPage();
  }

  if (!/^\d{5,20}$/.test(uid)) {
    return renderPage(
      null,
      "Invalid Free Fire UID. Please check the UID and try again.",
      400
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(
      `${FF_API_URL}/${encodeURIComponent(uid)}`,
      {
        headers: {
          Accept: "application/json",
        },
        signal: controller.signal,
      }
    );

    const text = await response.text();

    let result;

    try {
      result = JSON.parse(text);
    } catch {
      throw new Error("INVALID_API_RESPONSE");
    }

    if (!response.ok) {
      if (response.status === 400 || response.status === 404) {
        throw new Error("INVALID_UID");
      }

      throw new Error("API_UNAVAILABLE");
    }

    const data =
      result.data ??
      result.result ??
      result.player ??
      result;

    if (
      !data ||
      typeof data !== "object" ||
      Array.isArray(data) ||
      result.success === false ||
      result.status === "error" ||
      data.success === false ||
      data.status === "error"
    ) {
      throw new Error("INVALID_UID");
    }

    const playerUid = data.uid ?? data.id ?? data.player_id;

    if (playerUid == null || String(playerUid) !== uid) {
      throw new Error("INVALID_UID");
    }

    const player = {
      ...data,
      id: String(playerUid),
      nickname:
        data.name ??
        data.nickname ??
        data.username ??
        "Unknown Player",
      like: data.likes ?? data.like ?? null,
    };

    return renderPage(player);
  } catch (error) {
    if (error.name === "AbortError") {
      return renderPage(
        null,
        "The request timed out. Please try again.",
        504
      );
    }

    if (error.message === "INVALID_UID") {
      return renderPage(
        null,
        "Invalid Free Fire UID. Please check the UID and try again.",
        400
      );
    }

    return renderPage(
      null,
      "Unable to retrieve player data right now. Please try again later.",
      502
    );
  } finally {
    clearTimeout(timeout);
  }
});

app.listen(PORT, () => {
 console.log(`Server running: http://localhost:${PORT}`);
});
