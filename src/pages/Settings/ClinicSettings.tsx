import { useState } from 'react'
import { useClinic } from '@/hooks/useClinic'
import { useForm } from '@/hooks/useForm'
import { LoadingButton } from '@/components/LoadingButton'
import { Skeleton } from '@/components/Skeleton'
import { EmptyState } from '@/components/EmptyState'
import { canManage, isAdmin } from '@/utils/permissions'
import { useAuth } from '@/context/AuthContext'

export const ClinicSettings = () => {
  const { profile } = useAuth()
  const { clinic, team, loading, updateClinic, addTeamMember, removeTeamMember } = useClinic()
  const [activeTab, setActiveTab] = useState<'general' | 'team' | 'subscription'>('general')
  const [showAddTeamModal, setShowAddTeamModal] = useState(false)

  // General settings form
  const generalForm = useForm(
    clinic
      ? {
          name: clinic.name,
          email: clinic.email || '',
          phone: clinic.phone || '',
          address: clinic.address || '',
          city: clinic.city || '',
          postal_code: clinic.postal_code || '',
          website: clinic.website || '',
        }
      : {},
    async values => {
      if (clinic) {
        await updateClinic(clinic.id, values)
      }
    }
  )

  // Add team member form
  const teamForm = useForm(
    { email: '', role: 'assistant' as 'admin' | 'assistant' },
    async values => {
      if (clinic && values.email) {
        await addTeamMember(clinic.id, values.email, values.role)
        teamForm.reset()
        setShowAddTeamModal(false)
      }
    }
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <Skeleton count={5} height="h-12" />
        </div>
      </div>
    )
  }

  if (!clinic) {
    return (
      <EmptyState
        icon="🏥"
        title="No clinic found"
        description="You are not assigned to a clinic"
      />
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Clinic Settings</h1>
          <p className="text-gray-600 mt-1">{clinic.name}</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b">
            <div className="flex gap-8 px-6">
              {(['general', 'team', 'subscription'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 px-0 font-medium border-b-2 transition ${
                    activeTab === tab
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab === 'general'
                    ? '⚙️ General'
                    : tab === 'team'
                    ? '👥 Team'
                    : '💳 Subscription'}
                </button>
              ))}
            </div>
          </div>

          {/* General Tab */}
          {activeTab === 'general' && (
            <div className="p-6 space-y-6">
              <form
                onSubmit={e =>
                  generalForm.handleSubmit(e, {
                    name: { required: true },
                  })
                }
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Clinic Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={generalForm.values.name}
                    onChange={generalForm.handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={generalForm.values.email}
                      onChange={generalForm.handleChange}
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
                      value={generalForm.values.phone}
                      onChange={generalForm.handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={generalForm.values.address}
                    onChange={generalForm.handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={generalForm.values.city}
                      onChange={generalForm.handleChange}
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
                      value={generalForm.values.postal_code}
                      onChange={generalForm.handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Website
                    </label>
                    <input
                      type="url"
                      name="website"
                      value={generalForm.values.website}
                      onChange={generalForm.handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <LoadingButton
                    type="submit"
                    loading={generalForm.submitting}
                    variant="primary"
                    size="lg"
                  >
                    Save Changes
                  </LoadingButton>
                </div>
              </form>
            </div>
          )}

          {/* Team Tab */}
          {activeTab === 'team' && (
            <div className="p-6 space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Team Members</h3>
                {isAdmin(profile) && (
                  <LoadingButton
                    onClick={() => setShowAddTeamModal(true)}
                    variant="primary"
                  >
                    + Invite Member
                  </LoadingButton>
                )}
              </div>

              {team.length === 0 ? (
                <EmptyState
                  icon="👥"
                  title="No team members"
                  description="Add team members to collaborate"
                  size="sm"
                />
              ) : (
                <div className="space-y-3">
                  {team.map(member => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{member.full_name}</p>
                        <p className="text-sm text-gray-600">{member.email}</p>
                        <span className="inline-block mt-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                          {member.role}
                        </span>
                      </div>

                      {isAdmin(profile) && member.id !== profile?.id && (
                        <LoadingButton
                          onClick={() => removeTeamMember(clinic.id, member.id)}
                          variant="danger"
                          size="sm"
                        >
                          Remove
                        </LoadingButton>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Subscription Tab */}
          {activeTab === 'subscription' && (
            <div className="p-6">
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 text-lg capitalize">
                        {clinic.subscription_plan || 'Free'} Plan
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Status: <span className="font-medium">{clinic.subscription_status}</span>
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        clinic.subscription_status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {clinic.subscription_status}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm">
                    {clinic.max_users && (
                      <p>
                        👥 Team Members: <span className="font-medium">Up to {clinic.max_users}</span>
                      </p>
                    )}
                    {clinic.max_patients && (
                      <p>
                        👨‍⚕️ Patients: <span className="font-medium">Up to {clinic.max_patients}</span>
                      </p>
                    )}
                  </div>
                </div>

                {isAdmin(profile) && (
                  <div>
                    <LoadingButton variant="primary">
                      Upgrade Plan
                    </LoadingButton>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Team Member Modal */}
      {showAddTeamModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-6">Invite Team Member</h2>

            <form
              onSubmit={e =>
                teamForm.handleSubmit(e, {
                  email: { required: true, email: true },
                })
              }
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={teamForm.values.email}
                  onChange={teamForm.handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="member@example.com"
                />
                {teamForm.touched.email && teamForm.errors.email && (
                  <p className="text-red-500 text-sm mt-1">{teamForm.errors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <select
                  name="role"
                  value={teamForm.values.role}
                  onChange={teamForm.handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="assistant">Assistant</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="flex gap-4">
                <LoadingButton
                  type="submit"
                  loading={teamForm.submitting}
                  fullWidth
                  variant="primary"
                >
                  Send Invitation
                </LoadingButton>
                <button
                  type="button"
                  onClick={() => setShowAddTeamModal(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-900 px-4 py-2 rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
