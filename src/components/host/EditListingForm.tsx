import { useState } from 'react'
import { NeumoCard } from '../../neumo/NeumoKit'
import {
  updateListing,
  uploadListingImage,
  deleteListingImage,
  type Listing,
  type UpdateListingInput,
} from '../../services/listingService'
import toast from 'react-hot-toast'

interface EditListingFormProps {
  listing: Listing
  onSuccess?: () => void
  onCancel?: () => void
}

export function EditListingForm({
  listing,
  onSuccess,
  onCancel,
}: EditListingFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadingImages, setUploadingImages] = useState(false)

  // Form state - initialize with listing data
  const [formData, setFormData] = useState<UpdateListingInput>({
    title: listing.title,
    description: '',
    city: listing.city,
    state: listing.state,
    hospital_name: listing.hospitalName,
    hospital_city: listing.hospitalCity,
    hospital_state: listing.hospitalState,
    minutes_to_hospital: listing.minutesToHospital,
    price_per_month: listing.pricePerMonth,
    room_type: listing.roomType,
    tags: listing.tags,
    perks: listing.perks,
    allows_pets: listing.allowsPets,
    parking: listing.parking,
    ideal_contract_lengths: listing.contractLengths,
  })

  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [imagePreview, setImagePreview] = useState<string[]>([])
  const [existingImages, setExistingImages] = useState<string[]>(
    listing.imageUrl ? [listing.imageUrl] : []
  )

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    const totalImages = existingImages.length + selectedImages.length + files.length
    if (totalImages > 10) {
      toast.error('Maximum 10 images allowed')
      return
    }

    setSelectedImages([...selectedImages, ...files])

    files.forEach((file) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview((prev) => [...prev, reader.result as string])
      }
      reader.readAsDataURL(file)
    })
  }

  const removeNewImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index))
    setImagePreview((prev) => prev.filter((_, i) => i !== index))
  }

  const removeExistingImage = async (imageUrl: string) => {
    try {
      await deleteListingImage(imageUrl)
      setExistingImages((prev) => prev.filter((url) => url !== imageUrl))
      toast.success('Image removed')
    } catch (error) {
      console.error('Error removing image:', error)
      toast.error('Failed to remove image')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setIsSubmitting(true)

      // Upload new images
      let newImageUrls: string[] = []
      if (selectedImages.length > 0) {
        setUploadingImages(true)
        const uploadPromises = selectedImages.map((file) =>
          uploadListingImage(file, listing.id.toString())
        )
        newImageUrls = await Promise.all(uploadPromises)
        setUploadingImages(false)
      }

      // Combine existing and new images
      const allImageUrls = [...existingImages, ...newImageUrls]

      // Update listing
      await updateListing(listing.id.toString(), {
        ...formData,
        image_url: allImageUrls[0] || undefined,
        image_urls: allImageUrls,
      })

      toast.success('Listing updated successfully!')
      onSuccess?.()
    } catch (error) {
      console.error('Error updating listing:', error)
      toast.error('Failed to update listing')
    } finally {
      setIsSubmitting(false)
      setUploadingImages(false)
    }
  }

  const amenityOptions = [
    'WiFi',
    'Kitchen',
    'Washer',
    'Dryer',
    'AC',
    'Heating',
    'TV',
    'Workspace',
    'Parking',
  ]

  const perkOptions = [
    'Quiet neighborhood',
    'Close to grocery stores',
    'Gym nearby',
    'Public transit',
    'Safe area',
    'Walkable',
  ]

  const toggleArrayItem = (
    array: string[] | undefined,
    item: string,
    setter: (value: string[]) => void
  ) => {
    const arr = array || []
    if (arr.includes(item)) {
      setter(arr.filter((i) => i !== item))
    } else {
      setter([...arr, item])
    }
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 16 }}>
      <NeumoCard>
        <form onSubmit={handleSubmit}>
          <h2 className="nm-heading-lg" style={{ fontSize: 18, marginBottom: 16 }}>
            Edit Listing
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Basic Info */}
            <div>
              <label className="nm-body" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                Title*
              </label>
              <input
                type="text"
                className="nm-input"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label className="nm-body" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                Description
              </label>
              <textarea
                className="nm-input"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={4}
                style={{ width: '100%', resize: 'vertical' }}
              />
            </div>

            {/* Location */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 8 }}>
              <div>
                <label className="nm-body" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                  City*
                </label>
                <input
                  type="text"
                  className="nm-input"
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                  required
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <label className="nm-body" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                  State*
                </label>
                <input
                  type="text"
                  className="nm-input"
                  value={formData.state}
                  onChange={(e) =>
                    setFormData({ ...formData, state: e.target.value })
                  }
                  required
                  maxLength={2}
                  style={{ width: '100%', textTransform: 'uppercase' }}
                />
              </div>
            </div>

            {/* Hospital */}
            <div>
              <label className="nm-body" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                Nearest Hospital*
              </label>
              <input
                type="text"
                className="nm-input"
                value={formData.hospital_name}
                onChange={(e) =>
                  setFormData({ ...formData, hospital_name: e.target.value })
                }
                required
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label className="nm-body" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                Minutes to Hospital: {formData.minutes_to_hospital}
              </label>
              <input
                type="range"
                min="1"
                max="60"
                value={formData.minutes_to_hospital}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    minutes_to_hospital: parseInt(e.target.value),
                  })
                }
                style={{ width: '100%' }}
              />
            </div>

            {/* Pricing */}
            <div>
              <label className="nm-body" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                Monthly Price*
              </label>
              <div style={{ position: 'relative' }}>
                <span
                  style={{
                    position: 'absolute',
                    left: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: 14,
                    color: '#6b7280',
                  }}
                >
                  $
                </span>
                <input
                  type="number"
                  className="nm-input"
                  value={formData.price_per_month}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      price_per_month: parseInt(e.target.value),
                    })
                  }
                  required
                  min="0"
                  step="50"
                  style={{ width: '100%', paddingLeft: 24 }}
                />
              </div>
            </div>

            {/* Room Type */}
            <div>
              <label className="nm-body" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
                Room Type*
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                {[
                  { value: 'entire-place', label: 'Entire Place' },
                  { value: 'private-room', label: 'Private Room' },
                  { value: 'shared', label: 'Shared Room' },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={
                      'nm-pill ' +
                      (formData.room_type === option.value
                        ? 'nm-pill--active'
                        : '')
                    }
                    style={{ flex: 1, fontSize: 11 }}
                    onClick={() =>
                      setFormData({
                        ...formData,
                        room_type: option.value as any,
                      })
                    }
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Amenities */}
            <div>
              <label className="nm-body" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
                Amenities
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {amenityOptions.map((amenity) => (
                  <button
                    key={amenity}
                    type="button"
                    className={
                      'nm-pill ' +
                      (formData.tags?.includes(amenity)
                        ? 'nm-pill--active'
                        : '')
                    }
                    style={{ fontSize: 11 }}
                    onClick={() =>
                      toggleArrayItem(
                        formData.tags,
                        amenity,
                        (tags) => setFormData({ ...formData, tags })
                      )
                    }
                  >
                    {amenity}
                  </button>
                ))}
              </div>
            </div>

            {/* Perks */}
            <div>
              <label className="nm-body" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
                Perks
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {perkOptions.map((perk) => (
                  <button
                    key={perk}
                    type="button"
                    className={
                      'nm-pill ' +
                      (formData.perks?.includes(perk) ? 'nm-pill--active' : '')
                    }
                    style={{ fontSize: 11 }}
                    onClick={() =>
                      toggleArrayItem(
                        formData.perks,
                        perk,
                        (perks) => setFormData({ ...formData, perks })
                      )
                    }
                  >
                    {perk}
                  </button>
                ))}
              </div>
            </div>

            {/* Options */}
            <div style={{ display: 'flex', gap: 12 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input
                  type="checkbox"
                  checked={formData.allows_pets}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      allows_pets: e.target.checked,
                    })
                  }
                />
                <span className="nm-body" style={{ fontSize: 12 }}>
                  Pets allowed
                </span>
              </label>
            </div>

            {/* Images */}
            <div>
              <label className="nm-body" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
                Photos
              </label>

              {/* Existing images */}
              {existingImages.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                  {existingImages.map((url, index) => (
                    <div
                      key={url}
                      style={{
                        position: 'relative',
                        borderRadius: 12,
                        overflow: 'hidden',
                        aspectRatio: '4/3',
                      }}
                    >
                      <img
                        src={url}
                        alt={`Existing ${index + 1}`}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => removeExistingImage(url)}
                        style={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          width: 24,
                          height: 24,
                          borderRadius: 999,
                          border: 'none',
                          background: 'rgba(0,0,0,0.6)',
                          color: 'white',
                          cursor: 'pointer',
                          fontSize: 12,
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* New image previews */}
              {imagePreview.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                  {imagePreview.map((preview, index) => (
                    <div
                      key={index}
                      style={{
                        position: 'relative',
                        borderRadius: 12,
                        overflow: 'hidden',
                        aspectRatio: '4/3',
                      }}
                    >
                      <img
                        src={preview}
                        alt={`New ${index + 1}`}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => removeNewImage(index)}
                        style={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          width: 24,
                          height: 24,
                          borderRadius: 999,
                          border: 'none',
                          background: 'rgba(0,0,0,0.6)',
                          color: 'white',
                          cursor: 'pointer',
                          fontSize: 12,
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload button */}
              <label
                htmlFor="image-upload-edit"
                style={{
                  display: 'block',
                  padding: 20,
                  border: '2px dashed #d1d5db',
                  borderRadius: 12,
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: '#f9fafb',
                }}
              >
                <span className="nm-body" style={{ fontSize: 11, color: '#6b7280' }}>
                  + Add more images
                </span>
                <input
                  id="image-upload-edit"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageSelect}
                  style={{ display: 'none' }}
                />
              </label>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              {onCancel && (
                <button
                  type="button"
                  className="nm-pill"
                  style={{ flex: 1 }}
                  onClick={onCancel}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                className="nm-pill nm-pill--active"
                style={{ flex: 2 }}
                disabled={isSubmitting || uploadingImages}
              >
                {uploadingImages
                  ? 'Uploading images...'
                  : isSubmitting
                  ? 'Saving...'
                  : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </NeumoCard>
    </div>
  )
}
