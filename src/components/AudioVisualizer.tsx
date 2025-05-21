import { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  stream: MediaStream;
}

export const AudioVisualizer = ({ stream }: AudioVisualizerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  
  useEffect(() => {
    if (!canvasRef.current) return;

    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(stream);
    
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.7;
    source.connect(analyser);

    const canvas = canvasRef.current;
    const canvasCtx = canvas.getContext('2d')!;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const draw = () => {
      const width = canvas.width;
      const height = canvas.height;
      const barWidth = (width / bufferLength) * 2.5;
      
      animationFrameRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);
      
      canvasCtx.fillStyle = 'rgb(249, 250, 251)'; // bg-gray-50
      canvasCtx.fillRect(0, 0, width, height);
      
      let x = 0;
      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * height;
        const gradient = canvasCtx.createLinearGradient(0, height, 0, height - barHeight);
        gradient.addColorStop(0, '#2563eb'); // blue-600
        gradient.addColorStop(1, '#3b82f6'); // blue-500
        
        canvasCtx.fillStyle = gradient;
        canvasCtx.fillRect(x, height - barHeight, barWidth, barHeight);
        x += barWidth + 1;
      }
    };
    
    draw();
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      audioContext.close();
    };
  }, [stream]);
  
  return (
    <canvas
      ref={canvasRef}
      width={300}
      height={100}
      className="w-full rounded-lg"
    />
  );
};
