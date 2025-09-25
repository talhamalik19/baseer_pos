// // ws-server.js
// import { WebSocketServer, WebSocket } from "ws";

// const WS_PORT = 4047;
// const clients = new Map(); 
// let wss; 

// export function initWebSocketServer() {
//   if (wss) return wss; 

//   wss = new WebSocketServer({ port: WS_PORT });

//   wss.on("listening", () => {
//     console.log(`WebSocket server running at ws://0.0.0.0:${WS_PORT}`);
//   });

//   wss.on("connection", (ws, req) => {
//     try {
//       // Parse sessionId from query string
//       const url = new URL(req.url, `http://${req.headers.host}`);
//       const sessionId = url.searchParams.get("session");

//       if (!sessionId) {
//         console.log("Missing sessionId, closing socket");
//         ws.close();
//         return;
//       }

//       clients.set(sessionId, ws);
//       console.log(`Client connected for session ${sessionId}`);

//       ws.on("close", () => {
//         clients.delete(sessionId);
//         console.log(`Client disconnected for session ${sessionId}`);
//       });
//     } catch (err) {
//       console.error("WS connection error:", err);
//       ws.close();
//     }
//   });

//   return wss;
// }

// // Broadcast helper
// export function notifyConsent(sessionId, data) {
//   console.log("notify", sessionId, data);
//   // send(JSON.stringify(data));
//   const ws = clients.get(sessionId);
//   console.log("ws", ws)
//   // if (ws && ws.readyState === WebSocket.OPEN) {
//   //   ws.send(JSON.stringify(data));
//   //   console.log(`✅ Consent sent to ${sessionId}`);
//   //   return true;
//   // } else {
//   //   console.log(`❌ No active client for ${sessionId}`);
//   //   return false;
//   // }
// }
