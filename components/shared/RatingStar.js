export function RatingStar({ ratings, reviewCount, page, rating = 0, onRatingChange, isClickable = false }) {
    const display_rating = rating || ratings || 0;
    const total_stars = 5;

    const integerPart = parseInt(display_rating);
    const decimalPart = Math.round((display_rating - integerPart) * 10);

    const handleStarClick = (starIndex) => {
        if (isClickable && onRatingChange) {
            onRatingChange(starIndex + 1);
        }
    };

    const handleStarHover = (starIndex, isHovering) => {
        if (isClickable) {
            // You can add hover effects here if needed
        }
    };

    return (
        <>
            <div className="rating flex align-middle">
                {[...Array(total_stars)].map((_, index) => {
                    let fillPercentage = 0;
                    
                    if (isClickable) {
                        // For clickable stars, show full stars up to the rating
                        fillPercentage = index < rating ? 100 : 0;
                    } else {
                        // For display-only stars, show partial fills
                        if (index < integerPart) {
                            fillPercentage = 100;
                        } else if (index === integerPart && decimalPart > 0) {
                            fillPercentage = decimalPart * 10;
                        } else {
                            fillPercentage = 0;
                        }
                    }

                    return (
                        <Star 
                            key={index} 
                            fillPercentage={fillPercentage}
                            onClick={() => handleStarClick(index)}
                            onMouseEnter={() => handleStarHover(index, true)}
                            onMouseLeave={() => handleStarHover(index, false)}
                            isClickable={isClickable}
                        />
                    );
                })}
            </div>
        </>
    );
}

export function Star({ fillPercentage, onClick, onMouseEnter, onMouseLeave, isClickable }) {
    const show_filled = 100 - fillPercentage;
    
    return (
        <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 2048 2048" 
            width="20" 
            height="20" 
            style={{ 
                margin: '5px 2px',
                cursor: isClickable ? 'pointer' : 'default',
                transition: 'transform 0.1s ease'
            }}
            onClick={onClick}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            onMouseDown={(e) => isClickable && (e.currentTarget.style.transform = 'scale(0.95)')}
            onMouseUp={(e) => isClickable && (e.currentTarget.style.transform = 'scale(1)')}
        >
            {/* Gray background star */}
            <path 
                transform="translate(1020,1)" 
                d="m0 0 16 1 17 5 13 8 10 10 8 14 19 40 13 28 17 36 9 20 7 15 15 31 13 28 18 38 16 34 13 28 10 22 8 16 13 28 48 102 13 28 18 38 19 41 11 23 15 3 126 19 360 55 117 18 21 4 12 5 11 8 8 8 8 13 5 13 1 5v21l-6 16-6 10-11 13-28 28-2 3h-2l-2 4-33 33-7 8-32 32-1 2h-2l-2 4-33 33-2 3h-2l-2 4-41 41-7 8-27 27-1 2h-2l-2 4-36 36-7 8-31 31-2 3h-2l-2 4-38 38-2 3h-2l-2 4-31 31-7 8-30 30-5 6h-2l-2 4-20 20-1 4 6 35 9 56 12 74 14 86 18 110 24 147 12 74 12 73 1 8v16l-3 13-7 14-9 10-8 7-16 8-11 3-11 1-13-2-16-6-17-9-74-41-85-47-47-26-85-47-27-15-24-13-23-13-87-48-85-47-7-4-6 1-143 79-143 79-85 47-85 47-29 16-24 13-23 13-24 13-10 5-13 4h-20l-14-4-12-6-12-11-7-9-6-12-3-10-1-14 7-46 15-92 15-91 34-209 21-129 17-103-7-8-12-12-7-8-31-31-7-8-25-25-7-8-38-38-7-8-38-38-7-8-31-31-7-8-25-25-7-8-39-39-7-8-37-37-7-8-31-31-7-8-25-25-7-8-35-35-7-8-8-10-6-12-3-10v-24l6-15 5-9 9-11 11-8 11-5 13-3 96-15 393-60 73-11 64-10 5-5 15-32 7-16 7-14 13-28 18-38 15-32 13-28 17-36 9-20 7-14 13-28 18-38 15-32 13-28 17-36 13-28 18-38 16-34 15-32 13-28 8-17 9-13 9-8 16-8 11-3z" 
                fill="#c7c7c7" 
            />

            {/* Yellow filled star */}
            <path 
                transform="translate(1020,1)" 
                d="m0 0 16 1 17 5 13 8 10 10 8 14 19 40 13 28 17 36 9 20 7 15 15 31 13 28 18 38 16 34 13 28 10 22 8 16 13 28 48 102 13 28 18 38 19 41 11 23 15 3 126 19 360 55 117 18 21 4 12 5 11 8 8 8 8 13 5 13 1 5v21l-6 16-6 10-11 13-28 28-2 3h-2l-2 4-33 33-7 8-32 32-1 2h-2l-2 4-33 33-2 3h-2l-2 4-41 41-7 8-27 27-1 2h-2l-2 4-36 36-7 8-31 31-2 3h-2l-2 4-38 38-2 3h-2l-2 4-31 31-7 8-30 30-5 6h-2l-2 4-20 20-1 4 6 35 9 56 12 74 14 86 18 110 24 147 12 74 12 73 1 8v16l-3 13-7 14-9 10-8 7-16 8-11 3-11 1-13-2-16-6-17-9-74-41-85-47-47-26-85-47-27-15-24-13-23-13-87-48-85-47-7-4-6 1-143 79-143 79-85 47-85 47-29 16-24 13-23 13-24 13-10 5-13 4h-20l-14-4-12-6-12-11-7-9-6-12-3-10-1-14 7-46 15-92 15-91 34-209 21-129 17-103-7-8-12-12-7-8-31-31-7-8-25-25-7-8-38-38-7-8-38-38-7-8-31-31-7-8-25-25-7-8-39-39-7-8-37-37-7-8-31-31-7-8-25-25-7-8-35-35-7-8-8-10-6-12-3-10v-24l6-15 5-9 9-11 11-8 11-5 13-3 96-15 393-60 73-11 64-10 5-5 15-32 7-16 7-14 13-28 18-38 15-32 13-28 17-36 9-20 7-14 13-28 18-38 15-32 13-28 17-36 13-28 18-38 16-34 15-32 13-28 8-17 9-13 9-8 16-8 11-3z" 
                fill="#FFAB02" 
                style={{ clipPath: `inset(0% ${show_filled}% 0% 0%)` }} 
            />
        </svg>
    );
}