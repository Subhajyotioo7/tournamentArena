import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Clock3, CheckCircle2, CircleX, Trash2, Users } from 'lucide-react';
import { Button } from '../components/ui/button';
import { roomService } from '../services/api';

function InvitationStatus({ status }) {
  if (status === 'accepted') {
    return <CheckCircle2 className="h-5 w-5 text-emerald-600" aria-label="Accepted" />;
  }
  if (status === 'rejected') {
    return <CircleX className="h-5 w-5 text-red-500" aria-label="Declined" />;
  }
  return <span className="text-xs font-bold uppercase text-amber-600">Waiting</span>;
}

export default function TeamWaiting() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [error, setError] = useState('');
  const [removing, setRemoving] = useState(false);

  const loadRoom = useCallback(async () => {
    try {
      const data = await roomService.getDetail(roomId);
      setRoom(data);
    } catch (loadError) {
      setError(loadError.message || 'Unable to load team status');
    }
  }, [navigate, roomId]);

  useEffect(() => {
    loadRoom();
    const timer = window.setInterval(loadRoom, 5000);
    return () => window.clearInterval(timer);
  }, [loadRoom]);

  const accepted = room?.invitations?.filter((item) => item.status === 'accepted').length || 0;
  const rejected = room?.invitations?.filter((item) => item.status === 'rejected').length || 0;
  const total = room?.team_mode === 'duo' ? 1 : 3;
  const complete = accepted === total;
  const removeTeam = async () => {
    const pendingInvitation = room?.invitations?.find((item) => item.status === 'pending');
    if (!pendingInvitation || !window.confirm('Remove this team from the tournament? Paid entry amounts will not be refunded.')) return;
    setRemoving(true);
    try {
      await roomService.removeTeam(roomId, null, pendingInvitation.id);
      navigate('/my-rooms');
    } catch (removeError) {
      setError(removeError.message || 'Unable to remove team');
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-amber-50 px-4 py-12">
      <div className="mx-auto max-w-2xl rounded-3xl border border-stone-200 bg-white p-6 shadow-xl sm:p-10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
          <Clock3 className="h-8 w-8" aria-hidden="true" />
        </div>
        <h1 className="mt-6 text-center text-3xl font-black text-stone-900">Waiting for your team</h1>
        <p className="mt-2 text-center text-stone-500">
        {complete
          ? 'Your team is complete and has been added to the tournament.'
          : `Your ${room?.team_mode || 'team'} entry is reserved. Teammates must accept their invitations before the team can join.`}
        </p>

        {room && (
          <div className="mt-8 rounded-2xl bg-stone-50 p-5">
            <div className="flex items-center justify-between text-sm font-bold text-stone-700">
              <span className="flex items-center gap-2"><Users className="h-4 w-4" /> {room.payment_type === 'leader_pays_all' ? 'Captain pays all' : 'Split payment'}</span>
              <span>{accepted}/{total} accepted{rejected ? ` • ${rejected} declined` : ''}</span>
            </div>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between rounded-xl bg-white px-4 py-3">
                <span className="font-semibold text-stone-800">Captain / you</span>
                <span className="text-xs font-bold uppercase text-emerald-600">Paid</span>
              </div>
              {(room.invitations || []).map((invitation) => (
                <div key={invitation.id} className="flex items-center justify-between rounded-xl bg-white px-4 py-3">
                  <div>
                    <p className="font-semibold text-stone-800">{invitation.invitee_username || invitation.game_id}</p>
                    <p className="text-xs text-stone-400">Game ID: {invitation.game_id}</p>
                  </div>
                  <InvitationStatus status={invitation.status} />
                </div>
              ))}
            </div>
          </div>
        )}

        {error && <p className="mt-5 text-center text-sm font-semibold text-red-600">{error}</p>}
        {room?.can_manage && !complete && (
          <Button className="mt-3 w-full border-red-200 text-red-600 hover:bg-red-50" variant="outline" onClick={removeTeam} disabled={removing}>
            <Trash2 className="mr-2 h-4 w-4" /> {removing ? 'Removing team...' : 'Remove team'}
          </Button>
        )}
        <Button className="mt-8 w-full" variant={complete ? 'default' : 'outline'} onClick={() => navigate('/my-rooms')}>
          {complete ? 'Open My Rooms' : 'Back to My Rooms'}
        </Button>
      </div>
    </div>
  );
}
