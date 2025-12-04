import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { profileService } from '../../services/profileService'
import toast from 'react-hot-toast'

interface AvatarUploadProps {
  currentAvatarUrl?: string
  onUploadSuccess?: (url: string) => void
}

export function AvatarUpload({ currentAvatarUrl, onUploadSuccess }: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState(currentAvatarUrl)

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0]
      if (!file) return

      setUploading(true)

      try {
        const url = await profileService.uploadAvatar(file)
        setAvatarUrl(url)
        toast.success('Avatar updated!')
        onUploadSuccess?.(url)
      } catch (error: any) {
        console.error('Upload error:', error)
        toast.error(error.message || 'Failed to upload avatar')
      } finally {
        setUploading(false)
      }
    },
    [onUploadSuccess]
  )

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to remove your avatar?')) return

    try {
      setUploading(true)
      await profileService.deleteAvatar()
      setAvatarUrl(undefined)
      toast.success('Avatar removed')
      onUploadSuccess?.(''
)
    } catch (error: any) {
      console.error('Delete error:', error)
      toast.error(error.message || 'Failed to remove avatar')
    } finally {
      setUploading(false)
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
    },
    maxFiles: 1,
    disabled: uploading,
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
      {/* Avatar Preview */}
      <div
        style={{
          width: 120,
          height: 120,
          borderRadius: 999,
          overflow: 'hidden',
          background: avatarUrl
            ? `url(${avatarUrl})`
            : 'linear-gradient(135deg, #14B8A6, #FB923C)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 24px rgba(148,163,184,0.3)',
        }}
      >
        {!avatarUrl && (
          <span style={{ fontSize: 48 }}>
            👤
          </span>
        )}
      </div>

      {/* Upload Area */}
      <div
        {...getRootProps()}
        style={{
          padding: 16,
          borderRadius: 16,
          border: `2px dashed ${isDragActive ? '#14B8A6' : 'rgba(148,163,184,0.3)'}`,
          background: isDragActive ? 'rgba(20,184,166,0.05)' : 'rgba(148,163,184,0.05)',
          textAlign: 'center',
          cursor: uploading ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease',
          width: '100%',
          maxWidth: 300,
        }}
      >
        <input {...getInputProps()} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
          {uploading ? (
            <>
              <div
                style={{
                  width: 24,
                  height: 24,
                  border: '3px solid #14B8A6',
                  borderTopColor: 'transparent',
                  borderRadius: 999,
                  animation: 'spin 0.8s linear infinite',
                }}
              />
              <p className="nm-body" style={{ fontSize: 11, color: '#6b7280' }}>
                Uploading...
              </p>
            </>
          ) : (
            <>
              <p className="nm-body" style={{ fontSize: 12, fontWeight: 600 }}>
                {isDragActive ? 'Drop image here' : 'Click or drag to upload'}
              </p>
              <p className="nm-body" style={{ fontSize: 10, color: '#6b7280' }}>
                PNG, JPG, GIF (max 5MB)
              </p>
            </>
          )}
        </div>
      </div>

      {/* Delete Button */}
      {avatarUrl && !uploading && (
        <button
          type="button"
          className="nm-pill"
          style={{ fontSize: 11, color: '#ef4444' }}
          onClick={handleDelete}
        >
          Remove Avatar
        </button>
      )}

      <style>
        {`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  )
}
