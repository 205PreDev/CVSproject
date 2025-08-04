import React from 'react';
import { useAuth } from '../../context/AuthContext';

function ProfilePage() {
  const { user } = useAuth();

  if (!user) {
    return <div>사용자 정보를 불러오는 중입니다...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">프로필</h1>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="mb-4">
          <p className="text-sm text-gray-500">이메일</p>
          <p className="text-lg">{user.email}</p>
        </div>
        <div className="mb-4">
          <p className="text-sm text-gray-500">가입일</p>
          <p className="text-lg">{new Date(user.created_at).toLocaleDateString()}</p>
        </div>
        {/* 여기에 추가적인 프로필 정보 (예: 이름, 연락처) 및 수정 기능이 들어갈 수 있습니다. */}
      </div>
    </div>
  );
}

export default ProfilePage;
