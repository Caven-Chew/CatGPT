import React, { useEffect, useState } from 'react';
import styles from './ChatList.module.css';

interface ChatListProps {
    setSelectedRoom: (roomId: string) => void;
}

const ChatList: React.FC<ChatListProps> = ({ setSelectedRoom }) => {
    const [rooms, setRooms] = useState<string[]>([]);
    const [localSelected, setLocalSelected] = useState<string | null>(null);

    useEffect(() => {
        fetch('http://127.0.0.1:5000/api/rooms')
            .then(res => res.json())
            .then(data => {
                if (data.rooms) setRooms(data.rooms);
            })
            .catch(err => console.error('Error fetching rooms:', err));
    }, []);

    const handleClick = (roomId: string) => {
        setLocalSelected(roomId);
        setSelectedRoom(roomId);
    };

    const handleNewChat = () => {
        // TODO: Replace this with your actual logic to create a new chat room
        const newRoomId = `room-${Date.now()}`;
        setRooms([newRoomId, ...rooms]);
        handleClick(newRoomId);
    };

    return (
        <div className={styles.container}>
            <h2>Chat Rooms</h2>
            <button className={styles.newChatButton} onClick={handleNewChat}>
                + New Chat
            </button>
            <ul className={styles.roomList}>
                {rooms.map(roomId => (
                    <li
                        key={roomId}
                        onClick={() => handleClick(roomId)}
                        className={`${styles.roomItem} ${roomId === localSelected ? styles.selected : ''}`}
                    >
                        {roomId}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default ChatList;
