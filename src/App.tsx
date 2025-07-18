import bromoImage from './assets/bromo.jpg'
import tenggerImage from './assets/tengger.jpg'
import edelweiss1 from './assets/edelweiss_1.png'
import Squiggle from './components/custom/squiggle';
import SensorChart from './components/custom/sensor-chart';
import { useState, useEffect } from 'react';

const DECORATIONS_COUNT = 50;

function App() {
    const [showTengger, setShowTengger] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            const scrollY = window.scrollY;

            if (scrollY > window.innerHeight) {
                setShowTengger(true);
            } else {
                setShowTengger(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const generateRandomEdelweiss = () => {
        const decorations = [];
        const images = [edelweiss1];
        const sizes = ['size-8', 'size-10', 'size-12', 'size-14', 'size-16'];

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
                    style={{
                        zIndex: -2,
                        opacity: showTengger ? 0 : 1
                    }}
                />
                <img
                    src={tenggerImage}
                    alt="Mount Tengger"
                    className="fixed inset-0 w-full h-full object-cover"
                    style={{
                        zIndex: -1,
                        opacity: showTengger ? 1 : 0
                    }}
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
                        <img src={decoration.src} alt="Edelweiss" className="w-full h-full object-contain opacity-70 -z-10" />
                    </div>
                ))}

                <div className="relative z-10 text-center text-white mx-auto px-4">
                    <h1 className="text-7xl sm:text-8xl md:text-10xl lg:text-12xl xl:text-14xl font-extrabold mb-4 leading-tight text-yellow-300">
                        SAVANA
                    </h1>
                    <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl mb-4 max-w-3xl mx-auto font-extrabold leading-relaxed px-2">
                        Sustainable Action for the Village
                        <br />
                        Environment, Education, and Health in Wonokitri
                    </p>
                </div>
            </div>

            <Squiggle className="w-full fill-white -mb-0.25 z-20" />
            <div className='min-h-screen bg-white z-10 relative flex items-center justify-center p-8 pb-20'>
                <SensorChart />
            </div>
        </>
    )
}

export default App;
