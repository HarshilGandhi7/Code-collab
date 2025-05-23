import React from 'react';
import { useRouter } from 'next/navigation';
import { RoomData } from '@/utils/room';

interface UserSessionsProps {
  sessions: RoomData[];
  username: string;
}

const UserSessions = ({ sessions,username }: UserSessionsProps) => {
  const router = useRouter();


  if (!sessions || sessions.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-8 text-center">
        <h3 className="text-xl font-semibold text-white mb-4">No Saved Sessions</h3>
        <p className="text-gray-400 mb-6">Create a new room to start coding!</p>
        <button 
          onClick={() => router.push('/create-room')} 
          className="px-5 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-white transition-colors"
        >
          Create New Room
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {sessions.map((session) => (
        <div 
          key={session.roomId} 
          className="bg-gray-800 rounded-lg overflow-hidden shadow-lg border border-gray-700 hover:border-blue-500 transition-all duration-300"
        >
          <div className="bg-gray-900 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex space-x-1">
                <span className="h-3 w-3 rounded-full bg-red-500"></span>
                <span className="h-3 w-3 rounded-full bg-yellow-500"></span>
                <span className="h-3 w-3 rounded-full bg-green-500"></span>
              </div>
              <span className="font-mono text-sm text-blue-400">{session.language}</span>
            </div>
          </div>
          
          {/* Code preview */}
          <div className="p-4">
            <div className="mb-3 flex justify-between items-start">
              <h3 className="text-white font-semibold truncate">{session.roomId}</h3>
            </div>
            
            <div className="bg-gray-900 rounded p-3 font-mono text-xs text-gray-300 h-32 overflow-hidden relative">
              <pre className="whitespace-pre-wrap break-all">{session.code.substring(0, 150)}</pre>
              {session.code.length > 0 && (
                <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-gray-900 to-transparent"></div>
              )}
            </div>
          </div>
          
          {/* Footer with actions */}
          <div className="bg-gray-900 px-4 py-3 flex justify-between items-center">
            <button
              onClick={() => router.push(`/room/${session.roomId}/${username}`)}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-sm text-white transition-colors"
            >
              Open Session
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default UserSessions;