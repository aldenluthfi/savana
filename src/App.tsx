import bromoImage from './assets/bromo.jpg'
import edelweiss1 from './assets/edelweiss_1.png'

const DECORATIONS_COUNT = 50;

function App() {
  const generateRandomEdelweiss = () => {
    const decorations = [];
    const images = [edelweiss1];
    const sizes = ['w-8 h-8', 'w-10 h-10', 'w-12 h-12', 'w-14 h-14', 'w-16 h-16'];

    for (let i = 0; i < DECORATIONS_COUNT; i++) {
      const randomImage = images[Math.floor(Math.random() * images.length)];
      const randomSize = sizes[Math.floor(Math.random() * sizes.length)];
      const randomTop = Math.random() * 100;
      const randomLeft = Math.random() * 100;

      decorations.push({
        src: randomImage,
        size: randomSize,
        top: randomTop,
        left: randomLeft,
      });
    }

    return decorations;
  };

  const edelweissDecorations = generateRandomEdelweiss();

  return (
    <>
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <img
          src={bromoImage}
          alt="Mount Bromo"
          className="fixed inset-0 w-full h-full object-cover"
          style={{ zIndex: -1 }}
        />
        <div className="absolute inset-0 bg-blue-500/30"></div>

        {edelweissDecorations.map((decoration, index) => (
          <div
            key={index}
            className={`absolute ${decoration.size} pointer-events-none`}
            style={{
              top: `${decoration.top}%`,
              left: `${decoration.left}%`,
              transform: 'translate(-50%, -50%)',
              zIndex: 5
            }}
          >
            <img src={decoration.src} alt="Edelweiss" className="w-full h-full object-contain opacity-70" />
          </div>
        ))}

        <div className="relative z-10 text-center text-white mx-auto px-4">
          <h1 className="text-12xl md:text-14xl font-extrabold mb-4 leading-tight text-yellow-200">
            SAVANA
          </h1>
          <p className="text-2xl md:text-3xl mb-4 max-w-2xl mx-auto font-extrabold leading-relaxed">
            Sustainable Action for the
            <br/>
            Village, Agriculture, Nature, and Health
          </p>
        </div>
      </div>

      <div className='h-screen bg-white z-10 relative'>

      </div>

      <footer className="bg-gray-800 text-white py-8 relative z-10">
      </footer>
    </>
  )
}

export default App;
