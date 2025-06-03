import React from 'react'
import { Box } from '@mui/material'
import { Routes, Route } from 'react-router-dom'
import Home from './Home'
import CreateRoom from './CreateRoom'
import JoinRoom from './JoinRoom'
import TransferPage from './Transfer'
import { useSearchParams } from 'react-router-dom';
import Peer from '../elements/Peer'

function index() {
  const [searchParams, setSearchParams] = useSearchParams();
  const roomId = searchParams.get("roomId")
  const isHost = searchParams.get("isHost")

  return (
    <Box sx={{ flex: "1 1 auto" }}>
      <Peer roomId={roomId} isHost={isHost} />
      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/create" element={<CreateRoom />} />

        {/* 如果直接掃 QR Code 到 /join/:roomId，就自動導向 */}
        <Route path="/join/:roomId" element={<JoinRoom />} />

        {/* 如果只是打 /join，就顯示輸入框 */}
        <Route path="/join" element={<JoinRoom />} />

        <Route path="/transfer" element={<TransferPage />} />
      </Routes>
    </Box>
  )
}

export default index