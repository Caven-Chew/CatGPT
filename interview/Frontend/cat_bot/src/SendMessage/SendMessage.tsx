import React, { useState } from 'react';
import styles from './SendMessage.module.css';

interface SendMessageProps {
    selectedRoom: string | null;
    setToUpdate: (val: boolean) => void;
}

const SendMessage: React.FC<SendMessageProps> = ({ selectedRoom, setToUpdate }) => {
    const [input, setInput] = useState('');

    const handleSend = async () => {
        if (!selectedRoom || !input.trim()) return;

        const payload = {
            user_input: input,
            room_id: selectedRoom
        };

        try {
            const response = await fetch('http://127.0.0.1:5000/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error('Failed to send message');
            setInput('');
            setToUpdate(true);
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') handleSend();
    };

    return (
        <div className={styles.sendContainer}>
            <input
                type="text"
                placeholder={selectedRoom ? 'Type a message...' : 'Select a room first'}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={!selectedRoom}
                className={styles.sendInput}
            />
            <button
                onClick={handleSend}
                disabled={!selectedRoom || !input.trim()}
                className={styles.sendButton}
            >
                Send
            </button>
        </div>
    );
};

export default SendMessage;
