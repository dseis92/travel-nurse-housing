import { useState } from 'react'
import { NeumoCard } from '../../neumo/NeumoKit'
import {
  createListing,
  uploadListingImage,
  type CreateListingInput,
} from '../../services/listingService'
import toast from 'react-hot-toast'

interface CreateListingFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export function CreateListingForm({
  onSuccess,
  onCancel,
}: CreateListingFormProps) {
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadingImages, setUploadingImages] = useState(false)

  // Form state
  const [formData, setFormData] = useState<CreateListingInput>({
    title: '',
    description: '',
    city: '',
    state: '',
    address: '',
    hospital_name: '',
    hospital_city: '',
    hospital_state: '',
    minutes_to_hospital: 10,
    price_per_month: 1500,
    room_type: 'private-room',
    bedrooms: 1,
    bathrooms: 1,
    max_guests: 1,
    tags: [],
    perks: [],
    allows_pets: false,
    parking: 'street',
    ideal_contract_lengths: [13],
  })

  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [imagePreview, setImagePreview] = useState<string[]>([])

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    // Limit to 10 images
    const newFiles = files.slice(0, 10 - selectedImages.length)
    setSelectedImages([...selectedImages, ...newFiles])

    // Create previews
    newFiles.forEach((file) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview((prev) => [...prev, reader.result as string])
      }
      reader.readAsDataURL(file)
    })
  }

  const removeImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index))
    setImagePreview((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true)

      // Upload images first
      let imageUrls: string[] = []
      if (selectedImages.length > 0) {
        setUploadingImages(true)
        const uploadPromises = selectedImages.map((file) =>
          uploadListingImage(file)
        )
        imageUrls = await Promise.all(uploadPromises)
        setUploadingImages(false)
      }

      // Create listing
      await createListing({
        ...formData,
        image_url: imageUrls[0] || undefined,
        image_urls: imageUrls,
      })

      toast.success('Listing created successfully!')
      onSuccess?.()
    } catch (error) {
      console.error('Error creating listing:', error)
      toast.error('Failed to create listing')
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

  const toggleArrayItem = <T,>(
    array: T[],
    item: T,
    setter: (value: T[]) => void
  ) => {
    if (array.includes(item)) {
      setter(array.filter((i) => i !== item))
    } else {
      setter([...array, item])
    }
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 16 }}>
      {/* Progress indicator */}
      <div style={{ marginBottom: 20 }}>
        <div
          style={{
            display: 'flex',
            gap: 8,
            marginBottom: 8,
          }}
        >
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              style={{
                flex: 1,
                height: 4,
                borderRadius: 2,
                background:
                  step >= s
                    ? 'linear-gradient(135deg, #8f63ff, #b088ff)'
                    : '#e0e0e0',
              }}
            />
          ))}
        </div>
        <p className="nm-body" style={{ fontSize: 12, color: '#6b7280' }}>
          Step {step} of 4
        </p>
      </div>

      <NeumoCard>
        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div>
            <h2 className="nm-heading-lg" style={{ fontSize: 18, marginBottom: 16 }}>
              Basic Information
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label className="nm-body" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                  Listing Title*
                </label>
                <input
                  type="text"
                  className="nm-input"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Cozy room near Mayo Clinic"
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
                  placeholder="Describe your space..."
                  rows={4}
                  style={{ width: '100%', resize: 'vertical' }}
                />
              </div>

              <div>
                <label className="nm-body" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                <div>
                  <label className="nm-body" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                    Bedrooms
                  </label>
                  <input
                    type="number"
                    className="nm-input"
                    value={formData.bedrooms}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        bedrooms: parseInt(e.target.value),
                      })
                    }
                    min="0"
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label className="nm-body" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                    Bathrooms
                  </label>
                  <input
                    type="number"
                    className="nm-input"
                    value={formData.bathrooms}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        bathrooms: parseFloat(e.target.value),
                      })
                    }
                    min="0"
                    step="0.5"
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label className="nm-body" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                    Max Guests
                  </label>
                  <input
                    type="number"
                    className="nm-input"
                    value={formData.max_guests}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        max_guests: parseInt(e.target.value),
                      })
                    }
                    min="1"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
            </div>

            <button
              type="button"
              className="nm-pill nm-pill--active"
              style={{ width: '100%', marginTop: 16 }}
              onClick={() => setStep(2)}
              disabled={!formData.title}
            >
              Next
            </button>
          </div>
        )}

        {/* Step 2: Location */}
        {step === 2 && (
          <div>
            <h2 className="nm-heading-lg" style={{ fontSize: 18, marginBottom: 16 }}>
              Location & Hospital
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
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
                    placeholder="Minneapolis"
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
                    placeholder="MN"
                    maxLength={2}
                    style={{ width: '100%', textTransform: 'uppercase' }}
                  />
                </div>
              </div>

              <div>
                <label className="nm-body" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                  Street Address (optional)
                </label>
                <input
                  type="text"
                  className="nm-input"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  placeholder="123 Main St"
                  style={{ width: '100%' }}
                />
              </div>

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
                  placeholder="Mayo Clinic"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 8 }}>
                <div>
                  <label className="nm-body" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                    Hospital City*
                  </label>
                  <input
                    type="text"
                    className="nm-input"
                    value={formData.hospital_city}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        hospital_city: e.target.value,
                      })
                    }
                    placeholder="Rochester"
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
                    value={formData.hospital_state}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        hospital_state: e.target.value,
                      })
                    }
                    placeholder="MN"
                    maxLength={2}
                    style={{ width: '100%', textTransform: 'uppercase' }}
                  />
                </div>
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

              <div style={{ display: 'flex', gap: 8 }}>
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

              <div>
                <label className="nm-body" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                  Parking
                </label>
                <select
                  className="nm-input"
                  value={formData.parking}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      parking: e.target.value as any,
                    })
                  }
                  style={{ width: '100%' }}
                >
                  <option value="street">Street parking</option>
                  <option value="garage">Garage</option>
                  <option value="driveway">Driveway</option>
                  <option value="none">No parking</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button
                type="button"
                className="nm-pill"
                style={{ flex: 1 }}
                onClick={() => setStep(1)}
              >
                Back
              </button>
              <button
                type="button"
                className="nm-pill nm-pill--active"
                style={{ flex: 1 }}
                onClick={() => setStep(3)}
                disabled={
                  !formData.city ||
                  !formData.state ||
                  !formData.hospital_name ||
                  !formData.hospital_city ||
                  !formData.hospital_state
                }
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Amenities & Pricing */}
        {step === 3 && (
          <div>
            <h2 className="nm-heading-lg" style={{ fontSize: 18, marginBottom: 16 }}>
              Amenities & Pricing
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
                          formData.tags || [],
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
                          formData.perks || [],
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
                    min="0"
                    step="50"
                    style={{ width: '100%', paddingLeft: 24 }}
                  />
                </div>
              </div>

              <div>
                <label className="nm-body" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
                  Ideal Contract Lengths (weeks)
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {[4, 8, 13, 26, 52].map((weeks) => (
                    <button
                      key={weeks}
                      type="button"
                      className={
                        'nm-pill ' +
                        (formData.ideal_contract_lengths?.includes(weeks)
                          ? 'nm-pill--active'
                          : '')
                      }
                      style={{ fontSize: 11 }}
                      onClick={() =>
                        toggleArrayItem(
                          formData.ideal_contract_lengths || [],
                          weeks,
                          (lengths) =>
                            setFormData({
                              ...formData,
                              ideal_contract_lengths: lengths.sort((a, b) => a - b),
                            })
                        )
                      }
                    >
                      {weeks} weeks
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button
                type="button"
                className="nm-pill"
                style={{ flex: 1 }}
                onClick={() => setStep(2)}
              >
                Back
              </button>
              <button
                type="button"
                className="nm-pill nm-pill--active"
                style={{ flex: 1 }}
                onClick={() => setStep(4)}
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Photos */}
        {step === 4 && (
          <div>
            <h2 className="nm-heading-lg" style={{ fontSize: 18, marginBottom: 16 }}>
              Add Photos
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label
                  htmlFor="image-upload"
                  style={{
                    display: 'block',
                    padding: 40,
                    border: '2px dashed #d1d5db',
                    borderRadius: 20,
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: '#f9fafb',
                  }}
                >
                  <span className="nm-body" style={{ fontSize: 12, color: '#6b7280' }}>
                    Click to upload images (max 10)
                  </span>
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageSelect}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>

              {imagePreview.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
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
                        alt={`Preview ${index + 1}`}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
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
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button
                type="button"
                className="nm-pill"
                style={{ flex: 1 }}
                onClick={() => setStep(3)}
                disabled={isSubmitting}
              >
                Back
              </button>
              <button
                type="button"
                className="nm-pill nm-pill--active"
                style={{ flex: 2 }}
                onClick={handleSubmit}
                disabled={isSubmitting || uploadingImages}
              >
                {uploadingImages
                  ? 'Uploading images...'
                  : isSubmitting
                  ? 'Creating listing...'
                  : 'Create Listing'}
              </button>
            </div>

            {onCancel && (
              <button
                type="button"
                className="nm-pill"
                style={{ width: '100%', marginTop: 8 }}
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancel
              </button>
            )}
          </div>
        )}
      </NeumoCard>
    </div>
  )
}
