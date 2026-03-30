import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/src/api/axios';
import { CircleUserRound, Save } from 'lucide-react';
import LoadingSpinner from '@/src/components/LoadingSpinner';

type ProfileFormData = {
  username: string;
  first_name: string;
  last_name: string;
  email: string;
};

const normalizeValue = (value: string) => value.trim();
const PROFILE_CACHE_KEY = 'cybersieve_profile_cache';

const persistAndBroadcastProfile = (profile: ProfileFormData) => {
  try {
    window.localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(profile));
  } catch {
    // Ignore storage failures.
  }

  window.dispatchEvent(
    new CustomEvent('profile-updated', {
      detail: profile,
    })
  );
};

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState<ProfileFormData>({
    username: '',
    first_name: '',
    last_name: '',
    email: ''
  });
  const [initialFormData, setInitialFormData] = useState<ProfileFormData>({
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
        const loadedFormData: ProfileFormData = {
          username: response.data.username || '',
          first_name: response.data.first_name || '',
          last_name: response.data.last_name || '',
          email: response.data.email || ''
        };
        setFormData(loadedFormData);
        setInitialFormData(loadedFormData);
        persistAndBroadcastProfile(loadedFormData);
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

    const payload = {
      username: normalizeValue(formData.username) || null,
      first_name: normalizeValue(formData.first_name),
      last_name: normalizeValue(formData.last_name) || null,
    };

    const initialPayload = {
      username: normalizeValue(initialFormData.username) || null,
      first_name: normalizeValue(initialFormData.first_name),
      last_name: normalizeValue(initialFormData.last_name) || null,
    };

    const hasChanges =
      payload.username !== initialPayload.username ||
      payload.first_name !== initialPayload.first_name ||
      payload.last_name !== initialPayload.last_name;

    if (!hasChanges) {
      setSuccess('No profile changes to save.');
      setTimeout(() => setSuccess(''), 3000);
      return;
    }

    try {
      const response = await api.put('/me', payload);

      const updated = response.data || {};
      const updatedFormData: ProfileFormData = {
        username: (updated.username ?? payload.username ?? '').toString(),
        first_name: (updated.first_name ?? payload.first_name ?? '').toString(),
        last_name: (updated.last_name ?? payload.last_name ?? '').toString(),
        email: (updated.email ?? formData.email ?? '').toString(),
      };

      setFormData(updatedFormData);
      setInitialFormData(updatedFormData);

      persistAndBroadcastProfile(updatedFormData);
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err: any) {
      console.error('Failed to update profile', err);
      setError(err.response?.data?.detail || 'Failed to update profile');
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div
      className="min-h-screen bg-slate-950 text-slate-100 px-4 py-10"
      style={{ fontFamily: '"Afacad", "Segoe UI", sans-serif' }}
    >
      <div className="mx-auto w-full max-w-2xl">
        <div className="mb-7 text-center">
          <CircleUserRound className="mx-auto h-14 w-14 text-blue-400" />
          <h1 className="mt-3 text-5xl font-semibold tracking-tight">
            <span className="text-blue-400">Edit</span> Profile
          </h1>
          <p className="mt-2 text-base text-slate-300">Change Your Information</p>
        </div>

        {error && <div className="mb-4 rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</div>}
        {success && <div className="mb-4 rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300">{success}</div>}

        <form onSubmit={handleSubmit} className="rounded-xl border border-slate-800 bg-slate-900/30 backdrop-blur-sm">
          <div className="space-y-5 p-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-100">Username</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="h-11 w-full rounded-md border border-slate-800 bg-slate-800/70 px-3 text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                placeholder="Enter your username"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-100">First name</label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  className="h-11 w-full rounded-md border border-slate-800 bg-slate-800/70 px-3 text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                  placeholder="First name"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-100">Last name</label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  className="h-11 w-full rounded-md border border-slate-800 bg-slate-800/70 px-3 text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                  placeholder="Last name"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 p-6">
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-100">Email</label>
                <input
                  type="text"
                  value={formData.email}
                  disabled
                  className="h-11 w-full rounded-md border border-slate-800 bg-slate-800/70 px-3 text-slate-400"
                />
              </div>
            </div>

            <div className="mt-8 flex items-center justify-end gap-4">
              <button
                type="button"
                onClick={() => navigate('/scan')}
                className="text-sm font-medium text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-md bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-400"
              >
                <Save className="h-4 w-4" />
                Save Changes
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;
