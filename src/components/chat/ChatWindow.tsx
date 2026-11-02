'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Send, X, MessageCircle, Loader2, Bot, RotateCcw } from 'lucide-react';
import { ChatService, ChatResponse } from '@/lib/chat/service';
import { Invention } from '@/types/invention';

// 메시지 타입 정의
interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    type?: 'text' | 'inventions' | 'knowledge' | 'error';
    inventions?: Invention[];
    sources?: { title: string; category: string }[];
}

// 발명품 카드 컴포넌트 (Dify 스타일로 더 심플하게 수정)
function InventionCard({ invention }: { invention: Invention }) {
    const gradeNames: Record<number, string> = {
        1: '초등학교', 2: '중학교', 3: '고등학교', 4: '일반', 5: '대학교'
    };

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer group">
            {invention.drawing_url && (
                <div className="relative overflow-hidden rounded-md mb-2 bg-gray-50 aspect-video flex items-center justify-center">
                    <img
                        src={invention.drawing_url}
                        alt={invention.simple_title}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                </div>
            )}
            <h4 className="font-semibold text-sm text-gray-900 mb-1 line-clamp-1 group-hover:text-blue-600 transition-colors">
                {invention.simple_title}
            </h4>
            <p className="text-xs text-gray-500 line-clamp-2 mb-2">
                {invention.simple_summary}
            </p>
            <div className="flex gap-1 flex-wrap">
                <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                    {gradeNames[invention.grade_id || 0] || '기타'}
                </span>
                {invention.sdg && (
                    <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">
                        {invention.sdg}
                    </span>
                )}
            </div>
        </div>
    );
}

