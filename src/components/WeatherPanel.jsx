import React from 'react';
import { Cloud, CloudRain, Sun, Wind, Droplets, Eye, Gauge, MapPin, Bookmark } from 'lucide-react';

const getWeatherIcon = (description, className) => {
  const desc = description.toLowerCase();
  if (desc.includes('regn') || desc.includes('skur') || desc.includes('åska')) {
    return <CloudRain className={className} />;
  }
  if (desc.includes('klar') || desc.includes('sol')) return <Sun className={className} />;
  if (desc.includes('moln') || desc.includes('mulet') || desc.includes('dimma')) {
    return <Cloud className={className} />;
  }
  if (desc.includes('rain')) return <CloudRain className={className} />;
  if (desc.includes('cloud')) return <Cloud className={className} />;
  if (desc.includes('clear') || desc.includes('sunny')) return <Sun className={className} />;
  return <Cloud className={className} />;
};

const DESCRIPTION_MAP = {
  'clear sky': 'Klar himmel',
  'few clouds': 'Få moln',
  'scattered clouds': 'Spridda moln',
  'broken clouds': 'Brutna moln',
  'overcast clouds': 'Mulet',
  'light rain': 'Lätt regn',
  'moderate rain': 'Måttligt regn',
  'heavy intensity rain': 'Kraftigt regn',
  'very heavy rain': 'Mycket kraftigt regn',
  'extreme rain': 'Extremt regn',
  'freezing rain': 'Underkylt regn',
  'light intensity shower rain': 'Lätta regnskurar',
  'shower rain': 'Regnskurar',
  'heavy intensity shower rain': 'Kraftiga regnskurar',
  'ragged shower rain': 'Ojämna regnskurar',
  'light snow': 'Lätt snöfall',
  snow: 'Snö',
  'heavy snow': 'Kraftigt snöfall',
  sleet: 'Snöblandat regn',
  'light shower sleet': 'Lätta skurar med snöblandat regn',
  'shower sleet': 'Skurar med snöblandat regn',
  'light rain and snow': 'Lätt regn och snö',
  'rain and snow': 'Regn och snö',
  'light shower snow': 'Lätta snöbyar',
  'shower snow': 'Snöbyar',
  'heavy shower snow': 'Kraftiga snöbyar',
  'light intensity drizzle': 'Lätt duggregn',
  drizzle: 'Duggregn',
  'heavy intensity drizzle': 'Kraftigt duggregn',
  'light intensity drizzle rain': 'Lätt duggregn med regn',
  'drizzle rain': 'Duggregn med regn',
  'heavy intensity drizzle rain': 'Kraftigt duggregn med regn',
  'shower rain and drizzle': 'Regnskurar och duggregn',
  'heavy shower rain and drizzle': 'Kraftiga regnskurar och duggregn',
  'shower drizzle': 'Duggregnsskurar',
  thunderstorm: 'Åskväder',
  'thunderstorm with light rain': 'Åska med lätt regn',
  'thunderstorm with rain': 'Åska med regn',
  'thunderstorm with heavy rain': 'Åska med kraftigt regn',
  'light thunderstorm': 'Lätt åska',
  'heavy thunderstorm': 'Kraftigt åska',
  'ragged thunderstorm': 'Oregelbunden åska',
  'thunderstorm with light drizzle': 'Åska med lätt duggregn',
  'thunderstorm with drizzle': 'Åska med duggregn',
  'thunderstorm with heavy drizzle': 'Åska med kraftigt duggregn',
  mist: 'Dimma',
  smoke: 'Rök',
  haze: 'Dis',
  dust: 'Damm',
  fog: 'Dimma',
  sand: 'Sand',
  ash: 'Aska',
  squall: 'Byig vind',
  tornado: 'Tornado',
};

const formatDescription = (description) => {
  if (!description) return '';
  const lower = description.toLowerCase();
  const mapped = DESCRIPTION_MAP[lower];
  if (mapped) return mapped;
  return lower.charAt(0).toUpperCase() + lower.slice(1);
};

