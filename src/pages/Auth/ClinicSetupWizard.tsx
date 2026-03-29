import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from '@/hooks/useForm'
import { useClinic } from '@/hooks/useClinic'
import { LoadingButton } from '@/components/LoadingButton'

export const ClinicSetupWizard = () => {
  const navigate = useNavigate()
  const { createClinic } = useClinic()
  const [step, setStep] = useState<1 | 2 | 3>(1)

  // Step 1: Basic Info
  const basicForm = useForm(
    { name: '', email: '', phone: '' },
    async values => {
      if (step === 1) {
        setStep(2)
      }
    }
  )

  // Step 2: Location
  const locationForm = useForm(
    { address: '', city: '', postal_code: '', country: '' },
    async values => {
      if (step === 2) {
        setStep(3)
      }
    }
  )

  // Step 3: Confirmation & Create
  const confirmForm = useForm({}, async () => {
    const clinic = await createClinic({
      name: basicForm.values.name,
      email: basicForm.values.email,
      phone: basicForm.values.phone,
      address: locationForm.values.address,
      city: locationForm.values.city,
      postal_code: locationForm.values.postal_code,
      country: locationForm.values.country,
      subscription_plan: 'free',
      subscription_status: 'active',
      max_users: 5,
      max_patients: 50,
    })

    if (clinic) {
      navigate('/')
    }
  })

  const handleNext = async (rules: any) => {
    if (basicForm.validate(rules)) {
      setStep(2)
    }
  }

  const handlePrev = () => {
    if (step > 1) {
      setStep((step - 1) as 1 | 2 | 3)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md">
        {/* Progress Indicator */}
        <div className="flex gap-2 mb-8">
          {[1, 2, 3].map(s => (
            <div
              key={s}
              className={`h-2 flex-1 rounded-full transition ${
                s <= step ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>

        {/* Step 1: Basic Information */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Create Your Clinic</h1>
              <p className="text-gray-600 mt-2">Step 1 of 3: Basic Information</p>
            </div>

            <form
              onSubmit={e => {
                e.preventDefault()
                handleNext({ name: { required: true } })
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Clinic Name *
                </label>
                <input
                  type="text"
                  name="name"
                  placeholder="My Dental Clinic"
                  value={basicForm.values.name}
                  onChange={basicForm.handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="clinic@example.com"
                  value={basicForm.values.email}
                  onChange={basicForm.handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  placeholder="+1 (555) 000-0000"
                  value={basicForm.values.phone}
                  onChange={basicForm.handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <LoadingButton
                  type="submit"
                  variant="primary"
                  fullWidth
                  size="lg"
                >
                  Next
                </LoadingButton>
              </div>
            </form>
          </div>
        )}

        {/* Step 2: Location */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Location Details</h1>
              <p className="text-gray-600 mt-2">Step 2 of 3: Where is your clinic?</p>
            </div>

            <form
              onSubmit={e => {
                e.preventDefault()
                setStep(3)
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <input
                  type="text"
                  name="address"
                  placeholder="123 Main Street"
                  value={locationForm.values.address}
                  onChange={locationForm.handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    name="city"
                    placeholder="New York"
                    value={locationForm.values.city}
                    onChange={locationForm.handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Postal Code
                  </label>
                  <input
                    type="text"
                    name="postal_code"
                    placeholder="10001"
                    value={locationForm.values.postal_code}
                    onChange={locationForm.handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country
                </label>
                <input
                  type="text"
                  name="country"
                  placeholder="United States"
                  value={locationForm.values.country}
                  onChange={locationForm.handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={handlePrev}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-900 font-bold py-2 rounded-lg transition"
                >
                  Back
                </button>
                <LoadingButton
                  type="submit"
                  variant="primary"
                  fullWidth
                  size="lg"
                >
                  Next
                </LoadingButton>
              </div>
            </form>
          </div>
        )}

        {/* Step 3: Confirmation */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Review & Create</h1>
              <p className="text-gray-600 mt-2">Step 3 of 3: Confirm your information</p>
            </div>

            <form
              onSubmit={e => {
                e.preventDefault()
                confirmForm.handleSubmit(e)
              }}
              className="space-y-4"
            >
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Clinic Name</p>
                  <p className="font-semibold text-gray-900">{basicForm.values.name}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-semibold text-gray-900">{basicForm.values.email}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-semibold text-gray-900">{basicForm.values.phone}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Address</p>
                  <p className="font-semibold text-gray-900">
                    {locationForm.values.address}, {locationForm.values.city}
                    {locationForm.values.postal_code && ` ${locationForm.values.postal_code}`}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Plan</p>
                  <p className="font-semibold text-gray-900">Free (Up to 50 patients, 5 users)</p>
                </div>
              </div>

              <p className="text-xs text-gray-600">
                By creating a clinic, you agree to our Terms of Service and Privacy Policy.
              </p>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={handlePrev}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-900 font-bold py-2 rounded-lg transition"
                >
                  Back
                </button>
                <LoadingButton
                  type="submit"
                  loading={confirmForm.submitting}
                  variant="primary"
                  fullWidth
                  size="lg"
                >
                  Create Clinic
                </LoadingButton>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
