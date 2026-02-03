import React, { useState, useEffect, useRef } from 'react';
import SearchForm from './components/SearchForm.jsx';
import WeatherPanel from './components/WeatherPanel.jsx';
import EmptyState from './components/EmptyState.jsx';
import LoadingState from './components/LoadingState.jsx';
import ErrorBanner from './components/ErrorBanner.jsx';

const WeatherApp = () => {
  const [city, setCity] = useState('');
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [unit, setUnit] = useState('metric');
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [suggesting, setSuggesting] = useState(false);
  const [savedPlaces, setSavedPlaces] = useState(() => {
    try {
      const stored = localStorage.getItem('savedPlaces');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [activePlaceIndex, setActivePlaceIndex] = useState(0);
  const [currentPlace, setCurrentPlace] = useState(null);
  const [activePlace, setActivePlace] = useState(null);
  const [lastActivePlace, setLastActivePlace] = useState(() => {
    try {
      const stored = localStorage.getItem('lastActivePlace');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [weatherCache, setWeatherCache] = useState(() => {
    try {
      const stored = localStorage.getItem('weatherCache');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });
  const carouselRef = useRef(null);
  const scrollTimerRef = useRef(null);
  const miniMapContainer = useRef(null);
  const miniMap = useRef(null);
  const miniMarkerRef = useRef(null);
  const pendingMiniMarker = useRef(null);

  const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;

  useEffect(() => {
    // Ensure Leaflet assets are loaded once before initializing the map.
    if (!document.querySelector('link[href*="leaflet"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
      document.head.appendChild(link);
    }

    if (!window.L) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
      script.async = true;
      script.onload = () => {
        // Delay init to let the DOM/layout settle.
        setTimeout(() => {
          if (miniMapContainer.current && !miniMap.current) {
            initMap();
          }
        }, 100);
      };
      document.head.appendChild(script);
    } else {
      setTimeout(() => {
        if (miniMapContainer.current && !miniMap.current) {
          initMap();
        }
      }, 100);
    }
  }, []);

  useEffect(() => {
    // Fetch initial data so the UI isn't empty on first load.
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchWeatherByCoords(position.coords.latitude, position.coords.longitude, '', {
            setAsCurrent: true,
            updateQuery: false,
          });
        },
        () => {
          fetchWeather('Stockholm', { setAsCurrent: true, updateQuery: false });
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 600000 }
      );
    } else {
      fetchWeather('Stockholm', { setAsCurrent: true, updateQuery: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setActivePlace(null);
  }, []);

  useEffect(() => {
    localStorage.setItem('savedPlaces', JSON.stringify(savedPlaces));
  }, [savedPlaces]);

  useEffect(() => {
    localStorage.setItem('weatherCache', JSON.stringify(weatherCache));
  }, [weatherCache]);

  useEffect(() => {
    if (!weather) return;

    ensureMiniMap();

    if (miniMap.current) {
      // Ensure Leaflet recalculates size after the panel mounts.
      setTimeout(() => {
        miniMap.current.invalidateSize();
      }, 0);
    }
  }, [weather]);

  const ensureMiniMap = () => {
    if (!miniMapContainer.current || !window.L) return;

    if (miniMap.current && miniMap.current.getContainer() !== miniMapContainer.current) {
      // Recreate the map if React replaced the container element.
      miniMap.current.remove();
      miniMap.current = null;
      miniMarkerRef.current = null;
    }

    if (!miniMap.current) {
      initMap();
    }
  };

  const initMap = () => {
    if (miniMap.current) return;

    if (!miniMap.current && miniMapContainer.current) {
      miniMap.current = window.L.map(miniMapContainer.current, {
        zoomControl: false,
        attributionControl: false,
      }).setView([59.3293, 18.0686], 3);

      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(miniMap.current);

      // Disable interaction after init to keep the map visible but static.
      miniMap.current.dragging.disable();
      miniMap.current.scrollWheelZoom.disable();
      miniMap.current.doubleClickZoom.disable();
      miniMap.current.boxZoom.disable();
      miniMap.current.keyboard.disable();
      if (miniMap.current.tap) {
        miniMap.current.tap.disable();
      }
      if (miniMap.current.touchZoom) {
        miniMap.current.touchZoom.disable();
      }
    }

    if (pendingMiniMarker.current && miniMap.current) {
      const { lat, lon, cityName, tempValue } = pendingMiniMarker.current;
      pendingMiniMarker.current = null;
      updateMapMarker(lat, lon, cityName, tempValue);
    }
  };

  const updateMapMarker = (lat, lon, cityName, tempValue) => {
    ensureMiniMap();

    if (!miniMap.current) {
      pendingMiniMarker.current = { lat, lon, cityName, tempValue };
    }

    if (miniMap.current) {
      if (miniMarkerRef.current) {
        miniMap.current.removeLayer(miniMarkerRef.current);
      }

      miniMarkerRef.current = window.L
        .marker([lat, lon])
        .addTo(miniMap.current);
    }

    if (miniMap.current) {
      miniMap.current.setView([lat, lon], 3);
    }
  };

  const fetchForecastByCoords = async (lat, lon) => {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=${unit}&lang=sv&appid=${API_KEY}`
    );

    if (!response.ok) {
      throw new Error('Kunde inte hämta prognos');
    }

    const data = await response.json();
    setForecast(data);
    return data;
  };

  const placeKey = (lat, lon) => `${lat.toFixed(4)},${lon.toFixed(4)}`;

  const fetchWeather = async (searchCity, options = {}) => {
    if (!searchCity.trim()) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${searchCity}&units=${unit}&lang=sv&appid=${API_KEY}`
      );

      if (!response.ok) {
        throw new Error('Stad hittades inte');
      }

      const data = await response.json();
      const resolvedLabel = `${data.name}${data.sys?.country ? `, ${data.sys.country}` : ''}`;
      setWeather(data);
      setCity(resolvedLabel);
      if (options.updateQuery !== false) {
        setQuery(resolvedLabel);
      }
      setActivePlace({
        name: resolvedLabel,
        lat: data.coord.lat,
        lon: data.coord.lon,
      });
      if (options.setAsCurrent) {
        setCurrentPlace({
          name: resolvedLabel,
          lat: data.coord.lat,
          lon: data.coord.lon,
        });
        setActivePlace(null);
      }
      setForecast(null);
      const forecastData = await fetchForecastByCoords(data.coord.lat, data.coord.lon);
      setWeatherCache((prev) => ({
        ...prev,
        [placeKey(data.coord.lat, data.coord.lon)]: {
          weather: data,
          forecast: forecastData,
        },
      }));

      setTimeout(() => {
        updateMapMarker(data.coord.lat, data.coord.lon, data.name, data.main.temp);
      }, 50);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchWeatherByCoords = async (lat, lon, label, options = {}) => {
    const cached = weatherCache[placeKey(lat, lon)];
    if (cached?.weather) {
      setWeather(cached.weather);
      setForecast(cached.forecast || null);
    }
    setLoading(true);
    setError('');

    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=${unit}&lang=sv&appid=${API_KEY}`
      );

      if (!response.ok) {
        throw new Error('Stad hittades inte');
      }

      const data = await response.json();
      const resolvedLabel =
        label || `${data.name}${data.sys?.country ? `, ${data.sys.country}` : ''}`;
      setWeather(data);
      setCity(resolvedLabel);
      if (options.updateQuery !== false) {
      if (options.updateQuery !== false) {
        setQuery(resolvedLabel);
      }
      }
      setActivePlace({
        name: resolvedLabel,
        lat: data.coord.lat,
        lon: data.coord.lon,
      });
      if (options.setAsCurrent) {
        setCurrentPlace({
          name: resolvedLabel,
          lat: data.coord.lat,
          lon: data.coord.lon,
        });
        setActivePlace(null);
      }
      setForecast(null);
      const forecastData = await fetchForecastByCoords(data.coord.lat, data.coord.lon);
      setWeatherCache((prev) => ({
        ...prev,
        [placeKey(data.coord.lat, data.coord.lon)]: {
          weather: data,
          forecast: forecastData,
        },
      }));

      setTimeout(() => {
        updateMapMarker(data.coord.lat, data.coord.lon, data.name, data.main.temp);
      }, 50);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        setSuggesting(true);
        const response = await fetch(
          `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(
            query.trim()
          )}&limit=5&appid=${API_KEY}`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error('Kunde inte hämta förslag');
        }

        const data = await response.json();
        setSuggestions(
          data.map((item) => ({
            name: item.name,
            state: item.state,
            country: item.country,
            lat: item.lat,
            lon: item.lon,
          }))
        );
      } catch (err) {
        if (err.name !== 'AbortError') {
          setSuggestions([]);
        }
      } finally {
        setSuggesting(false);
      }
    }, 300);

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [query, API_KEY]);

  useEffect(() => {
    if (weather) {
      // Re-fetch when the unit changes so values stay consistent.
      fetchWeather(city);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unit]);

  const tempUnit = unit === 'metric' ? '°C' : '°F';
  const windUnit = unit === 'metric' ? 'm/s' : 'mph';

  const getBackgroundClass = () => {
    if (!weather) return 'from-slate-900 via-blue-900 to-slate-800';

    if (weather.main.temp == null) return 'from-slate-900 via-blue-900 to-slate-800';
    const tempC = weather.main.temp;
    const desc = weather.weather[0].description.toLowerCase();

    if (desc.includes('klar') || desc.includes('sol')) {
      if (tempC >= 25) return 'from-amber-700 via-orange-700 to-sky-700';
      if (tempC >= 15) return 'from-amber-600 via-sky-700 to-blue-900';
      return 'from-sky-900 via-blue-900 to-slate-800';
    }

    if (desc.includes('regn') || desc.includes('skur') || desc.includes('åska')) {
      return 'from-slate-900 via-indigo-900 to-gray-900';
    }

    if (desc.includes('snö') || tempC <= 0) {
      return 'from-slate-900 via-cyan-900 to-slate-800';
    }

    if (desc.includes('moln') || desc.includes('mulet') || desc.includes('dimma') || desc.includes('dis')) {
      return 'from-slate-900 via-blue-900 to-gray-800';
    }

    return 'from-slate-900 via-blue-900 to-slate-800';
  };

  const samePlace = (a, b) =>
    a &&
    b &&
    Math.abs(a.lat - b.lat) < 0.0001 &&
    Math.abs(a.lon - b.lon) < 0.0001;

  // Build the carousel list with current place first, then saved, then active search.
  const places = (() => {
    const list = [];
    if (currentPlace) {
      list.push({ ...currentPlace, current: true, saved: false });
    }
    const saved = savedPlaces
      .filter((p) => !samePlace(p, currentPlace))
      .map((p) => ({ ...p, current: false, saved: true }));
    list.push(...saved);
    if (activePlace && !list.some((p) => samePlace(p, activePlace))) {
      list.splice(1, 0, { ...activePlace, current: false, saved: false });
    }
    return list;
  })();

  // Persist the currently focused card so we can restore it next session.
  useEffect(() => {
    if (!activePlace || !places.length) return;
    const index = places.findIndex((p) => samePlace(p, activePlace));
    if (index >= 0 && index !== activePlaceIndex) {
      setActivePlaceIndex(index);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePlace, places.length]);

  useEffect(() => {
    if (activePlaceIndex >= places.length && places.length > 0) {
      setActivePlaceIndex(0);
    }
  }, [activePlaceIndex, places.length]);

  useEffect(() => {
    if (!carouselRef.current) return;
    const children = Array.from(carouselRef.current.children);
    const target = children[activePlaceIndex];
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
    }
  }, [activePlaceIndex]);

  useEffect(() => {
    if (!places.length) return;
    const place = places[activePlaceIndex];
    if (place) {
      localStorage.setItem('lastActivePlace', JSON.stringify({
        name: place.name,
        lat: place.lat,
        lon: place.lon,
      }));
      setLastActivePlace({
        name: place.name,
        lat: place.lat,
        lon: place.lon,
      });
    }
  }, [activePlaceIndex, places.length]);

  useEffect(() => {
    if (!lastActivePlace || !currentPlace) return;
    if (samePlace(lastActivePlace, currentPlace)) return;
    if (activePlace && samePlace(activePlace, lastActivePlace)) return;
    fetchWeatherByCoords(lastActivePlace.lat, lastActivePlace.lon, lastActivePlace.name, {
      updateQuery: false,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPlace, lastActivePlace]);


  // Snap to the closest card after scrolling settles.
  const handleCarouselScroll = () => {
    if (!carouselRef.current) return;
    if (scrollTimerRef.current) {
      clearTimeout(scrollTimerRef.current);
    }
    scrollTimerRef.current = setTimeout(() => {
      const container = carouselRef.current;
      const children = Array.from(container.children);
      if (!children.length) return;
      const center = container.scrollLeft + container.clientWidth / 2;
      let closestIndex = 0;
      let closestDist = Infinity;
      children.forEach((child, index) => {
        const childCenter = child.offsetLeft + child.clientWidth / 2;
        const dist = Math.abs(childCenter - center);
        if (dist < closestDist) {
          closestDist = dist;
          closestIndex = index;
        }
      });

      if (closestIndex !== activePlaceIndex) {
        setActivePlaceIndex(closestIndex);
        const place = places[closestIndex];
        if (place) {
          fetchWeatherByCoords(place.lat, place.lon, place.name, { updateQuery: false });
        }
      }
    }, 120);
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${getBackgroundClass()} p-4 md:p-8`}>
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="text-center mb-8 pt-8">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-2 tracking-tight">Väder</h1>
          <p className="text-blue-200 text-lg">Aktuell väderrapport där du än befinner dig</p>
        </div>
        {weather && places.length > 1 && (
          <div className="sticky top-4 z-10 flex justify-center gap-2 mb-4">
            {places.map((_, index) => (
              <button
                key={`dot-${index}`}
                type="button"
                onClick={() => {
                  setActivePlaceIndex(index);
                  const place = places[index];
                  if (place) {
                    fetchWeatherByCoords(place.lat, place.lon, place.name, {
                      updateQuery: false,
                    });
                  }
                }}
                className={`h-2.5 w-2.5 rounded-full transition ${
                  index === activePlaceIndex
                    ? 'bg-white'
                    : 'bg-white/30 hover:bg-white/50'
                }`}
                aria-label={`Gå till sida ${index + 1}`}
              />
            ))}
          </div>
        )}

        <div className="fixed left-4 top-6 z-20">
        <SearchForm
          query={query}
          suggestions={suggestions}
          suggesting={suggesting}
          onQueryChange={setQuery}
          onSearch={(value) => fetchWeather(value, { updateQuery: false })}
          onSelectSuggestion={(item) => {
            const label = item.label || [item.name, item.state, item.country]
              .filter(Boolean)
              .join(', ');
            setSuggestions([]);
            fetchWeatherByCoords(item.lat, item.lon, label, { updateQuery: false });
          }}
        />
        </div>

        <ErrorBanner message={error} />

        <div className="grid grid-cols-1 gap-8">
          <div>
            {loading && !weather && <LoadingState />}

            {weather && (
              <div
                ref={carouselRef}
                onScroll={handleCarouselScroll}
                className="flex overflow-x-auto snap-x snap-mandatory -mx-4 px-4"
              >
                {places.map((place, index) => {
                  const key = placeKey(place.lat, place.lon);
                  const cached = weatherCache[key];
                  const isSaved = savedPlaces.some((p) => samePlace(p, place));
                  const panelWeather = cached?.weather;
                  const panelForecast = cached?.forecast;
                  const showLoading = !panelWeather;
                  const isActive = index === activePlaceIndex;

                  return (
                    <div
                      key={`${place.lat}-${place.lon}-${place.current ? 'current' : 'saved'}`}
                      className="min-w-full snap-start px-2"
                    >
                      {showLoading ? (
                        <div className="backdrop-blur-lg bg-white/10 rounded-3xl p-8 border border-white/20 shadow-2xl h-full">
                          <p className="text-blue-200 mb-4">
                            {place.current ? 'Nuvarande plats' : place.saved ? 'Sparad plats' : 'Vald plats'}
                          </p>
                          <h2 className="text-3xl font-bold text-white mb-6">{place.name}</h2>
                          <LoadingState />
                        </div>
                      ) : (
                        <WeatherPanel
                          weather={panelWeather}
                          forecast={panelForecast}
                          tempUnit={tempUnit}
                          windUnit={windUnit}
                          unit={unit}
                          onUnitChange={setUnit}
                          mapRef={isActive ? miniMapContainer : undefined}
                          isSaved={isSaved}
                          isCurrent={place.current}
                          onSavePlace={() => {
                            if (!place || isSaved) return;
                            const clean = { name: place.name, lat: place.lat, lon: place.lon };
                            setSavedPlaces((prev) => {
                              if (prev.some((p) => samePlace(p, clean))) return prev;
                              return [clean, ...prev].slice(0, 8);
                            });
                          }}
                          onRemovePlace={() => {
                            setSavedPlaces((prev) =>
                              prev.filter((p) => !(p.lat === place.lat && p.lon === place.lon))
                            );
                          }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}


            {!weather && !loading && !error && <EmptyState />}
          </div>

        </div>
      </div>
    </div>
  );
};

export default WeatherApp;
