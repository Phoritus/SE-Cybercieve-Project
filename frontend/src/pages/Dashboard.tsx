import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const Dashboard: React.FC = () => {
  const { logout } = useAuth();
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.get('/users');
        setUsers(response.data);
      } catch (err) {
        console.error('Failed to fetch users', err);
      }
    };

    fetchUsers();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
          <button
            onClick={logout}
            className="bg-red-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-600 transition duration-200"
          >
            Logout
          </button>
        </div>
        <div className="mb-6 flex justify-between items-center">
            <p className="text-gray-600">Welcome! You are logged in.</p>
            <Link to="/profile" className="text-blue-500 hover:text-blue-700 font-semibold">Edit Profile</Link>
        </div>
        
        <h3 className="text-xl font-semibold text-gray-700 mb-4">User List (from local DB)</h3>
        <ul className="space-y-2">
          {users.map((user: any) => (
            <li key={user.id} className="bg-gray-50 p-3 rounded border border-gray-200 text-gray-700 flex justify-between items-center">
              <div>
                <span className="font-bold block">{user.username || 'No Username'}</span>
                <span className="text-sm text-gray-600">{user.first_name} {user.last_name}</span>
              </div>
              <span className="text-gray-500 text-sm">({user.email})</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Dashboard;
