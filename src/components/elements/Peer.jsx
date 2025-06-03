import React, { useEffect, useState, useRef } from 'react';
import Peer from 'peerjs';
import { v4 as uuidv4 } from 'uuid'; // 用於產生唯一 ID
import { atom, useAtom } from 'jotai'

// MUI元件
import Button from '@mui/material/Button';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import CircularProgress from '@mui/material/CircularProgress'; // 進度指示
import IconButton from '@mui/material/IconButton';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload'; // 下載圖示
import CheckCircleIcon from '@mui/icons-material/CheckCircle'; // 成功圖示
import ErrorIcon from '@mui/icons-material/Error'; // 錯誤圖示
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty'; // 等待/傳送中圖示
import CloudUploadIcon from '@mui/icons-material/CloudUpload'; // 上傳圖示
import DeleteIcon from '@mui/icons-material/Delete';
import Tooltip from '@mui/material/Tooltip'; // 提示工具

// 檔案狀態類型
const FILE_STATUS = {
  SELECTED: 'selected', // 已選擇，待傳送
  SENDING: 'sending',   // 傳送中
  SENT: 'sent',         // 已成功傳送 (Host端確認Joiner收到)
  FAILED: 'failed',     // 傳送失敗
  RECEIVED: 'received', // Joiner端已接收
  DOWNLOADED: 'downloaded' // Joiner端已下載
};

const connOpenAtom = atom(false)
export { connOpenAtom }

