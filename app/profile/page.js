"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authFetch } from "@/lib/authFetch";

const emptyForm = { name: "", phone: "", bio: "", address: "" };

export default function ProfilePage() {
  const router = useRouter();
  const [form, setForm] = useState(emptyForm);
  const [original, setOriginal] = useState(emptyForm);
  const [picture, setPicture] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // get my profile from the backend and fill the form
  const loadProfile = useCallback(async () => {
    const data = await authFetch("/users/profile");
    const p = data.user || data.profile || data;
    const values = {
      name: p.name || "",
      phone: p.phone || "",
      bio: p.bio || "",
      address: p.address || "",
    };
    setForm(values);
    setOriginal(values);
    setPicture(p.profilePicture || "");
  }, []);

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      router.replace("/login");
      return;
    }
    loadProfile()
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [router, loadProfile]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // save only the fields that were changed or newly added
  const handleSave = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const changed = {};
    Object.keys(form).forEach((key) => {
      if (form[key].trim() !== original[key]) {
        changed[key] = form[key].trim();
      }
    });

    if (Object.keys(changed).length === 0) {
      setError("Nothing changed.");
      return;
    }

    setSaving(true);
    try {
      await authFetch("/users/profile", { method: "PUT", body: changed });
      await loadProfile();

      // keep the name in the saved user info up to date
      if (changed.name) {
        const saved = JSON.parse(localStorage.getItem("user") || "{}");
        saved.name = changed.name;
        localStorage.setItem("user", JSON.stringify(saved));
      }
      setSuccess("Profile saved.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // upload or replace the profile picture
  const handlePicture = async (e) => {
    const input = e.target;
    const file = input.files[0];
    if (!file) return;

    setError("");
    setSuccess("");

    if (file.size > 2 * 1024 * 1024) {
      setError("Image must be 2MB or smaller.");
      input.value = "";
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      await authFetch("/users/profile/picture", {
        method: "POST",
        body: formData,
      });
      await loadProfile();
      setSuccess("Profile picture updated.");
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      input.value = "";
    }
  };

  if (loading) {
    return (
      <div className="auth-page">
        <div className="card">
          <p className="subtitle">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="card">
        <h1>My profile</h1>
        <p className="subtitle">Add or change your information.</p>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div style={{ textAlign: "center", marginBottom: "16px" }}>
          {picture ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={picture}
              alt="profile"
              style={{
                width: 96,
                height: 96,
                borderRadius: "50%",
                objectFit: "cover",
              }}
            />
          ) : (
            <div
              style={{
                width: 96,
                height: 96,
                borderRadius: "50%",
                background: "#ddd",
                margin: "0 auto",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 36,
              }}
            >
              {(form.name || "?").charAt(0).toUpperCase()}
            </div>
          )}

          <div style={{ marginTop: 10 }}>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handlePicture}
              disabled={uploading}
            />
            <p className="subtitle">
              {uploading ? "Uploading..." : "jpg, png or webp, max 2MB"}
            </p>
          </div>
        </div>

        <form className="form" onSubmit={handleSave}>
          <div className="field">
            <label htmlFor="name">Name</label>
            <input
              id="name"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="phone">Phone number</label>
            <input
              id="phone"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="01712345678"
            />
          </div>

          <div className="field">
            <label htmlFor="bio">Bio</label>
            <input
              id="bio"
              name="bio"
              value={form.bio}
              onChange={handleChange}
              maxLength={200}
              placeholder="Write something about yourself"
            />
          </div>

          <div className="field">
            <label htmlFor="address">Address</label>
            <input
              id="address"
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="Dhaka, Bangladesh"
            />
          </div>

          <button className="btn" disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </button>
        </form>

        <p className="switch-text">
          <Link href="/dashboard">Back to dashboard</Link>
        </p>
      </div>
    </div>
  );
}