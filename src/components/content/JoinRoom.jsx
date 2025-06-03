import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export default function JoinRoom() {
  const navigate = useNavigate();
  const { roomId: paramRoomId } = useParams(); // 透過路由抓參數
  const [inputRoomId, setInputRoomId] = useState('');

  useEffect(() => {
    if (paramRoomId) {
      // 如果路由裡有 roomId，代表使用者掃描 QR Code 直接進來
      // 自動導向傳輸頁面
      navigate(`/transfer?roomId=${paramRoomId}`);
    }
  }, [paramRoomId, navigate]);

  const handleJoin = () => {
    const trimmed = inputRoomId.trim();
    if (trimmed.length === 0) return;
    navigate(`/transfer?roomId=${trimmed}`);
  };

  const handleBack = () => {
    navigate('/');
  };

  // 如果已經在 useEffect 觸發 navigate，就不需要再渲染輸入框
  if (paramRoomId) {
    return (
      <div className="min-h-screen bg-[#0D1117] text-[#C9D1D9] flex items-center justify-center">
        <p className="text-lg">自動導向中…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D1117] text-[#C9D1D9] flex flex-col items-center justify-center px-4">
      <h2 className="text-2xl font-medium mb-6">🔗 加入房間</h2>
      <div className="w-full max-w-xs">
        <label className="block text-[#8B949E] mb-2" htmlFor="roomId">
          房間 ID
        </label>
        <input
          id="roomId"
          type="text"
          value={inputRoomId}
          onChange={(e) => setInputRoomId(e.target.value)}
          className="w-full px-4 py-2 bg-[#161B22] text-[#C9D1D9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#238636] mb-4"
          placeholder="輸入房間 ID..."
        />
        <button
          className="w-full bg-[#238636] hover:bg-[#2EA043] text-white py-3 rounded-lg transition mb-4"
          onClick={handleJoin}
        >
          加入
        </button>
        <button
          className="w-full bg-[#161B22] hover:bg-[#30363D] text-[#C9D1D9] py-3 rounded-lg transition"
          onClick={handleBack}
        >
          ← 返回
        </button>
      </div>
    </div>
  );
}