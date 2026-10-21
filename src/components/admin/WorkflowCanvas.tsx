'use client';

import React, { useCallback } from 'react';
import {
    ReactFlow,
    useNodesState,
    useEdgesState,
    addEdge,
    Background,
    Controls,
    Connection,
    Edge,
    Node,
    MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

const initialNodes: Node[] = [
    // 1. 사용자 질문
    {
        id: 'user-input',
        type: 'input',
        data: { label: '사용자 질문 (User Input)' },
        position: { x: 300, y: 0 },
        style: { background: '#f8fafc', border: '1px solid #94a3b8', borderRadius: '8px', padding: '10px', width: 220 },
    },
    // 2. 스마트 라우터 (LLM)
    {
        id: 'router',
        data: { label: 'Smart Router (LLM Intent/Clarify)' },
        position: { x: 300, y: 150 },
        style: { background: '#fef08a', border: '1px solid #eab308', borderRadius: '8px', padding: '10px', width: 220, fontWeight: 'bold' },
    },
    // 3-A. TAG Engine (기존)
    {
        id: 'tag-engine',
        data: { label: 'TAG Engine (Natural Language to SQL)' },
        position: { x: 100, y: 300 },
        style: { background: '#dbeafe', border: '1px solid #3b82f6', borderRadius: '8px', padding: '10px', width: 220 },
    },
    // 3-B. RAG Engine (신규)
    {
        id: 'rag-engine',
        data: { label: 'RAG Engine (Vector Search + GPT)' },
        position: { x: 500, y: 300 },
        style: { background: '#ffedd5', border: '1px solid #f97316', borderRadius: '8px', padding: '10px', width: 220 },
    },
    // 4-A. Database
    {
        id: 'database',
        data: { label: 'Database (SQL Search)' },
        position: { x: 100, y: 450 },
        style: { background: '#dcfce7', border: '1px solid #22c55e', borderRadius: '8px', padding: '10px', width: 220 },
    },
    // 4-B. Vector DB
    {
        id: 'vector-db',
        data: { label: 'Vector DB (Knowledge Search)' },
        position: { x: 500, y: 450 },
        style: { background: '#dcfce7', border: '1px solid #22c55e', borderRadius: '8px', padding: '10px', width: 220 },
    },
    // 5. Response
    {
        id: 'response',
        type: 'output',
        data: { label: '통합 응답 (Response)' },
        position: { x: 300, y: 600 },
        style: { background: '#fdf4ff', border: '1px solid #d946ef', borderRadius: '8px', padding: '10px', width: 220 },
    },
];

const initialEdges: Edge[] = [
    // User -> Router
    { id: 'e1', source: 'user-input', target: 'router', markerEnd: { type: MarkerType.ArrowClosed } },

    // Router -> TAG (Branch A)
    { id: 'e2-tag', source: 'router', target: 'tag-engine', label: 'TAG (Inventions)', markerEnd: { type: MarkerType.ArrowClosed } },
    // Router -> RAG (Branch B)
    { id: 'e2-rag', source: 'router', target: 'rag-engine', label: 'RAG (Knowledge)', markerEnd: { type: MarkerType.ArrowClosed } },

    // TAG flow
    { id: 'e3-tag', source: 'tag-engine', target: 'database', animated: true, markerEnd: { type: MarkerType.ArrowClosed } },
    { id: 'e4-tag', source: 'database', target: 'response', animated: true, markerEnd: { type: MarkerType.ArrowClosed } },

    // RAG flow
    { id: 'e3-rag', source: 'rag-engine', target: 'vector-db', animated: true, markerEnd: { type: MarkerType.ArrowClosed } },
    { id: 'e4-rag', source: 'vector-db', target: 'response', animated: true, markerEnd: { type: MarkerType.ArrowClosed } },
];

interface WorkflowCanvasProps {
    onNodeClick: (node: Node) => void;
}

export default function WorkflowCanvas({ onNodeClick }: WorkflowCanvasProps) {
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    const onConnect = useCallback(
        (params: Connection) => setEdges((eds) => addEdge(params, eds)),
        [setEdges],
    );

    const handleNodeClick = (_: React.MouseEvent, node: Node) => {
        // DB 노드는 편집할 설정이 없으므로(혹은 제한적이므로) 클릭 핸들러 전달 안 할 수도 있음.
        // 여기서는 모든 노드 클릭 허용 후 SettingsPanel에서 필터링.
        onNodeClick(node);
    };

    return (
        <div style={{ width: '100%', height: '100%' }}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={handleNodeClick}
                fitView
            >
                <Background />
                <Controls />
            </ReactFlow>
        </div>
    );
}
