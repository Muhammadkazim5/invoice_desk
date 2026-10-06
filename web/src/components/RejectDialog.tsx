import { useEffect, useRef, useState } from 'react';

interface RejectDialogProps {
  open: boolean;
  busy: boolean;
  onCancel: () => void;
  onConfirm: (note: string) => void;
}

export function RejectDialog({ open, busy, onCancel, onConfirm }: RejectDialogProps): JSX.Element {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [note, setNote] = useState('');
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      setNote('');
      setTouched(false);
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  const trimmed = note.trim();
  const showError = touched && trimmed.length === 0;

  return (
    <dialog
      ref={dialogRef}
      className="reject-dialog"
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
      onClose={onCancel}
    >
      <form
        method="dialog"
        onSubmit={(event) => {
          event.preventDefault();
          setTouched(true);
          if (trimmed.length === 0) return;
          onConfirm(trimmed);
        }}
      >
        <h2>Reject invoice</h2>
        <label htmlFor="reject-note">Reason for rejection</label>
        <textarea
          id="reject-note"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          onBlur={() => setTouched(true)}
          rows={4}
          required
          aria-describedby={showError ? 'reject-note-error' : undefined}
          aria-invalid={showError}
        />
        {showError && (
          <p id="reject-note-error" className="field-error" role="alert">
            A reason is required to reject an invoice.
          </p>
        )}
        <div className="dialog-actions">
          <button type="button" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button type="submit" className="button-danger" disabled={busy}>
            {busy ? 'Rejecting…' : 'Reject invoice'}
          </button>
        </div>
      </form>
    </dialog>
  );
}
