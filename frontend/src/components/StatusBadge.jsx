export default function StatusBadge({ state }) {
  const map = {
    draft:    'badge-draft',
    waiting:  'badge-waiting',
    approved: 'badge-approved',
    rejected: 'badge-rejected',
    pending:  'badge-pending',
    cancelled:'badge-draft',
  }
  return <span className={map[state] || 'badge-draft'}>{state?.charAt(0).toUpperCase() + state?.slice(1)}</span>
}
