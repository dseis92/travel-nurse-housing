import { useAuthStore } from '../../stores/authStore';
import { DocumentUpload } from './DocumentUpload';
import type { VerificationStatus } from '../../types';

export function NurseVerification() {
  const { profile } = useAuthStore();

  if (!profile || profile.role !== 'nurse') {
    return null;
  }

  const status: VerificationStatus = profile.licenseStatus || 'unverified';

  const getStatusDisplay = () => {
    switch (status) {
      case 'verified':
        return {
          color: 'green',
          icon: '✓',
          title: 'Verified Nurse',
          description: 'Your nursing license has been verified',
        };
      case 'pending':
        return {
          color: 'yellow',
          icon: '⏳',
          title: 'Verification Pending',
          description: 'Your documents are under review (usually 1-2 business days)',
        };
      case 'rejected':
        return {
          color: 'red',
          icon: '✗',
          title: 'Verification Failed',
          description: 'Please upload a valid nursing license',
        };
      default:
        return {
          color: 'gray',
          icon: '!',
          title: 'Verification Required',
          description: 'Upload your nursing license to get verified',
        };
    }
  };

  const statusDisplay = getStatusDisplay();

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 space-y-6">
      {/* Status Badge */}
      <div className="flex items-start gap-4">
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold ${
            statusDisplay.color === 'green'
              ? 'bg-green-100 text-green-600'
              : statusDisplay.color === 'yellow'
              ? 'bg-yellow-100 text-yellow-600'
              : statusDisplay.color === 'red'
              ? 'bg-red-100 text-red-600'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          {statusDisplay.icon}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-800">{statusDisplay.title}</h3>
          <p className="text-gray-600 mt-1">{statusDisplay.description}</p>
        </div>
      </div>

      {/* Upload Section - only show if not verified or pending */}
      {status !== 'verified' && status !== 'pending' && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Why verify your license?</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Get a "Verified Nurse" badge on your profile</li>
              <li>• Hosts are 3x more likely to accept verified nurses</li>
              <li>• Faster booking approvals</li>
              <li>• Access to exclusive listings</li>
            </ul>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Upload Nursing License
            </label>
            <DocumentUpload documentType="nursing_license" />
          </div>

          <p className="text-xs text-gray-500">
            Accepted formats: PNG, JPG, PDF. Your license will be reviewed within 1-2 business
            days. We protect your information and only use it for verification purposes.
          </p>
        </div>
      )}

      {/* Verified Badge Display */}
      {status === 'verified' && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
              <svg
                className="w-10 h-10 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="text-xl font-bold text-green-900">You're verified!</h4>
              <p className="text-green-700 mt-1">
                Hosts can see your verified badge when you request bookings
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Pending Status Display */}
      {status === 'pending' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <p className="text-yellow-800 text-sm">
            We'll notify you via email once your verification is complete. This usually takes 1-2
            business days.
          </p>
        </div>
      )}
    </div>
  );
}
