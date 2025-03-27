import React, { useEffect, useRef, useState } from 'react';
import styles from './ChatMessages.module.css';

interface ChatMessagesProps {
    selectedRoom: string | null;
    toUpdate: boolean;
    setToUpdate: (val: boolean) => void;
}

interface Message {
    id: number;
    message: string;
    send_from: string;
    timestamp: string;
}

const renderMessageContent = (text: string) => {
    const imageRegex = /!\[.*?\]\((https?:\/\/[^\s)]+)\)/g;

    const parts = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = imageRegex.exec(text)) !== null) {
        const imageUrl = match[1];

        // Add preceding text
        if (match.index > lastIndex) {
            parts.push(
                <div key={`text-${lastIndex}`}>
                    {text.slice(lastIndex, match.index).trim()}
                </div>
            );
        }

        // Add image
        parts.push(
            <img
                key={`img-${match.index}`}
                src={imageUrl}
                alt="Embedded"
                className={styles.imageMessage}
            />
        );

        lastIndex = imageRegex.lastIndex;
    }

    // Add any remaining text
    if (lastIndex < text.length) {
        parts.push(
            <div key={`text-end`}>{text.slice(lastIndex).trim()}</div>
        );
    }

    return <>{parts}</>;
};


const ChatMessages: React.FC<ChatMessagesProps> = ({ selectedRoom, toUpdate, setToUpdate }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);
    const chatContainerRef = useRef<HTMLDivElement | null>(null); // ← ref to the container

    // Fetch messages when selectedRoom or toUpdate changes
    useEffect(() => {
        if (!selectedRoom) return;

        setLoading(true);
        fetch(`http://127.0.0.1:5000/api/history/${selectedRoom}`)
            .then(res => res.json())
            .then(data => {
                setMessages(data);
                setLoading(false);
                setToUpdate(false);
            })
            .catch(err => {
                console.error('Failed to load messages:', err);
                setLoading(false);
            });
    }, [selectedRoom, toUpdate]);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    if (!selectedRoom) return <div className={styles.chatContainer}>Select a room to see messages.</div>;
    if (loading) return <div>Loading messages...</div>;

    return (
        <div className={styles.chatContainer} ref={chatContainerRef}>
            {messages.map((msg) => (
                <div
                    key={msg.id}
                    className={`${styles.messageBubble} ${
                        msg.send_from === 'User' ? styles.userMessage : styles.systemMessage
                    }`}
                >
                    <div className={styles.messageMeta}>
                        {msg.send_from} · {new Date(msg.timestamp).toLocaleTimeString()}
                    </div>
                    {renderMessageContent(msg.message)}
                </div>
            ))}
        </div>
    );
};

export default ChatMessages;
