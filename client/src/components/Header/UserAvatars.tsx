import { useBoardStore } from '../../store/boardStore';
import { userIdToColor } from '../../utils/color';

export default function UserAvatars() {
  const connectedUsers = useBoardStore((s) => s.connectedUsers);
  const localUserId = useBoardStore((s) => s.userId);
  const localUserName = useBoardStore((s) => s.userName);

  // Always show local user first
  const localUser = { userId: localUserId, userName: localUserName, color: userIdToColor(localUserId) };
  const others = Object.values(connectedUsers).filter((u) => u.userId !== localUserId);
  const allUsers = [localUser, ...others];

  return (
    <div className="flex items-center gap-1">
      {allUsers.map((user) => {
        const initials = user.userName
          .split(' ')
          .map((w) => w[0])
          .join('')
          .slice(0, 2)
          .toUpperCase();
        const color = user.color || userIdToColor(user.userId);
        const isLocal = user.userId === localUserId;
        return (
          <div
            key={user.userId}
            title={`${user.userName}${isLocal ? ' (you)' : ''}`}
            className="w-8 h-8 flex items-center justify-center text-xs font-bold select-none"
            style={{
              backgroundColor: color,
              color: '#0b0c10',
              borderRadius: 4,
              boxShadow: isLocal ? `0 0 0 2px var(--lime)` : `0 0 0 1.5px var(--border-mid)`,
              fontFamily: "'Space Mono', monospace",
              letterSpacing: '0.02em',
            }}
          >
            {initials}
          </div>
        );
      })}
    </div>
  );
}
