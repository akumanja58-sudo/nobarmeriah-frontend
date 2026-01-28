'use client';

const OrbitLoader = ({ size = 48, text = 'Memuat...' }) => {
  return (
    <div className="flex flex-col items-center justify-center">
      {/* Loader */}
      <div 
        className="orbit-loader"
        style={{ width: size, height: size }}
      />
      
      {/* Text */}
      {text && (
        <p className="text-gray-500 font-condensed mt-4 text-sm">{text}</p>
      )}

      {/* Styles */}
      <style jsx>{`
        .orbit-loader {
          transform: rotateZ(45deg);
          perspective: 1000px;
          border-radius: 50%;
          color: #22C55E; /* green-500 - ijo terang */
        }

        .orbit-loader::before,
        .orbit-loader::after {
          content: '';
          display: block;
          position: absolute;
          top: 0;
          left: 0;
          width: inherit;
          height: inherit;
          border-radius: 50%;
          transform: rotateX(70deg);
          animation: orbit-spin 1s linear infinite;
        }

        .orbit-loader::after {
          color: #15803D; /* green-700 - ijo gelap */
          transform: rotateY(70deg);
          animation-delay: 0.4s;
        }

        @keyframes orbit-spin {
          0%, 100% {
            box-shadow: 0.2em 0px 0 0px currentcolor;
          }
          12% {
            box-shadow: 0.2em 0.2em 0 0 currentcolor;
          }
          25% {
            box-shadow: 0 0.2em 0 0px currentcolor;
          }
          37% {
            box-shadow: -0.2em 0.2em 0 0 currentcolor;
          }
          50% {
            box-shadow: -0.2em 0 0 0 currentcolor;
          }
          62% {
            box-shadow: -0.2em -0.2em 0 0 currentcolor;
          }
          75% {
            box-shadow: 0px -0.2em 0 0 currentcolor;
          }
          87% {
            box-shadow: 0.2em -0.2em 0 0 currentcolor;
          }
        }
      `}</style>
    </div>
  );
};

export default OrbitLoader;
