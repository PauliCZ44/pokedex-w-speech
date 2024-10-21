import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { ChevronLeft, ChevronRight, Volume2, Settings, Dices } from 'lucide-react';

interface Pokemon {
  id: number;
  name: string;
  sprites: {
    other: {
      'official-artwork': {
        front_default: string;
      };
    };
  };
}

const fetchPokemon = async (id: number): Promise<Pokemon> => {
  const { data } = await axios.get(`https://pokeapi.co/api/v2/pokemon/${id}`);
  return data;
};

const speakPokemonName = (name: string, lang: string) => {
  const utterance = new SpeechSynthesisUtterance(name);
  
  const voices = speechSynthesis.getVoices();
  const targetVoice = voices.find(voice => voice.lang.startsWith(lang));
  
  if (targetVoice) {
    utterance.voice = targetVoice;
  } else {
    console.log(`${lang} voice not found. Using default voice.`);
  }

  speechSynthesis.speak(utterance);
};

const getRandomNum = () => Math.floor(Math.random()*1000)

function App() {
  const [pokemonId, setPokemonId] = useState(1);
  const [randomId, setRandomId] = useState(getRandomNum());
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [language, setLanguage] = useState('cs-CZ');
  const [imageKey, setImageKey] = useState(0);
  const queryClient = useQueryClient();
  
  const { data: pokemon, isLoading, isError } = useQuery({
    queryKey: ['pokemon', pokemonId],
    queryFn: () => fetchPokemon(pokemonId),
  });

  useEffect(() => {
    if (pokemon) {
      const timer = setTimeout(() => {
        speakPokemonName(pokemon.name, language);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [pokemon, language]);

  useEffect(() => {
    // Prefetch next Pokemon
    const nextId = pokemonId + 1;
    queryClient.prefetchQuery({
      queryKey: ['pokemon', nextId],
      queryFn: () => fetchPokemon(nextId),
    });
  }, [pokemonId, queryClient]);


    useEffect(() => {
    // Prefetch next Pokemon
    queryClient.prefetchQuery({
      queryKey: ['pokemon', randomId],
      queryFn: () => fetchPokemon(randomId),
    });
  }, [randomId, queryClient]);

  
  const handleRandom = () => {
    setIsButtonDisabled(true);
    setPokemonId(randomId);
    setImageKey(prevKey => prevKey + 1); // Trigger animation
    setTimeout(() => setIsButtonDisabled(false), 2500);
    setRandomId(getRandomNum())
  }

  const handleNavigation = (direction: 'prev' | 'next') => {
    setIsButtonDisabled(true);
    setPokemonId((prev) => direction === 'prev' ? Math.max(1, prev - 1) : prev + 1);
    setImageKey(prevKey => prevKey + 1); // Trigger animation
    setTimeout(() => setIsButtonDisabled(false), 2500);
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'cs-CZ' ? 'en-US' : 'cs-CZ');
  };

  if (isError) return <div className="text-center text-white">Error fetching Pokémon</div>;

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4 relative">
      <style jsx>{`
        @keyframes scaleIn {
          from {
            transform: scale(0.8);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        .pokemon-image {
          animation: scaleIn 500ms ease-out;
        }
        .nav-button {
          transition: all 0.1s ease-in-out;
        }
        .nav-button:active {
          transform: scale(0.95);
          box-shadow: inset 0 3px 5px rgba(0, 0, 0, 0.2);
        }
      `}</style>
      <button
        onClick={toggleLanguage}
        className="absolute top-4 right-4 bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 transition-colors"
        aria-label="Settings"
      >
        <Settings size={24} />
      </button>
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm">
        <h1 className="text-xl font-bold text-center mb-4">Pokédex</h1>
        {isLoading && <div className="text-center text-white">
          <div class="animate-pulse bg-gray-100  w-64 h-96  shadow rounded-md p-4 max-w-sm w-full mx-auto text-slate-800	">
         Loading...
          </div>
        </div>}
        
        {pokemon && (
          <div className="text-center">
            <img
              key={imageKey}
              src={pokemon.sprites.other['official-artwork'].front_default}
              alt={pokemon.name}
              className="w-64 h-64 mx-auto mb-4 pokemon-image"
            />
            <h2 className="text-2xl font-semibold capitalize mb-2">{pokemon.name}</h2>
            <p className="text-gray-600  text-xs">
              #{pokemon.id.toString().padStart(3, '0')}
            </p>
            <p className="text-gray-600 mb-3 text-xs">
              {language}
            </p>
            <button
              onClick={() => speakPokemonName(pokemon.name, language)}
              className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 transition-colors"
              aria-label="Speak Pokémon name"
            >
              <Volume2 size={24} /> 
            </button>
          </div>
        )}
        <div className="flex justify-between mt-4">
          <button
            onClick={() => handleNavigation('prev')}
            disabled={isButtonDisabled}
            className={`nav-button bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-l transition-colors ${isButtonDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <ChevronLeft size={32} />
          </button>
          
            <button
            onClick={handleRandom}
            disabled={isButtonDisabled}
            className={`nav-button bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-l transition-colors ${isButtonDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Dices size={32} />
          </button>
          
          <button
            onClick={() => handleNavigation('next')}
            disabled={isButtonDisabled}
            className={`nav-button bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-r transition-colors ${isButtonDisabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
          >
            <ChevronRight size={32} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;