function PeerIndex({ roomId, isHost }) {
  const [peerInstance, setPeerInstance] = useState(null);
  const [connOpen, setConnOpen] = useAtom(connOpenAtom);
  // ... (sendFiles, recvBlobs, progressMap states remain the same)

  // To store the DataConnection object for cleanup
  const dataConnectionRef = useRef(null);

  // Host: 管理準備傳送的檔案及其狀態
  // 結構: { id: string, name: string, size: number, type: string, previewUrl: string, status: string, fileObject: File }
  const [filesToProcess, setFilesToProcess] = useState([]);

  // Joiner: 管理已接收的檔案
  // 結構: { id: string, name: string, size: number, type: string, blobUrl: string, blobObject: Blob, status: string }
  const [receivedFiles, setReceivedFiles] = useState([]);

  // 暫存 Joiner 端收到的批次檔案元數據
  const incomingFileBatchMetaRef = useRef({}); // key: fileId (host generated), value: metadata from host

  // Step 1: 建立 PeerJS 物件 (Unchanged)
  useEffect(() => {
    let peer;
    if (roomId) {
      if (isHost) {
        peer = new Peer(roomId);
        console.log(`Host attempting to open Peer with ID: ${roomId}`);
      } else {
        peer = new Peer(undefined); // Joiner gets a random ID
        console.log('Joiner attempting to open Peer with a random ID');
      }
      setPeerInstance(peer);

      return () => {
        if (peer && !peer?.destroyed) {
          console.log('Destroying peer instance:', peer.id);
          peer.destroy();
        }
        setPeerInstance(null);
        setFilesToProcess([])
        setReceivedFiles([])
      };
    }

  }, [roomId, isHost]);

  // Step 2: 註冊 open / connection / error 監聽
  // Step 2: 註冊監聽 (部分修改)
  useEffect(() => {
    if (!peerInstance) return;
    peerInstance.removeAllListeners();

    const onPeerError = (err) => console.error('PeerJS error:', err);
    peerInstance.on('error', onPeerError);

    const setupDataConnectionListeners = (dc) => {
      dataConnectionRef.current = dc;
      dc.on('open', () => { setConnOpen(true); console.log(`DataConnection open with ${dc.peer}`); });
      dc.on('close', () => { setConnOpen(false); dataConnectionRef.current = null; console.log(`DataConnection closed with ${dc.peer}`); });
      dc.on('error', (err) => { console.error(`DataConnection error with ${dc.peer}:`, err); setConnOpen(false); });

      dc.on('data', (data) => {
        if (isHost) { // Host 接收 Joiner 的訊息
          if (data.type === 'file-received-ack') {
            console.log(`Host: ACK for file ${data.fileId}`);
            setFilesToProcess(prevFiles =>
              prevFiles.map(f => f.id === data.fileId ? { ...f, status: FILE_STATUS.SENT } : f)
            );
          } else if (data.type === 'file-receive-error') {
            console.error(`Host: Joiner reported error for file ${data.fileId}: ${data.error}`);
            setFilesToProcess(prevFiles =>
              prevFiles.map(f => f.id === data.fileId ? { ...f, status: FILE_STATUS.FAILED } : f)
            );
          }
        } else { // Joiner 接收 Host 的訊息
          console.log('blob in', data)
          if (data.type === 'file-metadata') {
            console.log('Joiner: Received file metadata', data);
            incomingFileBatchMetaRef.current[data.fileId] = data; // 暫存元數據
          } else if (data instanceof Blob || data instanceof ArrayBuffer || data instanceof Uint8Array) {
            // 假設 Host 傳送的檔案 ID 是透過某种方式关联 (例如，Host 在送出 Blob 前，確保對應的 fileId 已被 Joiner 知曉)
            // 這裡我們需要一個機制來關聯 Blob 和它的元數據。
            // 一個簡單的方式是 Host 送完 metadata 後，緊接著送 blob，並假設順序性。
            // 或者，Host 可以在 Blob 中夾帶 fileId，但 PeerJS 直接發送 Blob 時無法這樣做。
            // 目前的設計是依賴 `incomingFileBatchMetaRef` 和 Host 發送順序

            // 尋找最近一個沒有對應 Blob 的 metadata (簡易策略)
            // 更好的策略是 Host 在送 Blob 前，先送一個 {type: 'blob-coming', fileId: '...'}
            let associatedMeta = null;
            // 找到最後一個收到的且還沒有配對 Blob 的 meta
            const pendingMetaFileIds = Object.keys(incomingFileBatchMetaRef.current).filter(id =>
              !receivedFiles.some(rf => rf.id === id)
            );

            if (pendingMetaFileIds.length > 0) {
              // 假設是最後一個 metadata 對應這個 blob (或更複雜的配對邏輯)
              // 為了簡化，我們假設 Host 會確保 metadata 和 blob 的某種對應關係
              // 這裡我們需要一個更可靠的方式來配對 Blob 和 Metadata。
              // 由於 Host 端在傳送檔案前會先傳 fileId，Joiner 收到 metadata 後，再收到 Blob，可嘗試配對。
              // 這裡假設 metadata 中的 fileId 是唯一且 host 在發送 Blob 之前，Joiner 已經收到對應的 metadata
              // 實際上，可能需要 Host 發送 Blob 時也帶上 fileId (例如包裝成 {type:'file-chunk', id: '...', payload: Blob})
              // 但 PeerJS send(Blob) 不支援這樣，除非自己處理序列化。

              // 為了演示，我們假設最後一個未配對的 metadata 是正確的。
              // 這在多檔案並行處理時會有問題，但單線程傳送時可能OK。
              const lastPendingMetaId = pendingMetaFileIds[pendingMetaFileIds.length - 1]; // 不夠穩健
              if (lastPendingMetaId && incomingFileBatchMetaRef.current[lastPendingMetaId]) {
                associatedMeta = incomingFileBatchMetaRef.current[lastPendingMetaId];
              }
            }

            if (associatedMeta) {
              const { fileId, name, mimeType, size } = associatedMeta;
              console.log(`Joiner: Received blob for ${name} (ID: ${fileId})`);
              const blob = (data instanceof Blob) ? data : new Blob([data], { type: mimeType });
              const fileURL = URL.createObjectURL(blob);

              setReceivedFiles(prev => [...prev, {
                id: fileId, name, type: mimeType, size,
                blobUrl: fileURL, blobObject: blob, status: FILE_STATUS.RECEIVED
              }]);

              // 向 Host 發送確認
              dc.send({ type: 'file-received-ack', fileId });
              delete incomingFileBatchMetaRef.current[fileId]; // 清理已處理的元數據
            } else {
              console.warn('Joiner: Received blob/arraybuffer without matching metadata or ID.');
              // 可以考慮向 Host 發送一個錯誤訊息
            }
          } else if (data.type === 'batch-meta') {
            console.log('Joiner: Received batch metadata', data);
            // 可以用來預期檔案數量等
          }
        }
      });
    };

    if (isHost) {
      peerInstance.on('open', (id) => console.log(`Host Peer opened: ${id}`));
      peerInstance.on('connection', setupDataConnectionListeners);
    } else {
      peerInstance.on('open', (id) => {
        console.log(`Joiner Peer opened: ${id}`);
        if (roomId) {
          const conn = peerInstance.connect(roomId);
          setupDataConnectionListeners(conn);
        }
      });
    }
    // Cleanup is handled in the main useEffect's return
  }, [peerInstance, roomId, isHost, receivedFiles]); // added receivedFiles as Joiner needs it for pairing logic.

  // Host: 處理檔案選擇
  const handleFileSelect = (event) => {
    const newFiles = Array.from(event.target.files).map(file => ({
      id: uuidv4(), // 為每個檔案產生唯一ID
      name: file.name,
      size: file.size,
      type: file.type,
      previewUrl: URL.createObjectURL(file),
      status: FILE_STATUS.SELECTED,
      fileObject: file
    }));
    setFilesToProcess(prevFiles => [...prevFiles, ...newFiles]);
    event.target.value = null; // 清空 input，以便下次選擇相同檔案也能觸發 onChange
  };

  // Host: 傳送選定的檔案
  const handleSendSelectedFiles = async () => {
    if (!connOpen || !dataConnectionRef.current) {
      alert('連線未建立!'); return;
    }
    const filesToSendNow = filesToProcess.filter(f => f.status === FILE_STATUS.SELECTED);
    if (filesToSendNow.length === 0) {
      alert('沒有已選擇的檔案可傳送。'); return;
    }

    dataConnectionRef.current.send({ type: 'batch-meta', totalFiles: filesToSendNow.length });

    for (const file of filesToSendNow) {
      setFilesToProcess(prev => prev.map(f => f.id === file.id ? { ...f, status: FILE_STATUS.SENDING } : f));
      try {
        const metadata = {
          type: 'file-metadata', fileId: file.id, name: file.name,
          mimeType: file.type, size: file.size
        };
        dataConnectionRef.current.send(metadata);
      } catch (error) {
        console.error(`Host: Error sending file ${file.name}:`, error);
        setFilesToProcess(prev => prev.map(f => f.id === file.id ? { ...f, status: FILE_STATUS.FAILED } : f));
      }
    }
    for (const file of filesToSendNow) {
      try {
        // 確保 metadata 有足夠時間被對方處理 (非常簡陋的同步方式)
        // 在實際應用中，Host和Joiner之間應該有更複雜的流量控制和確認機制
        await new Promise(resolve => setTimeout(resolve, 50)); // 短暫延遲

        dataConnectionRef.current.send(file.fileObject);
        console.log(`Host: Sent ${file.name} (ID: ${file.id})`);
        // 注意：此時 Host 只是發送了，不代表 Joiner 收到了。狀態更新依賴 ACK。
      } catch (error) {
        console.error(`Host: Error sending file ${file.name}:`, error);
        setFilesToProcess(prev => prev.map(f => f.id === file.id ? { ...f, status: FILE_STATUS.FAILED } : f));
      }
    }
  };

  // Joiner: 下載檔案
  const handleDownloadFile = (fileId) => {
    const fileToDownload = receivedFiles.find(f => f.id === fileId);
    if (fileToDownload) {
      const a = document.createElement('a');
      a.href = fileToDownload.blobUrl;
      a.download = fileToDownload.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      // URL.revokeObjectURL(fileToDownload.blobUrl); // 若不再需要預覽，可釋放
      setReceivedFiles(prev => prev.map(f => f.id === fileId ? { ...f, status: FILE_STATUS.DOWNLOADED } : f));
    }
  };

  const handleDeleteFile = (id) => {
    const filelist = filesToProcess.filter(file => file.id !== id)
    setFilesToProcess(filelist)
  }

  // 渲染檔案狀態圖示 (Host 用)
  const renderFileStatusIcon = (status, id = null) => {
    switch (status) {
      case FILE_STATUS.SELECTED: return (
        <>
          <Tooltip title="已選擇"><CloudUploadIcon color="action" /></Tooltip>
          <Tooltip title="刪除">
            <IconButton sx={{ ml: 1 }} onClick={() => handleDeleteFile(id)}>
              <DeleteIcon color="action" />
            </IconButton>
          </Tooltip>
        </>
      );
      case FILE_STATUS.SENDING: return <Tooltip title="傳送中"><HourglassEmptyIcon color="primary" className="animate-spin" /></Tooltip>;
      case FILE_STATUS.SENT: return <Tooltip title="已傳送"><CheckCircleIcon color="success" /></Tooltip>;
      case FILE_STATUS.FAILED: return <Tooltip title="失敗"><ErrorIcon color="error" /></Tooltip>;
      default: return null;
    }
  };

  // ... Rest of your component (JSX, file handling logic etc.)
  return (
    <div>
      {/* <p>PeerJS Connection Status: {connOpen ? 'Connected' : 'Disconnected'}</p>
      <p>My Peer ID: {peerInstance?.id || 'Initializing...'}</p>
      {isHost && <p>Hosting on Room ID: {roomId}</p>}
      {!isHost && <p>Attempting to join Room ID: {roomId}</p>} */}
      {/* Add UI for sending/receiving files here */}
      {(isHost && !!connOpen || !isHost) &&
        <Paper elevation={3} className="p-4 md:p-6 max-w-2xl mx-auto my-4">
          <Typography variant="h5" component="h2" gutterBottom className="text-center text-indigo-600">
            WHL's 檔案傳輸 ({isHost ? 'Host' : 'Joiner'})
          </Typography>
          <div className="mb-4 space-y-2">
            <Typography>Peer ID: <span className="font-mono bg-gray-100 p-1 rounded">{peerInstance?.id || '...'}</span></Typography>
            {isHost && <Typography>房號: <span className="font-mono bg-gray-100 p-1 rounded">{roomId}</span></Typography>}
            <Typography>
              連線狀態:
              <span className={`ml-2 px-2 py-1 text-xs rounded-full text-white ${connOpen ? 'bg-green-500' : 'bg-red-500'}`}>
                {connOpen ? '已連線' : '未連線'}
              </span>
            </Typography>
          </div>

          {/* Host UI */}
          {isHost && (
            <div className="mt-6 border-t pt-4">
              <Typography variant="h6" gutterBottom>傳送檔案</Typography>
              <div className="mb-4">
                <Button variant="outlined" component="label" disabled={!connOpen}>
                  選擇檔案
                  <input type="file" hidden multiple onChange={handleFileSelect} />
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSendSelectedFiles}
                  disabled={!connOpen || !filesToProcess.some(f => f.status === FILE_STATUS.SELECTED)}
                  className="ml-2"
                >
                  傳送已選擇的
                </Button>
              </div>
              {filesToProcess.length > 0 && (
                <List dense>
                  {filesToProcess.map((file) => (
                    <ListItem key={file.id} divider className="hover:bg-gray-50">
                      <img src={file.previewUrl} alt={file.name} className="w-12 h-12 object-cover mr-3 rounded" />
                      <ListItemText
                        primary={<span className="font-medium">{file.name}</span>}
                        secondary={`${(file.size / 1024).toFixed(1)} KB - 狀態: ${file.status}`}
                      />
                      <div className="ml-auto">{renderFileStatusIcon(file.status, file.id)}</div>
                    </ListItem>
                  ))}
                </List>
              )}
            </div>
          )}

          {/* Joiner UI */}
          {!isHost && (
            <div className="mt-6 border-t pt-4">
              <Typography variant="h6" gutterBottom>接收到的檔案</Typography>
              {receivedFiles.length === 0 && connOpen && (
                <Typography variant="body2" color="textSecondary">等待接收檔案中...</Typography>
              )}
              {receivedFiles.length === 0 && !connOpen && (
                <Typography variant="body2" color="textSecondary">請先連線至 Host。</Typography>
              )}
              {receivedFiles.length > 0 && (
                <List dense>
                  {receivedFiles.map((file) => (
                    <ListItem key={file.id} divider className="hover:bg-gray-50">
                      <img src={file.blobUrl} alt={file.name} className="w-12 h-12 object-cover mr-3 rounded" />
                      <ListItemText
                        primary={<span className="font-medium">{file.name}</span>}
                        secondary={`${(file.size / 1024).toFixed(1)} KB`}
                      />
                      <Tooltip title="下載檔案">
                        <IconButton
                          color="primary"
                          onClick={() => handleDownloadFile(file.id)}
                          disabled={file.status === FILE_STATUS.DOWNLOADED}
                        >
                          <CloudDownloadIcon />
                        </IconButton>
                      </Tooltip>
                      {file.status === FILE_STATUS.DOWNLOADED && (
                        <Tooltip title="已下載"><CheckCircleIcon color="success" className="ml-2" /></Tooltip>
                      )}
                    </ListItem>
                  ))}
                </List>
              )}
            </div>
          )}
        </Paper>
      }
    </div>
  );
}

export default PeerIndex;