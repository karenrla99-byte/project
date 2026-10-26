/** RPG 대화창 */
export default function Window({ title, children, style, className = '' }) {
  return (
    <div className={`win ${className}`} style={style}>
      {title && <div style={{ fontWeight: 700, marginBottom: 12 }}>{title}</div>}
      {children}
    </div>
  );
}
