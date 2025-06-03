import React from 'react'
import { Box } from '@mui/material'
import { useNavigate } from 'react-router-dom';

function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0D1117] text-[#C9D1D9] flex flex-col items-center justify-center px-4">
      <h1 className="text-3xl font-semibold mb-8">📸 WHL 圖片傳輸工具</h1>
      <button
        className="w-full max-w-xs bg-[#238636] hover:bg-[#2EA043] text-white py-3 rounded-lg mb-4 transition"
        onClick={() => navigate('/create')}
      >
        建立連線
      </button>
      <button
        className="w-full max-w-xs bg-[#161B22] hover:bg-[#30363D] text-[#C9D1D9] py-3 rounded-lg transition"
        onClick={() => navigate('/join')}
      >
        加入連線
      </button>
    </div>
  )
}

export default Home