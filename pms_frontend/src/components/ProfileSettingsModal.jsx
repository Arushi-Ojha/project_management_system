import React, { useState, useRef, useEffect } from 'react';
import { apiCall } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function ProfileSettingsModal({ isOpen, onClose }) {
  const { user, updateUser } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  // Square Cropper state
  const [cropImageSrc, setCropImageSrc] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isHoverDrop, setIsHoverDrop] = useState(false);

  const imageRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (user?.avatarUrl) {
      setAvatarUrl(user.avatarUrl);
    }
  }, [user]);

  if (!isOpen || !user) return null;

  // Handle image file selection / drop
  const handleImageFile = (file) => {
    if (!file || !file.type.startsWith('image/')) {
      setError('Please select a valid image file (PNG, JPG, WebP).');
      return;
    }
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      setCropImageSrc(e.target.result);
      setZoom(1);
      setOffset({ x: 0, y: 0 });
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsHoverDrop(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsHoverDrop(true);
  };

  const handleDragLeave = () => {
    setIsHoverDrop(false);
  };

  // Pan controls in crop box
  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDraggingImage(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e) => {
    if (!isDraggingImage) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDraggingImage(false);
  };

  // Crop application: renders square to canvas and exports base64
  const handleApplyCrop = () => {
    if (!imageRef.current) return;
    const canvas = document.createElement('canvas');
    const cropSize = 256;
    canvas.width = cropSize;
    canvas.height = cropSize;
    const ctx = canvas.getContext('2d');

    const img = imageRef.current;
    const viewportSize = 200; // Displayed square viewport dimension

    // Scale factor from viewport to output canvas
    const scaleRatio = cropSize / viewportSize;

    // Clear background to white
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, cropSize, cropSize);

    // Compute drawing dimensions and offsets
    const drawnWidth = img.naturalWidth * zoom * scaleRatio * (viewportSize / img.naturalWidth);
    const drawnHeight = img.naturalHeight * zoom * scaleRatio * (viewportSize / img.naturalWidth);
    const drawnX = offset.x * scaleRatio;
    const drawnY = offset.y * scaleRatio;

    ctx.drawImage(img, drawnX, drawnY, drawnWidth, drawnHeight);

    const croppedBase64 = canvas.toDataURL('image/jpeg', 0.88);
    setAvatarUrl(croppedBase64);
    setCropImageSrc(null); // Return to standard profile view
  };

  const handleCancelCrop = () => {
    setCropImageSrc(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (password && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password && password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    try {
      setLoading(true);
      const payload = {};
      if (password) payload.password = password;
      if (avatarUrl !== user.avatarUrl) payload.avatarUrl = avatarUrl;

      if (Object.keys(payload).length === 0) {
        setMessage('No modifications made.');
        return;
      }

      await apiCall('/iam/users/me', {
        method: 'PATCH',
        body: payload
      });

      updateUser({ avatarUrl });
      setMessage('Profile updated successfully.');
      setPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setMessage(null);
        onClose();
      }, 1000);
    } catch (err) {
      setError(err.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '580px', width: '92%' }}>
        
        {/* Header */}
        <div className="flex-row justify-between items-center" style={{ borderBottom: '2px solid #000', paddingBottom: '12px', marginBottom: '16px' }}>
          <div>
            <h2 style={{ margin: '0 0 4px 0', fontSize: '20px' }}>Profile & Password Settings</h2>
            <p style={{ margin: 0, fontSize: '13px' }}>
              Update your account password and profile avatar picture.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ fontWeight: 'bold', padding: '6px 14px', fontSize: '13px' }}
          >
            Close [X]
          </button>
        </div>

        {/* Read-only account overview */}
        <div style={{ border: '1px solid #000', padding: '12px', marginBottom: '16px', background: '#fff' }} className="flex-col gap-6">
          <div className="flex-row justify-between items-center">
            <span style={{ fontSize: '14px' }}><strong>Full Name:</strong> {user.name || 'Unnamed'}</span>
            <span style={{ fontSize: '13px', border: '1px solid #000', padding: '2px 6px' }}>Role: [{user.role}]</span>
          </div>
          <p style={{ margin: 0, fontSize: '13px' }}><strong>Email:</strong> {user.email}</p>
          <div className="flex-row gap-16">
            {user.employeeId && <span style={{ fontSize: '13px' }}><strong>Employee ID:</strong> {user.employeeId}</span>}
            {user.position && <span style={{ fontSize: '13px' }}><strong>Position:</strong> {user.position}</span>}
          </div>
        </div>

        {error && (
          <div style={{ border: '2px solid #000', padding: '8px 12px', marginBottom: '12px' }}>
            <p style={{ margin: 0, fontWeight: 'bold', fontSize: '13px' }}>Error: {error}</p>
          </div>
        )}
        {message && (
          <div style={{ border: '2px solid #000', padding: '8px 12px', marginBottom: '12px' }}>
            <p style={{ margin: 0, fontWeight: 'bold', fontSize: '13px' }}>{message}</p>
          </div>
        )}

        {/* SQUARE CROP INTERFACE */}
        {cropImageSrc ? (
          <div style={{ border: '2px solid #000', padding: '16px', marginBottom: '16px' }} className="flex-col gap-12">
            <div className="flex-row justify-between items-center">
              <h3 style={{ margin: 0, fontSize: '16px' }}>Select Square Ratio Crop</h3>
              <span style={{ fontSize: '12px' }}>Drag image to position inside square</span>
            </div>

            <div className="flex-row gap-16 items-center justify-center flex-wrap">
              {/* Square Viewport */}
              <div
                style={{
                  width: '200px',
                  height: '200px',
                  border: '2px solid #000',
                  overflow: 'hidden',
                  position: 'relative',
                  background: '#f0f0f0',
                  cursor: isDraggingImage ? 'grabbing' : 'grab',
                  userSelect: 'none'
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                <img
                  ref={imageRef}
                  src={cropImageSrc}
                  alt="Crop preview"
                  draggable={false}
                  style={{
                    position: 'absolute',
                    left: `${offset.x}px`,
                    top: `${offset.y}px`,
                    width: `${200 * zoom}px`,
                    maxWidth: 'none',
                    display: 'block',
                    pointerEvents: 'none'
                  }}
                />
              </div>

              {/* Real-time Circular Mask Preview */}
              <div className="flex-col items-center gap-6">
                <span style={{ fontSize: '13px', fontWeight: 'bold' }}>Circular Mask Preview:</span>
                <div
                  style={{
                    width: '120px',
                    height: '120px',
                    borderRadius: '50%',
                    border: '2px solid #000',
                    overflow: 'hidden',
                    position: 'relative',
                    background: '#f0f0f0'
                  }}
                >
                  <img
                    src={cropImageSrc}
                    alt="Circular preview"
                    draggable={false}
                    style={{
                      position: 'absolute',
                      left: `${offset.x * 0.6}px`,
                      top: `${offset.y * 0.6}px`,
                      width: `${120 * zoom}px`,
                      maxWidth: 'none',
                      display: 'block'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Zoom Slider */}
            <div className="flex-row items-center gap-12" style={{ marginTop: '8px' }}>
              <label style={{ fontSize: '13px', margin: 0, fontWeight: 'bold' }}>Zoom Scale:</label>
              <input
                type="range"
                min="0.5"
                max="3.0"
                step="0.05"
                value={zoom}
                onChange={e => setZoom(parseFloat(e.target.value))}
                style={{ flex: 1 }}
              />
              <span style={{ fontSize: '12px', minWidth: '40px' }}>{zoom.toFixed(1)}x</span>
            </div>

            {/* Crop Action Buttons */}
            <div className="flex-row justify-end gap-12" style={{ marginTop: '10px' }}>
              <button
                type="button"
                onClick={handleCancelCrop}
                style={{ padding: '6px 14px', fontSize: '13px' }}
              >
                Cancel Crop
              </button>
              <button
                type="button"
                onClick={handleApplyCrop}
                style={{ fontWeight: 'bold', padding: '6px 16px', fontSize: '14px' }}
              >
                Apply Square Crop
              </button>
            </div>
          </div>
        ) : (
          /* STANDARD FORM WITH DRAG-AND-DROP UPLOAD & CIRCULAR DISPLAY */
          <form onSubmit={handleSubmit} className="flex-col gap-16">
            
            {/* Profile Picture Section */}
            <div>
              <label style={{ fontSize: '14px', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>
                Profile Avatar Picture:
              </label>

              <div className="flex-row gap-20 items-center flex-wrap">
                {/* Circular Display (Bigger Size: 120px) */}
                <div className="flex-col items-center gap-4">
                  <div
                    style={{
                      width: '120px',
                      height: '120px',
                      borderRadius: '50%',
                      border: '3px solid #000',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: '#fff'
                    }}
                  >
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt="Profile Avatar"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <span style={{ fontSize: '13px', fontWeight: 'bold', textAlign: 'center', padding: '4px' }}>
                        No Avatar Set
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 'bold' }}>Circular Display</span>
                </div>

                {/* Drag and Drop Upload Area */}
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    flex: 1,
                    minWidth: '220px',
                    border: isHoverDrop ? '2px dashed #000' : '1px dashed #000',
                    padding: '16px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: isHoverDrop ? '#f9f9f9' : '#fff'
                  }}
                  className="flex-col gap-6 items-center justify-center"
                >
                  <p style={{ margin: 0, fontSize: '13px', fontWeight: 'bold' }}>
                    Drag & Drop image here, or click to upload
                  </p>
                  <p style={{ margin: 0, fontSize: '11px' }}>
                    Allows selecting a square crop for circular display
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleImageFile(e.target.files[0]);
                      }
                    }}
                    style={{ display: 'none' }}
                  />
                </div>
              </div>

              {/* Or Direct Avatar URL */}
              <div style={{ marginTop: '8px' }}>
                <span style={{ fontSize: '12px' }}>Or enter Image Web URL:</span>
                <input
                  type="text"
                  value={avatarUrl.startsWith('data:') ? '[Cropped Picture Data Attached]' : avatarUrl}
                  onChange={e => setAvatarUrl(e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                  style={{ fontSize: '13px', marginTop: '4px' }}
                />
              </div>
            </div>

            {/* Password Change Section */}
            <div style={{ borderTop: '1px solid #000', paddingTop: '12px' }} className="flex-col gap-10">
              <label style={{ fontSize: '14px', fontWeight: 'bold', margin: 0 }}>
                Change Password (Leave blank to keep unchanged):
              </label>

              <div>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="New password (minimum 6 characters)"
                  style={{ fontSize: '14px', padding: '8px 10px' }}
                />
              </div>

              <div>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  style={{ fontSize: '14px', padding: '8px 10px' }}
                />
              </div>
            </div>

            {/* Form Footer Action Buttons */}
            <div className="flex-row justify-end gap-14" style={{ borderTop: '1px solid #000', paddingTop: '14px', marginTop: '4px' }}>
              <button
                type="button"
                onClick={onClose}
                style={{ padding: '8px 18px', fontSize: '14px' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{ fontWeight: 'bold', padding: '8px 20px', fontSize: '14px' }}
              >
                {loading ? 'Saving Profile...' : 'Save Profile Changes'}
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
}
