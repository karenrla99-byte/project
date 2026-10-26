export default function Button({ accent, className = '', ...props }) {
  return <button type="button" className={`btn ${accent ? 'accent' : ''} ${className}`} {...props} />;
}
