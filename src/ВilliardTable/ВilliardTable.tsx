import React, { useRef, useEffect, useState } from 'react';


const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 400;

const BALL_COLORS = ['#FF5733', '#33FF57', '#5733FF', '#FFFF33', '#33FFFF'];
const MIN_RADIUS = 10;
const MAX_RADIUS = 60;
const RESTITUTION = 0.9;

class Ball {
  constructor(
    public x: number,
    public y: number,
    public dx: number,
    public dy: number,
    public color: string,
    public radius: number,
    public isDragging: boolean = false
  ) {}

  draw(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.closePath();
  }

  update() {
    if (!this.isDragging) {
      this.x += this.dx;
      this.y += this.dy;
    }
  }

  handleCollision(canvasWidth: number, canvasHeight: number, balls: Ball[]) {
    if (this.x + this.radius >= canvasWidth || this.x - this.radius <= 0) {
      this.dx = -this.dx * RESTITUTION;
    }
    if (this.y + this.radius >= canvasHeight || this.y - this.radius <= 0) {
      this.dy = -this.dy * RESTITUTION;
    }

    balls.forEach(ball => {
      if (ball !== this) {
        const dx = ball.x - this.x;
        const dy = ball.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < this.radius + ball.radius) {
          const angle = Math.atan2(dy, dx);
          const sin = Math.sin(angle);
          const cos = Math.cos(angle);


          const thisVelX = this.dx * cos + this.dy * sin;
          const thisVelY = this.dy * cos - this.dx * sin;
          const ballVelX = ball.dx * cos + ball.dy * sin;
          const ballVelY = ball.dy * cos - ball.dx * sin;


          const thisNewVelX = (thisVelX * (this.radius - ball.radius) + 2 * ball.radius * ballVelX) / (this.radius + ball.radius);
          const thisNewVelY = thisVelY;
          const ballNewVelX = (ballVelX * (ball.radius - this.radius) + 2 * this.radius * thisVelX) / (this.radius + ball.radius);
          const ballNewVelY = ballVelY;


          this.dx = thisNewVelX * RESTITUTION;
          this.dy = thisNewVelY * RESTITUTION;
          ball.dx = ballNewVelX * RESTITUTION;
          ball.dy = ballNewVelY * RESTITUTION;


          const overlap = this.radius + ball.radius - distance;
          const angleOverlap = angle + Math.PI;
          this.x += Math.cos(angleOverlap) * overlap * 0.5;
          this.y += Math.sin(angleOverlap) * overlap * 0.5;
          ball.x -= Math.cos(angleOverlap) * overlap * 0.5;
          ball.y -= Math.sin(angleOverlap) * overlap * 0.5;
        }
      }
    });
  }
}


const ColorMenu: React.FC<{ onSelectColor: (color: string) => void }> = ({ onSelectColor }) => {
  return (
    <div>
      <p>Select Ball Color:</p>
      {BALL_COLORS.map(color => (
        <button key={color} style={{ backgroundColor: color }} onClick={() => onSelectColor(color)}></button>
      ))}
    </div>
  );
};


const BilliardGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [balls, setBalls] = useState<Ball[]>([]);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [draggedBall, setDraggedBall] = useState<Ball | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>(BALL_COLORS[0]);

  useEffect(() => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        const newBalls: Ball[] = [];
        for (let i = 0; i < 5; i++) {
          const randomX = Math.random() * (CANVAS_WIDTH - 2 * MAX_RADIUS) + MAX_RADIUS;
          const randomY = Math.random() * (CANVAS_HEIGHT - 2 * MAX_RADIUS) + MAX_RADIUS;
          const randomDX = 0;
          const randomDY = 0;
          const randomColor = BALL_COLORS[i % BALL_COLORS.length];
          const randomRadius = Math.random() * (MAX_RADIUS - MIN_RADIUS) + MIN_RADIUS;
          newBalls.push(new Ball(randomX, randomY, randomDX, randomDY, randomColor, randomRadius));
        }
        setBalls(newBalls);
      }
    }
  }, []);

  const animate = () => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        balls.forEach(ball => {
          ball.update();
          ball.handleCollision(CANVAS_WIDTH, CANVAS_HEIGHT, balls);
          ball.color = selectedColor;
          ball.draw(ctx);
        });
        requestAnimationFrame(animate);
      }
    }
  };

  useEffect(() => {
    animate();
  }, [balls, selectedColor]);


  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const mouseX = event.nativeEvent.offsetX;
    const mouseY = event.nativeEvent.offsetY;

    balls.forEach(ball => {
      const distance = Math.sqrt((mouseX - ball.x) ** 2 + (mouseY - ball.y) ** 2);
      if (distance < ball.radius) {
        setIsDragging(true);
        setDraggedBall(ball);
        ball.isDragging = true;
      }
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    if (draggedBall) {
      draggedBall.isDragging = false;
    }
    setDraggedBall(null);
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging && draggedBall && canvasRef.current) {
      const mouseX = event.nativeEvent.offsetX;
      const mouseY = event.nativeEvent.offsetY;
      const dx = mouseX - draggedBall.x;
      const dy = mouseY - draggedBall.y;
      draggedBall.dx = dx * 0.05;
      draggedBall.dy = dy * 0.05;
    }
  };

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
  };

  return (
    <div>
      <ColorMenu onSelectColor={handleColorSelect} />
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        style={{ border: '1px solid black', cursor: 'pointer' }}
      ></canvas>
    </div>
  );
};

export default BilliardGame;







