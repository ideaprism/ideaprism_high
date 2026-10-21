import { Invention } from '@/types/invention';

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

export interface ChatResponse {
    content: string;
    type: 'text' | 'inventions' | 'knowledge' | 'error';
    inventions?: Invention[];
    sources?: { title: string; category: string }[];
}

/**
 * 챗봇 API 서비스 클래스
 * 지노 수석: 로직의 응집도를 높이고 ChatWindow의 책임을 줄이기 위해 분리했습니다.
 */
export class ChatService {
    private static API_URL = '/api/chat';

    static async sendMessage(message: string): Promise<ChatResponse> {
        try {
            const response = await fetch(this.API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'API 응답 오류');
            }

            return await response.json();
        } catch (error: any) {
            console.error('[ChatService] Error:', error);
            return {
                content: '죄송합니다. 서버 통신 중 오류가 발생했습니다.',
                type: 'error'
            };
        }
    }
}
