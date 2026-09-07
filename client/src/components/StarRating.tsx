const StarRating = ({ rating, size = 13 }: { rating: number; size?: number }) => {
  return (
    <span style={{ display: 'inline-flex', gap: '1px', fontSize: `${size}px`, color: 'var(--accent-lumen)' }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} style={{ opacity: i <= Math.round(rating) ? 1 : 0.25 }}>★</span>
      ))}
    </span>
  );
};

export default StarRating;