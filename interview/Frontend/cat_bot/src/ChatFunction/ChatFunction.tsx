import { useState } from 'react';
import ChatList from '../ChatList/ChatList';
import ChatMessages from '../ChatMessages/ChatMessages';
import SendMessage from '../SendMessage/SendMessage';
import Styles from './ChatFunction.module.css';

function App() {
    const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
    const [toUpdate, setToUpdate] = useState<boolean>(false);

    return (
        <div className={Styles["chat-container"]}>
            <div className={Styles["chat-list"]}>
                <ChatList setSelectedRoom={setSelectedRoom} />
            </div>
            <div className={Styles["chat-messages"]}>
                <ChatMessages selectedRoom={selectedRoom} toUpdate={toUpdate} setToUpdate={setToUpdate} />
            </div>
            <div className={Styles["send-message"]}>
                <SendMessage selectedRoom={selectedRoom} setToUpdate={setToUpdate} />
            </div>
        </div>
    );
}

export default App;
