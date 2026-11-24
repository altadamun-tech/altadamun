import { Button, Stack } from '@mui/material';
import { useTranslation } from 'react-i18next';

interface LeaveReviewActionsProps {
  status: string;
  onApprove: () => void;
  onReject: () => void;
  disabled?: boolean;
}

export default function LeaveReviewActions({ status, onApprove, onReject, disabled }: LeaveReviewActionsProps) {
  const { t } = useTranslation();
  if (status !== 'pending') return null;
  return (
    <Stack direction="row" spacing={1}>
      <Button color="success" variant="contained" size="small" onClick={onApprove} disabled={disabled}>
        {t('leave.approve') || 'Approve'}
      </Button>
      <Button color="error" variant="contained" size="small" onClick={onReject} disabled={disabled}>
        {t('leave.reject') || 'Reject'}
      </Button>
    </Stack>
  );
}
