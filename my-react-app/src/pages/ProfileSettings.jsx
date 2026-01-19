import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { User } from 'lucide-react';
import UserInfo from '../components/profile/UserInfo';
import PasswordChangeForm from '../components/profile/PasswordChangeForm';
import useProfileSettings from '../hooks/useProfileSettings';

const ProfileSettings = () => {
  const { user } = useSelector((state) => state.auth);
  const { loading, userProfile, saveUserProfile, updatePassword } = useProfileSettings();

  // Redirect if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
            <User className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
            <p className="text-sm text-gray-600">Manage your account information and security preferences</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-6">
        <UserInfo
          userProfile={userProfile}
          onSave={saveUserProfile}
          loading={loading}
        />

        <PasswordChangeForm
          onSave={updatePassword}
          loading={loading}
        />
      </div>
    </div>
  );
};

export default ProfileSettings;