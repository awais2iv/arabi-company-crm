import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useSelector, useDispatch } from 'react-redux';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const useProfileSettings = () => {
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.token);

  const fetchUserProfile = async () => {
    try {
      if (!token) {
        console.log('No token available');
        return;
      }

      setLoading(true);
      console.log('Fetching user profile with token:', token.substring(0, 20) + '...');
      const response = await axios.get(`${API_BASE_URL}/users/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('User profile response:', response.data);
      console.log('Setting user profile:', response.data.data);
      setUserProfile(response.data.data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      toast.error('Failed to fetch user profile');
    } finally {
      setLoading(false);
    }
  };

  const saveUserProfile = async (userData) => {
    try {
      setLoading(true);
      const response = await axios.patch(`${API_BASE_URL}/users/update-profile`, userData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('Profile update response:', response.data);
      setUserProfile(response.data.data);
      toast.success('Profile updated successfully');
      return true;
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async (passwordData) => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_BASE_URL}/users/change-password`, passwordData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('Password update response:', response.data);
      toast.success('Password updated successfully');
      return true;
    } catch (error) {
      console.error('Error updating password:', error);
      toast.error(error.response?.data?.message || 'Failed to update password');
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchUserProfile();
    }
  }, [token]);

  return {
    loading,
    userProfile,
    saveUserProfile,
    updatePassword,
    refetchUser: fetchUserProfile,
  };
};

export default useProfileSettings;