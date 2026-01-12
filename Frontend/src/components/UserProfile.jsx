"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../hooks/useAuth"
import { userAPI } from "../services/api"
import { getErrorMessage } from "../utils/errors"
import "../styles/UserProfile.css"

export default function UserProfile({ onClose }) {
  const { user, logout } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [showPasswordChange, setShowPasswordChange] = useState(false)
  const [username, setUsername] = useState(user?.username || "")
  const [email, setEmail] = useState(user?.email || "")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    setUsername(user?.username || "")
    setEmail(user?.email || "")
  }, [user])

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setLoading(true)

    try {
      await userAPI.updateProfile(username, email)
      setSuccess("Profile updated successfully")
      setIsEditing(false)
      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match")
      return
    }

    setLoading(true)

    try {
      await userAPI.changePassword(currentPassword, newPassword, confirmPassword)
      setSuccess("Password changed successfully")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setShowPasswordChange(false)
      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="user-profile-modal">
      <div className="profile-overlay" onClick={onClose}></div>
      <div className="profile-container">
        <div className="profile-header">
          <h2>User Profile</h2>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <div className="profile-content">
          <div className="user-avatar-large">
            <i className="fa-solid fa-user"></i>
          </div>

          {!isEditing && !showPasswordChange ? (
            <div className="profile-info">
              <div className="info-row">
                <label>Username</label>
                <p>{user?.username}</p>
              </div>
              <div className="info-row">
                <label>Email</label>
                <p>{user?.email}</p>
              </div>
              <div className="profile-actions">
                <button className="edit-btn" onClick={() => setIsEditing(true)}>
                  <i className="fa-solid fa-pen"></i> Edit Profile
                </button>
                <button className="password-btn" onClick={() => setShowPasswordChange(true)}>
                  <i className="fa-solid fa-key"></i> Change Password
                </button>
              </div>
            </div>
          ) : isEditing ? (
            <form onSubmit={handleUpdateProfile} className="profile-form">
              <div className="form-group">
                <label>Username</label>
                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} disabled={loading} />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} />
              </div>
              <div className="form-actions">
                <button type="submit" className="save-btn" disabled={loading}>
                  {loading ? "Saving..." : "Save Changes"}
                </button>
                <button type="button" className="cancel-btn" onClick={() => setIsEditing(false)} disabled={loading}>
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleChangePassword} className="profile-form">
              <div className="form-group">
                <label>Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label>New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="save-btn" disabled={loading}>
                  {loading ? "Changing..." : "Change Password"}
                </button>
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setShowPasswordChange(false)}
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="profile-footer">
            <button className="logout-btn-modal" onClick={logout}>
              <i className="fa-solid fa-arrow-right-from-bracket"></i> Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
