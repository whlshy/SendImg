import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import QRCode from 'react-qr-code';
import { useSnackbarStore } from '@/store';
import { useAtom } from 'jotai';

import { connOpenAtom } from '../elements/Peer'

const isProd = import.meta.env.MODE === 'production'

function CreateRoom() {
  const [searchParams, setSearchParams] = useSearchParams();
  const roomId = searchParams.get("roomId")
  const navigate = useNavigate();
  const [joinLink, setJoinLink] = useState('');
  const { setSnackMsg } = useSnackbarStore();
  const [connOpen, setConnOpen] = useAtom(connOpenAtom);

  useEffect(() => {
    // 進入此頁面時產生一組唯一 Room ID
    const id = uuidv4().slice(0, 13); // 取前 16 碼
    setSearchParams({ roomId: id, isHost: true });

    // 產生完整加入連結 (假設部署在同一個 origin)
    const origin = window.location.origin;
    setJoinLink(`${origin}${isProd ? '/SendImg' : ""}/join/${id}`);
  }, []);

  useEffect(() => {
    if (connOpen) {
      navigate(`/transfer?roomId=${roomId}&isHost=true`);
    }
  }, [connOpen])

  const handleCopyLink = () => {
    if (!joinLink) return;
    navigator.clipboard.writeText(joinLink).then(() => {
      setSnackMsg({ message: '已複製加入連結到剪貼簿！' });
    });
  };

  const handleBack = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#0D1117] text-[#C9D1D9] flex flex-col items-center justify-center px-4">
      <h2 className="text-2xl font-medium mb-6">🆔 你的房間 ID</h2>

      <div className="bg-[#161B22] p-6 rounded-lg flex flex-col items-center">
        {/* 顯示房間 ID */}
        <p className="text-xl font-mono mb-4">{roomId}</p>

        {/* 顯示「加入連結」 */}
        {joinLink && (
          <div className="w-full mb-4">
            <label className="block text-sm text-[#8B949E] mb-1">加入連結</label>
            <div className="flex items-center bg-[#0D1117] rounded-lg overflow-hidden">
              <input
                type="text"
                readOnly
                value={joinLink}
                className="flex-1 px-3 py-2 bg-transparent text-[#C9D1D9] font-mono focus:outline-none"
              />
              <button
                onClick={handleCopyLink}
                className="px-3 py-2 bg-[#238636] hover:bg-[#2EA043] text-white transition"
              >
                複製
              </button>
            </div>
          </div>
        )}

        {/* 動態產生的 QR Code，掃描後會到 /join/{roomId} */}
        {joinLink && (
          <div className="bg-white p-2 rounded-md mb-4">
            <QRCode value={joinLink} size={128} />
          </div>
        )}

        <p className="text-sm text-[#8B949E]">等待對方掃描或點選連結加入…⏳</p>

        {/* 測試用：直接跳到傳輸頁（正式不用顯示） */}
        {/* <button
          className="mt-4 bg-[#238636] hover:bg-[#2EA043] text-white px-6 py-2 rounded-lg transition"
          onClick={() => navigate(`/transfer/${roomId}`)}
        >
          直接開始傳輸（測試）
        </button> */}
      </div>

      <button
        className="mt-8 bg-[#161B22] hover:bg-[#30363D] text-[#C9D1D9] px-6 py-2 rounded-lg transition"
        onClick={handleBack}
      >
        ← 返回
      </button>
    </div>
  );
}

export default CreateRoom;