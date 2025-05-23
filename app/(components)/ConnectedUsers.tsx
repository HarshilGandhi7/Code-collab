import React, { memo } from 'react';

interface ConnectedUsersProps {
  users: string[];
  currentUser: string;
}

const ConnectedUsers = memo(({ users, currentUser }: ConnectedUsersProps) => {
  
  return (
    <div className="bg-gray-800 rounded-lg p-3">
      <h3 className="text-sm text-gray-400 mb-2">Connected Users ({users.length})</h3>
      <div className="flex flex-wrap gap-2">
        {users.map((user) => (
          <span
            key={user}
            className={`px-3 py-1 text-sm rounded-full ${
              user === currentUser
                ? "bg-green-600 text-white"
                : "bg-gray-700 text-gray-300"
            }`}
          >
            {user}
          </span>
        ))}
      </div>
    </div>
  );
});

ConnectedUsers.displayName = 'ConnectedUsers';

export default ConnectedUsers;