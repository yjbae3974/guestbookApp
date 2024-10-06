import React, { useState, useEffect } from "react";
import "./App.css";

function App() {
    const [name, setName] = useState("");
    const [message, setMessage] = useState("");
    const [password, setPassword] = useState("");
    const [guestbookEntries, setGuestbookEntries] = useState([]);
    const emojis = ["😀", "😂", "😍", "😢", "😡", "👍"];

    useEffect(() => {
        fetch("http://localhost:3001/api/guestbook")
            .then((response) => response.json())
            .then((entries) => {
                const promises = entries.map((entry) =>
                    fetch(
                        `http://localhost:3001/api/guestbook/${entry.id}/comments`
                    )
                        .then((res) => res.json())
                        .then((comments) => ({
                            ...entry,
                            comments: comments || [],
                            reactions: entry.reactions || "",
                        }))
                );
                return Promise.all(promises);
            })
            .then((entriesWithComments) =>
                setGuestbookEntries(entriesWithComments)
            );
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        fetch("http://localhost:3001/api/guestbook", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ name, message, password }),
        })
            .then((response) => response.json())
            .then((newEntry) => {
                const entryWithExtras = {
                    ...newEntry,
                    comments: [], // Initialize comments
                    reactions: newEntry.reactions || "", // Initialize reactions
                };
                setGuestbookEntries([entryWithExtras, ...guestbookEntries]);
                setName("");
                setMessage("");
                setPassword("");
            });
    };

    const handleAddReaction = (id, emoji) => {
        fetch(`http://localhost:3001/api/guestbook/${id}/reactions`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ reaction: emoji }),
        })
            .then((response) => response.json())
            .then((updatedEntry) => {
                setGuestbookEntries(
                    guestbookEntries.map((entry) =>
                        entry.id === id
                            ? { ...entry, reactions: updatedEntry.reactions }
                            : entry
                    )
                );
            });
    };

    const handleDelete = (id) => {
        const userPassword = prompt("비밀번호를 입력하세요:");
        fetch(`http://localhost:3001/api/guestbook/${id}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ password: userPassword }),
        }).then((response) => {
            if (response.status === 403) {
                alert("비밀번호가 일치하지 않습니다.");
            } else {
                setGuestbookEntries(
                    guestbookEntries.filter((entry) => entry.id !== id)
                );
            }
        });
    };

    const handleEdit = (id) => {
        const newMessage = prompt("수정할 메시지를 입력하세요:");
        const userPassword = prompt("비밀번호를 입력하세요:");
        fetch(`http://localhost:3001/api/guestbook/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                message: newMessage,
                password: userPassword,
            }),
        }).then((response) => {
            if (response.status === 403) {
                alert("비밀번호가 일치하지 않습니다.");
            } else {
                response.json().then((updatedEntry) => {
                    setGuestbookEntries(
                        guestbookEntries.map((entry) =>
                            entry.id === id
                                ? { ...updatedEntry, comments: entry.comments }
                                : entry
                        )
                    );
                });
            }
        });
    };

    const handleAddComment = (id) => {
        const newComment = prompt("댓글을 입력하세요:");
        fetch(`http://localhost:3001/api/guestbook/${id}/comments`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ comment: newComment }),
        })
            .then((response) => response.json())
            .then((newCommentData) => {
                setGuestbookEntries(
                    guestbookEntries.map((entry) => {
                        if (entry.id === id) {
                            return {
                                ...entry,
                                comments: [...(entry.comments || []), newCommentData],
                            };
                        } else {
                            return entry;
                        }
                    })
                );
            });
    };

    return (
        <div className="App">
            <h1>방명록</h1>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    placeholder="이름"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                />
                <textarea
                    placeholder="메시지"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                />
                <input
                    type="password"
                    placeholder="비밀번호"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <button type="submit">남기기</button>
            </form>
            <h2>방명록 목록</h2>
            <ul>
                {guestbookEntries.map((entry) => (
                    <li key={entry.id}>
                        <div className="flex justify-content-between">
                            <div>
                                <strong>{entry.name}:</strong> {entry.message}
                                <small>
                                    {new Date(
                                        entry.created_at
                                    ).toLocaleString()}
                                </small>
                            </div>
                            <div>
                                {entry.reactions && (
                                    <span>{entry.reactions}</span>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-content-end">
                            {emojis.map((emoji) => (
                                <button
                                    key={emoji}
                                    onClick={() =>
                                        handleAddReaction(entry.id, emoji)
                                    }
                                    className={
                                        emoji === entry.reactions
                                            ? "emoji-button selected"
                                            : "emoji-button"
                                    }
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                        <button onClick={() => handleEdit(entry.id)}>
                            수정
                        </button>
                        <button onClick={() => handleDelete(entry.id)}>
                            삭제
                        </button>
                        <button onClick={() => handleAddComment(entry.id)}>
                            댓글쓰기
                        </button>
                        <div
                            className="dark-theme"
                            style={{
                                padding: "20px",
                                marginTop: "20px",
                                borderRadius: "10px",
                            }}
                        >
                            {entry.comments &&
                                Array.isArray(entry.comments) &&
                                entry.comments.map((comment, index) => (
                                    <div
                                        key={index}
                                        className="flex justify-content-between"
                                    >
                                        <span>{comment.content}</span>
                                        <span>{comment.created_at}</span>
                                    </div>
                                ))}
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default App;
