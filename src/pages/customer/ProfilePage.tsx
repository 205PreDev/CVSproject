import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import DatabaseService from '../../services/database';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import toast from 'react-hot-toast';

function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ username: '', phone: '' });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const profileData = await DatabaseService.getProfile(user.id);
      if (profileData) {
        setProfile(profileData);
        setFormData({ username: profileData.username || '', phone: profileData.phone || '' });
      }
    } catch (error) {
      toast.error('프로필 정보를 불러오는 데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      await DatabaseService.updateProfile(user.id, formData);
      toast.success('프로필이 성공적으로 업데이트되었습니다.');
      fetchProfile(); // 최신 정보 다시 불러오기
      setIsEditing(false);
    } catch (error) {
      toast.error('프로필 업데이트에 실패했습니다.');
    }
  };

  if (loading) {
    return <div>프로필 정보를 불러오는 중입니다...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">프로필 관리</h1>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="mb-4">
          <p className="text-sm text-gray-500">이메일</p>
          <p className="text-lg">{user?.email}</p>
        </div>
        
        {isEditing ? (
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">이름</label>
              <Input
                id="username"
                name="username"
                type="text"
                value={formData.username}
                onChange={handleInputChange}
                className="w-full"
              />
            </div>
            <div className="mb-6">
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">연락처</label>
              <Input
                id="phone"
                name="phone"
                type="text"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" onClick={() => setIsEditing(false)} variant="outline">
                취소
              </Button>
              <Button type="submit">저장</Button>
            </div>
          </form>
        ) : (
          <>
            <div className="mb-4">
              <p className="text-sm text-gray-500">이름</p>
              <p className="text-lg">{profile?.username || '-'}</p>
            </div>
            <div className="mb-4">
              <p className="text-sm text-gray-500">연락처</p>
              <p className="text-lg">{profile?.phone || '-'}</p>
            </div>
            <div className="mt-6 flex justify-end">
              <Button onClick={() => setIsEditing(true)}>프로필 수정</Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ProfilePage;
