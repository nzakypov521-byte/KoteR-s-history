// src/components/screens/SettingsScreen.jsx
import { useState } from "react";
import { Plus, X } from "lucide-react";
import useStore, { CURRENCIES } from "../../store";

export default function SettingsScreen() {
  const settings = useStore((s) => s.settings);
  const updateSettings = useStore((s) => s.updateSettings);
  const addCategory = useStore((s) => s.addCategory);
  const removeCategory = useStore((s) => s.removeCategory);

  const [newCat, setNewCat] = useState("");

  const handleAddCat = () => {
    const cat = newCat.trim();
    if (!cat || settings.categories.includes(cat)) return;
    addCategory(cat);
    setNewCat("");
  };

  return (
    <div
      className="fade-in"
      style={{ display: "flex", flexDirection: "column", gap: 14 }}
    >
      {/* Currency */}
      <div className="card" style={{ padding: 20 }}>
        <div className="section-label" style={{ marginBottom: 12 }}>
          БАЗОВАЯ ВАЛЮТА
        </div>
        <select
          className="input-field"
          value={settings.baseCurrency}
          onChange={(e) => updateSettings({ baseCurrency: e.target.value })}
        >
          {CURRENCIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 8 }}>
          Используется по умолчанию при голосовом вводе без указания валюты
        </div>
      </div>

      {/* Categories */}
      <div className="card" style={{ padding: 20 }}>
        <div className="section-label" style={{ marginBottom: 14 }}>
          КАТЕГОРИИ
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            marginBottom: 16,
          }}
        >
          {settings.categories.map((cat) => (
            <div
              key={cat}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "5px 10px 5px 12px",
                borderRadius: 20,
                background: "rgba(139,92,246,0.1)",
                border: "1px solid rgba(139,92,246,0.25)",
                color: "var(--purple-light)",
                fontSize: 12,
              }}
            >
              {cat}
              <button
                onClick={() => removeCategory(cat)}
                style={{
                  background: "none",
                  border: "none",
                  color: "rgba(139,92,246,0.5)",
                  cursor: "pointer",
                  display: "flex",
                  padding: 0,
                }}
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>

        {/* Add category */}
        <div style={{ display: "flex", gap: 8 }}>
          <input
            className="input-field"
            value={newCat}
            onChange={(e) => setNewCat(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddCat()}
            placeholder="Новая категория…"
            style={{ flex: 1 }}
          />
          <button
            onClick={handleAddCat}
            style={{
              padding: "8px 14px",
              borderRadius: 10,
              border: "none",
              background: "var(--purple)",
              color: "#fff",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
            }}
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      {/* Поддержка */}
      <a
        href="https://t.me/KoteR8730"
        target="_blank"
        rel="noopener noreferrer"
        style={{ textDecoration: "none" }}
      >
        <div
          className="card"
          style={{
            padding: "16px 20px",
            display: "flex",
            alignItems: "center",
            gap: 14,
            cursor: "pointer",
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "rgba(255,255,255,0.04)")
          }
          onMouseLeave={(e) => (e.currentTarget.style.background = "")}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              flexShrink: 0,
              background: "rgba(0,136,204,0.15)",
              border: "1px solid rgba(0,136,204,0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
            }}
          >
            ✈️
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>
              Техническая поддержка
            </div>
            <div
              style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}
            >
              @KoteR8730 в Telegram
            </div>
          </div>
          <div
            style={{
              marginLeft: "auto",
              color: "var(--text-dim)",
              fontSize: 18,
            }}
          >
            →
          </div>
        </div>
      </a>

      {/* About */}
      <div className="card" style={{ padding: 20 }}>
        <div className="section-label" style={{ marginBottom: 10 }}>
          О ПРИЛОЖЕНИИ
        </div>
        <div
          style={{
            fontSize: 28,
            fontWeight: 800,
            letterSpacing: 2,
            marginBottom: 4,
          }}
        >
          SOMA
        </div>
        <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
          Знай куда уходят деньги
        </div>
        <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 8 }}>
          v1.0.0 · Голосовой бухгалтер для ИП и МСБ
        </div>
      </div>
    </div>
  );
}