const WeatherPanel = ({
  weather,
  forecast,
  tempUnit,
  windUnit,
  unit,
  onUnitChange,
  mapRef,
  isSaved,
  onSavePlace,
  onRemovePlace,
  isCurrent,
}) => {
  const description = formatDescription(weather.weather[0].description);
  const formatTemp = (value) =>
    value == null || Number.isNaN(value) ? '—' : Math.round(value);
  const temp = weather.main.temp;
  const feelsLike = weather.main.feels_like;
  let tempMax = weather.main.temp_max;
  let tempMin = weather.main.temp_min;
  const windSpeed = weather.wind?.speed != null ? weather.wind.speed : null;
  const visibilityKm = weather.visibility != null ? (weather.visibility / 1000).toFixed(1) : null;
  const visibilityText = visibilityKm ? `${visibilityKm} km` : '—';
  const cloudPercent = weather.clouds?.all != null ? `${weather.clouds.all}%` : '—';
  const rainMm = weather.rain?.['1h'] ?? weather.rain?.['3h'] ?? null;
  const gust = weather.wind?.gust ?? null;
  const timezoneOffsetSeconds = weather.timezone ?? 0;
  const localTime = new Date(Date.now() + timezoneOffsetSeconds * 1000)
    .toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
  const sunrise = weather.sys?.sunrise
    ? new Date((weather.sys.sunrise + timezoneOffsetSeconds) * 1000)
      .toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })
    : '—';
  const sunset = weather.sys?.sunset
    ? new Date((weather.sys.sunset + timezoneOffsetSeconds) * 1000)
      .toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })
    : '—';
  const timezoneOffset = forecast?.city?.timezone ?? 0;
  const toLocalDateString = (dtSeconds) => {
    const date = new Date((dtSeconds + timezoneOffset) * 1000);
    return date.toISOString().slice(0, 10);
  };
  const toLocalTime = (dtSeconds) => {
    return new Date((dtSeconds + timezoneOffset) * 1000)
      .toISOString()
      .slice(11, 16);
  };
  const toLocalDateLabel = (dtSeconds) => {
    return new Date((dtSeconds + timezoneOffset) * 1000)
      .toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' });
  };

  if (forecast?.list?.length) {
    const now = Math.floor(Date.now() / 1000);
    const todayKey = toLocalDateString(now);
    const todayItems = forecast.list.filter((item) => toLocalDateString(item.dt) === todayKey);
    if (todayItems.length) {
      tempMax = Math.max(...todayItems.map((item) => item.main.temp_max));
      tempMin = Math.min(...todayItems.map((item) => item.main.temp_min));
    }
  }

  const tempDisplay = formatTemp(temp);
  const feelsDisplay = formatTemp(feelsLike);
  const tempMaxDisplay = formatTemp(tempMax);
  const tempMinDisplay = formatTemp(tempMin);

  return (
    <div className="backdrop-blur-lg bg-white/10 rounded-3xl p-8 border border-white/20 shadow-2xl animate-fadeIn h-full">
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-5 h-5 text-blue-300" />
              <h2 className="text-3xl md:text-4xl font-bold text-white">
                {weather.name}{weather.sys?.country ? `, ${weather.sys.country}` : ''}
              </h2>
            </div>
            <div className="flex items-center gap-3">
              {isCurrent && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/15 px-2.5 py-1 text-xs text-blue-100">
                  <MapPin className="w-3.5 h-3.5 text-emerald-300" />
                  Nuvarande
                </span>
              )}
              <p className="text-blue-200 text-xl">{description}</p>
            </div>
          </div>
          {!isCurrent && (
            <button
              type="button"
              onClick={isSaved ? onRemovePlace : onSavePlace}
              className={`rounded-full p-2 border transition ${
                isSaved
                  ? 'bg-amber-400/20 border-amber-300/40 text-amber-200 hover:bg-amber-400/30'
                  : 'bg-white/10 border-white/15 text-blue-100 hover:bg-white/20'
              }`}
              aria-label={isSaved ? 'Ta bort sparad plats' : 'Spara plats'}
              title={isSaved ? 'Ta bort sparad plats' : 'Spara plats'}
            >
              <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-amber-300' : ''}`} />
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col items-center justify-center mb-12">
        <div className="flex flex-wrap items-center justify-center gap-6">
          <div className="text-yellow-300 drop-shadow-lg">
            {getWeatherIcon(weather.weather[0].description, 'w-24 h-24')}
          </div>
          <div className="flex items-center gap-4">
            <div className="text-7xl font-bold text-white drop-shadow-lg">
              {tempDisplay === '—' ? '—' : `${tempDisplay}${tempUnit}`}
            </div>
            <div className="flex items-center rounded-full bg-white/10 border border-white/15 p-1">
              <button
                type="button"
                onClick={() => onUnitChange('metric')}
                className={`px-2.5 py-1 rounded-full text-sm font-semibold transition-all ${
                  unit === 'metric'
                    ? 'bg-blue-500 text-white'
                    : 'text-blue-200 hover:bg-white/10'
                }`}
              >
                °C
              </button>
              <button
                type="button"
                onClick={() => onUnitChange('imperial')}
                className={`px-2.5 py-1 rounded-full text-sm font-semibold transition-all ${
                  unit === 'imperial'
                    ? 'bg-blue-500 text-white'
                    : 'text-blue-200 hover:bg-white/10'
                }`}
              >
                °F
              </button>
            </div>
          </div>
        </div>
        <p className="text-blue-200 text-xl mt-4">
          Känns som {feelsDisplay === '—' ? '—' : `${feelsDisplay}${tempUnit}`}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8 pb-8 border-b border-white/10">
        <div className="bg-white/5 rounded-2xl p-4">
          <p className="text-blue-300 text-sm mb-2">Max temp</p>
          <p className="text-2xl font-bold text-white">
            {tempMaxDisplay === '—' ? '—' : `${tempMaxDisplay}${tempUnit}`}
          </p>
        </div>
        <div className="bg-white/5 rounded-2xl p-4">
          <p className="text-blue-300 text-sm mb-2">Min temp</p>
          <p className="text-2xl font-bold text-white">
            {tempMinDisplay === '—' ? '—' : `${tempMinDisplay}${tempUnit}`}
          </p>
        </div>
        <div className="bg-white/5 rounded-2xl p-3 col-span-2 lg:col-span-1">
          <p className="text-blue-300 text-sm mb-2">Karta</p>
          <a
            href={`https://www.google.com/maps?q=${weather.coord.lat},${weather.coord.lon}`}
            target="_blank"
            rel="noreferrer"
            className="relative block h-28 rounded-xl overflow-hidden border border-white/10 shadow-lg"
          >
            {mapRef ? (
              <div ref={mapRef} className="h-full w-full pointer-events-none" />
            ) : (
              <div className="h-full w-full bg-white/5" />
            )}
            <div className="absolute inset-0 bg-black/10 hover:bg-black/0 transition-colors" />
          </a>
        </div>
      </div>

      {forecast?.list?.length ? (
        <div className="mb-8">
          <p className="text-blue-300 text-sm mb-3">Kommande timmar</p>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-2 px-2">
            {forecast.list.slice(0, 16).map((item) => {
              const time = toLocalTime(item.dt);
              const itemTemp = formatTemp(item.main.temp);
              const itemDesc = formatDescription(item.weather[0].description);
              return (
                <div
                  key={item.dt}
                  className="min-w-[92px] bg-white/5 rounded-xl p-3 border border-white/10 text-center"
                >
                  <p className="text-blue-300 text-xs mb-2">{time}</p>
                  <div className="flex justify-center text-yellow-300 mb-2">
                    {getWeatherIcon(itemDesc, 'w-6 h-6')}
                  </div>
                  <p className="text-white font-semibold">
                    {itemTemp === '—' ? '—' : `${itemTemp}${tempUnit}`}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {forecast?.list?.length ? (
        <div className="mb-8">
          <p className="text-blue-300 text-sm mb-3">5 dagar</p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {(() => {
              const groups = forecast.list.reduce((acc, item) => {
                const key = toLocalDateString(item.dt);
                acc[key] = acc[key] || [];
                acc[key].push(item);
                return acc;
              }, {});

              return Object.keys(groups)
                .slice(0, 5)
                .map((dateKey) => {
                  const items = groups[dateKey];
                  const min = Math.min(...items.map((i) => i.main.temp_min));
                  const max = Math.max(...items.map((i) => i.main.temp_max));
                  const noon = items.reduce((closest, item) => {
                    const hour = parseInt(toLocalTime(item.dt).slice(0, 2), 10);
                    const diff = Math.abs(hour - 12);
                    if (!closest) return item;
                    const closestHour = parseInt(toLocalTime(closest.dt).slice(0, 2), 10);
                    return diff < Math.abs(closestHour - 12) ? item : closest;
                  }, null);
                  const iconDesc = formatDescription(noon?.weather?.[0]?.description || '');
                  return (
                    <div
                      key={dateKey}
                      className="bg-white/5 rounded-lg p-2 border border-white/10 text-center"
                    >
                      <p className="text-blue-300 text-[10px] mb-1">
                        {toLocalDateLabel(items[0].dt)}
                      </p>
                      <div className="flex justify-center text-yellow-300 mb-1">
                        {getWeatherIcon(iconDesc, 'w-5 h-5')}
                      </div>
                      <p className="text-white text-xs font-semibold">
                        {formatTemp(max)}{tempUnit}
                      </p>
                      <p className="text-blue-200 text-[10px]">
                        {formatTemp(min)}{tempUnit}
                      </p>
                    </div>
                  );
                });
            })()}
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
        <div className="bg-white/5 rounded-xl p-4">
          <p className="text-blue-300 text-xs mb-2">Lokal tid</p>
          <p className="text-xl font-bold text-white">{localTime}</p>
        </div>
        <div className="bg-white/5 rounded-xl p-4">
          <p className="text-blue-300 text-xs mb-2">Soluppgång</p>
          <p className="text-xl font-bold text-white">{sunrise}</p>
        </div>
        <div className="bg-white/5 rounded-xl p-4">
          <p className="text-blue-300 text-xs mb-2">Solnedgång</p>
          <p className="text-xl font-bold text-white">{sunset}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white/5 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Droplets className="w-4 h-4 text-blue-400" />
            <p className="text-blue-300 text-xs">Luftfuktighet</p>
          </div>
          <p className="text-xl font-bold text-white">
            {weather.main.humidity != null ? `${weather.main.humidity}%` : '—'}
          </p>
        </div>

        <div className="bg-white/5 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Wind className="w-4 h-4 text-blue-400" />
            <p className="text-blue-300 text-xs">Vind</p>
          </div>
          <p className="text-xl font-bold text-white">
            {windSpeed != null ? `${windSpeed.toFixed(1)} ${windUnit}` : '—'}
          </p>
        </div>

        <div className="bg-white/5 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Wind className="w-4 h-4 text-blue-400" />
            <p className="text-blue-300 text-xs">Vindbyar</p>
          </div>
          <p className="text-xl font-bold text-white">
            {gust != null ? `${gust.toFixed(1)} ${windUnit}` : '—'}
          </p>
        </div>

        <div className="bg-white/5 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Droplets className="w-4 h-4 text-blue-400" />
            <p className="text-blue-300 text-xs">Regn (mm)</p>
          </div>
          <p className="text-xl font-bold text-white">
            {rainMm != null ? `${rainMm.toFixed(1)} mm` : '—'}
          </p>
        </div>

        <div className="bg-white/5 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Gauge className="w-4 h-4 text-blue-400" />
            <p className="text-blue-300 text-xs">Tryck</p>
          </div>
          <p className="text-xl font-bold text-white">
            {weather.main.pressure != null ? `${weather.main.pressure} hPa` : '—'}
          </p>
        </div>

        <div className="bg-white/5 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Eye className="w-4 h-4 text-blue-400" />
            <p className="text-blue-300 text-xs">Sikt</p>
          </div>
          <p className="text-xl font-bold text-white">
            {visibilityText}
          </p>
        </div>

        <div className="bg-white/5 rounded-xl p-4 col-span-2">
          <div className="flex items-center gap-2 mb-2">
            <Cloud className="w-4 h-4 text-blue-400" />
            <p className="text-blue-300 text-xs">Molnighet</p>
          </div>
          <p className="text-xl font-bold text-white">{cloudPercent}</p>
        </div>
      </div>
    </div>
  );
};

export default WeatherPanel;
