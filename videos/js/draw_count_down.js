function draw_count_down(timestamp) {
    const duration = 10; // seconds
            const numberStart = 100;
            const numberEnd = 200;

            const rectY = 150, rectW = 200, rectH = 100;
            const startX = 0;
            const endX = canvas.width - rectW;

            let startTime = null;

            
            
    if (!startTime) startTime = timestamp;
    const elapsed = (timestamp - startTime) / 1000; // seconds

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (elapsed <= duration) {
        // Calculate animation progress (0 to 1)
        const progress = elapsed / duration;

        // Rectangle X position (left to right)
        const rectX = startX + (endX - startX) * progress;

        // Countdown number from 100 to 200
        const number = numberStart + (numberEnd - numberStart) * progress;

        // Draw rectangle
        ctx.fillStyle = 'skyblue';
        ctx.fillRect(rectX, rectY, rectW, rectH);

        // Draw number centered inside rectangle
        ctx.fillStyle = 'black';
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(Math.floor(number), rectX + rectW / 2, rectY + rectH / 2);
    }

    if (elapsed < duration) {
        requestAnimationFrame(animate);
    }
}