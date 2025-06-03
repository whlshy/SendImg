import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import Peer from 'peerjs';

export default function TransferPage() {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const isHost = location.state?.isHost ?? false;

  const handleBack = () => {
    navigate('/');
  };

  return (
    <div className="bg-[#0D1117] text-[#C9D1D9] flex flex-col items-center px-4 py-6">
      <button
        className="mt-auto bg-[#161B22] hover:bg-[#30363D] text-[#C9D1D9] px-6 py-2 rounded-lg transition"
        onClick={handleBack}
      >
        ← 離開房間
      </button>
    </div>
  );
}