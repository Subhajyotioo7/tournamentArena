import { Button } from './ui/button';
// import { useEffect, useState } from "react";

// export default function RoomChat({ roomId }) {
//   const [socket, setSocket] = useState(null);
//   const [message, setMessage] = useState("");
//   const [messages, setMessages] = useState([]);

//   useEffect(() => {
//     const ws = new WebSocket(
//       `ws://127.0.0.1:8000/ws/room/${roomId}/`
//     );

//     ws.onmessage = (e) => {
//       const data = JSON.parse(e.data);
//       setMessages((prev) => [...prev, data]);
//     };

//     setSocket(ws);
//     return () => ws.close();
//   }, [roomId]);

//   const sendMessage = () => {
//     socket.send(JSON.stringify({ message }));
//     setMessage("");
//   };

//   return (
//     <div className="bg-gray-800 p-4 rounded-lg">
//       <div className="h-64 overflow-y-auto space-y-2">
//         {messages.map((msg, i) => (
//           <div key={i} className={msg.is_admin ? "text-red-400" : "text-white"}>
//             <b>{msg.sender}:</b> {msg.message}
//           </div>
//         ))}
//       </div>

//       <div className="flex gap-2 mt-2">
//         <input
//           className="flex-1 p-2 rounded text-black"
//           value={message}
//           onChange={(e) => setMessage(e.target.value)}
//         />
//         <button
//           onClick={sendMessage}
//           className="bg-purple-600 px-4 rounded text-white"
//         >
//           Send
//         </button>
//       </div>
//     </div>
//   );
// }

import { useEffect, useState, useRef } from "react";
import { Crown, MessageCircle, Send } from "lucide-react";

export default function RoomChat({ roomId }) {
  const token = localStorage.getItem("token");

  const socketRef = useRef(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);

  // ================== LOAD CHAT HISTORY ==================
  useEffect(() => {
    fetch(`/chat/room/${roomId}/messages/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setMessages(data);
        }
      })
      .catch((err) =>
        console.error("Failed to load chat history:", err)
      );
  }, [roomId, token]);

  // ================== WEBSOCKET CONNECTION ==================
  useEffect(() => {
    if (!roomId || !token) return;

    const protocol =
      window.location.protocol === "https:" ? "wss" : "ws";

    const wsUrl = `${protocol}://${window.location.host}/ws/room/${roomId}/?token=${token}`;

    console.log("Connecting to WebSocket:", wsUrl);

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("WebSocket connected");
    };

    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);
      setMessages((prev) => [...prev, data]);
    };

    ws.onerror = (e) => {
      console.error("WebSocket error:", e);
    };

    ws.onclose = () => {
      console.warn("WebSocket closed");
    };

    socketRef.current = ws;

    return () => {
      ws.close();
    };
  }, [roomId, token]);

  // ================== AUTO SCROLL ==================
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ================== SEND MESSAGE ==================
  const sendMessage = (type = "chat") => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      console.error("WebSocket not ready");
      return;
    }

    if (!message.trim()) return;

    socket.send(
      JSON.stringify({
        message,
        type,
      })
    );

    setMessage("");
  };

  // ================== UI ==================
  return (
    <div className="flex flex-col h-[500px] bg-gray-900 rounded-xl shadow-xl border border-gray-700">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-700 flex justify-between items-center">
        <h2 className="flex items-center gap-2 text-lg font-bold text-white"><MessageCircle className="h-5 w-5" aria-hidden="true" />Room Chat</h2>
        <span className="text-xs text-gray-400">Live</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`p-3 rounded-lg max-w-[80%]
              ${
                msg.msg_type === "winner"
                  ? "bg-green-700 text-white mx-auto text-center font-bold"
                  : msg.is_admin
                  ? "bg-red-600 text-white ml-auto"
                  : "bg-gray-700 text-white"
              }`}
          >
            {msg.msg_type !== "winner" && (
              <div className="text-xs text-gray-300 mb-1">
                {msg.is_admin ? <span className="flex items-center gap-1"><Crown className="h-3 w-3" aria-hidden="true" />Admin</span> : msg.sender}
              </div>
            )}
            <div>{msg.message}</div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-gray-700 flex gap-2">
        <input
          className="flex-1 rounded-lg px-3 py-2 bg-gray-800 text-white focus:outline-none"
          placeholder="Type message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <Button
          onClick={() => sendMessage("chat")}
          size="sm"
        >
          <Send className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only">Send</span>
        </Button>
      </div>
    </div>
  );
}

