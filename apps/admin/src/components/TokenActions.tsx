import type { WorkerToken } from '../hooks/useTokens';

interface TokenActionsProps {
  token: WorkerToken;
  onRevoke?: () => void;
  onRegenerate?: () => void;
}

export function TokenActions({ token, onRevoke, onRegenerate }: TokenActionsProps) {
  const isExpired = new Date(token.expires_at) < new Date();
  const isRevoked = token.revoked;

  const handleRevoke = () => {
    if (window.confirm('Are you sure you want to revoke this token? This will immediately disable access to the dashboard.')) {
      onRevoke?.();
    }
  };

  const handleRegenerate = () => {
    if (window.confirm('Are you sure you want to regenerate this token? This will revoke the existing token and create a new one.')) {
      onRegenerate?.();
    }
  };

  return (
    <div className="flex justify-end space-x-2">
      {!isRevoked && !isExpired && (
        <button
          onClick={handleRevoke}
          className="text-red-600 hover:text-red-900 text-sm font-medium"
        >
          Revoke
        </button>
      )}
      
      <button
        onClick={handleRegenerate}
        className="text-blue-600 hover:text-blue-900 text-sm font-medium"
      >
        Regenerate
      </button>
    </div>
  );
}