// 메시지 컴포넌트
function ChatMessage({ message }: { message: Message }) {
    const isUser = message.role === 'user';

    return (
        <div className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'} gap-3`}>
                {/* 아바타 */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isUser ? 'bg-indigo-600' : 'bg-green-100'
                    }`}>
                    {isUser ? (
                        <span className="text-white text-xs font-bold">ME</span>
                    ) : (
                        <Bot className="w-5 h-5 text-green-600" />
                    )}
                </div>

                {/* 메시지 내용 */}
                <div className="flex flex-col">
                    <div className={`relative px-4 py-3 text-sm leading-relaxed shadow-sm ${isUser
                        ? 'bg-indigo-600 text-white rounded-2xl rounded-tr-sm'
                        : 'bg-white text-gray-800 border border-gray-100 rounded-2xl rounded-tl-sm'
                        }`}>
                        <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>

                    {/* 발명품 목록 */}
                    {message.type === 'inventions' && message.inventions && message.inventions.length > 0 && (
                        <div className="mt-3 grid grid-cols-1 gap-2">
                            {message.inventions.map((inv) => (
                                <InventionCard key={inv.id} invention={inv} />
                            ))}
                        </div>
                    )}

                    {/* RAG 출처 (Dify 스타일로 깔끔하게) */}
                    {message.type === 'knowledge' && message.sources && message.sources.length > 0 && (
                        <div className="mt-2 pl-2 border-l-2 border-gray-200">
                            <p className="text-xs text-gray-500 font-semibold mb-1">REFERENCE</p>
                            <div className="flex flex-wrap gap-2">
                                {message.sources.map((s, i) => (
                                    <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded hover:bg-gray-200 transition-colors cursor-default">
                                        {s.title}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// 메인 채팅 컴포넌트
export default function ChatWindow() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome',
            role: 'assistant',
            content: '안녕하세요! 👋\n무엇을 도와드릴까요? 발명품 검색이나 궁금한 점을 물어봐주세요.',
            type: 'text',
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // 스크롤을 맨 아래로
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isOpen, isLoading]);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 128)}px`; // 128px is max-h-32
        }
    }, [input]);

    // 메시지 전송
    const sendMessage = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input.trim(),
            type: 'text',
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const data = await ChatService.sendMessage(userMessage.content);

            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: data.content || '응답을 받지 못했습니다.',
                type: (data.inventions && data.inventions.length > 0) ? 'inventions' : (data.type || 'text'),
                inventions: data.inventions,
                sources: data.sources,
            };

            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            console.error('[ChatWindow] Error:', error);
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: '죄송합니다. 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
                type: 'error',
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleReset = () => {
        setMessages([
            {
                id: 'welcome',
                role: 'assistant',
                content: '대화가 초기화되었습니다. \n새로운 주제로 다시 이야기해볼까요? 😊',
                type: 'text',
            }
        ]);
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <>
            {/* 플로팅 버튼 (Blue Color, Fixed Bottom-Right) */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed z-[99999] rounded-full shadow-lg flex items-center justify-center hover:scale-105 transition-all duration-300"
                    style={{
                        bottom: '24px',
                        right: '24px',
                        width: '56px',
                        height: '56px',
                        backgroundColor: '#0066FF',
                        color: 'white'
                    }}
                    aria-label="채팅 열기"
                >
                    <MessageCircle className="w-7 h-7" />
                </button>
            )}

            {/* 채팅창 (Fixed Size, White Background, distinct shadow) */}
            <div
                className={`fixed z-[99999] rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden transition-all duration-300 origin-bottom-right ${isOpen
                    ? 'opacity-100 scale-100 pointer-events-auto'
                    : 'opacity-0 scale-95 pointer-events-none'
                    }`}
                style={{
                    bottom: '24px',
                    right: '24px',
                    width: '380px',
                    height: '600px',
                    maxHeight: 'calc(100vh - 48px)',
                    backgroundColor: '#ffffff'
                }}
            >
                {/* 헤더 */}
                <div className="bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center border border-indigo-100">
                            <Bot className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 text-sm">IdeaPrism AI</h3>
                            <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                Online
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={handleReset}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                            title="대화 초기화"
                        >
                            <RotateCcw className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* 메시지 영역 */}
                <div className="flex-1 overflow-y-auto p-5 bg-gray-50 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                    {messages.map((msg) => (
                        <ChatMessage key={msg.id} message={msg} />
                    ))}
                    {messages.length === 1 && (
                        <div className="grid gap-2 px-1 mb-6">
                            {[
                                {
                                    label: "어떤 문제를 해결하는 발명을 찾으시나요?",
                                    value: "생활 속 [    ] 불편함을 해결하는 발명 아이디어를 찾고 싶어."
                                },
                                {
                                    label: "창의적인 발명 아이디어를 추천해드릴까요?",
                                    value: "학교 숙제로 제출할만한 [    ] 관련 창의적인 발명 아이디어를 추천해줘."
                                },
                                {
                                    label: "다른 친구들의 발명품을 찾아볼까요?",
                                    value: "학생들이 만든 [    ] 관련 기발한 발명품을 보여줘."
                                }
                            ].map((suggestion, i) => (
                                <button
                                    key={i}
                                    onClick={() => {
                                        setInput(suggestion.value);
                                        const textarea = document.querySelector('textarea');
                                        if (textarea) textarea.focus();
                                    }}
                                    className="text-left text-sm text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 rounded-xl px-4 py-3 transition-colors shadow-sm flex items-center justify-between group"
                                >
                                    <span>{suggestion.label}</span>
                                    <Send className="w-3.5 h-3.5 opacity-0 group-hover:opacity-50 transition-opacity" />
                                </button>
                            ))}
                        </div>
                    )}
                    {isLoading && (
                        <div className="flex justify-start mb-6">
                            <div className="flex flex-row gap-3">
                                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center border border-green-50">
                                    <Bot className="w-5 h-5 text-green-600" />
                                </div>
                                <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-sm border border-gray-100 shadow-sm flex items-center">
                                    <div className="flex gap-1">
                                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* 입력 영역 */}
                <div className="p-4 bg-white border-t border-gray-100 shrink-0">
                    <div className="relative flex items-end bg-gray-50 border border-gray-200 rounded-xl focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all shadow-inner">
                        <textarea
                            ref={textareaRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="궁금한 내용을 입력하세요..."
                            className="flex-1 pl-4 pr-12 py-3 bg-transparent border-none text-sm focus:outline-none resize-none min-h-[64px] max-h-32"
                            disabled={isLoading}
                        />
                        <button
                            onClick={sendMessage}
                            disabled={!input.trim() || isLoading}
                            className="absolute w-8 h-8 flex items-center justify-center rounded-lg transition-none"
                            style={{
                                bottom: '12px', // bottom-3
                                right: '8px',   // right-2
                                backgroundColor: (input.trim() && !isLoading) ? '#2563eb' : '#e5e7eb',
                                color: (input.trim() && !isLoading) ? '#ffffff' : '#9ca3af',
                                opacity: 1,
                                cursor: (input.trim() && !isLoading) ? 'pointer' : 'default',
                                border: 'none'
                            }}
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="text-center mt-2">
                        <p className="text-[10px] text-gray-400">
                            AI는 실수할 수 있습니다. 중요한 정보는 확인이 필요합니다.
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
