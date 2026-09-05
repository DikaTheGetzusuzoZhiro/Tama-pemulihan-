const axios = require("axios");

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.end(JSON.stringify(body));
}

module.exports = async (req, res) => {
  if (req.method === "OPTIONS") return send(res, 204, {});
  if (req.method !== "POST") return send(res, 405, { error: "Method not allowed" });

  try {
    const username = String(req.body?.username || "").trim().replace(/^@/, "").slice(0, 20);
    if (!username) return send(res, 400, { error: "Username wajib diisi." });

    const lookup = await axios.post(
      "https://users.roblox.com/v1/usernames/users",
      { usernames: [username], excludeBannedUsers: false },
      { timeout: 9000 }
    );

    const user = lookup.data?.data?.[0];
    if (!user) return send(res, 404, { error: "Username Roblox tidak ditemukan." });

    const avatarResult = await axios.get(
      "https://thumbnails.roblox.com/v1/users/avatar-headshot",
      { params: { userIds: user.id, size: "420x420", format: "Png", isCircular: false }, timeout: 9000 }
    );

    return send(res, 200, {
      ok: true,
      user: {
        id: user.id,
        username: user.name,
        displayName: user.displayName,
        avatar: avatarResult.data?.data?.[0]?.imageUrl || null
      }
    });
  } catch (err) {
    console.error(err?.response?.data || err?.message || err);
    return send(res, 502, { error: "Gagal mengambil data Roblox. Coba lagi." });
  }
};
