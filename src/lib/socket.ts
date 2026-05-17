import { io, Socket } from 'socket.io-client';
import { useEffect, useState } from 'react';
import { Stroke } from '../types';

let socket: Socket | null = null;

export const useBoardSocket = (boardId: string) => {
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // In production, the URL might be different, but for now empty string or current host
    socket = io();

    socket.on('connect', () => {
      setIsConnected(true);
      socket?.emit('join-board', boardId);
    });

    socket.on('init-board', (initialStrokes: Stroke[]) => {
      setStrokes(initialStrokes);
    });

    socket.on('stroke-drawn', (newStroke: Stroke) => {
      setStrokes((prev) => {
        // Prevent duplicate strokes
        if (prev.find(s => s.id === newStroke.id)) return prev;
        return [...prev, newStroke];
      });
    });

    socket.on('board-cleared', () => {
      setStrokes([]);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    return () => {
      socket?.disconnect();
    };
  }, [boardId]);

  const addStroke = (stroke: Stroke) => {
    // Update locally immediately (optimistic)
    setStrokes((prev) => [...prev, stroke]);
    // Send to server
    socket?.emit('draw-stroke', { boardId, stroke });
  };

  const clearStrokes = () => {
    socket?.emit('clear-board', boardId);
  };

  return { strokes, addStroke, clearStrokes, isConnected };
};
