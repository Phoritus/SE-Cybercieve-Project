import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/src/api/axios';

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    username: '',
    first_name: '',
    last_name: '',
    email: ''
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await api.get('/me');
        // The /me endpoint returns the token payload, which might not have all details if they were updated recently.
        // Ideally /me should return the fresh DB user.
        // But our /me implementation returns payload from token.
        // Wait, api/users.py: get_current_user returns payload.
        // Payload comes from AuthService.verify_token.
        // We need to fetch the actual user details from DB to edit them.

        // Let's assume we can use the email from /me to fetch details? 
        // Or we should update /me to return DB user.
        // For now, let's try to fetch from /users if we can filter? No.

        // Actually, the plan didn't specify changing /me. 
        // But to edit profile, we need current values.
        // If /me only returns token payload, it might be stale.
        // However, for now, let's use what we have.
        // If /me returns email, we can't easily get other fields if they aren't in token.

        // Let's check what verify_token returns. It returns jwt.decode payload.
        // Supabase JWT contains user_metadata.

        // If we want to edit "local" DB fields (username, first_name, last_name), we need to fetch them from OUR DB.
        // We don't have a "get my profile" endpoint that returns DB user.
        // We should probably add one or update /me.

        // Let's assume for this step we will just fetch /me and if it lacks data, we might show empty.
        // BUT, we really should have a way to get current DB user.
        // Let's add GET /me/profile to backend? Or just update GET /me to return DB user?
        // Updating GET /me to return DB user is better.

        // For now, I'll write the frontend code assuming /me returns the DB user or we can get it.
        // If I update /me in backend, I should do that.

        // Let's stick to the plan. I'll write this file, then I might need to update backend /me.
        setFormData({
          username: response.data.username || '',
          first_name: response.data.first_name || '',
          last_name: response.data.last_name || '',
          email: response.data.email || ''
        });
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch profile', err);
        setError('Failed to load profile');
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await api.put('/me', {
        username: formData.username || null,
        first_name: formData.first_name,
        last_name: formData.last_name || null
      });
      setSuccess('Profile updated successfully!');
    } catch (err: any) {
      console.error('Failed to update profile', err);
      setError(err.response?.data?.detail || 'Failed to update profile');
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">Edit Profile</h1>

        {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
        {success && <div className="bg-green-100 text-green-700 p-3 rounded mb-4">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 font-bold mb-2">Email</label>
            <input
              type="text"
              value={formData.email}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 font-bold mb-2">Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Username (optional)"
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 font-bold mb-2">First Name</label>
            <input
              type="text"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="First Name"
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 font-bold mb-2">Last Name</label>
            <input
              type="text"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Last Name (optional)"
            />
          </div>

          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="text-gray-600 hover:text-gray-800 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 transition duration-200"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;
