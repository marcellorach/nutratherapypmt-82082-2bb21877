
import React from 'react';

interface StarRatingProps {
  score: number;
}

const StarRating: React.FC<StarRatingProps> = ({ score }) => {
  return (
    <div className="flex">
      {[...Array(5)].map((_, i) => (
        <span 
          key={i}
          className={`text-sm ${
            i < Math.floor(score) 
              ? "text-amber-400" 
              : "text-gray-300"
          }`}
        >
          ★
        </span>
      ))}
    </div>
  );
};

export default StarRating;
