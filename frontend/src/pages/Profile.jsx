import React, { useState, useEffect } from 'react';
import useAuthStore from '../store/authStore';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { User, DollarSign, Target, Save, Mail } from 'lucide-react';

const Profile = () => {
  const { user, setUser, token } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    monthlyIncome: '',
    savingsGoal: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        monthlyIncome: user.monthlyIncome || '',
        savingsGoal: user.savingsGoal || '',
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.put(
        'http://localhost:5000/api/user/profile',
        {
          name: formData.name,
          monthlyIncome: parseFloat(formData.monthlyIncome),
          savingsGoal: parseFloat(formData.savingsGoal),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setUser(response.data.user);
      toast.success('Profile updated successfully! ✨');
    } catch (error) {
      console.error('Update profile error:', error);
      toast.error(error.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="bg-white rounded-3xl shadow-xl shadow-indigo-100 overflow-hidden border border-indigo-50">
        {/* Header */}
        <div className="bg-[#534AB7] p-8 text-white relative">
          <div className="relative z-10">
            <h1 className="text-3xl font-bold mb-2">My Profile</h1>
            <p className="text-indigo-100 opacity-90">Manage your personal information and financial goals</p>
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* User Info Section */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <User className="w-5 h-5 text-[#534AB7]" />
              Personal Information
            </h2>
            
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-600 ml-1">Full Name</label>
              <div className="relative">
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Your name"
                  className="w-full bg-indigo-50/50 border-2 border-transparent focus:border-[#534AB7] focus:bg-white rounded-2xl py-3 px-4 transition-all duration-200 outline-none text-gray-800"
                />
              </div>
            </div>

            <div className="space-y-1 opacity-60">
              <label className="text-sm font-medium text-gray-600 ml-1">Email Address (Read-only)</label>
              <div className="relative flex items-center bg-gray-100 border-2 border-transparent rounded-2xl py-3 px-4">
                <Mail className="w-5 h-5 text-gray-400 mr-2" />
                <span className="text-gray-500">{user?.email}</span>
              </div>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Financial Goals Section */}
          <div className="space-y-4 pt-2">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Target className="w-5 h-5 text-[#1D9E75]" />
              Financial Targets
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-600 ml-1">Monthly Income (₹)</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2">
                    <DollarSign className="w-4 h-4 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    name="monthlyIncome"
                    value={formData.monthlyIncome}
                    onChange={handleChange}
                    required
                    min="0"
                    placeholder="e.g. 5000"
                    className="w-full bg-indigo-50/50 border-2 border-transparent focus:border-[#534AB7] focus:bg-white rounded-2xl py-3 pl-10 pr-4 transition-all duration-200 outline-none text-gray-800"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-600 ml-1">Savings Goal (₹)</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2">
                    <Target className="w-4 h-4 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    name="savingsGoal"
                    value={formData.savingsGoal}
                    onChange={handleChange}
                    required
                    min="0"
                    placeholder="e.g. 2000"
                    className="w-full bg-indigo-50/50 border-2 border-transparent focus:border-[#534AB7] focus:bg-white rounded-2xl py-3 pl-10 pr-4 transition-all duration-200 outline-none text-gray-800"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-[#534AB7] hover:bg-[#453c9e] text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              <Save className="w-5 h-5" />
              {loading ? 'Saving Changes...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;
