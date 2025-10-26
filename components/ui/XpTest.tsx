"use client";

import React, { useState } from "react";

export default function XpTest() {
  const [message, setMessage] = useState("");

  const boostXp = async () => {
    try {
      const res = await fetch("/api/user/add-xp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ xpToAdd: 199999999 }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(
          `✅ Added 4000 XP. New Level: ${data.user.level}, XP left: ${data.user.xp}, Rank: ${data.user.rank}`
        );
        window.location.reload();
      } else {
        setMessage(`❌ ${data.error || "Error"}`);
      }
    } catch (err) {
      console.error(err);
      setMessage("❌ Failed to call API");
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 space-y-4">
      <h1 className="text-xl font-bold">Demo XP Booster</h1>
      <button
        onClick={boostXp}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Add 4000 XP
      </button>
      {message && <p className="text-sm mt-2">{message}</p>}
    </div>
  );
}
