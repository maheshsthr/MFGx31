export default function Brand({ size = 32, round = 10, showText = true, textSize = 1.1, light = false }) {
  return (
    <span className={`brand ${light ? 'brand--light' : ''}`}>
      <img
        src="/logo.png"
        alt=""
        className="brand-img"
        style={{
          width: size,
          height: size,
          borderRadius: typeof round === 'number' ? `${round}px` : round === false ? 0 : '10px',
        }}
      />
      {showText && (
        <span className="brand-text" style={{ fontSize: `${textSize}rem` }}>
          <span className="brand-text-bold">MFG</span>
          <span className="brand-text-light">x31</span>
        </span>
      )}
    </span>
  );
}
